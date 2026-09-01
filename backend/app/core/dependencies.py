from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.database import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Support both 'user_id' and standard JWT 'sub' payload fields
        user_id = payload.get("user_id") or payload.get("sub")

        if user_id is None:
            raise credentials_exception

        # Safely parse user ID to integer
        parsed_user_id = int(user_id)

    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    # Query the user model directly from the database
    user = db.query(User).filter(User.id == parsed_user_id).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user


def require_roles(*allowed_roles: int):
    """Dependency wrapper for Role-Based Access Control (RBAC)."""
    def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.role_id not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )

        return current_user

    return role_checker