from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from db.base import Base

class Session(Base):
    user_id = Column(Integer, ForeignKey("user.id"))
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime)

