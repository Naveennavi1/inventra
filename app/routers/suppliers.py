from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.supplier import Supplier

from app.schemas.supplier_schema import (
    SupplierCreate,
    SupplierUpdate,
    SupplierResponse
)

router = APIRouter(
    prefix="/suppliers",
    tags=["Suppliers"]
)


# Create Supplier
@router.post("/", response_model=SupplierResponse)
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db)
):

    if supplier.email:
        existing = db.query(Supplier).filter(
            Supplier.email == supplier.email
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Supplier email already exists"
            )

    new_supplier = Supplier(**supplier.model_dump())

    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)

    return new_supplier


# Get All Suppliers
@router.get("/", response_model=list[SupplierResponse])
def get_suppliers(
    search: str = None,
    db: Session = Depends(get_db)
):

    query = db.query(Supplier)

    if search:
        query = query.filter(
            Supplier.name.ilike(f"%{search}%")
        )

    return query.all()


# Get Supplier by ID
@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):

    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    return supplier


# Update Supplier
@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db)
):

    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    updates = supplier_data.model_dump(exclude_unset=True)

    if updates.get("email"):
        existing = db.query(Supplier).filter(
            Supplier.email == updates["email"],
            Supplier.id != supplier_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email already belongs to another supplier"
            )

    for key, value in updates.items():
        setattr(supplier, key, value)

    db.commit()
    db.refresh(supplier)

    return supplier


# Delete Supplier
@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):

    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    if supplier.products:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete supplier associated with products"
        )

    db.delete(supplier)
    db.commit()

    return {
        "message": "Supplier deleted successfully"
    }