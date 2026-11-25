from pydantic import BaseModel, ConfigDict, Field
from typing import List
from datetime import datetime


# Individual product in a sale
class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


# Create sale
class SaleCreate(BaseModel):
    items: List[SaleItemCreate]


# Individual sale item response
class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


# Complete sale response
class SaleResponse(BaseModel):
    id: int
    sale_date: datetime
    total_amount: float
    status: str
    items: List[SaleItemResponse]

    model_config = ConfigDict(from_attributes=True)