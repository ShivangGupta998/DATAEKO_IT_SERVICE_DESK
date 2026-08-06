from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import hash_password


def create_user(
    db: Session,
    user_data
):

    hashed_password = hash_password(
        user_data.password
    )

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        role_id=user_data.role_id,
        department_id=user_data.department_id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user