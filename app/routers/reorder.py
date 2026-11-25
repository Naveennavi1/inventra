from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.reorder_service import get_reorder_recommendations
from app.schemas.reorder_schema import ReorderRecommendation

router = APIRouter(
    prefix="/reorder",
    tags=["Smart Reordering"]
)


@router.get(
    "/recommendations",
    response_model=list[ReorderRecommendation]
)
def get_recommendations(db: Session = Depends(get_db)):

    return get_reorder_recommendations(db)


@router.get("/low-stock")
def get_low_stock_products(db: Session = Depends(get_db)):

    recommendations = get_reorder_recommendations(db)

    return {
        "total_low_stock_products": len(recommendations),
        "products": recommendations
    }


@router.get("/summary")
def get_reorder_summary(db: Session = Depends(get_db)):

    recommendations = get_reorder_recommendations(db)

    critical = sum(
        1 for item in recommendations
        if item["priority"] == "CRITICAL"
    )

    high = sum(
        1 for item in recommendations
        if item["priority"] == "HIGH"
    )

    medium = sum(
        1 for item in recommendations
        if item["priority"] == "MEDIUM"
    )

    total_units = sum(
        item["recommended_quantity"]
        for item in recommendations
    )

    return {
        "total_products_to_reorder": len(recommendations),
        "critical_products": critical,
        "high_priority_products": high,
        "medium_priority_products": medium,
        "total_recommended_units": total_units
    }