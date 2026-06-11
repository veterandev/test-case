from pydantic import BaseModel
from datetime import datetime
from models.enums import UserRole


class UserResponse(BaseModel):

    id: int
    name: str
    email: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True
