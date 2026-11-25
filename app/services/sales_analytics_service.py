from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.sale import Sale, SaleItem
from app.models.product import Product


# 1. Overall Sales Summary
def get_sales_summary(db: Session):

    result = db.query(
        func.count(Sale.id).label("total_sales"),
        func.coalesce(func.sum(Sale.total_amount), 0).label("total_revenue"),
        func.coalesce(func.avg(Sale.total_amount), 0).label("average_order_value")
    ).filter(
        Sale.status == "COMPLETED"
    ).first()

    return {
        "total_sales": result.total_sales,
        "total_revenue": round(float(result.total_revenue), 2),
        "average_order_value": round(float(result.average_order_value), 2)
    }


# 2. Daily Sales Report
def get_daily_sales(db: Session):

    results = db.query(
        func.date(Sale.sale_date).label("date"),
        func.count(Sale.id).label("total_sales"),
        func.sum(Sale.total_amount).label("revenue")
    ).filter(
        Sale.status == "COMPLETED"
    ).group_by(
        func.date(Sale.sale_date)
    ).order_by(
        func.date(Sale.sale_date).desc()
    ).all()

    return [
        {
            "date": str(row.date),
            "total_sales": row.total_sales,
            "revenue": round(float(row.revenue or 0), 2)
        }
        for row in results
    ]


# 3. Monthly Sales Report
def get_monthly_sales(db: Session):

    results = db.query(
        func.year(Sale.sale_date).label("year"),
        func.month(Sale.sale_date).label("month"),
        func.count(Sale.id).label("total_sales"),
        func.sum(Sale.total_amount).label("revenue")
    ).filter(
        Sale.status == "COMPLETED"
    ).group_by(
        func.year(Sale.sale_date),
        func.month(Sale.sale_date)
    ).order_by(
        func.year(Sale.sale_date).desc(),
        func.month(Sale.sale_date).desc()
    ).all()

    return [
        {
            "year": row.year,
            "month": row.month,
            "total_sales": row.total_sales,
            "revenue": round(float(row.revenue or 0), 2)
        }
        for row in results
    ]


# 4. Best-Selling Products
def get_best_selling_products(db: Session):

    results = db.query(
        Product.id.label("product_id"),
        Product.name.label("product_name"),
        func.sum(SaleItem.quantity).label("units_sold"),
        func.sum(SaleItem.subtotal).label("total_revenue")
    ).join(
        SaleItem, SaleItem.product_id == Product.id
    ).join(
        Sale, Sale.id == SaleItem.sale_id
    ).filter(
        Sale.status == "COMPLETED"
    ).group_by(
        Product.id,
        Product.name
    ).order_by(
        func.sum(SaleItem.quantity).desc()
    ).limit(10).all()

    return [
        {
            "product_id": row.product_id,
            "product_name": row.product_name,
            "units_sold": row.units_sold,
            "total_revenue": round(float(row.total_revenue or 0), 2)
        }
        for row in results
    ]