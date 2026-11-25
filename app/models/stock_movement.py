from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.connection import Base


class StockMovement(Base):

    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    movement_type = Column(
        String(20),
        nullable=False
    )

    quantity = Column(Integer, nullable=False)

    note = Column(String(255), nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    product = relationship("Product")