from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ============================================================
# CREATE ASSET
# ============================================================

class AssetCreate(BaseModel):

    asset_tag: str

    asset_type: str = "Hardware"

    manufacturer: str = "Apple"

    model: str

    serial_number: str

    purchase_date: Optional[date] = None


# ============================================================
# UPDATE ASSET
# ============================================================

class AssetUpdate(BaseModel):

    asset_tag: Optional[str] = None

    asset_type: Optional[str] = None

    manufacturer: Optional[str] = None

    model: Optional[str] = None

    serial_number: Optional[str] = None

    status: Optional[str] = None

    purchase_date: Optional[date] = None


# ============================================================
# ASSIGN ASSET
# ============================================================

class AssetAssign(BaseModel):

    assigned_to: int


# ============================================================
# RESPONSE
# ============================================================

class AssetResponse(BaseModel):

    id: int

    asset_tag: str

    asset_type: str

    manufacturer: str

    model: str

    serial_number: str

    assigned_to: Optional[int]

    status: str

    purchase_date: Optional[date]

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )