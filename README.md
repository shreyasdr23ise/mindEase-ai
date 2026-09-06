# MindEase AI 🌿

**AI-Powered Emotional Wellness & Mental Health Support Platform**

MindEase AI is an intelligent emotional-wellness companion built as a final-year BE (Information Science & Engineering) project. It lets users talk about their feelings, receive empathetic AI support, track mood and stress, keep a private journal, practice guided wellness exercises, learn about mental health and medicines, and get connected to professional and crisis support — all with a strong commitment to safety, privacy, and non-clinical boundaries.

> **⚠️ Important:** MindEase AI is **not** a doctor, therapist, pharmacist, or emergency service. It provides general educational information and emotional support only. It never diagnoses, prescribes, or gives personalized medical instructions. In a crisis, always contact professional/emergency services.

---

## ✨ Features

- **AI Emotional Support Chat** — empathetic, context-aware conversations with emotion & intent detection, streaming-ready, with a rich demo fallback (no API key required)
- **Crisis Detection & Mode** — multi-layer safety engine (rule + intent + AI) that immediately surfaces emergency resources when high-risk language is detected
- **Mood Tracking** — interactive mood check-ins, stress/anxiety sliders, weekly & monthly charts
- **Private Journal** — rich editor, writing prompts, mood tags, search & AI reflection
- **Wellness Center** — breathing (animated orb), grounding (5-4-3-2-1), CBT-inspired thought records, mindfulness, stress relief, sleep & gratitude exercises
- **Medicine Information Center** — source-based, disclaimed general information (never personalized dosing)
- **Professional Help** — counselor directory, consultation requests, counselor dashboard
- **Crisis Resources** — configurable multi-country emergency resources with verified-date tracking
- **Roles** — `user`, `counselor`, `admin` with separate dashboards
- **Privacy-first** — data minimization, export, delete, anonymous mode
- **Premium UI** — glassmorphism, smooth animations, dark/light theme, responsive, accessible

## 🧰 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| Mobile (native) | React Native (Expo SDK 57), TypeScript, React Navigation, Hermes + New Architecture |
| Backend | Python, FastAPI, Pydantic, SQLAlchemy (async), python-jose, Passlib |
| Database | PostgreSQL (SQLAlchemy ORM) |
| AI/NLP | Configurable provider: **Mock** (default demo), **OpenAI**, **HuggingFace** |
| Caching | Redis (optional, for caching/rate-limiting) |
| DevOps | Docker, Docker Compose, Render.com |
| Testing | Pytest (backend), ESLint/TypeScript (frontend), `tsc --noEmit` (mobile) |

---

## 🗂️ Folder Structure

```
mindEase-ai/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/             # REST route handlers
│   │   ├── core/            # config, database, security
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── services/        # AI, emotion, intent, crisis, medicine, safety
│   ├── tests/               # Pytest test suites
│   └── seed_data.py         # Demo/seed data script
├── frontend/                # Next.js application
│   └── src/app/             # App Router pages
├── mobile/                  # Native Android app (React Native / Expo)
│   ├── app.json             # App identity, icons, splash, permissions
│   ├── src/screens/         # All 30 screens
│   ├── src/lib/             # API client, services, storage
│   ├── src/context/         # Auth + Theme providers
│   └── scripts/             # Asset generation script
├── database/                # Migrations & schema notes
├── docker/                  # Dockerfiles + docker-compose.yml
└── docs/                    # Architecture & design docs
```

---

## 🚀 Getting Started

### Option A: Docker (recommended, easiest)

```bash
# 1. Copy environment config
cp backend/.env.example backend/.env

# 2. Build & start all services (Postgres, Redis, backend, frontend, seed)
docker compose -f docker/docker-compose.yml up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs (Swagger): http://localhost:8000/docs

To (re)seed demo data:
```bash
docker compose -f docker/docker-compose.yml run --rm seed
```

### Option B: Local development

**Prerequisites:** Python 3.12+, Node 20+, PostgreSQL 16 (or run just the DB via Docker).

#### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure env
cp .env.example .env
# Edit .env with your DATABASE_URL / JWT_SECRET

# Start (auto-creates tables)
uvicorn app.main:app --reload --port 8000
```

Seed demo data (uses the sync DB URL):
```bash
python seed_data.py
```

#### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local       # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:3000.

#### 3. Native Android app (mobile)

See [`docs/ANDROID_BUILD.md`](docs/ANDROID_BUILD.md) for the full build guide.

```powershell
cd mobile
npm install
npx tsc --noEmit
npx expo prebuild -p android   # creates mobile/android/

# Production APK (env var MUST be unset)
cd android
.\gradlew.bat assembleRelease --no-daemon   # -> app/build/outputs/apk/release/app-release.apk
```

The app reads its API base URL from `EXPO_PUBLIC_API_URL` at bundle time
(`mobile/src/config.ts`); when unset it falls back to `https://mindease-backend.onrender.com`.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| User | `demo@mindease.ai` | `demo123` |
| Admin | `admin@mindease.ai` | `admin123` |
| Counselor | `counselor@mindease.ai` | `counselor123` |

You can also register a brand-new account.

---

## 🔑 Environment Variables

See `backend/.env.example` and `frontend/.env.example` for the full list. Key ones:

- `DATABASE_URL` / `SYNC_DATABASE_URL` — Postgres connection strings (async / sync)
- `JWT_SECRET` — secret for signing tokens (generate a strong random value)
- `AI_PROVIDER` — `mock` (default) | `openai` | `huggingface`
- `AI_API_KEY` — API key for external providers
- `REDIS_URL` — optional Redis connection
- `CORS_ORIGINS` — comma-separated allowed frontend origins
- `ENCRYPTION_KEY` — key for sensitive at-rest data

> Never commit real secrets. `.env` files must stay out of version control.

---

## 🧠 AI Configuration

The application uses a provider abstraction (`AIProvider`):

```
AIProvider
├── MockAIProvider      (default — runs offline, safe, context-aware demo responses)
├── OpenAIProvider      (uses an OpenAI-compatible HTTP API)
└── HuggingFaceProvider (uses HuggingFace Inference API)
```

Without any API key, the app **still runs fully** using the Mock provider, which detects emotion/intent and generates empathetic, context-appropriate responses plus suggested actions. To switch:

```bash
AI_PROVIDER=openai
AI_API_KEY=sk-...
```

---

## 🛡️ Safety Architecture

1. **Input validation & authentication** — every message runs through the API guard.
2. **Crisis detection (priority)** — layered rule + intent + optional AI classification with severity scoring (`critical`/`high`/`medium`). Crisis immediately short-circuits normal generation into **Crisis Mode** with emergency resources.
3. **Emotion analysis** — detects joy/sadness/anxiety/anger/stress/panic/loneliness/neutral with confidence & severity.
4. **Intent detection** — routes to the right handler (support, wellness, medicine, crisis, etc.).
5. **Response safety filter** — inspects every AI response for diagnosis, prescription, dosage, overconfident, self-harm or harmful content, and replaces it with a safe alternative if found.

**Medicine safety:** the system never approves personal use, never gives personalized doses, and never tells a user to stop/start medication. It clearly labels all content as general educational information and directs users to qualified healthcare professionals.

See `docs/` for the full architecture documentation.

---

## ✅ Testing

### Backend

```bash
cd backend
pytest tests -v
```

- Unit/integration tests cover: auth & token generation, password hashing, crisis detection (all 8 required safety cases), emotion & intent detection, response safety filter, and medicine safety logic.
- API tests (register/login/authorization) run when a backend is reachable, otherwise skip gracefully.

### Frontend

```bash
cd frontend
npm run lint
npx tsc --noEmit
npm run build
```

---

## 📄 Documentation

See `docs/`:
- `architecture.md` — system architecture & data flow
- `api.md` — REST API reference
- `ai-architecture.md` — AI provider & NLP pipeline
- `crisis-detection.md` — multi-layer crisis safety system
- `medicine-safety.md` — medicine information rules & safety logic
- `security.md` — authentication, authorization, and security model
- `ANDROID_BUILD.md` — building/signing the native Android app (Windows notes included)
- `DEPLOYMENT.md` — deploying the backend to Render.com

---

## 📱 Native Mobile App

The `mobile/` folder contains a genuine native Android app (React Native + Expo, **no WebView**)
that mirrors the web feature set: auth, AI chat, mood tracking & trends, journal with prompts,
wellness exercises (breathing orb, grounding 5-4-3-2-1, CBT wizard), medicine info center,
professional help & counselor requests, crisis mode + emergency call resources, trust contacts,
and full profile/theme/notification settings.

Ship-ready artifacts are built locally and verified:
- Production APK & AAB signed with the release keystore; production APK is scanned for dev-IP leaks.
- Dev APK variant targets the LAN backend for same-Wi-Fi testing.

---

## 🧭 Deployment Considerations

- Set strong `JWT_SECRET` and `ENCRYPTION_KEY`.
- Verify and update **emergency resource numbers** for your target region before production use (data includes `last_verified`).
- For medicine data, maintain source attribution (`source`, `source_url`, `last_updated`).
- Use HTTPS in production; configure CORS to your real frontend origin.
- Enable rate limiting and monitoring in production.
- Comply with applicable data-protection laws (e.g., local privacy regulations) before claiming specific privacy certifications.

---

**Made with care for a final-year engineering demonstration.**
