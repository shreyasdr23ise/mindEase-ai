import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
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
from app.models.activity import ActivityLog
from app.schemas.admin import (
    AdminAnalytics, UserListResponse,
    ActivityLogPage, ActivityLogResponse, UserActivitySummary, ActivityStats,
)
from app.services.activity.logger import build_activity_log, EventType, EventCategory

router = APIRouter(prefix="/api/admin", tags=["admin"])


async def _require_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def _get_count(db: AsyncSession, model) -> int:
    result = await db.execute(select(func.count()).select_from(model))
    return result.scalar() or 0


def _activity_to_dict(log: ActivityLog) -> dict:
    return {
        "id": str(log.id),
        "user_id": str(log.user_id) if log.user_id else None,
        "event_type": log.event_type,
        "event_category": log.event_category,
        "timestamp": log.timestamp.isoformat(),
        "status": log.status,
        "device_type": log.device_type,
        "device_manufacturer": log.device_manufacturer,
        "device_model": log.device_model,
        "os": log.os,
        "os_version": log.os_version,
        "app_version": log.app_version,
        "network_type": log.network_type,
        "ip_address": log.ip_address,
        "request_id": log.request_id,
        "session_id": log.session_id,
        "metadata": log.event_data,
    }


def _record_admin_event(db, current_user: User, event_type: str, request: Request, metadata: dict | None = None):
    db.add(build_activity_log(
        user_id=current_user.id,
        event_type=event_type,
        event_category=EventCategory.ADMIN,
        metadata=metadata or {},
        request=request,
    ))


@router.get("/users")
async def list_users(
    request: Request,
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
        select(func.count(func.distinct(Conversation.user_id)))
        .select_from(Message)
        .join(Conversation, Message.conversation_id == Conversation.id)
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


@router.get("/dashboard", response_model=ActivityStats)
async def get_dashboard_stats(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_admin(current_user)

    today = datetime.utcnow()
    today_start = today.replace(hour=0, minute=0, second=0, microsecond=0)

    total_events = await _get_count(db, ActivityLog)
    events_today_result = await db.execute(
        select(func.count()).select_from(ActivityLog).where(ActivityLog.timestamp >= today_start)
    )
    events_today = events_today_result.scalar() or 0

    login_events = ("LOGIN", "ADMIN_LOGIN")
    logins_today_result = await db.execute(
        select(func.count()).select_from(ActivityLog).where(
            ActivityLog.timestamp >= today_start,
            ActivityLog.event_type.in_(login_events),
        )
    )
    logins_today = logins_today_result.scalar() or 0

    failed_today_result = await db.execute(
        select(func.count()).select_from(ActivityLog).where(
            ActivityLog.timestamp >= today_start,
            ActivityLog.status == "failed",
        )
    )
    failed_today = failed_today_result.scalar() or 0

    active_today_result = await db.execute(
        select(func.count(func.distinct(ActivityLog.user_id)))
        .select_from(ActivityLog)
        .where(ActivityLog.timestamp >= today_start, ActivityLog.user_id.isnot(None))
    )
    active_today = active_today_result.scalar() or 0

    cat_result = await db.execute(
        select(ActivityLog.event_category, func.count()).group_by(ActivityLog.event_category)
    )
    by_category = {cat: count for cat, count in cat_result.all()}

    type_result = await db.execute(
        select(ActivityLog.event_type, func.count()).group_by(ActivityLog.event_type)
    )
    by_event_type = {etype: count for etype, count in type_result.all()}

    _record_admin_event(db, current_user, EventType.ADMIN_VIEW_ACTIVITY, request,
                        metadata={"scope": "dashboard"})
    await db.commit()

    return ActivityStats(
        total_events=total_events,
        events_today=events_today,
        logins_today=logins_today,
        active_users_today=active_today,
        failed_logins_today=failed_today,
        by_category=by_category,
        by_event_type=by_event_type,
    )


@router.get("/activity")
async def get_activity_logs(
    request: Request,
    user_id: str | None = Query(None, description="Filter by user id"),
    event_type: str | None = Query(None, description="Filter by event type"),
    event_category: str | None = Query(None, description="Filter by event category"),
    status_filter: str | None = Query(None, alias="status", description="Filter by status: success|failed"),
    date_from: str | None = Query(None, description="ISO date (YYYY-MM-DD)"),
    date_to: str | None = Query(None, description="ISO date (YYYY-MM-DD)"),
    q: str | None = Query(None, description="Server-side text search"),
    sort: str = Query("desc", description="sort: asc|desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_admin(current_user)

    query = select(ActivityLog)
    count_query = select(func.count()).select_from(ActivityLog)

    conditions = []
    if user_id:
        conditions.append(ActivityLog.user_id == user_id)
    if event_type:
        conditions.append(ActivityLog.event_type == event_type)
    if event_category:
        conditions.append(ActivityLog.event_category == event_category)
    if status_filter:
        conditions.append(ActivityLog.status == status_filter)
    if date_from:
        try:
            from_dt = datetime.fromisoformat(date_from)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_from. Use ISO format.")
        conditions.append(ActivityLog.timestamp >= from_dt)
    if date_to:
        try:
            to_dt = datetime.fromisoformat(date_to)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_to. Use ISO format.")
        conditions.append(ActivityLog.timestamp <= to_dt)
    if q:
        like = f"%{q}%"
        conditions.append(
            or_(
                ActivityLog.event_type.ilike(like),
                ActivityLog.event_category.ilike(like),
                ActivityLog.device_manufacturer.ilike(like),
                ActivityLog.device_model.ilike(like),
                ActivityLog.os.ilike(like),
                ActivityLog.app_version.ilike(like),
                ActivityLog.ip_address.ilike(like),
                ActivityLog.request_id.ilike(like),
                ActivityLog.session_id.ilike(like),
            )
        )

    if conditions:
        query = query.where(*conditions)
        count_query = count_query.where(*conditions)

    order = ActivityLog.timestamp.desc() if sort == "desc" else ActivityLog.timestamp.asc()
    result = await db.execute(
        query.order_by(order)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    logs = list(result.scalars().all())

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    _record_admin_event(db, current_user, EventType.ADMIN_VIEW_ACTIVITY, request,
                        metadata={"filtered": bool(q or user_id or event_type), "page": page})
    await db.commit()

    return ActivityLogPage(
        items=[ActivityLogResponse(**x) for x in (_activity_to_dict(l) for l in logs)],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/users/{user_id}")
async def get_user_summary(
    user_id,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_admin(current_user)

    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    total_events_result = await db.execute(
        select(func.count()).select_from(ActivityLog).where(ActivityLog.user_id == target_user.id)
    )
    total_events = total_events_result.scalar() or 0

    last_event_result = await db.execute(
        select(ActivityLog.timestamp)
        .where(ActivityLog.user_id == target_user.id)
        .order_by(ActivityLog.timestamp.desc())
        .limit(1)
    )
    last_event_at = last_event_result.scalar()

    login_count_result = await db.execute(
        select(func.count()).select_from(ActivityLog).where(
            ActivityLog.user_id == target_user.id,
            ActivityLog.event_type == "LOGIN",
        )
    )
    login_count = login_count_result.scalar() or 0

    failed_login_result = await db.execute(
        select(func.count()).select_from(ActivityLog).where(
            ActivityLog.user_id == target_user.id,
            ActivityLog.event_type == "LOGIN_FAILED",
        )
    )
    failed_login_count = failed_login_result.scalar() or 0

    chat_messages_result = await db.execute(
        select(func.count()).select_from(ActivityLog).where(
            ActivityLog.user_id == target_user.id,
            ActivityLog.event_type == "CHAT_MESSAGE",
        )
    )
    chat_messages = chat_messages_result.scalar() or 0

    mood_checkins_result = await db.execute(
        select(func.count()).select_from(ActivityLog).where(
            ActivityLog.user_id == target_user.id,
            ActivityLog.event_type == "MOOD_CHECKIN",
        )
    )
    mood_checkins = mood_checkins_result.scalar() or 0

    journal_entries_result = await db.execute(
        select(func.count()).select_from(ActivityLog).where(
            ActivityLog.user_id == target_user.id,
            ActivityLog.event_type == "JOURNAL_CREATED",
        )
    )
    journal_entries = journal_entries_result.scalar() or 0

    wellness_sessions_result = await db.execute(
        select(func.count()).select_from(ActivityLog).where(
            ActivityLog.user_id == target_user.id,
            ActivityLog.event_type.in_(["WELLNESS_STARTED", "WELLNESS_COMPLETED"]),
        )
    )
    wellness_sessions = wellness_sessions_result.scalar() or 0

    crisis_events_result = await db.execute(
        select(func.count()).select_from(ActivityLog).where(
            ActivityLog.user_id == target_user.id,
            ActivityLog.event_type == "CRISIS_DETECTED",
        )
    )
    crisis_events = crisis_events_result.scalar() or 0

    recent_result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.user_id == target_user.id)
        .order_by(ActivityLog.timestamp.desc())
        .limit(20)
    )
    recent_events = [_activity_to_dict(l) for l in recent_result.scalars().all()]

    _record_admin_event(db, current_user, EventType.ADMIN_VIEW_USER, request,
                        metadata={"target_user": target_user.email})
    await db.commit()

    return UserActivitySummary(
        user_id=target_user.id,
        email=target_user.email,
        full_name=target_user.full_name,
        preferred_name=target_user.preferred_name,
        role=target_user.role,
        is_active=target_user.is_active,
        onboarding_completed=target_user.onboarding_completed,
        created_at=target_user.created_at.isoformat(),
        total_events=total_events,
        last_event_at=last_event_at.isoformat() if last_event_at else None,
        login_count=login_count,
        failed_login_count=failed_login_count,
        chat_messages=chat_messages,
        mood_checkins=mood_checkins,
        journal_entries=journal_entries,
        wellness_sessions=wellness_sessions,
        crisis_events=crisis_events,
        recent_events=[ActivityLogResponse(**x) for x in recent_events],
    )


@router.get("/activity/export", response_class=StreamingResponse)
async def export_activity_csv(
    request: Request,
    user_id: str | None = Query(None, description="Filter by user id"),
    event_type: str | None = Query(None, description="Filter by event type"),
    date_from: str | None = Query(None, description="ISO date (YYYY-MM-DD)"),
    date_to: str | None = Query(None, description="ISO date (YYYY-MM-DD)"),
    limit: int = Query(1000, ge=1, le=10000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_admin(current_user)

    query = select(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(limit)
    conditions = []
    if user_id:
        conditions.append(ActivityLog.user_id == user_id)
    if event_type:
        conditions.append(ActivityLog.event_type == event_type)
    if date_from:
        conditions.append(ActivityLog.timestamp >= datetime.fromisoformat(date_from))
    if date_to:
        conditions.append(ActivityLog.timestamp <= datetime.fromisoformat(date_to))
    if conditions:
        query = query.where(*conditions)

    logs = list((await db.execute(query)).scalars().all())

    _record_admin_event(db, current_user, EventType.ADMIN_EXPORT, request,
                        metadata={"row_count": len(logs), "format": "csv"})
    await db.commit()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "timestamp", "user_id", "event_type", "event_category", "status",
        "device_type", "device_manufacturer", "device_model", "os", "os_version",
        "app_version", "network_type", "ip_address", "request_id", "session_id",
    ])
    for log in logs:
        writer.writerow([
            log.timestamp.isoformat(),
            str(log.user_id) if log.user_id else "",
            log.event_type,
            log.event_category,
            log.status,
            log.device_type or "",
            log.device_manufacturer or "",
            log.device_model or "",
            log.os or "",
            log.os_version or "",
            log.app_version or "",
            log.network_type or "",
            log.ip_address or "",
            log.request_id or "",
            log.session_id or "",
        ])
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=activity_logs.csv"},
    )


@router.post("/users/{user_id}/deactivate", status_code=status.HTTP_200_OK)
async def deactivate_user(
    user_id,
    request: Request,
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
    _record_admin_event(db, current_user, EventType.ADMIN_UPDATE_USER, request,
                        metadata={"target_user": target_user.email, "action": "deactivate"})
    await db.commit()
    return {"message": f"User {target_user.email} deactivated"}