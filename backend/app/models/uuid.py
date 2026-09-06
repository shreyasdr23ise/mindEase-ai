"""Cross-dialect UUID type.

Uses the native PostgreSQL UUID type when connected to PostgreSQL, and falls
back to CHAR(36) for other databases (e.g., SQLite during local development).
This keeps the application runnable without Docker while PostgreSQL remains the
canonical production database.
"""
import uuid

from sqlalchemy.types import TypeDecorator, CHAR


class UUIDType(TypeDecorator):
    """A UUID type that works on PostgreSQL and on SQLite/other dialects."""

    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import UUID as PG_UUID

            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None or dialect.name == "postgresql":
            return value
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        try:
            return uuid.UUID(str(value))
        except (ValueError, TypeError, AttributeError):
            return value