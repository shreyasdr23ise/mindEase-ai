from uuid import uuid4
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.wellness import WellnessExercise, WellnessSession
from app.schemas.wellness import (
    WellnessExerciseResponse, WellnessSessionCreate, WellnessSessionResponse,
)
from app.services.activity.logger import build_activity_log, EventType, EventCategory

router = APIRouter(prefix="/api/wellness", tags=["wellness"])

VALID_CATEGORIES = {
    "breathing", "grounding", "mindfulness", "stress_relief",
    "cbt", "sleep", "positive_reflection",
}


@router.get("/", response_model=list[WellnessExerciseResponse])
async def list_exercises(
    category: Optional[str] = Query(None, description="Filter by exercise category"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(WellnessExercise).where(WellnessExercise.is_active == True)
    if category:
        if category not in VALID_CATEGORIES:
            raise HTTPException(status_code=400, detail=f"Invalid category. Valid: {sorted(VALID_CATEGORIES)}")
        query = query.where(WellnessExercise.category == category)
    result = await db.execute(query.order_by(WellnessExercise.category))
    return list(result.scalars().all())


@router.post("/session", response_model=WellnessSessionResponse, status_code=status.HTTP_201_CREATED)
async def log_wellness_session(
    payload: WellnessSessionCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    exercise_result = await db.execute(
        select(WellnessExercise).where(WellnessExercise.id == payload.exercise_id)
    )
    exercise = exercise_result.scalar_one_or_none()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    session = WellnessSession(
        id=uuid4(),
        user_id=current_user.id,
        exercise_id=payload.exercise_id,
        completed=payload.completed,
        duration_seconds=payload.duration_seconds,
        notes=payload.notes,
    )
    db.add(session)

    event_type = EventType.WELLNESS_COMPLETED if payload.completed else EventType.WELLNESS_STARTED
    db.add(build_activity_log(
        user_id=current_user.id,
        event_type=event_type,
        event_category=EventCategory.WELLNESS,
        metadata={
            "exercise": exercise.category,
            "completed": bool(payload.completed),
            "duration_seconds": payload.duration_seconds,
        },
        request=request,
    ))
    await db.commit()
    await db.refresh(session)

    return WellnessSessionResponse(
        id=session.id,
        user_id=session.user_id,
        exercise_id=session.exercise_id,
        completed=session.completed,
        duration_seconds=session.duration_seconds,
        notes=session.notes,
        created_at=session.created_at,
        exercise=WellnessExerciseResponse.model_validate(exercise),
    )


@router.get("/sessions/history", response_model=list[WellnessSessionResponse])
async def get_session_history(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WellnessSession)
        .where(WellnessSession.user_id == current_user.id)
        .order_by(WellnessSession.created_at.desc())
    )
    sessions = list(result.scalars().all())

    responses = []
    for s in sessions:
        ex = await db.execute(select(WellnessExercise).where(WellnessExercise.id == s.exercise_id))
        exercise = ex.scalar_one_or_none()
        responses.append(
            WellnessSessionResponse(
                id=s.id,
                user_id=s.user_id,
                exercise_id=s.exercise_id,
                completed=s.completed,
                duration_seconds=s.duration_seconds,
                notes=s.notes,
                created_at=s.created_at,
                exercise=WellnessExerciseResponse.model_validate(exercise) if exercise else None,
            )
        )
    return responses


@router.get("/{exercise_id}", response_model=WellnessExerciseResponse)
async def get_exercise(
    exercise_id,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WellnessExercise).where(WellnessExercise.id == exercise_id)
    )
    exercise = result.scalar_one_or_none()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise
