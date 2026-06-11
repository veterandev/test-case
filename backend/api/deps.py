from fastapi import Depends, HTTPException, Cookie
from sqlalchemy.orm import Session
from utils.time import utcnow, ensure_utc

from db.session import SessionLocal
from models.session import Session as UserSession


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_session(
    session_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):

    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(UserSession).filter(
        UserSession.token == session_token
    ).first()

    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    if ensure_utc(session.expires_at) < utcnow():
        raise HTTPException(status_code=401, detail="Session expired")

    return session
