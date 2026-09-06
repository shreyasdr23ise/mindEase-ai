from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.counselor import Counselor, CounselorRequest
from app.schemas.counselor import (
    CounselorResponse, CounselorRequestCreate, CounselorRequestResponse,
)

router = APIRouter(prefix="/api/counselors", tags=["counselors"])


def _to_response(c: Counselor, user: User) -> CounselorResponse:
    return CounselorResponse(
        id=c.id,
        user_id=c.user_id,
        full_name=user.full_name if user else None,
        specialty=c.specialty,
        experience_years=c.experience_years,
        bio=c.bio,
        location=c.location,
        availability=c.availability,
        is_online=c.is_online,
        rating=c.rating,
        consultation_fee=c.consultation_fee,
        is_active=c.is_active,
    )


@router.get("/", response_model=list[CounselorResponse])
async def list_counselors(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Counselor).where(Counselor.is_active == True)
    )
    counselors = list(result.scalars().all())

    responses = []
    for c in counselors:
        user_result = await db.execute(select(User).where(User.id == c.user_id))
        user = user_result.scalar_one_or_none()
        responses.append(_to_response(c, user))
    return responses


@router.get("/requests/mine", response_model=list[CounselorRequestResponse])
async def get_my_requests(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CounselorRequest)
        .where(CounselorRequest.user_id == current_user.id)
        .order_by(CounselorRequest.created_at.desc())
    )
    requests = list(result.scalars().all())

    responses = []
    for r in requests:
        counselor_res = await db.execute(select(Counselor).where(Counselor.id == r.counselor_id))
        counselor = counselor_res.scalar_one_or_none()
        c_user = None
        if counselor:
            u_res = await db.execute(select(User).where(User.id == counselor.user_id))
            c_user = u_res.scalar_one_or_none()
        responses.append(
            CounselorRequestResponse(
                id=r.id,
                user_id=r.user_id,
                counselor_id=r.counselor_id,
                status=r.status,
                message=r.message,
                created_at=r.created_at,
                updated_at=r.updated_at,
                counselor=_to_response(counselor, c_user) if counselor else None,
            )
        )
    return responses


@router.get("/{counselor_id}", response_model=CounselorResponse)
async def get_counselor(
    counselor_id,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Counselor).where(Counselor.id == counselor_id, Counselor.is_active == True)
    )
    counselor = result.scalar_one_or_none()
    if not counselor:
        raise HTTPException(status_code=404, detail="Counselor not found")

    user_result = await db.execute(select(User).where(User.id == counselor.user_id))
    user = user_result.scalar_one_or_none()
    return _to_response(counselor, user)


@router.post("/request", response_model=CounselorRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_counselor_request(
    payload: CounselorRequestCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    counselor_result = await db.execute(
        select(Counselor).where(Counselor.id == payload.counselor_id, Counselor.is_active == True)
    )
    counselor = counselor_result.scalar_one_or_none()
    if not counselor:
        raise HTTPException(status_code=404, detail="Counselor not found")

    existing_result = await db.execute(
        select(CounselorRequest).where(
            CounselorRequest.user_id == current_user.id,
            CounselorRequest.counselor_id == payload.counselor_id,
            CounselorRequest.status == "pending",
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already have a pending request with this counselor")

    request = CounselorRequest(
        id=uuid4(),
        user_id=current_user.id,
        counselor_id=payload.counselor_id,
        status="pending",
        message=payload.message,
    )
    db.add(request)
    await db.commit()
    await db.refresh(request)

    return CounselorRequestResponse(
        id=request.id,
        user_id=request.user_id,
        counselor_id=request.counselor_id,
        status=request.status,
        message=request.message,
        created_at=request.created_at,
        updated_at=request.updated_at,
        counselor=_to_response(counselor, None),
    )
