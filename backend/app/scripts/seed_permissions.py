import logging
from app.database.database import SessionLocal
from app.models.permission import Permission

logger = logging.getLogger(__name__)

def seed_permissions() -> None:
    db = SessionLocal()
    permissions = [
        {
            "name": "manage_users",
            "description": "Create, update and delete users"
        },
        {
            "name": "manage_settings",
            "description": "Manage application settings"
        },
        {
            "name": "view_reports",
            "description": "View reports and analytics"
        },
        {
            "name": "manage_tickets",
            "description": "Manage all tickets"
        },
        {
            "name": "update_ticket",
            "description": "Update assigned tickets"
        },
        {
            "name": "create_ticket",
            "description": "Create new tickets"
        }
    ]

    try:
        for permission in permissions:
            existing = db.query(Permission).filter(
                Permission.name == permission["name"]
            ).first()

            if not existing:
                db.add(Permission(**permission))

        db.commit()
        logger.info("Permissions seeded successfully.")
    except Exception as e:
        logger.error(f"Failed to seed permissions: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_permissions()