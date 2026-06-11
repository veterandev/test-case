from sqlalchemy import Column, Integer, String, DateTime
from db.base import Base

class Log(Base):
    level = Column(String)
    message = Column(String)
