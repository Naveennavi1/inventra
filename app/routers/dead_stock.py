from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.dead_stock_service import (
    get_dead_stock_products,
    get_slow_moving_products
)

from app.schemas.dead_stock_schema import (
    DeadStockResponse,
    SlowMovingResponse,
    DeadStockSummary
)

router = APIRouter(
    prefix="/dead-stock",
    tags=["Dead Stock Detection"]
)


# Get dead stock products
@router.get("/", response_model=list[DeadStockResponse])
def get_dead_stock(
    days: int = 60,
    db: Session = Depends(get_db)
):
    return get_dead_stock_products(db, days)


# Get slow-moving products
@router.get("/slow-moving", response_model=list[SlowMovingResponse])
def get_slow_moving(
    days: int = 30,
    db: Session = Depends(get_db)
):
    return get_slow_moving_products(db, days)


# Dead stock summary
@router.get("/summary", response_model=DeadStockSummary)
def dead_stock_summary(db: Session = Depends(get_db)):

    products = get_dead_stock_products(db)

    total_units = sum(
        item["current_stock"] for item in products
    )

    total_value = sum(
        item["stock_value"] for item in products
    )

    return {
        "total_dead_stock_products": len(products),
        "total_stock_units": total_units,
        "total_stock_value": round(total_value, 2)
    }