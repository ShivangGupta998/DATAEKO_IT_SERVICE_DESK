import asyncio
from datetime import datetime, time, timedelta
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.services.auto_assign_service import auto_assign_stale_tickets

# Business Hours Configuration: Mon-Fri, 9:00 AM - 5:00 PM
WORK_START_HOUR = 9
WORK_END_HOUR = 17

def add_business_hours(start_dt: datetime, hours_to_add: int) -> datetime:
    """Calculates SLA due date strictly within business hours (Mon-Fri, 9am-5pm)."""
    current = start_dt

    if current.weekday() >= 5:
        days_ahead = 7 - current.weekday()
        current = datetime.combine(current.date() + timedelta(days=days_ahead), time(WORK_START_HOUR, 0))
    elif current.hour >= WORK_END_HOUR:
        current = datetime.combine(current.date() + timedelta(days=1), time(WORK_START_HOUR, 0))
        if current.weekday() >= 5:
            days_ahead = 7 - current.weekday()
            current = datetime.combine(current.date() + timedelta(days=days_ahead), time(WORK_START_HOUR, 0))
    elif current.hour < WORK_START_HOUR:
        current = datetime.combine(current.date(), time(WORK_START_HOUR, 0))

    remaining_hours = hours_to_add

    while remaining_hours > 0:
        day_end = datetime.combine(current.date(), time(WORK_END_HOUR, 0))
        hours_available_today = (day_end - current).total_seconds() / 3600.0

        if remaining_hours <= hours_available_today:
            current += timedelta(hours=remaining_hours)
            remaining_hours = 0
        else:
            remaining_hours -= hours_available_today
            next_day = current.date() + timedelta(days=1)
            while next_day.weekday() >= 5:
                next_day += timedelta(days=1)
            current = datetime.combine(next_day, time(WORK_START_HOUR, 0))

    return current

def calculate_sla_due(priority: str) -> datetime:
    """Calculate SLA deadline based on ticket priority."""
    now = datetime.utcnow()
    p = (priority or "medium").lower()
    sla_hours = {"critical": 2, "high": 8, "medium": 24, "low": 72}.get(p, 24)
    return add_business_hours(now, sla_hours)

def get_sla_status(sla_due: datetime, resolved_at: datetime = None, status: str = "") -> str:
    """Returns SLA status taking resolution state and paused states into account."""
    if status.lower() in ["waiting for customer", "paused"]:
        return "Paused"
    if resolved_at:
        return "Resolved Within SLA" if resolved_at <= sla_due else "Resolved After SLA"

    now = datetime.utcnow()
    if now > sla_due:
        return "Breached"
    elif (sla_due - now).total_seconds() <= 3600:
        return "Near Breach"
    return "Within SLA"

def get_remaining_minutes(sla_due: datetime) -> int:
    """Returns remaining SLA time in minutes."""
    remaining = sla_due - datetime.utcnow()
    return int(remaining.total_seconds() / 60)

async def start_sla_and_auto_assign_scheduler():
    """Background task loop executing auto-assignment every 90 minutes."""
    print("--> SLA & Auto-Assign Background Task Initiated (90 min interval).")
    while True:
        try:
            db = SessionLocal()
            try:
                auto_assign_stale_tickets(db)
            finally:
                db.close()
        except Exception as e:
            print(f"--> Auto-Assign Loop Exception: {e}")
            
        # 5400 seconds = 90 minutes
        await asyncio.sleep(5400)