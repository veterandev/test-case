from sqlalchemy import Column, Integer, String, ForeignKey
from db.base import Base

class CaseDetail(Base):
    case_id = Column(Integer, ForeignKey("case.id"))
    field = Column(String)
    value = Column(String)
