from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.services.sales_analytics_service import (
    get_sales_summary,
    get_daily_sales,
    get_monthly_sales,
    get_best_selling_products
)

from app.schemas.analytics_schema import (
    SalesSummary,
    DailySalesResponse,
    MonthlySalesResponse,
    BestSellingProductResponse
)

router = APIRouter(
    prefix="/analytics",
    tags=["Sales Analytics"]
)


# Overall Sales Summary
@router.get("/summary", response_model=SalesSummary)
def sales_summary(db: Session = Depends(get_db)):
    return get_sales_summary(db)


# Daily Sales Report
@router.get("/daily", response_model=list[DailySalesResponse])
def daily_sales(db: Session = Depends(get_db)):
    return get_daily_sales(db)


# Monthly Sales Report
@router.get("/monthly", response_model=list[MonthlySalesResponse])
def monthly_sales(db: Session = Depends(get_db)):
    return get_monthly_sales(db)


# Best-Selling Products
@router.get("/best-selling-products", response_model=list[BestSellingProductResponse])
def best_selling_products(db: Session = Depends(get_db)):
    return get_best_selling_products(db)