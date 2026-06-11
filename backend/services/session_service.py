# session_service.py
from sqlalchemy.orm import Session
from datetime import timedelta

from models.session import Session as UserSession
from utils.security import generate_token
from utils.time import utcnow
from core.config import SESSION_EXPIRE_HOURS


def create_session(db: Session, user_id: int):

    token = generate_token()
    print("token",token)
    expires_at = utcnow() + timedelta(hours=SESSION_EXPIRE_HOURS)

    session = UserSession(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


def refresh_session(db: Session, old_session: UserSession):

    new_token = generate_token()

    old_session.token = new_token
    old_session.expires_at = utcnow() + timedelta(hours=SESSION_EXPIRE_HOURS)

    db.commit()

    return old_session


def logout_session(db: Session, session: UserSession):

    db.delete(session)
    db.commit()

def logout(db: Session, token: str):
    db.query(UserSession).filter(UserSession.token == token).delete()
    db.commit()
    
def cleanup_expired_sessions(db: Session):

    db.query(UserSession).filter(
        UserSession.expires_at < utcnow()
    ).delete()

    db.commit()
