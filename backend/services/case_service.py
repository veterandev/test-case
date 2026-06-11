from sqlalchemy.orm import Session
from models.case import Case


def get_user_cases(db: Session, user_id: int):

    return db.query(Case).filter(
        Case.user_id == user_id
    ).all()
