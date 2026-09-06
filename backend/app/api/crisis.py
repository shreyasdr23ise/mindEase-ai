from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.crisis import CrisisEvent
from app.schemas.crisis import CrisisAnalyzeRequest, CrisisEventCreate, CrisisEventResponse
from app.services.crisis.detector import CrisisDetector
from app.services.activity.logger import build_activity_log, EventType, EventCategory

router = APIRouter(prefix="/api/crisis", tags=["crisis"])


@router.post("/analyze", response_model=dict)
async def analyze_text(
    payload: CrisisAnalyzeRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    result = CrisisDetector.detect(payload.text)

    if result["is_crisis"]:
        # Log the crisis event
        event = CrisisEvent(
            id=uuid4(),
            user_id=current_user.id,
            severity=result["severity"],
            detected_content=payload.text,
            trigger_type=result["crisis_type"],
            response_provided=result["score"] > 1 and "automated safety response" or None,
        )
        db.add(event)
        db.add(build_activity_log(
            user_id=current_user.id,
            event_type=EventType.CRISIS_DETECTED,
            event_category=EventCategory.CRISIS,
            metadata={"severity": result["severity"], "crisis_type": result["crisis_type"]},
            request=request,
        ))
        await db.commit()

    return {
        "is_crisis": result["is_crisis"],
        "severity": result["severity"],
        "crisis_type": result["crisis_type"],
        "confidence": result["confidence"],
        "score": result["score"],
    }


@router.post("/event", response_model=CrisisEventResponse, status_code=status.HTTP_201_CREATED)
async def create_crisis_event(
    payload: CrisisEventCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    valid_severity = {"low", "medium", "high", "critical"}
    if payload.severity not in valid_severity:
        raise HTTPException(status_code=400, detail=f"Invalid severity. Must be one of {sorted(valid_severity)}")

    event = CrisisEvent(
        id=uuid4(),
        user_id=current_user.id,
        severity=payload.severity,
        detected_content=payload.detected_content,
        trigger_type=payload.trigger_type,
        response_provided=payload.response_provided,
        resolved=payload.resolved,
        resolved_at=payload.resolved_at,
    )
    db.add(event)
    db.add(build_activity_log(
        user_id=current_user.id,
        event_type=EventType.CRISIS_DETECTED,
        event_category=EventCategory.CRISIS,
        metadata={"severity": payload.severity, "crisis_type": payload.trigger_type},
        request=request,
    ))
    await db.commit()
    await db.refresh(event)
    return event
