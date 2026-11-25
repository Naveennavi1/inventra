from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.product import Product
from app.models.product_batch import ProductBatch
from app.schemas.batch_schema import BatchCreate, BatchResponse

router = APIRouter(
    prefix="/batches",
    tags=["Batch Management"]
)


# Create Product Batch
@router.post("/", response_model=BatchResponse)
def create_batch(
    batch_data: BatchCreate,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == batch_data.product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    existing_batch = db.query(ProductBatch).filter(
        ProductBatch.batch_number == batch_data.batch_number
    ).first()

    if existing_batch:
        raise HTTPException(
            status_code=400,
            detail="Batch number already exists"
        )

    if (
        batch_data.manufacturing_date
        and batch_data.expiry_date <= batch_data.manufacturing_date
    ):
        raise HTTPException(
            status_code=400,
            detail="Expiry date must be after manufacturing date"
        )

    batch = ProductBatch(
        product_id=batch_data.product_id,
        batch_number=batch_data.batch_number,
        quantity=batch_data.quantity,
        manufacturing_date=batch_data.manufacturing_date,
        expiry_date=batch_data.expiry_date
    )

    try:
        db.add(batch)
        db.commit()
        db.refresh(batch)
        return batch

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Batch creation failed"
        )


# Get All Batches
@router.get("/", response_model=list[BatchResponse])
def get_batches(db: Session = Depends(get_db)):

    return (
        db.query(ProductBatch)
        .order_by(ProductBatch.expiry_date.asc())
        .all()
    )


# Get Batch By ID
@router.get("/{batch_id}", response_model=BatchResponse)
def get_batch(
    batch_id: int,
    db: Session = Depends(get_db)
):
    batch = db.query(ProductBatch).filter(
        ProductBatch.id == batch_id
    ).first()

    if not batch:
        raise HTTPException(
            status_code=404,
            detail="Batch not found"
        )

    return batch