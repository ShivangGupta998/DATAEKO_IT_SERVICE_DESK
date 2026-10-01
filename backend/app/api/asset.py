from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.asset import Asset
from app.models.user import User

from app.schemas.asset import (
    AssetCreate,
    AssetUpdate,
    AssetAssign,
    AssetResponse
)

from app.core.dependencies import (
    get_current_user,
    require_roles
)


router = APIRouter(
    prefix="/assets",
    tags=["Assets"]
)


# ============================================================
# ROLE IDS
# ============================================================

ADMIN = 1
MANAGER = 2
TECHNICIAN = 3
EMPLOYEE = 4


# ============================================================
# CREATE ASSET
# ADMIN / MANAGER / TECHNICIAN
# ============================================================

@router.post(
    "/",
    response_model=AssetResponse,
    status_code=status.HTTP_201_CREATED
)
def create_asset(
    asset_data: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            ADMIN,
            MANAGER,
            TECHNICIAN
        )
    )
):

    # Check asset tag
    existing_asset = (
        db.query(Asset)
        .filter(Asset.asset_tag == asset_data.asset_tag)
        .first()
    )

    if existing_asset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Asset tag already exists"
        )

    # Check serial number
    existing_serial = (
        db.query(Asset)
        .filter(Asset.serial_number == asset_data.serial_number)
        .first()
    )

    if existing_serial:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Serial number already exists"
        )

    # Create asset (INCLUDING COST)
    asset = Asset(
        asset_tag=asset_data.asset_tag,
        asset_type=asset_data.asset_type,
        manufacturer=asset_data.manufacturer,
        model=asset_data.model,
        serial_number=asset_data.serial_number,
        cost=asset_data.cost,  # <--- PASS COST TO ORM MODEL
        purchase_date=asset_data.purchase_date,
        status="Available"
    )

    db.add(asset)
    db.commit()
    db.refresh(asset)

    return asset


# ============================================================
# GET ALL ASSETS
# ADMIN / MANAGER / TECHNICIAN
# ============================================================

@router.get(
    "/",
    response_model=list[AssetResponse]
)
def get_assets(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            ADMIN,
            MANAGER,
            TECHNICIAN
        )
    )
):

    assets = (
        db.query(Asset)
        .order_by(Asset.created_at.desc())
        .all()
    )

    return assets


# ============================================================
# GET MY ASSETS
# ALL AUTHENTICATED USERS
# ============================================================

@router.get(
    "/my",
    response_model=list[AssetResponse]
)
def get_my_assets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    user_id = current_user.id

    assets = (
        db.query(Asset)
        .filter(Asset.assigned_to == user_id)
        .order_by(Asset.created_at.desc())
        .all()
    )

    return assets


# ============================================================
# GET SINGLE ASSET
# ============================================================

@router.get(
    "/{asset_id:int}",
    response_model=AssetResponse
)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    user_id = current_user.id
    role_id = current_user.role_id

    asset = (
        db.query(Asset)
        .filter(Asset.id == asset_id)
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )

    # Employee can view only their assigned asset
    if role_id == EMPLOYEE:
        if asset.assigned_to != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your assigned assets"
            )

    return asset


# ============================================================
# UPDATE ASSET
# ADMIN / MANAGER / TECHNICIAN
# ============================================================

@router.patch(
    "/{asset_id:int}",
    response_model=AssetResponse
)
def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            ADMIN,
            MANAGER,
            TECHNICIAN
        )
    )
):

    asset = (
        db.query(Asset)
        .filter(Asset.id == asset_id)
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )

    # Check asset tag duplicate
    if asset_data.asset_tag is not None:
        duplicate = (
            db.query(Asset)
            .filter(
                Asset.asset_tag == asset_data.asset_tag,
                Asset.id != asset_id
            )
            .first()
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Asset tag already exists"
            )

        asset.asset_tag = asset_data.asset_tag

    # Check serial number duplicate
    if asset_data.serial_number is not None:
        duplicate = (
            db.query(Asset)
            .filter(
                Asset.serial_number == asset_data.serial_number,
                Asset.id != asset_id
            )
            .first()
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Serial number already exists"
            )

        asset.serial_number = asset_data.serial_number

    # Update other fields
    if asset_data.asset_type is not None:
        asset.asset_type = asset_data.asset_type

    if asset_data.manufacturer is not None:
        asset.manufacturer = asset_data.manufacturer

    if asset_data.model is not None:
        asset.model = asset_data.model

    if asset_data.cost is not None:
        asset.cost = asset_data.cost  # <--- UPDATE COST FIELD

    if asset_data.status is not None:
        asset.status = asset_data.status

    if asset_data.purchase_date is not None:
        asset.purchase_date = asset_data.purchase_date

    db.commit()
    db.refresh(asset)

    return asset


# ============================================================
# ASSIGN ASSET
# ADMIN / MANAGER / TECHNICIAN
# ============================================================

@router.patch(
    "/{asset_id:int}/assign",
    response_model=AssetResponse
)
def assign_asset(
    asset_id: int,
    assign_data: AssetAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            ADMIN,
            MANAGER,
            TECHNICIAN
        )
    )
):

    asset = (
        db.query(Asset)
        .filter(Asset.id == asset_id)
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )

    employee = (
        db.query(User)
        .filter(User.id == assign_data.assigned_to)
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if employee.role_id != EMPLOYEE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assets can only be assigned to Employees"
        )

    asset.assigned_to = employee.id
    asset.status = "Assigned"

    db.commit()
    db.refresh(asset)

    return asset


# ============================================================
# RETIRE ASSET
# ADMIN / MANAGER / TECHNICIAN
# ============================================================

@router.patch(
    "/{asset_id:int}/retire",
    response_model=AssetResponse
)
def retire_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            ADMIN,
            MANAGER,
            TECHNICIAN
        )
    )
):

    asset = (
        db.query(Asset)
        .filter(Asset.id == asset_id)
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )

    asset.status = "Retired"
    asset.assigned_to = None

    db.commit()
    db.refresh(asset)

    return asset