# MindEase AI

**AI-powered emotional wellness companion — a full-stack, production-deployed mental health support platform.**

MindEase AI is a final-year BE (Information Science & Engineering) engineering demonstration that combines an empathetic AI support chat, a multi-layer crisis-safety engine, mood and journal tracking, guided wellness exercises, a medicine information center, and a counselor/emergency network — shipped as a **native Android app** backed by a **live cloud API and database**.

> **Live demo backend** · `https://mindease-backend-r87i.onrender.com` · API docs at `/docs`
> **Native Android release APK** — built, signed, and verified (see [APK install](#-install-the-android-app)).

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution & Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [System Architecture](#-architecture)
5. [Backend Deployment Architecture](#-backend-deployment)
6. [Database](#-database)
7. [API Overview](#-api-overview)
8. [Install the Android App](#-install-the-android-app)
9. [Run Locally](#-run-locally)
10. [Testing Results](#-testing-results)
11. [Screenshots](#️-screenshots)
12. [Project Structure](#-project-structure)
13. [Limitations](#-limitations)
14. [Future Enhancements](#-future-enhancements)
15. [Safety, Privacy & Medical Disclaimer](#-safety-privacy--medical-disclaimer)
16. [Release Readiness Checklist](#-release-readiness-checklist)

---

## Problem Statement

Mental health care access is limited by cost, stigma, availability, and the wide gap between those who need support and the professionals who can provide it. Many people experiencing everyday stress, anxiety, or low mood lack a private, judgment-free way to check in, understand their feelings, and take small actionable steps toward wellbeing. Meanwhile, AI chatbot solutions often operate without safety guardrails — risking harmful, inappropriate, or unprofessional responses.

**MindEase AI addresses this by building a privacy-first emotional-wellness companion that:**
- Provides immediate, empathetic conversational support anytime, anywhere.
- Detects crisis-level language in real time and pivots to verified emergency resources.
- Helps users build self-awareness through mood tracking, journaling, and guided exercises.
- Connects users to human professionals and crisis organizations.
- Enforces strict safety filters so the AI never diagnoses, prescribes, or gives medical directives.

---

## ✨ Features

- **AI Emotional Support Chat** — empathetic, context-aware conversations with emotion and intent detection; streaming-ready, with a fully functional offline **Mock provider** (no API key required) and pluggable OpenAI / HuggingFace providers.
- **Crisis Detection & Crisis Mode** — layered rule + intent + AI safety engine with severity scoring (`low`/`medium`/`high`/`critical`). High-risk language immediately short-circuits normal responses to surface region-specific emergency resources.
- **Mood & Stress Tracking** — mood check-ins, stress/anxiety sliders, weekly and monthly trends, and history charts.
- **Private Journal** — rich editor, writing prompts, mood tagging, search, and AI reflection.
- **Wellness Center** — breathing exercises (animated orb), grounding (5-4-3-2-1), CBT-inspired thought records, mindfulness, stress relief, sleep, and gratitude activities, with session history.
- **Medicine Information Center** — source-attributed, disclaimed general medication information (never personalized dosing).
- **Professional Help** — counselor directory with ratings and availability, consultation requests, and a counselor dashboard.
- **Emergency Resources** — configurable multi-country crisis helplines with verified-date tracking and one-tap calling/dialing.
- **Roles & Dashboards** — `user`, `counselor`, and `admin` with separate capabilities and an analytics dashboard.
- **Privacy-first** — data minimization, export/delete controls, anonymous mode, and configurable data retention.
- **Premium UI** — glassmorphism, smooth animations, dark/light theme, responsive layouts, and accessibility support.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| **Mobile (native Android)** | React Native 0.86, Expo SDK 57, TypeScript, React Navigation 7, Hermes + New Architecture (no WebView) |
| **Mobile state/API** | Context API, Axios/HTTP client, `EXPO_PUBLIC_API_URL` bundle-time configuration |
| **Backend API** | Python 3.12, FastAPI, Pydantic, SQLAlchemy 2 (async `asyncpg`), python-jose (JWT), Passlib (bcrypt) |
| **Database** | PostgreSQL (free cloud instance on Render; `psycopg2` for sync seed scripts) |
| **AI/NLP** | Provider abstraction: **Mock** (default, offline), **OpenAI-compatible**, **HuggingFace Inference** |
| **Security** | JWT auth & refresh, role-based access control, password hashing, response content safety filters, at-rest encryption key |
| **DevOps / Cloud** | Docker + Docker Compose, Render.com (blueprint `render.yaml`), GitHub Actions-ready CI, GitHub |
| **Testing** | Pytest (backend, **71 passing**), ESLint/TypeScript (`tsc --noEmit`) for the client code |

---

## 🏛️ Architecture

```
                    ┌───────────────────────────────────────────────┐
                    │                MOBILE (Android)                │
                    │   React Native + Expo · Hermes · TypeScript    │
                    │   Screens · Context (Auth/Theme) · API client  │
                    └──────────────────────┬────────────────────────┘
                                           │  HTTPS  (JSON + JWT Bearer)
                                           ▼
                    ┌───────────────────────────────────────────────┐
                    │          BACKEND API  (FastAPI)               │
                    │  /api/auth /chat /mood /journal /wellness     │
                    │  /api/medicine /emergency /crisis /counselors │
                    │  /api/onboarding /privacy /admin              │
                    └───────┬───────────────────────────┬──────────┘
                            │ SQLAlchemy (asyncpg)      │ provider abstraction
                            ▼                           ▼
                    ┌──────────────────┐        ┌──────────────────────────────┐
                    │   PostgreSQL      │        │  AI Providers                │
                    │  mindease_ai DB   │        │  Mock │ OpenAI │ HuggingFace │
                    └──────────────────┘        └──────────────────────────────┘
```

**Backend data flow:**

1. Request → **JWT auth middleware** validates the token and role.
2. Route handler → optional **crisis pre-check** (rule + intent + optional AI classifier, severity scoring).
3. AI chat pipeline → emotion analysis → intent routing → safe response generation → **response safety filter**.
4. Result persisted via SQLAlchemy async session → PostgreSQL.

---

## 🚀 Backend Deployment

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Render.com (free tier)                          │
│                                                                          │
│  ┌───────────────────────────────┐        ┌───────────────────────────┐  │
│  │  Web Service                  │        │  PostgreSQL database      │  │
│  │  mindease-backend-r87i        │───────▶│  mindease-db              │  │
│  │  Python 3.12.10 · FastAPI     │  TLS   │  region: Virginia (free)  │  │
│  │  start: seed + uvicorn :$PORT │        └───────────────────────────┘  │
│  │  auto-created tables          │                                       │
│  └───────────────────────────────┘                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Deploy target:** `https://mindease-backend-r87i.onrender.com` (HTTP/2, TLS).
- **Build:** Render Python blueprint from `render.yaml` — `PYTHON_VERSION` pinned to `3.12.10` (default 3.14 has no wheels for pinned `pydantic-core`).
- **Start command:** `python -m seed_data && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Health check:** `GET /health` → `200 {"status": "healthy"}` (Render's configured `healthCheckPath`).
- **Configuration:** all secrets and connection strings are injected as **environment variables only** — never committed.
- Deploy details and the full Render setup run are documented in `docs/DEPLOYMENT.md` and the blueprint `render.yaml`.

---

## 🗄️ Database

- **Engine:** PostgreSQL 18 (Render free instance, `mindease_ai` database).
- **Schema:** managed by SQLAlchemy ORM models; `CREATE_TABLES_ON_STARTUP=true` creates tables on boot; `python -m seed_data` seeds demo + reference data on every deploy.
- **Key tables:** `users`, `conversations`, `messages`, `mood_logs`, `journal_entries`, `wellness_exercises`, `wellness_sessions`, `medicine_information`, `emergency_resources`, `counselors`, `counselor_requests`, `user_privacy_settings`, `crisis_events`, `audit_logs`.
- **Security:** dedicated least-privilege database role for the app; credentials rotated before release; connection uses TLS (`ssl=require`).
- **Access model:** users own their data; privacy settings control analytics/export/delete behavior.

---

## 📡 API Overview

Base URL: `https://mindease-backend-r87i.onrender.com` · Interactive docs: **`/docs`** (Swagger UI) and `/redoc`.

| Area | Endpoints (prefix) | Description |
|------|--------------------|-------------|
| Health | `GET /health` | Liveness check |
| Auth | `/api/auth` | Register, login, token refresh/validate, `me` |
| Chat | `/api/chat` | AI support conversations, history |
| Mood | `/api/mood` | Log mood/stress/anxiety, trends, history |
| Journal | `/api/journal` | Entries, prompts, search, tags |
| Wellness | `/api/wellness` | Exercise library, guided sessions, history |
| Medicine | `/api/medicine` | Medicine information + source-based search |
| Emergency | `/api/emergency` | Multi-country crisis helplines/resources |
| Crisis | `/api/crisis` | Analyze severity, log crisis events |
| Counselors | `/api/counselors` | Directory, consultation requests, dashboards |
| Onboarding | `/api/onboarding` | Profile onboarding/complete |
| Privacy | `/api/privacy` | Settings, data export/delete |
| Admin | `/api/admin` | User management, platform analytics |

---

## 📱 Install the Android App

> **Requirements:** Android 8.0+ (API 26+). The app is a genuine native build (React Native + Hermes) — **no WebView**.

1. Copy the release APK (`mindease-ai-release.apk`, ~82 MB) to your Android device.
2. On the device, allow **Install from unknown sources** (Settings → Security) — the app is signed with the developer's release keystore but is not on Google Play.
3. Open the APK and follow the install prompt.
4. Launch **MindEase AI**, register a new account (or use the provided demo credentials), and the app connects to the live backend over HTTPS.

**What the verified release build guarantees:**
- Signed with the release keystore (SHA-256 `955668e6…15292`), verified with `apksigner`.
- Contains **only the public HTTPS backend URL** (`https://mindease-backend-r87i.onrender.com`) — no `localhost`, emulator, LAN, or dev-server endpoints.
- **No API keys, passwords, database credentials, or private keys embedded** (byte-level scan of all 1,325 APK entries).

See [`docs/ANDROID_BUILD.md`](docs/ANDROID_BUILD.md) for reproducing the signed build (Windows notes included).

---

## 🧑‍💻 Run Locally

**Prerequisites:** Python 3.12+, Node 20+, PostgreSQL 16+ (or use Docker).

### Backend

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # edit DATABASE_URL / JWT_SECRET
uvicorn app.main:app --reload --port 8000   # -> http://localhost:8000/docs
python seed_data.py           # optional demo/seed data
```

### Native Android app

```bash
cd mobile
npm install
npx tsc --noEmit
npx expo prebuild -p android
cd android
.\gradlew.bat assembleRelease --no-daemon   # -> app/build/outputs/apk/release/app-release.apk
```

The API base URL is baked in at bundle time via `EXPO_PUBLIC_API_URL` (see `mobile/src/config.ts`).

> **Demo accounts:** seeded automatically on deploy via `DEMO_USER_PASSWORD`, `DEMO_COUNSELOR_PASSWORD`, and `DEMO_ADMIN_PASSWORD`. For **local development only**, placeholders are documented in `backend/.env.example`; production credentials are managed as secret environment variables and are **never** written to this repository or the README.

---

## ✅ Testing Results

**Backend — Pytest: `71 passed`** (run against the full suite after the final hardening changes).

Coverage areas:
- Auth: registration, login, token generation/validation, password hashing (bcrypt).
- Crisis detection: **all 8 required safety cases** for high-risk phrase classification.
- Emotion & intent detection, response safety filter (blocks diagnosis/prescription/self-harm content).
- Medicine safety logic (disclaimers, no personalized dosing).
- API integration tests for register/login/authorization.

**Live production verification (post-deploy, post-secret-rotation):** a 26-call endpoint battery against the live backend passed — health, auth (3 roles), chat, mood check-in, journal, wellness sessions, medicine search, emergency, crisis analyze/event, counselors, onboarding, privacy settings, and admin analytics/users. `active_users_today=1`, `total_users=4`, `total_conversations=13`, `total_messages=30`, `total_mood_logs=31`, `total_journal_entries=7`, `total_wellness_sessions=2`, `total_counselors=2`.

---

## 🖼️ Screenshots

*Placeholders — add real device captures here:*

```
| Chat           | Mood tracking   | Wellness       | Counselor      |
|----------------|-----------------|----------------|----------------|
| (add screenshot)| (add screenshot)| (add screenshot)| (add screenshot)|
```

---

## 📂 Project Structure

```
mindEase-ai/
├── backend/                  # FastAPI application (Python 3.12)
│   ├── app/
│   │   ├── api/              # Routers: auth, chat, mood, journal, wellness, medicine, emergency, crisis, counselors, onboarding, privacy, admin
│   │   ├── core/             # config (env-driven, secret-safe), database, security
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # AI providers, emotion/intent/crisis/medicine/safety services
│   │   └── main.py           # App factory & routing
│   ├── tests/                # Pytest suites (71 passing)
│   └── seed_data.py          # Seed/reference data generation
├── mobile/                   # Native Android app (React Native + Expo)
│   ├── android/              # Generated native project (release APK output)
│   ├── src/screens/          # App screens
│   ├── src/lib/              # API client, services, secure storage
│   └── src/context/          # Auth + Theme providers
├── database/                 # Schema notes & migration material
├── docker/                   # Dockerfiles + docker-compose.yml
├── docs/                     # architecture, api, security, deployment, android build docs
└── render.yaml               # Render blueprint (service + database)
```

---

## ⚠️ Limitations

- **AI is a companion, not a clinician.** Responses are general and educational, never diagnostic or prescriptive.
- Crisis detection is effective but heuristic; its thresholds must be tuned and validated for a target population.
- The demo backend runs on Render's free tier (cold starts and a limited free database lifecycle).
- Mock AI provider is used by default; external providers (OpenAI/HuggingFace) require API keys and rate-limit management.
- Emergency contact numbers are region-configurable but must be re-validated by operators before broad production use.

---

## 🔮 Future Enhancements

- Publish the app to Google Play / App Store with a verified clinical-review process.
- Heartbeat monitoring, rate limiting, and structured audit dashboards.
- Real-time counselor chat and appointment scheduling.
- Wearable/health-integration (sleep, HRV) for richer mood correlations.
- On-device or privacy-preserving federated AI for lower latency and stronger data locality.
- I18n/L10n for multi-region wellness and emergency content.

---

## 🛡️ Safety, Privacy & Medical Disclaimer

**Medical disclaimer.** MindEase AI is **not** a doctor, therapist, pharmacist, emergency service, or substitute for professional care. It provides general educational information and emotional support **only**. It never diagnoses, prescribes, recommends dosages, or instructs users to stop/start treatment. If you are in crisis or someone is in immediate danger, contact local emergency services or crisis helplines immediately.

**Safety architecture.** Layered input validation and authentication → crisis detection (priority, severity-scored) → emotion analysis → intent routing → AI response generation → **response safety filter** that blocks diagnosis, prescription, dosage, self-harm, and harmful output. Medicine content carries explicit source attribution and disclaimers.

**Privacy.** Data minimization by design, per-user privacy settings (share/analytics/retention), data export and delete, configurable anonymous mode, bcrypt password hashing, JWT-gated access, and TLS in transit. Sensitive at-rest values use an encryption key injected via environment.

**Security posture of this repository.** The audit in `docs/security.md` confirms: no secrets, API keys, or private keys in Git history; `.env`, keystore, `storepass.txt`, `*.jks`, `*.pem`, `*.key`, and `secrets/` are git-ignored; production database credentials and signing secrets were **rotated** before release and exist only as environment variables / local OS-only files.

---

## 📋 Release Readiness Checklist

| Security / Release item | Status |
|-------------------------|--------|
| No secrets, API keys, DB passwords, private keys in Git history or files | ✅ PASS |
| `.gitignore` excludes `.env`, `*.keystore`, `*.jks`, `storepass.txt`, `*.pem`, `*.key`, `secrets/`, credential files | ✅ PASS |
| `.env.example` contains placeholders only | ✅ PASS |
| Production DB password, JWT secret, encryption key rotated to fresh values | ✅ PASS |
| Old DB credentials revoked; only least-privilege role remains | ✅ PASS |
| Secrets delivered to the backend as environment variables only | ✅ PASS |
| Backend healthy after rotation (`/health` 200) | ✅ PASS |
| All modules verified live: auth, chat, mood, journal, wellness, medicine, emergency, crisis, counselors, onboarding, privacy, admin | ✅ PASS |
| Release APK contains no secrets | ✅ PASS |
| Release APK uses only the public HTTPS backend URL (no localhost/LAN/dev URLs) | ✅ PASS |
| Backend automated tests green (71 passed) | ✅ PASS |

---

**Made with care as a final-year engineering demonstration.**