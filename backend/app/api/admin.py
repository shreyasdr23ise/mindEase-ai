from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.models.mood import MoodLog
from app.models.journal import JournalEntry
from app.models.crisis import CrisisEvent
from app.models.wellness import WellnessSession
from app.models.counselor import Counselor
from app.models.audit import AuditLog
from app.schemas.admin import AdminAnalytics, UserListResponse

router = APIRouter(prefix="/api/admin", tags=["admin"])


async def _require_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def _get_count(db: AsyncSession, model) -> int:
    result = await db.execute(select(func.count()).select_from(model))
    return result.scalar() or 0


@router.get("/users", response_model=list[UserListResponse])
async def list_users(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_admin(current_user)
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = list(result.scalars().all())
    return [
        UserListResponse(
            id=u.id,
            email=u.email,
            username=u.username,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            onboarding_completed=u.onboarding_completed,
            created_at=u.created_at.isoformat(),
        )
        for u in users
    ]


@router.get("/analytics", response_model=AdminAnalytics)
async def get_analytics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_admin(current_user)

    today = datetime.utcnow()
    today_start = today.replace(hour=0, minute=0, second=0, microsecond=0)

    total_users = await _get_count(db, User)
    total_conversations = await _get_count(db, Conversation)
    total_messages = await _get_count(db, Message)
    total_mood_logs = await _get_count(db, MoodLog)
    total_journal_entries = await _get_count(db, JournalEntry)
    total_crisis_events = await _get_count(db, CrisisEvent)
    total_wellness_sessions = await _get_count(db, WellnessSession)
    total_counselors = await _get_count(db, Counselor)

    active_today_result = await db.execute(
        select(func.count(func.distinct(Message.user_id)))
        .select_from(Message)
        .where(Message.created_at >= today_start)
    )
    active_today = active_today_result.scalar() or 0

    return AdminAnalytics(
        total_users=total_users,
        total_conversations=total_conversations,
        total_messages=total_messages,
        total_mood_logs=total_mood_logs,
        total_journal_entries=total_journal_entries,
        total_crisis_events=total_crisis_events,
        total_wellness_sessions=total_wellness_sessions,
        active_users_today=active_today,
        total_counselors=total_counselors,
    )


@router.get("/audit-logs", response_model=list[dict])
async def get_audit_logs(
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_admin(current_user)
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    )
    logs = list(result.scalars().all())
    return [
        {
            "id": str(l.id),
            "user_id": str(l.user_id) if l.user_id else None,
            "action": l.action,
            "details": l.details,
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat(),
        }
        for l in logs
    ]


@router.post("/users/{user_id}/deactivate", status_code=status.HTTP_200_OK)
async def deactivate_user(
    user_id,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_admin(current_user)
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    target_user.is_active = False
    await db.commit()
    return {"message": f"User {target_user.email} deactivated"}
