# auth_api.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse, RedirectResponse

from api.deps import get_current_session, get_optional_session

from api.deps import get_db
from services.auth_service import login_with_qr, user_info

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/qr-login", response_model=None)
def qr_login(key: str, db: Session = Depends(get_db)):

    token = login_with_qr(db, key)

    if not token:
        return {"error": "invalid key"}
    response = JSONResponse({"status": "ok"})

    # if not token:
    #     return RedirectResponse(
    #         url="http://127.0.0.1:3000/login-failed",
    #         status_code=302
    #     )

    # response = RedirectResponse(
    #     url="http://127.0.0.1:3000",
    #     status_code=302
    # )

    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False
    )
    
    return response

@router.get("/me")
async def get_me(
    session=Depends(get_optional_session),
    db: Session = Depends(get_db)):
    if not session:
        return {
            "authenticated": False,
            "user": {
                "id": 1234,
                "user_name": "Guest1",
                "user_role": "Guest",
                "avatar": "https://ui-avatars.com/api/?name=Guest"
            }
        }

    user_id = session.user_id
    print("session.user_id:",session.user_id)
    user = user_info(db, user_id)

    if not user:
        return {
            "authenticated": False,
            "user": {
                "id": 1234,
                "user_name": "Guest2",
                "user_role": "Guest",
                "avatar": "https://ui-avatars.com/api/?name=Guest"
            }
        }

    return {
        "authenticated": True,
        "user": {
            "id": user_id,
            "user_name": user.full_name,
            "user_role": user.role,
            "avatar": f"https://ui-avatars.com/api/?name={user.full_name}"
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
