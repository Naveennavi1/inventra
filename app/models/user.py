from sqlalchemy import Column, Integer, String, Boolean, Enum
from app.database.connection import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STAFF = "staff"


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String(100), unique=True, nullable=False)

    email = Column(String(150), unique=True, nullable=False)

    hashed_password = Column(String(255), nullable=False)

    role = Column(Enum(UserRole), default=UserRole.STAFF)

    is_active = Column(Boolean, default=True)