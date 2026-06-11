from sqlalchemy import Column, Integer, DateTime, Boolean
from sqlalchemy.ext.declarative import as_declarative, declared_attr
from utils.time import utcnow

@as_declarative()
class Base:
    id = Column(Integer, primary_key=True, index=True)
    
    # Table Name as its Class name
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower()

    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False) # for soft delete
    
    # method for soft delete
    def soft_delete(self):
        self.is_deleted = True