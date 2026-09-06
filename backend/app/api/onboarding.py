from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.user import OnboardingUpdate, UserResponse
from app.services.activity.logger import build_activity_log, EventType, EventCategory

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


@router.post("/complete", response_model=UserResponse)
async def complete_onboarding(
    payload: OnboardingUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if not payload.preferred_name or not payload.preferred_name.strip():
        raise HTTPException(status_code=400, detail="Preferred name is required")

    current_user.preferred_name = payload.preferred_name.strip()
    if payload.wellness_goals:
        current_user.wellness_goals = payload.wellness_goals
    if payload.preferred_style:
        current_user.preferred_style = payload.preferred_style
    current_user.onboarding_completed = True

    from datetime import datetime
    current_user.updated_at = datetime.utcnow()
    db.add(build_activity_log(
        user_id=current_user.id,
        event_type=EventType.ONBOARDING_COMPLETED,
        event_category=EventCategory.ONBOARDING,
        metadata={"goals": bool(payload.wellness_goals), "preferred_style": payload.preferred_style},
        request=request,
    ))
    await db.commit()
    await db.refresh(current_user)
    return current_user
