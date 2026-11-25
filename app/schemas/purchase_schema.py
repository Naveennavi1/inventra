from pydantic import BaseModel, ConfigDict, Field
from typing import List
from datetime import datetime


# Individual product in a purchase
class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: float = Field(gt=0)


# Create purchase
class PurchaseCreate(BaseModel):
    supplier_id: int
    items: List[PurchaseItemCreate]


# Purchase item response
class PurchaseItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


# Purchase response
class PurchaseResponse(BaseModel):
    id: int
    supplier_id: int
    purchase_date: datetime
    total_amount: float
    status: str
    items: List[PurchaseItemResponse]

    model_config = ConfigDict(from_attributes=True)