"""API integration tests.

These tests require a running PostgreSQL database (see docker-compose.yml).
They are skipped automatically when no database is reachable, so the pure
logic test suites run in any environment.
"""
import os

import pytest
import httpx

API_BASE = os.getenv("TEST_API_BASE", "http://localhost:8000")


@pytest.fixture(scope="module")
def client():
    """Returns an HTTP client against the running API, skipping if unreachable."""
    try:
        c = httpx.Client(base_url=API_BASE, timeout=5.0)
        c.get("/docs")
        return c
    except Exception:
        pytest.skip("Backend API not reachable - integration tests skipped", allow_module_level=True)


def _register_user(client: httpx.Client) -> dict:
    email = "pytest_integration@mindease.ai"
    payload = {
        "email": email,
        "username": "pytest_user",
        "full_name": "Pytest User",
        "password": "testpassword123",
    }
    r = client.post("/api/auth/register", json=payload)
    if r.status_code in (400, 409):  # already registered
        r = client.post(
            "/api/auth/login",
            json={"email": email, "password": "testpassword123"},
        )
    assert r.status_code in (200, 201), r.text
    return r.json()


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


class TestAuth:
    def test_register_and_login(self, client):
        data = _register_user(client)
        assert "access_token" in data or "token" in data
        assert "user" in data or "email" in data

    def test_login_wrong_password(self, client):
        r = client.post(
            "/api/auth/login",
            json={"email": "pytest_integration@mindease.ai", "password": "wrong-password"},
        )
        assert r.status_code in (401, 403)

    def test_me_unauthenticated(self, client):
        r = client.get("/api/auth/me")
        assert r.status_code in (401, 403)


class TestProtectedEndpoints:
    def test_dashboard_requires_auth(self, client):
        r = client.get("/api/mood/history")
        assert r.status_code in (401, 403)

    def test_chat_requires_auth(self, client):
        r = client.post("/api/chat/message", json={"message": "hello"})
        assert r.status_code in (401, 403)