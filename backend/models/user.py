from sqlalchemy import Column, Integer, String, DateTime, Enum
from db.base import Base
from models.enums import UserRole

class User(Base):
    full_name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    qr_key = Column(String(50), unique=True, index=True) # Unique Key for access
    role = Column(Enum(UserRole), default=UserRole.guest, nullable=False)
