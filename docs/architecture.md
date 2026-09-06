# MindEase AI — System Architecture

## Overview

MindEase AI is a full-stack, privacy-first mental-wellness platform. It separates
UI, business logic, API, AI/NLP, safety, authentication, and data layers cleanly
between a Next.js frontend and a FastAPI backend backed by PostgreSQL.

```mermaid
flowchart LR
    subgraph Frontend["Next.js Frontend (port 3000)"]
        UI[Pages & Components]
        Store[Zustand Stores]
        API[API Client]
    end

    subgraph Backend["FastAPI Backend (port 8000)"]
        Auth[Auth Router]
        Chat[Chat Router]
        Mood[Mood/Journal/Wellness Routers]
        Med[Medicine Router]
        Crisis[Crisis Router]
        Admin[Admin/Counselor Routers]
        Pipeline[Chat Pipeline]
    end

    subgraph Services["Core Services"]
        AI[AI Provider Abstraction]
        Emotion[Emotion Analyzer]
        Intent[Intent Detector]
        CrisisDet[Crisis Detector]
        Safety[Response Safety Filter]
        MedService[Medicine Service]
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL)]
    end

    UI --> Store --> API
    API -->|HTTPS/JSON| Auth
    API -->|HTTPS/JSON| Chat
    API -->|HTTPS/JSON| Mood
    API -->|HTTPS/JSON| Med
    API -->|HTTPS/JSON| Crisis
    API -->|HTTPS/JSON| Admin

    Chat --> Pipeline
    Pipeline --> Emotion
    Pipeline --> Intent
    Pipeline --> CrisisDet
    Pipeline --> AI
    Pipeline --> Safety

    Med --> MedService

    Chat --> PG
    Mood --> PG
    Crisis --> PG
    Admin --> PG
```

## Chat Message Pipeline

Every chat message flows through the following pipeline in strict order:

```mermaid
flowchart TD
    A[User sends message] --> B[Input validation]
    B --> C[Authentication / authorization]
    C --> D{Multi-layer crisis detection}
    D -->|crisis| E[Crisis Mode: emergency response + event log]
    D -->|no crisis| F[Get / create conversation]
    F --> G[Save user message]
    G --> H[Intent detection]
    H --> I[Emotion analysis]
    I --> J[Context retrieval - last 10 messages]
    J --> K{Medicine intent?}
    K -->|yes| L[Medicine safety response]
    K -->|no| M[AI provider generation]
    L --> N[Response safety filter]
    M --> N
    N --> O[Save assistant message + audit log]
    O --> P[Return response + suggested actions]
```

Crisis detection has priority over normal generation and short-circuits the pipeline.

## Data Model (ER)

```mermaid
erDiagram
    USER ||--o{ CONVERSATION : has
    USER ||--o{ MOOD_LOG : logs
    USER ||--o{ JOURNAL_ENTRY : writes
    USER ||--o{ WELLNESS_SESSION : completes
    USER ||--o{ CRISIS_EVENT : triggers
    USER ||--o{ COUNSELOR_REQUEST : sends
    USER ||--o{ PRIVACY_SETTINGS : owns
    USER ||--o{ AUDIT_LOG : produces
    CONVERSATION ||--o{ MESSAGE : contains
    WELLNESS_EXERCISE ||--o{ WELLNESS_SESSION : logged-in
    COUNSELOR ||--o{ COUNSELOR_REQUEST : receives
    EMOTION_ANALYSIS }o--|| MESSAGE : derived-from
```

Key entities: `users`, `conversations`, `messages`, `mood_logs`, `journal_entries`,
`emotion_analysis`, `wellness_exercises`, `wellness_sessions`, `medicine_information`,
`emergency_resources`, `counselors`, `counselor_requests`, `crisis_events`,
`audit_logs`, `user_privacy_settings`.

Uses UUID primary keys, foreign keys with `ON DELETE CASCADE`, indexes on
frequently queried columns, and `created_at` / `updated_at` timestamps.

## Roles & Authorization

- **USER** — owns their conversations, journal, moods, and wellness sessions; can send counselor requests.
- **COUNSELOR — sees only requests/sessions routed to them and data the user has consented to share.
- **ADMIN — manages users, counselors, medicines, emergency resources, wellness content, crisis rules, and audit logs.

## Frontend Architecture

- Next.js App Router with route groups: `(auth)`, `(main)`.
- Zustand stores for auth, chat, mood, and theme with localStorage persistence.
- A single API client (`src/lib/api.ts`) wraps all backend routes with JWT auth headers.
- Design system built from reusable UI primitives (button, card, modal, slider…)
  plus shared components (AI orb, emotion badge, typing indicator, empty states).
- Framer Motion for animations; Recharts for charts; dark/light theme via a CSS-variable toggling store.