from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.privacy import UserPrivacySettings
from app.models.conversation import Conversation, Message
from app.models.mood import MoodLog
from app.models.journal import JournalEntry
from app.schemas.user import UserResponse

router = APIRouter(prefix="/api/privacy", tags=["privacy"])


async def _get_or_create_settings(db: AsyncSession, user_id) -> UserPrivacySettings:
    result = await db.execute(
        select(UserPrivacySettings).where(UserPrivacySettings.user_id == user_id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        settings = UserPrivacySettings(user_id=user_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.get("/settings", response_model=dict)
async def get_privacy_settings(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    settings = await _get_or_create_settings(db, current_user.id)
    return {
        "share_mood_data": settings.share_mood_data,
        "share_journal": settings.share_journal,
        "allow_analytics": settings.allow_analytics,
        "data_retention_days": settings.data_retention_days,
    }


@router.put("/settings", response_model=dict)
async def update_privacy_settings(
    payload: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    settings = await _get_or_create_settings(db, current_user.id)

    if "share_mood_data" in payload:
        settings.share_mood_data = bool(payload["share_mood_data"])
    if "share_journal" in payload:
        settings.share_journal = bool(payload["share_journal"])
    if "allow_analytics" in payload:
        settings.allow_analytics = bool(payload["allow_analytics"])
    if "data_retention_days" in payload:
        retention = int(payload["data_retention_days"])
        if retention < 30:
            raise HTTPException(status_code=400, detail="Data retention must be at least 30 days")
        settings.data_retention_days = retention

    settings.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(settings)

    return {
        "share_mood_data": settings.share_mood_data,
        "share_journal": settings.share_journal,
        "allow_analytics": settings.allow_analytics,
        "data_retention_days": settings.data_retention_days,
    }


@router.delete("/account", status_code=status.HTTP_200_OK)
async def delete_account(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    # Soft delete - deactivate account rather than hard delete
    current_user.is_active = False
    await db.commit()
    return {"message": "Account has been deactivated. Your data will be retained per your retention settings."}


@router.post("/export-data", response_model=dict)
async def export_data(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    # Gather user data for export
    conv_result = await db.execute(
        select(Conversation).where(Conversation.user_id == current_user.id)
    )
    conversations = list(conv_result.scalars().all())
    conv_list = []
    for c in conversations:
        msg_result = await db.execute(
            select(Message).where(Message.conversation_id == c.id).order_by(Message.created_at)
        )
        messages = list(msg_result.scalars().all())
        conv_list.append({
            "id": str(c.id),
            "title": c.title,
            "created_at": c.created_at.isoformat(),
            "messages": [
                {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()}
                for m in messages
            ],
        })

    mood_result = await db.execute(
        select(MoodLog).where(MoodLog.user_id == current_user.id).order_by(MoodLog.created_at)
    )
    mood_logs = [
        {
            "mood": m.mood,
            "stress_level": m.stress_level,
            "anxiety_level": m.anxiety_level,
            "note": m.note,
            "created_at": m.created_at.isoformat(),
        }
        for m in list(mood_result.scalars().all())
    ]

    journal_result = await db.execute(
        select(JournalEntry).where(JournalEntry.user_id == current_user.id).order_by(JournalEntry.created_at)
    )
    journal_entries = [
        {
            "title": j.title,
            "content": j.content,
            "mood": j.mood,
            "word_count": j.word_count,
            "created_at": j.created_at.isoformat(),
        }
        for j in list(journal_result.scalars().all())
    ]

    return {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "created_at": current_user.created_at.isoformat(),
        },
        "conversations": conv_list,
        "mood_logs": mood_logs,
        "journal_entries": journal_entries,
        "exported_at": datetime.utcnow().isoformat(),
    }
