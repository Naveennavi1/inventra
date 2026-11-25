from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.expiry_service import get_expiry_report
from app.schemas.expiry_schema import ExpiryResponse

router = APIRouter(
    prefix="/expiry",
    tags=["Expiry Monitoring"]
)


@router.get("/", response_model=list[ExpiryResponse])
def expiry_report(
    days: int = Query(default=30, ge=0),
    db: Session = Depends(get_db)
):
    return get_expiry_report(db, days)


@router.get("/summary")
def expiry_summary(
    db: Session = Depends(get_db)
):

    records = get_expiry_report(db, days=30)

    expired = sum(
        1 for item in records
        if item["status"] == "EXPIRED"
    )

    critical = sum(
        1 for item in records
        if item["status"] in ["CRITICAL", "EXPIRES_TODAY"]
    )

    near_expiry = sum(
        1 for item in records
        if item["status"] == "NEAR_EXPIRY"
    )

    total_value = sum(
        item["stock_value"] for item in records
    )

    return {
        "total_batches_at_risk": len(records),
        "expired_batches": expired,
        "critical_batches": critical,
        "near_expiry_batches": near_expiry,
        "total_stock_value_at_risk": round(total_value, 2)
    }