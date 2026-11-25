from pydantic import BaseModel
from datetime import date


class ExpiryResponse(BaseModel):
    batch_id: int
    batch_number: str
    product_id: int
    product_name: str
    quantity: int
    expiry_date: date
    days_remaining: int
    stock_value: float
    status: str