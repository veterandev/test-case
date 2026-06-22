# auth_service.py
from sqlalchemy.orm import Session
from models.user import User
from services.session_service import create_session


def login_with_qr(db: Session, key: str):

    user = db.query(User).filter(
        User.qr_key == key
    ).first()

    if not user:
        return None

    session = create_session(db, user.id)

    return session.token

def user_info(db: Session, id: int):

    user = db.query(User).filter(
        User.id == id
    ).first()

    print("user_info:", user)

    if not user:
        return None

    return user

