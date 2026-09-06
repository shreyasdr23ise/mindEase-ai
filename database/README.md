# Database — MindEase AI

This directory holds database-related assets.

## Schema

The SQLAlchemy models live in `backend/app/models/` and define the canonical schema.
Tables are auto-created on startup (when `CREATE_TABLES_ON_STARTUP=true`) or via
`Base.metadata.create_all()`. Alembic is available for production migrations.

## Core tables

users, sessions, conversations, messages, mood_logs, journal_entries,
emotion_analysis, wellness_exercises, wellness_sessions, medicine_information,
emergency_resources, counselors, counselor_requests, crisis_events, audit_logs,
user_privacy_settings

## Migrations (optional, production)

```bash
cd backend
alembic init alembic        # scaffold if not present
# configure alembic.ini with SYNC_DATABASE_URL,
# then after model changes:
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Notes

- `seed_data.py` in `backend/` seeds demo users, wellness exercises, medicines,
  emergency resources, moods, journals, and conversations. It uses the sync DB URL.
- Emergency resources carry a `last_verified` date and must be re-verified for
  production before activation.