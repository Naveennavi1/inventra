
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class StockMovementCreate(BaseModel):
    movement_type: str
    quantity: int
    note: Optional[str] = None


class InventoryResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    reorder_level: int
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StockMovementResponse(BaseModel):
    id: int
    product_id: int
    movement_type: str
    quantity: int
    note: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
