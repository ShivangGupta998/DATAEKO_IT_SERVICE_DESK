from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user

from app.models.permission import Permission
from app.models.role_permission import RolePermission


def require_permission(permission_name: str):

    def permission_checker(
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db)
    ):

        permission = (
            db.query(Permission)
            .filter(Permission.name == permission_name)
            .first()
        )

        if not permission:
            raise HTTPException(
                status_code=404,
                detail="Permission not found"
            )

        role_permission = (
            db.query(RolePermission)
            .filter(
                RolePermission.role_id == current_user["role_id"],
                RolePermission.permission_id == permission.id
            )
            .first()
        )

        if not role_permission:
            raise HTTPException(
                status_code=403,
                detail="Permission denied"
            )

        return current_user

    return permission_checker