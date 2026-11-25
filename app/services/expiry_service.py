from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.models.product_batch import ProductBatch
from app.models.product import Product


def get_expiry_report(db: Session, days: int = 30):

    today = date.today()
    alert_date = today + timedelta(days=days)

    records = (
        db.query(ProductBatch, Product)
        .join(Product, Product.id == ProductBatch.product_id)
        .filter(ProductBatch.quantity > 0)
        .filter(ProductBatch.expiry_date <= alert_date)
        .order_by(ProductBatch.expiry_date.asc())
        .all()
    )

    expiry_report = []

    for batch, product in records:

        days_remaining = (batch.expiry_date - today).days

        if days_remaining < 0:
            status = "EXPIRED"
        elif days_remaining == 0:
            status = "EXPIRES_TODAY"
        elif days_remaining <= 7:
            status = "CRITICAL"
        else:
            status = "NEAR_EXPIRY"

        expiry_report.append({
            "batch_id": batch.id,
            "batch_number": batch.batch_number,
            "product_id": product.id,
            "product_name": product.name,
            "quantity": batch.quantity,
            "expiry_date": batch.expiry_date,
            "days_remaining": days_remaining,
            "stock_value": round(
                batch.quantity * product.price, 2
            ),
            "status": status
        })

    return expiry_report