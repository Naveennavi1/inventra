from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.models.purchase import Purchase, PurchaseItem
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.stock_movement import StockMovement

from app.schemas.purchase_schema import (
    PurchaseCreate,
    PurchaseResponse
)

router = APIRouter(
    prefix="/purchases",
    tags=["Purchases"]
)


# Create Purchase
@router.post("/", response_model=PurchaseResponse)
def create_purchase(
    purchase_data: PurchaseCreate,
    db: Session = Depends(get_db)
):
    supplier = db.query(Supplier).filter(
        Supplier.id == purchase_data.supplier_id
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    total_amount = 0
    purchase_items = []

    for item in purchase_data.items:

        product = db.query(Product).filter(
            Product.id == item.product_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found"
            )

        subtotal = item.quantity * item.unit_price
        total_amount += subtotal

        purchase_items.append(
            PurchaseItem(
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=subtotal
            )
        )

    purchase = Purchase(
        supplier_id=purchase_data.supplier_id,
        total_amount=total_amount,
        status="RECEIVED",
        items=purchase_items
    )

    try:
        db.add(purchase)
        db.flush()

        for item in purchase_items:

            inventory = db.query(Inventory).filter(
                Inventory.product_id == item.product_id
            ).with_for_update().first()

            if not inventory:
                inventory = Inventory(
                    product_id=item.product_id,
                    quantity=0,
                    reorder_level=10
                )
                db.add(inventory)
                db.flush()

            inventory.quantity += item.quantity

            movement = StockMovement(
                product_id=item.product_id,
                movement_type="IN",
                quantity=item.quantity,
                note=f"Purchase #{purchase.id}"
            )

            db.add(movement)

        db.commit()

        db.refresh(purchase)

        return purchase

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Purchase creation failed"
        )


# Get All Purchases
@router.get("/", response_model=list[PurchaseResponse])
def get_purchases(db: Session = Depends(get_db)):

    purchases = (
        db.query(Purchase)
        .options(joinedload(Purchase.items))
        .order_by(Purchase.id.desc())
        .all()
    )

    return purchases


# Get Purchase By ID
@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db)
):

    purchase = (
        db.query(Purchase)
        .options(joinedload(Purchase.items))
        .filter(Purchase.id == purchase_id)
        .first()
    )

    if not purchase:
        raise HTTPException(
            status_code=404,
            detail="Purchase not found"
        )

    return purchase