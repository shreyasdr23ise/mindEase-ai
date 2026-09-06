# MindEase AI — REST API Documentation

Base URL: `http://localhost:8000` (Docker). All JSON.

Interactive docs available at `/docs` (Swagger UI) and `/redoc`.

## Authentication

Use `Authorization: Bearer <token>` for protected endpoints.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns JWT + user |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/auth/logout` | Revoke session |

**Register request:**
```json
{
  "email": "user@example.com",
  "username": "user",
  "full_name": "Full Name",
  "password": "strongpassword"
}
```

**Register/login response:**
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": { "id": "...", "email": "...", "username": "...", "role": "user" }
}
```

## Onboarding

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/onboarding/complete` | Save onboarding profile (name, goals, style) |

## Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat/message` | Send a message and get an AI response |
| GET | `/api/chat/conversations` | List user conversations |
| GET | `/api/chat/conversations/{id}` | Get a conversation with messages |
| PATCH | `/api/chat/conversations/{id}` | Rename a conversation |
| DELETE | `/api/chat/conversations/{id}` | Delete a conversation |

**Send message request:**
```json
{ "message": "I'm feeling really stressed today", "conversation_id": null }
```

**Response:**
```json
{
  "response": "That sounds really overwhelming…",
  "conversation_id": "…",
  "emotion": { "emotion": "stress", "confidence": 0.97, "severity": "high" },
  "intent": { "intent": "stress", "confidence": 0.9 },
  "suggested_actions": ["Try a calming breathing exercise", "…"],
  "is_crisis": false,
  "crisis_severity": null
}
```

When `is_crisis` is `true`, the response is an immediate **crisis support** message with
emergency resources and `suggested_actions` pointing to help lines.

## Mood

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/mood` | Log a mood check-in |
| GET | `/api/mood/history` | History (optional `days` filter) |
| DELETE | `/api/mood/{id}` | Delete a mood log |

Request: `{ "mood": "good", "stress_level": 4, "anxiety_level": 3, "note": "optional" }`

## Journal

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/journal` | Create an entry |
| GET | `/api/journal` | List (optional `q`, `mood` filters) |
| GET | `/api/journal/{id}` | Get one entry |
| PUT | `/api/journal/{id}` | Update a entry |
| DELETE | `/api/journal/{id}` | Delete an entry |

## Emotion

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/emotion/analyze` | Analyze text for emotion, returns `{emotion, confidence, severity}` |

## Wellness

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/wellness` | List exercises (optional `category` filter) |
| GET | `/api/wellness/{id}` | Get an exercise |
| POST | `/api/wellness/session` | Log a completed session |
| GET | `/api/wellness/sessions` | User's session history |

## Medicine

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/medicine/search?q=` | Search medicines (name/generic/category) |
| GET | `/api/medicine/{id}` | Full medicine record with safety data |

## Emergency & Crisis

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/emergency-resources?country=` | List crisis resources for a country |
| POST | `/api/crisis/analyze` | Analyze text for crisis severity |
| POST | `/api/crisis/event` | Log a crisis event |

## Counselors & Professional Support

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/counselors` | List counselors (optional filters) |
| GET | `/api/counselors/{id}` | Counselor detail |
| POST | `/api/counselor/request` | Create a consultation request |
| GET | `/api/counselor/requests` | User's requests |

## Admin (role: `admin`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | List users |
| GET | `/api/admin/analytics` | Platform analytics (counts + charts) |
| GET | `/api/admin/audit-logs` | Audit log entries |
| POST | `/api/admin/users/{id}/deactivate` | Deactivate a user |

## Privacy

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/privacy/settings` | Read privacy settings |
| PUT | `/api/privacy/settings` | Update privacy settings |
| POST | `/api/privacy/export-data` | Export user data |
| DELETE | `/api/privacy/account` | Delete account |

## Error Responses

Errors use standard HTTP status codes; the body is `{ "detail": "message" }`.
Common statuses: `400` (bad input), `401` (unauthenticated), `403` (forbidden),
`404` (not found), `409` (conflict, e.g. email already registered).