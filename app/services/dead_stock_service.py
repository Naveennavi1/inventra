from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.product import Product
from app.models.inventory import Inventory
from app.models.sale import Sale, SaleItem


def get_dead_stock_products(db: Session, days: int = 60):

    cutoff_date = datetime.now() - timedelta(days=days)

    # Find the latest sale date for each product
    last_sales = (
        db.query(
            SaleItem.product_id,
            func.max(Sale.sale_date).label("last_sale_date")
        )
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.status == "COMPLETED")
        .group_by(SaleItem.product_id)
        .subquery()
    )

    # Find products with no sales in the specified period
    records = (
        db.query(
            Product,
            Inventory,
            last_sales.c.last_sale_date
        )
        .join(Inventory, Inventory.product_id == Product.id)
        .outerjoin(
            last_sales,
            last_sales.c.product_id == Product.id
        )
        .filter(Inventory.quantity > 0)
        .filter(
            (last_sales.c.last_sale_date == None) |
            (last_sales.c.last_sale_date < cutoff_date)
        )
        .all()
    )

    dead_stock = []

    for product, inventory, last_sale_date in records:

        if last_sale_date is None:
            days_since_last_sale = None
            last_sale = "Never sold"
        else:
            days_since_last_sale = (
                datetime.now() - last_sale_date
            ).days
            last_sale = last_sale_date

        stock_value = inventory.quantity * product.price

        dead_stock.append({
            "product_id": product.id,
            "product_name": product.name,
            "current_stock": inventory.quantity,
            "last_sale_date": last_sale,
            "days_since_last_sale": days_since_last_sale,
            "stock_value": round(stock_value, 2)
        })

    return dead_stock


def get_slow_moving_products(db: Session, days: int = 30):

    cutoff_date = datetime.now() - timedelta(days=days)

    last_sales = (
        db.query(
            SaleItem.product_id,
            func.max(Sale.sale_date).label("last_sale_date")
        )
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.status == "COMPLETED")
        .group_by(SaleItem.product_id)
        .subquery()
    )

    records = (
        db.query(
            Product,
            Inventory,
            last_sales.c.last_sale_date
        )
        .join(Inventory, Inventory.product_id == Product.id)
        .outerjoin(
            last_sales,
            last_sales.c.product_id == Product.id
        )
        .filter(Inventory.quantity > 0)
        .filter(
            last_sales.c.last_sale_date.isnot(None),
            last_sales.c.last_sale_date < cutoff_date
        )
        .all()
    )

    slow_moving = []

    for product, inventory, last_sale_date in records:

        days_since_last_sale = (
            datetime.now() - last_sale_date
        ).days

        slow_moving.append({
            "product_id": product.id,
            "product_name": product.name,
            "current_stock": inventory.quantity,
            "days_since_last_sale": days_since_last_sale,
            "stock_value": round(
                inventory.quantity * product.price, 2
            )
        })

    return slow_moving