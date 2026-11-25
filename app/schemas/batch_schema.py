from pydantic import BaseModel, ConfigDict, Field
from datetime import date
from typing import Optional


# Create Product Batch
class BatchCreate(BaseModel):
    product_id: int
    batch_number: str
    quantity: int = Field(gt=0)
    manufacturing_date: Optional[date] = None
    expiry_date: date


# Batch Response
class BatchResponse(BaseModel):
    id: int
    product_id: int
    batch_number: str
    quantity: int
    manufacturing_date: Optional[date]
    expiry_date: date

    model_config = ConfigDict(from_attributes=True)