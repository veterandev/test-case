# auth_api.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse
from api.deps import get_current_session

from api.deps import get_db
from services.auth_service import login_with_qr

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/qr-login", response_model=None)
def qr_login(key: str, db: Session = Depends(get_db)):

    token = login_with_qr(db, key)

    if not token:
        return {"error": "invalid key"}

    response = JSONResponse({"status": "ok"})

    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False
    )
    
    return response

@router.get("/me")
def get_me(session=Depends(get_current_session)):

    user = session.user

    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "avatar": f"https://ui-avatars.com/api/?name={user.name}"
#            "avatar": user.avatar_url
        }
    }

@router.post("/refresh")
def refresh(
    session=Depends(get_current_session),
    db: Session = Depends(get_db)
):

    from services.session_service import refresh_session

    updated = refresh_session(db, session)

    response = JSONResponse({"message": "refreshed"})

    response.set_cookie(
        key="session_token",
        value=updated.token,
        httponly=True,
        samesite="lax"
    )

    return response

@router.post("/logout")
def logout(
    session=Depends(get_current_session),
    db: Session = Depends(get_db)
):

    from services.session_service import logout_session

    logout_session(db, session)

    response = JSONResponse({"message": "logged out"})

    response.delete_cookie("session_token")

    return response
