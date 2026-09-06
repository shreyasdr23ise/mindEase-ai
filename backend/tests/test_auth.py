"""Authentication and security tests."""
import pytest
from jose import jwt

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password


class TestPasswordHashing:
    def test_password_hash_not_plaintext(self):
        hashed = get_password_hash("mysecretpassword123")
        assert hashed != "mysecretpassword123"
        assert hashed.startswith("$2")

    def test_password_verification_success(self):
        hashed = get_password_hash("correcthorsebatterystaple")
        assert verify_password("correcthorsebatterystaple", hashed) is True

    def test_password_verification_failure(self):
        hashed = get_password_hash("correcthorsebatterystaple")
        assert verify_password("wrongpassword", hashed) is False

    def test_unique_hashes(self):
        """Same password should produce different hashes (salt)."""
        h1 = get_password_hash("samepassword")
        h2 = get_password_hash("samepassword")
        assert h1 != h2


class TestTokenCreation:
    def test_token_created(self):
        token = create_access_token({"sub": "test-user-id"})
        assert isinstance(token, str)
        assert len(token) > 20

    def test_token_contains_subject(self):
        token = create_access_token({"sub": "abc-123"})
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        assert payload["sub"] == "abc-123"

    def test_token_has_expiry(self):
        token = create_access_token({"sub": "abc-123"})
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        assert "exp" in payload

    def test_token_invalid_secret_rejected(self):
        token = create_access_token({"sub": "abc-123"})
        with pytest.raises(Exception):
            jwt.decode(token, "wrong-secret", algorithms=[settings.JWT_ALGORITHM])