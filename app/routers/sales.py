from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.stock_movement import StockMovement

from app.schemas.sale_schema import SaleCreate, SaleResponse

router = APIRouter(
    prefix="/sales",
    tags=["Sales"]
)


# Create Sale
@router.post("/", response_model=SaleResponse)
def create_sale(
    sale_data: SaleCreate,
    db: Session = Depends(get_db)
):

    if not sale_data.items:
        raise HTTPException(
            status_code=400,
            detail="Sale must contain at least one product"
        )

    try:
        total_amount = 0
        sale_items = []
        inventory_updates = []

        # Validate products and available stock
        for item in sale_data.items:

            product = db.query(Product).filter(
                Product.id == item.product_id
            ).first()

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {item.product_id} not found"
                )

            inventory = db.query(Inventory).filter(
                Inventory.product_id == item.product_id
            ).with_for_update().first()

            if not inventory:
                raise HTTPException(
                    status_code=404,
                    detail=f"Inventory not initialized for product {item.product_id}"
                )

            if inventory.quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.name}. Available: {inventory.quantity}"
                )

            subtotal = item.quantity * product.price
            total_amount += subtotal

            sale_items.append(
                SaleItem(
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_price=product.price,
                    subtotal=subtotal
                )
            )

            inventory_updates.append(
                (inventory, item)
            )

        # Create sale record
        sale = Sale(
            total_amount=total_amount,
            status="COMPLETED",
            items=sale_items
        )

        db.add(sale)
        db.flush()

        # Deduct inventory and record stock movements
        for inventory, item in inventory_updates:

            inventory.quantity -= item.quantity

            movement = StockMovement(
                product_id=item.product_id,
                movement_type="OUT",
                quantity=item.quantity,
                note=f"Sale #{sale.id}"
            )

            db.add(movement)

        db.commit()

        db.refresh(sale)

        return sale

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Sale creation failed"
        )


# Get All Sales
@router.get("/", response_model=list[SaleResponse])
def get_sales(db: Session = Depends(get_db)):

    sales = (
        db.query(Sale)
        .options(joinedload(Sale.items))
        .order_by(Sale.id.desc())
        .all()
    )

    return sales


# Get Sale By ID
@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db)
):

    sale = (
        db.query(Sale)
        .options(joinedload(Sale.items))
        .filter(Sale.id == sale_id)
        .first()
    )

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )

    return sale