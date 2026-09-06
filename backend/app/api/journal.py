from uuid import uuid4
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.journal import JournalEntry
from app.schemas.journal import JournalCreate, JournalUpdate, JournalResponse
from app.services.activity.logger import build_activity_log, EventType, EventCategory

router = APIRouter(prefix="/api/journal", tags=["journal"])

VALID_MOODS = {"very_good", "good", "neutral", "low", "very_low"}


def count_words(content: str) -> int:
    return len(content.split())


@router.post("/", response_model=JournalResponse, status_code=status.HTTP_201_CREATED)
async def create_journal_entry(
    payload: JournalCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    if payload.mood and payload.mood not in VALID_MOODS:
        raise HTTPException(status_code=400, detail="Invalid mood value")

    derived_title = (
        payload.title.strip()
        if payload.title and payload.title.strip()
        else (payload.content[:50].strip() or "Untitled entry")
    )
    entry = JournalEntry(
        id=uuid4(),
        user_id=current_user.id,
        title=derived_title,
        content=payload.content,
        mood=payload.mood,
        word_count=count_words(payload.content),
        writing_prompt=payload.writing_prompt,
    )
    db.add(entry)
    db.add(build_activity_log(
        user_id=current_user.id,
        event_type=EventType.JOURNAL_CREATED,
        event_category=EventCategory.JOURNAL,
        metadata={"word_count": count_words(payload.content)},
        request=request,
    ))
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/", response_model=list[JournalResponse])
async def list_journal_entries(
    search: Optional[str] = None,
    mood: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(JournalEntry).where(JournalEntry.user_id == current_user.id)

    if search:
        q = f"%{search}%"
        query = query.where(
            or_(JournalEntry.title.ilike(q), JournalEntry.content.ilike(q))
        )
    if mood:
        if mood not in VALID_MOODS:
            raise HTTPException(status_code=400, detail="Invalid mood filter")
        query = query.where(JournalEntry.mood == mood)

    result = await db.execute(query.order_by(JournalEntry.created_at.desc()))
    return list(result.scalars().all())


@router.get("/{entry_id}", response_model=JournalResponse)
async def get_journal_entry(
    entry_id,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JournalEntry).where(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry


@router.patch("/{entry_id}", response_model=JournalResponse)
async def update_journal_entry(
    entry_id,
    payload: JournalUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JournalEntry).where(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    if payload.title is not None:
        entry.title = payload.title.strip()
    if payload.content is not None:
        entry.content = payload.content
        entry.word_count = count_words(payload.content)
    if payload.mood is not None:
        if payload.mood not in VALID_MOODS:
            raise HTTPException(status_code=400, detail="Invalid mood value")
        entry.mood = payload.mood

    from datetime import datetime
    entry.updated_at = datetime.utcnow()
    db.add(build_activity_log(
        user_id=current_user.id,
        event_type=EventType.JOURNAL_UPDATED,
        event_category=EventCategory.JOURNAL,
        metadata={"word_count": entry.word_count},
        request=request,
    ))
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_journal_entry(
    entry_id,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JournalEntry).where(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    await db.delete(entry)
    db.add(build_activity_log(
        user_id=current_user.id,
        event_type=EventType.JOURNAL_DELETED,
        event_category=EventCategory.JOURNAL,
        metadata={"word_count": entry.word_count},
        request=request,
    ))
    await db.commit()
