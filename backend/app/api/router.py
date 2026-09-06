from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.mood import router as mood_router
from app.api.journal import router as journal_router
from app.api.wellness import router as wellness_router
from app.api.medicine import router as medicine_router
from app.api.emergency import router as emergency_router
from app.api.crisis import router as crisis_router
from app.api.counselors import router as counselors_router
from app.api.admin import router as admin_router
from app.api.privacy import router as privacy_router
from app.api.onboarding import router as onboarding_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(chat_router)
api_router.include_router(mood_router)
api_router.include_router(journal_router)
api_router.include_router(wellness_router)
api_router.include_router(medicine_router)
api_router.include_router(emergency_router)
api_router.include_router(crisis_router)
api_router.include_router(counselors_router)
api_router.include_router(admin_router)
api_router.include_router(privacy_router)
api_router.include_router(onboarding_router)
