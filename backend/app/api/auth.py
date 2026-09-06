from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password, get_current_user
from app.models.user import User
from app.models.session import UserSession
from app.models.privacy import UserPrivacySettings
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserUpdate, OnboardingUpdate
from app.schemas.auth import Token
from app.services.activity.logger import build_activity_log, EventType, EventCategory

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, request: Request, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    existing = await db.execute(select(User).where(User.email == user_data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = await db.execute(select(User).where(User.username == user_data.username))
    if existing_username.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = get_password_hash(user_data.password)
    user = User(
        id=uuid4(),
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role="user",
        is_active=True,
        is_anonymous=False,
        onboarding_completed=False,
    )
    db.add(user)
    await db.flush()

    # Create default privacy settings
    privacy = UserPrivacySettings(user_id=user.id)
    db.add(privacy)

    await db.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    user_session = UserSession(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(minutes=1440),
    )
    db.add(user_session)
    db.add(build_activity_log(
        user_id=user.id,
        event_type=EventType.REGISTER,
        event_category=EventCategory.AUTH,
        metadata={"email": user.email},
        request=request,
    ))
    await db.commit()

    return Token(
        access_token=token,
        user={
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "onboarding_completed": user.onboarding_completed,
        },
    )


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(user_data.password, user.hashed_password):
        db.add(build_activity_log(
            user_id=user.id if user else None,
            event_type=EventType.LOGIN_FAILED,
            event_category=EventCategory.AUTH,
            status="failed",
            metadata={"email": user_data.email},
            request=request,
        ))
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        db.add(build_activity_log(
            user_id=user.id,
            event_type=EventType.LOGIN_FAILED,
            event_category=EventCategory.AUTH,
            status="failed",
            metadata={"email": user_data.email, "reason": "account deactivated"},
            request=request,
        ))
        await db.commit()
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})

    user_session = UserSession(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(minutes=1440),
    )
    db.add(user_session)

    if user.role == "admin":
        event_type = EventType.ADMIN_LOGIN
        event_category = EventCategory.ADMIN
    else:
        event_type = EventType.LOGIN
        event_category = EventCategory.AUTH
    db.add(build_activity_log(
        user_id=user.id,
        event_type=event_type,
        event_category=event_category,
        metadata={"email": user.email, "role": user.role},
        session_id=str(user_session.id),
        request=request,
    ))
    await db.commit()

    return Token(
        access_token=token,
        user={
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "onboarding_completed": user.onboarding_completed,
        },
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(request: Request, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db.add(build_activity_log(
        user_id=current_user.id,
        event_type=EventType.ADMIN_LOGOUT if current_user.role == "admin" else EventType.LOGOUT,
        event_category=EventCategory.ADMIN if current_user.role == "admin" else EventCategory.AUTH,
        metadata={"email": current_user.email},
        request=request,
    ))
    # Invalidate all active sessions for user (simplified; JWT is stateless)
    # For the demo, we just return success.
    await db.commit()
    return {"message": "Successfully logged out"}
