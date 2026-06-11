from pydantic import BaseModel
from datetime import datetime

class CaseResponse(BaseModel):

    id: int
    title: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
