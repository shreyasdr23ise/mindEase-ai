from uuid import uuid4
from datetime import datetime, date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.mood import MoodLog
from app.schemas.mood import MoodCreate, MoodUpdate, MoodResponse, MoodHistory

router = APIRouter(prefix="/api/mood", tags=["mood"])

VALID_MOODS = {"very_good", "good", "neutral", "low", "very_low"}


@router.post("/", response_model=MoodResponse, status_code=status.HTTP_201_CREATED)
async def create_mood_log(
    payload: MoodCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.mood not in VALID_MOODS:
        raise HTTPException(status_code=400, detail=f"Invalid mood. Must be one of {sorted(VALID_MOODS)}")
    if not 1 <= payload.stress_level <= 10:
        raise HTTPException(status_code=400, detail="Stress level must be between 1 and 10")
    if not 1 <= payload.anxiety_level <= 10:
        raise HTTPException(status_code=400, detail="Anxiety level must be between 1 and 10")

    log = MoodLog(
        id=uuid4(),
        user_id=current_user.id,
        mood=payload.mood,
        stress_level=payload.stress_level,
        anxiety_level=payload.anxiety_level,
        note=payload.note,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/", response_model=list[MoodResponse])
async def get_mood_logs(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MoodLog)
        .where(MoodLog.user_id == current_user.id)
        .order_by(MoodLog.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/history", response_model=MoodHistory)
async def get_mood_history(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(MoodLog).where(MoodLog.user_id == current_user.id)

    if start_date:
        start_dt = datetime.combine(start_date, datetime.min.time())
        query = query.where(MoodLog.created_at >= start_dt)
    if end_date:
        end_dt = datetime.combine(end_date, datetime.max.time())
        query = query.where(MoodLog.created_at <= end_dt)

    result = await db.execute(query.order_by(MoodLog.created_at.desc()))
    logs = list(result.scalars().all())

    if not logs:
        return MoodHistory(logs=[], total=0)

    avg_stress = sum(l.stress_level for l in logs) / len(logs)
    avg_anxiety = sum(l.anxiety_level for l in logs) / len(logs)

    distribution = {}
    for l in logs:
        distribution[l.mood] = distribution.get(l.mood, 0) + 1

    return MoodHistory(
        logs=logs,
        total=len(logs),
        average_stress=round(avg_stress, 2),
        average_anxiety=round(avg_anxiety, 2),
        mood_distribution=distribution,
    )


@router.get("/{log_id}", response_model=MoodResponse)
async def get_mood_log(
    log_id,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MoodLog).where(MoodLog.id == log_id, MoodLog.user_id == current_user.id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Mood log not found")
    return log


@router.patch("/{log_id}", response_model=MoodResponse)
async def update_mood_log(
    log_id,
    payload: MoodUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MoodLog).where(MoodLog.id == log_id, MoodLog.user_id == current_user.id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Mood log not found")

    if payload.mood is not None:
        if payload.mood not in VALID_MOODS:
            raise HTTPException(status_code=400, detail="Invalid mood value")
        log.mood = payload.mood
    if payload.stress_level is not None:
        if not 1 <= payload.stress_level <= 10:
            raise HTTPException(status_code=400, detail="Stress level out of range")
        log.stress_level = payload.stress_level
    if payload.anxiety_level is not None:
        if not 1 <= payload.anxiety_level <= 10:
            raise HTTPException(status_code=400, detail="Anxiety level out of range")
        log.anxiety_level = payload.anxiety_level
    if payload.note is not None:
        log.note = payload.note

    await db.commit()
    await db.refresh(log)
    return log


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mood_log(
    log_id,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MoodLog).where(MoodLog.id == log_id, MoodLog.user_id == current_user.id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Mood log not found")
    await db.delete(log)
    await db.commit()
