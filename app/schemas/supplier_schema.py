from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional


class SupplierCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: str
    address: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierResponse(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: str
    address: Optional[str]

    model_config = ConfigDict(from_attributes=True)