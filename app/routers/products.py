from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.product import Product
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.user import User, UserRole

from app.core.security import (
    get_current_active_user,
    require_role
)

from app.schemas.product_schema import (
    ProductCreate,
    ProductUpdate,
    ProductResponse
)

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


# Add Product
@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.ADMIN, UserRole.STAFF)
    )
):

    category = db.query(Category).filter(
        Category.id == product.category_id
    ).first()

    supplier = db.query(Supplier).filter(
        Supplier.id == product.supplier_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    if product.price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Price must be greater than zero"
        )

    if product.barcode:
        existing = db.query(Product).filter(
            Product.barcode == product.barcode
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Barcode already exists"
            )

    new_product = Product(**product.model_dump())

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


# Get All Products
@router.get("/", response_model=list[ProductResponse])
def get_products(
    search: str = None,
    category_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):

    query = db.query(Product)

    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%")
        )

    if category_id:
        query = query.filter(
            Product.category_id == category_id
        )

    return query.all()


# Get Single Product
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


# Update Product
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.ADMIN, UserRole.STAFF)
    )
):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    updates = product_data.model_dump(exclude_unset=True)

    if "price" in updates and (
        updates["price"] is None or updates["price"] <= 0
    ):
        raise HTTPException(
            status_code=400,
            detail="Price must be greater than zero"
        )

    if "category_id" in updates:
        category = db.query(Category).filter(
            Category.id == updates["category_id"]
        ).first()

        if not category:
            raise HTTPException(
                status_code=404,
                detail="Category not found"
            )

    if "supplier_id" in updates:
        supplier = db.query(Supplier).filter(
            Supplier.id == updates["supplier_id"]
        ).first()

        if not supplier:
            raise HTTPException(
                status_code=404,
                detail="Supplier not found"
            )

    if updates.get("barcode"):
        existing = db.query(Product).filter(
            Product.barcode == updates["barcode"],
            Product.id != product_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Barcode already exists"
            )

    for key, value in updates.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    return product


# Delete Product - Admin Only
@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.ADMIN)
    )
):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if product.inventory:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete product with inventory records"
        )

    db.delete(product)
    db.commit()

    return {"message": "Product deleted successfully"}