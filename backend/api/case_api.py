from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from api.deps import get_db, get_current_session
from services.case_service import get_user_cases
from schemas.case_schema import CaseResponse

router = APIRouter(
    prefix="/case",
    tags=["case"],
    dependencies=[Depends(get_current_session)]
)


@router.get("/list", response_model=List[CaseResponse])
def list_cases(
    session=Depends(get_current_session),
    db: Session = Depends(get_db)
):

    cases = get_user_cases(db, session.user_id)

    return cases
