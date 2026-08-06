from fastapi import APIRouter, Depends

from app.core.rbac import require_permission

router = APIRouter(
    prefix="/test",
    tags=["RBAC Test"]
)


@router.get("/admin")
def admin_test(
    current_user=Depends(require_permission("manage_users"))
):
    return {
        "message": "Welcome Admin",
        "user": current_user
    }