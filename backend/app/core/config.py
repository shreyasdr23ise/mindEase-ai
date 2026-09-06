from typing import Optional, List, Annotated
from pydantic_settings import BaseSettings, SettingsConfigDict, NoDecode
from pydantic import field_validator


class Settings(BaseSettings):
    APP_NAME: str = "MindEase AI"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/mindease_ai"
    SYNC_DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/mindease_ai"
    JWT_SECRET: str = "mindease-ai-super-secret-jwt-key-change-in-production-2024"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    AI_PROVIDER: str = "mock"
    AI_API_KEY: Optional[str] = None
    REDIS_URL: str = "redis://localhost:6379/0"
    CORS_ORIGINS: Annotated[List[str], NoDecode] = ["http://localhost:3000"]
    ENCRYPTION_KEY: str = "mindease-ai-encryption-key-change-in-production"
    CREATE_TABLES_ON_STARTUP: bool = True

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return v
        return ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
