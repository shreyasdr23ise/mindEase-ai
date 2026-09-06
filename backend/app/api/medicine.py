from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.medicine import MedicineInformation
from app.schemas.medicine import MedicineResponse, MedicineList
from app.services.activity.logger import build_activity_log, EventType, EventCategory

router = APIRouter(prefix="/api/medicine", tags=["medicine"])


@router.get("/search", response_model=MedicineList)
async def search_medicines(
    request: Request,
    q: str = Query(..., min_length=2, description="Search query (name, generic name, or category)"),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = f"%{q.lower()}%"
    result = await db.execute(
        select(MedicineInformation)
        .where(
            or_(
                MedicineInformation.name.ilike(query),
                MedicineInformation.generic_name.ilike(query),
                MedicineInformation.category.ilike(query),
            )
        )
        .filter(MedicineInformation.is_active == True)
        .limit(limit)
    )
    medicines = list(result.scalars().all())
    db.add(build_activity_log(
        user_id=current_user.id,
        event_type=EventType.MEDICINE_INFO_REQUEST,
        event_category=EventCategory.MEDICINE,
        metadata={"result_count": len(medicines), "queried": True},
        request=request,
    ))
    await db.commit()
    return MedicineList(
        medicines=[MedicineResponse.model_validate(m) for m in medicines],
        total=len(medicines),
    )


@router.get("/{medicine_id}", response_model=MedicineResponse)
async def get_medicine(
    medicine_id,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MedicineInformation).where(
            MedicineInformation.id == medicine_id,
            MedicineInformation.is_active == True,
        )
    )
    medicine = result.scalar_one_or_none()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    db.add(build_activity_log(
        user_id=current_user.id,
        event_type=EventType.MEDICINE_INFO_REQUEST,
        event_category=EventCategory.MEDICINE,
        metadata={"medicine": medicine.generic_name or medicine.name, "queried": True},
        request=request,
    ))
    await db.commit()
    return medicine


@router.get("", response_model=MedicineList)
async def list_medicines(
    category: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(MedicineInformation).where(MedicineInformation.is_active == True)
    if category:
        query = query.where(MedicineInformation.category == category)
    result = await db.execute(query.order_by(MedicineInformation.name).limit(limit))
    medicines = list(result.scalars().all())
    return MedicineList(
        medicines=[MedicineResponse.model_validate(m) for m in medicines],
        total=len(medicines),
    )
