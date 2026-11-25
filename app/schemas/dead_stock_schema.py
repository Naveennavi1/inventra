from pydantic import BaseModel
from typing import Optional


class DeadStockResponse(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    last_sale_date: Optional[str | None]
    days_since_last_sale: Optional[int]
    stock_value: float


class SlowMovingResponse(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    days_since_last_sale: int
    stock_value: float


class DeadStockSummary(BaseModel):
    total_dead_stock_products: int
    total_stock_units: int
    total_stock_value: float