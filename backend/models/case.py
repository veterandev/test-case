from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from db.base import Base

class Case(Base):
    user_id = Column(Integer, ForeignKey("user.id"))
    title = Column(String)
    status = Column(String)
