from pydantic import BaseModel


class ReorderRecommendation(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    reorder_level: int
    target_stock: int
    recommended_quantity: int
    priority: str