import logging
from app.database.database import SessionLocal
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission

logger = logging.getLogger(__name__)

def seed_role_permissions() -> None:
    db = SessionLocal()

    role_permissions = {
        "Admin": [
            "manage_users",
            "manage_settings",
            "view_reports",
            "manage_tickets",
            "update_ticket",
            "create_ticket",
        ],
        "IT Manager": [
            "view_reports",
            "manage_tickets",
            "update_ticket",
        ],
        "Agent": [
            "update_ticket",
        ],
        "Employee": [
            "create_ticket",
        ],
    }

    try:
        for role_name, permission_names in role_permissions.items():
            role = db.query(Role).filter(Role.name == role_name).first()

            if not role:
                continue

            for permission_name in permission_names:
                permission = db.query(Permission).filter(
                    Permission.name == permission_name
                ).first()

                if not permission:
                    continue

                exists = db.query(RolePermission).filter(
                    RolePermission.role_id == role.id,
                    RolePermission.permission_id == permission.id
                ).first()

                if not exists:
                    db.add(
                        RolePermission(
                            role_id=role.id,
                            permission_id=permission.id
                        )
                    )

        db.commit()
        logger.info("Role permissions seeded successfully.")
    except Exception as e:
        logger.error(f"Failed to seed role permissions: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_role_permissions()