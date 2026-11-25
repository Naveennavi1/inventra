from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.product import Product


def get_reorder_recommendations(db: Session):

    inventory_records = (
        db.query(Inventory, Product)
        .join(Product, Inventory.product_id == Product.id)
        .filter(
            Inventory.quantity <= Inventory.reorder_level
        )
        .all()
    )

    recommendations = []

    for inventory, product in inventory_records:

        # Target stock is twice the reorder level
        target_stock = inventory.reorder_level * 2

        recommended_quantity = max(
            target_stock - inventory.quantity,
            0
        )

        if inventory.quantity == 0:
            priority = "CRITICAL"

        elif inventory.quantity <= inventory.reorder_level / 2:
            priority = "HIGH"

        else:
            priority = "MEDIUM"

        recommendations.append({
            "product_id": product.id,
            "product_name": product.name,
            "current_stock": inventory.quantity,
            "reorder_level": inventory.reorder_level,
            "target_stock": target_stock,
            "recommended_quantity": recommended_quantity,
            "priority": priority
        })

    return recommendations