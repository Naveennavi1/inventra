from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database.connection import Base



class Supplier(Base):

    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)

    email = Column(String(150), unique=True, nullable=True)

    phone = Column(String(20), nullable=False)

    address = Column(String(255), nullable=True)

    products = relationship(
        "Product",
        back_populates="supplier"
    )