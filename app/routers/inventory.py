from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.stock_movement import StockMovement

from app.schemas.inventory_schema import (
    StockMovementCreate,
    InventoryResponse,
    StockMovementResponse
)

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)


# Initialize Inventory
@router.post("/{product_id}/initialize")
def initialize_inventory(
    product_id: int,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(404, "Product not found")

    existing = db.query(Inventory).filter(
        Inventory.product_id == product_id
    ).first()

    if existing:
        raise HTTPException(
            400,
            "Inventory already initialized"
        )

    inventory = Inventory(
        product_id=product_id,
        quantity=0,
        reorder_level=10
    )

    db.add(inventory)
    db.commit()
    db.refresh(inventory)

    return inventory


# Stock In / Stock Out
@router.post("/{product_id}/movement")
def manage_stock(
    product_id: int,
    movement: StockMovementCreate,
    db: Session = Depends(get_db)
):

    if movement.movement_type not in ["IN", "OUT"]:
        raise HTTPException(
            400,
            "Movement type must be IN or OUT"
        )

    if movement.quantity <= 0:
        raise HTTPException(
            400,
            "Quantity must be greater than zero"
        )

    inventory = db.query(Inventory).filter(
        Inventory.product_id == product_id
    ).with_for_update().first()

    if not inventory:
        raise HTTPException(
            404,
            "Inventory not initialized"
        )

    if movement.movement_type == "IN":

        inventory.quantity += movement.quantity

    else:

        if inventory.quantity < movement.quantity:
            raise HTTPException(
                400,
                "Insufficient stock available"
            )

        inventory.quantity -= movement.quantity

    stock_record = StockMovement(
        product_id=product_id,
        movement_type=movement.movement_type,
        quantity=movement.quantity,
        note=movement.note
    )

    db.add(stock_record)

    try:
        db.commit()
        db.refresh(inventory)
        db.refresh(stock_record)

    except Exception:
        db.rollback()
        raise HTTPException(
            500,
            "Unable to update inventory"
        )

    return {
        "message": "Stock updated successfully",
        "product_id": product_id,
        "current_stock": inventory.quantity
    }


# View All Inventory
@router.get("/", response_model=list[InventoryResponse])
def get_inventory(
    db: Session = Depends(get_db)
):

    return db.query(Inventory).all()


# View Low Stock Products
@router.get("/low-stock")
def get_low_stock(
    db: Session = Depends(get_db)
):

    inventory = db.query(Inventory).filter(
        Inventory.quantity <= Inventory.reorder_level
    ).all()

    return inventory


# View Product Stock History
@router.get("/{product_id}/history",
            response_model=list[StockMovementResponse])
def get_stock_history(
    product_id: int,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(404, "Product not found")

    return db.query(StockMovement).filter(
        StockMovement.product_id == product_id
    ).order_by(
        StockMovement.created_at.desc()
    ).all()