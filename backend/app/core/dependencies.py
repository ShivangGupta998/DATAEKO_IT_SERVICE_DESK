from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from app.core.config import settings


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme)
):

    try:

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        user_id = payload.get("user_id")
        role_id = payload.get("role_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        return {
            "user_id": user_id,
            "role_id": role_id
        }

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


def require_roles(*allowed_roles: int):

    def role_checker(
        current_user: dict = Depends(get_current_user)
    ):

        role_id = current_user.get("role_id")

        if role_id not in allowed_roles:

            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action"
            )

        return current_user

    return role_checker