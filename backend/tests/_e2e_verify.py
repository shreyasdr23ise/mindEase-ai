"""In-process end-to-end verification of the activity/admin system.

Runs against a scratch SQLite DB so no live server or real data is needed.
"""
import os
import sys

# Scratch DB, injected BEFORE importing the app
TEST_DB = os.path.join(os.path.dirname(__file__), "_e2e_verify.db")
if os.path.exists(TEST_DB):
    os.remove(TEST_DB)

os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB}"
os.environ["SYNC_DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["ADMIN_EMAIL"] = "shreyasde157@gmail.com"
os.environ["ADMIN_PASSWORD"] = "shreyu@3015"
os.environ["CORS_ORIGINS"] = "http://localhost:8081"

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

import seed_data

PRINT = []


def ok(label, cond):
    tag = "PASS" if cond else "FAIL"
    PRINT.append(f"{tag}  {label}")


def main():
    seed_data.main()

    from fastapi.testclient import TestClient
    from app.main import app

    c = TestClient(app)

    # Honest checks: admin endpoints must reject non-admins
    demo = c.post("/api/auth/login", json={"email": "demo@mindease.ai", "password": "demo123"})
    ok("demo login 200", demo.status_code == 200)
    demo_token = demo.json()["access_token"]
    dh = {"Authorization": f"Bearer {demo_token}"}

    for path in ["/api/admin/dashboard", "/api/admin/activity", "/api/admin/activity/export", "/api/admin/users"]:
        r = c.get(path, headers=dh)
        ok(f"demo forbidden {path} -> {r.status_code}", r.status_code == 403)

    r = c.get("/api/admin/dashboard")
    ok("unauthenticated dashboard -> 401", r.status_code == 401)

    # Admin login
    a = c.post("/api/auth/login", json={"email": "shreyasde157@gmail.com", "password": "shreyu@3015"})
    ok("admin login 200", a.status_code == 200, )
    if a.status_code != 200:
        print(a.text)
        return
    ah = {"Authorization": f"Bearer {a.json()['access_token']}"}

    # Dashboard stats
    r = c.get("/api/admin/dashboard", headers=ah)
    ok("admin dashboard 200", r.status_code == 200)
    body = r.json()
    ok("dashboard has events", body.get("total_events", 0) >= 19)
    ok("dashboard has by_event_type", isinstance(body.get("by_event_type"), dict))

    # Activity logs endpoint w/ filters + pagination + sort
    r = c.get("/api/admin/activity?page=1&page_size=5&sort=desc", headers=ah)
    ok("activity list 200", r.status_code == 200)
    page = r.json()
    ok("activity total >= 19", page.get("total", 0) >= 19)
    ok("activity page_size==5", len(page.get("items", [])) == 5)

    r = c.get("/api/admin/activity?event_type=LOGIN", headers=ah)
    body = r.json()
    ok("filter LOGIN works", all(i["event_type"] == "LOGIN" for i in body["items"]) and body["total"] > 0)

    r = c.get("/api/admin/activity?status=failed", headers=ah)
    ok("filter failed status works", all(i["status"] == "failed" for i in r.json()["items"]))

    r = c.get("/api/admin/activity?q=Samsung", headers=ah)
    ok("text search matches manufacturer", r.json()["total"] > 0)

    r = c.get("/api/admin/activity?q=Galaxy", headers=ah)
    ok("text search finds devices", r.json()["total"] > 0)

    # User summary
    demo_uid = demo.json()["user"]["id"]
    r = c.get(f"/api/admin/users/{demo_uid}", headers=ah)
    ok("user summary 200", r.status_code == 200)
    summary = r.json()
    ok("user summary login_count >= 2", summary.get("login_count", 0) >= 2)
    ok("user summary has recent_events", len(summary.get("recent_events", [])) > 0)
    known_models = {"Galaxy S24", "Pixel 8", "iPhone 15"}
    ok(
        "user summary shows seeded device model",
        any(e.get("device_model") in known_models for e in summary["recent_events"]),
    )

    # CSV export (records ADMIN_EXPORT)
    r = c.get("/api/admin/activity/export?limit=10", headers=ah)
    ok("csv export 200", r.status_code == 200)
    ok("csv content-type", "text/csv" in r.headers.get("content-type", ""))
    ok("csv has header row", r.text.splitlines()[0].startswith("timestamp,user_id"))

    # Deactivate (records ADMIN_UPDATE_USER, then user blocked from login)
    r = c.post("/api/admin/users/{demo_uid}/deactivate".format(demo_uid=demo_uid), headers=ah)
    ok("deactivate 200", r.status_code == 200)
    r = c.post("/api/auth/login", json={"email": "demo@mindease.ai", "password": "demo123"})
    ok("deactivated user blocked (403)", r.status_code == 403)

    # Admin actions were recorded as admin events
    r = c.get("/api/admin/activity?event_type=ADMIN_UPDATE_USER", headers=ah)
    ok("admin update event recorded", r.json()["total"] >= 1)

    print("\n".join(PRINT))
    fails = [p for p in PRINT if p.startswith("FAIL")]
    print(f"\nSUMMARY: {len(PRINT) - len(fails)} passed, {len(fails)} failed")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()