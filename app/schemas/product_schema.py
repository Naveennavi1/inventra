from pydantic import BaseModel, ConfigDict
from typing import Optional


class ProductCreate(BaseModel):
    name: str
    barcode: Optional[str] = None
    description: Optional[str] = None
    price: float
    category_id: int
    supplier_id: int


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    barcode: Optional[str]
    description: Optional[str]
    price: float
    category_id: int
    supplier_id: int

    model_config = ConfigDict(from_attributes=True)