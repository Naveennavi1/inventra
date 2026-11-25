from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Product(Base):

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)

    barcode = Column(String(100), unique=True, nullable=True)

    description = Column(String(255), nullable=True)

    price = Column(Float, nullable=False)

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=False
    )

    supplier_id = Column(
        Integer,
        ForeignKey("suppliers.id"),
        nullable=False
    )

    category = relationship(
        "Category",
        back_populates="products"
    )

    supplier = relationship(
        "Supplier",
        back_populates="products"
    )

    inventory = relationship(
        "Inventory",
        back_populates="product",
        uselist=False
    )