from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.emergency import EmergencyResource
from app.schemas.emergency import EmergencyResourceResponse
from app.services.activity.logger import build_activity_log, EventType, EventCategory

router = APIRouter(prefix="/api/emergency", tags=["emergency"])


@router.get("/", response_model=list[EmergencyResourceResponse])
async def list_emergency_resources(
    request: Request,
    country: Optional[str] = Query(None, description="Filter by country"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(EmergencyResource).where(EmergencyResource.is_active == True)
    if country:
        query = query.where(EmergencyResource.country == country)
    result = await db.execute(query.order_by(EmergencyResource.country))
    resources = list(result.scalars().all())
    db.add(build_activity_log(
        user_id=current_user.id,
        event_type=EventType.EMERGENCY_OPENED,
        event_category=EventCategory.EMERGENCY,
        metadata={"resource_count": len(resources), "country": country},
        request=request,
    ))
    await db.commit()
    return resources
