from datetime import datetime, timedelta


# ============================================================
# CALCULATE SLA DEADLINE
# ============================================================

def calculate_sla_due(priority: str) -> datetime:
    """
    Calculate SLA deadline based on ticket priority.
    """

    now = datetime.utcnow()

    priority = priority.lower()


    if priority == "critical":

        return now + timedelta(hours=2)


    elif priority == "high":

        return now + timedelta(hours=8)


    elif priority == "medium":

        return now + timedelta(hours=24)


    elif priority == "low":

        return now + timedelta(hours=72)


    # Default SLA

    return now + timedelta(hours=24)




# ============================================================
# GET SLA STATUS
# ============================================================

def get_sla_status(
    sla_due: datetime,
    resolved_at: datetime = None
) -> str:
    """
    Returns current SLA status.
    """


    # Ticket already resolved

    if resolved_at:


        if resolved_at <= sla_due:

            return "Resolved Within SLA"


        else:

            return "Resolved After SLA"



    # Ticket is not resolved

    now = datetime.utcnow()


    # SLA deadline crossed

    if now > sla_due:

        return "Breached"



    remaining = sla_due - now



    # Less than 1 hour remaining

    if remaining.total_seconds() <= 3600:

        return "Near Breach"



    return "Within SLA"





# ============================================================
# GET REMAINING MINUTES
# ============================================================

def get_remaining_minutes(
    sla_due: datetime
) -> int:
    """
    Returns remaining SLA time in minutes.

    Positive value:
        SLA time remaining

    Negative value:
        SLA already breached
    """


    remaining = sla_due - datetime.utcnow()


    return int(
        remaining.total_seconds() / 60
    )