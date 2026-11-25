from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base


class ProductBatch(Base):
    __tablename__ = "product_batches"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    batch_number = Column(
        String(100),
        unique=True,
        nullable=False
    )

    quantity = Column(Integer, nullable=False, default=0)

    manufacturing_date = Column(Date, nullable=True)

    expiry_date = Column(Date, nullable=False)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    product = relationship("Product")
    