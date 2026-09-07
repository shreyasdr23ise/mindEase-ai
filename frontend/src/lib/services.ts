import { apiRequest } from "./api";
import type {
  AdminAnalytics,
  AuthResponse,
  ChatResponse,
  Conversation,
  ConversationDetail,
  Counselor,
  CounselorRequest,
  CrisisAnalysis,
  EmergencyResource,
  JournalEntry,
  MedicineInfo,
  MedicineList,
  MoodHistory,
  MoodLog,
  PrivacySettings,
  WellnessExercise,
  WellnessSession,
} from "../types";

// ── Auth ─────────────────────────────────────────────────────────────────
export const auth = {
  login: async (email: string, password: string) =>
    apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      timeoutMs: 120000,
    }),
  register: (input: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
  }) =>
    apiRequest<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: input,
      timeoutMs: 120000,
    }),
  me: (token: string) =>
    apiRequest("/api/auth/me", { token, timeoutMs: 60000 }),
  logout: (token: string) =>
    apiRequest<{ message: string }>("/api/auth/logout", {
      method: "POST",
      token,
    }),
};

// ── Chat ─────────────────────────────────────────────────────────────────
export const chat = {
  send: (
    token: string,
    message: string,
    conversationId?: string
  ) =>
    apiRequest<ChatResponse>("/api/chat/message", {
      method: "POST",
      body: { message, conversation_id: conversationId },
      token,
      timeoutMs: 60000,
    }),
  conversations: (token: string) =>
    apiRequest<Conversation[]>("/api/chat/conversations", { token }),
  conversation: (token: string, id: string) =>
    apiRequest<ConversationDetail>(`/api/chat/conversations/${id}`, { token }),
  rename: (token: string, id: string, title: string) =>
    apiRequest<Conversation>(`/api/chat/conversations/${id}`, {
      method: "PATCH",
      body: { title },
      token,
    }),
  remove: (token: string, id: string) =>
    apiRequest<void>(`/api/chat/conversations/${id}`, {
      method: "DELETE",
      token,
    }),
};

// ── Mood ─────────────────────────────────────────────────────────────────
export const mood = {
  create: (
    token: string,
    input: { mood: string; stress_level: number; anxiety_level: number; note?: string }
  ) =>
    apiRequest<MoodLog>("/api/mood/", { method: "POST", body: input, token }),
  list: (token: string) => apiRequest<MoodLog[]>("/api/mood/", { token }),
  history: (token: string, startDate?: string, endDate?: string) => {
    const q = new URLSearchParams();
    if (startDate) q.set("start_date", startDate);
    if (endDate) q.set("end_date", endDate);
    const qs = q.toString();
    return apiRequest<MoodHistory>(`/api/mood/history${qs ? `?${qs}` : ""}`, { token });
  },
  update: (
    token: string,
    id: string,
    input: { mood?: string; stress_level?: number; anxiety_level?: number; note?: string }
  ) =>
    apiRequest<MoodLog>(`/api/mood/${id}`, { method: "PATCH", body: input, token }),
  remove: (token: string, id: string) =>
    apiRequest<void>(`/api/mood/${id}`, { method: "DELETE", token }),
};

// ── Journal ──────────────────────────────────────────────────────────────
export const journal = {
  list: (token: string, search?: string) => {
    const qs = search && search.trim().length > 0 ? `?search=${encodeURIComponent(search.trim())}` : "";
    return apiRequest<JournalEntry[]>(`/api/journal/${qs}`, { token });
  },
  show: (token: string, id: string) =>
    apiRequest<JournalEntry>(`/api/journal/${id}`, { token }),
  create: (
    token: string,
    input: { title?: string; content: string; mood?: string; writing_prompt?: string }
  ) =>
    apiRequest<JournalEntry>("/api/journal/", { method: "POST", body: input, token }),
  update: (
    token: string,
    id: string,
    input: { title?: string; content?: string; mood?: string }
  ) =>
    apiRequest<JournalEntry>(`/api/journal/${id}`, {
      method: "PATCH",
      body: input,
      token,
    }),
  remove: (token: string, id: string) =>
    apiRequest<void>(`/api/journal/${id}`, { method: "DELETE", token }),
};

// ── Wellness ─────────────────────────────────────────────────────────────
export const wellness = {
  list: (token: string, category?: string) => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    return apiRequest<WellnessExercise[]>(`/api/wellness/${qs}`, { token });
  },
  show: (token: string, id: string) =>
    apiRequest<WellnessExercise>(`/api/wellness/${id}`, { token }),
  sessions: (token: string) =>
    apiRequest<WellnessSession[]>("/api/wellness/sessions/history", { token }),
  complete: (
    token: string,
    input: { exercise_id: string; completed: boolean; duration_seconds: number; notes?: string }
  ) =>
    apiRequest<WellnessSession>("/api/wellness/session", {
      method: "POST",
      body: input,
      token,
    }),
};

// ── Medicine ─────────────────────────────────────────────────────────────
export const medicine = {
  search: (token: string, q: string, limit = 20) =>
    apiRequest<MedicineList>(
      `/api/medicine/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      { token }
    ),
  list: (token: string, category?: string, limit = 50) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (category) params.set("category", category);
    return apiRequest<MedicineList>(`/api/medicine?${params.toString()}`, { token });
  },
  show: (token: string, id: string) =>
    apiRequest<MedicineInfo>(`/api/medicine/${id}`, { token }),
};

// ── Emergency ────────────────────────────────────────────────────────────
export const emergency = {
  list: (token: string, country?: string) => {
    const qs = country ? `?country=${encodeURIComponent(country)}` : "";
    return apiRequest<EmergencyResource[]>(`/api/emergency/${qs}`, { token });
  },
};

// ── Crisis ───────────────────────────────────────────────────────────────
export const crisis = {
  analyze: (token: string, text: string) =>
    apiRequest<CrisisAnalysis>("/api/crisis/analyze", {
      method: "POST",
      body: { text },
      token,
    }),
  report: (
    token: string,
    input: {
      severity: string;
      detected_content: string;
      trigger_type?: string;
      response_provided?: string;
      resolved?: boolean;
    }
  ) =>
    apiRequest("/api/crisis/event", { method: "POST", body: input, token }),
};

// ── Professional help ────────────────────────────────────────────────────
export const professional = {
  list: (token: string) => apiRequest<Counselor[]>("/api/counselors/", { token }),
  show: (token: string, id: string) =>
    apiRequest<Counselor>(`/api/counselors/${id}`, { token }),
  request: (token: string, counselorId: string, message?: string) =>
    apiRequest<CounselorRequest>("/api/counselors/request", {
      method: "POST",
      body: { counselor_id: counselorId, message },
      token,
    }),
  mine: (token: string) =>
    apiRequest<CounselorRequest[]>("/api/counselors/requests/mine", { token }),
};

// ── Privacy & data ───────────────────────────────────────────────────────
export const privacy = {
  settings: (token: string) => apiRequest<PrivacySettings>("/api/privacy/settings", { token }),
  updateSettings: (token: string, body: Partial<PrivacySettings>) =>
    apiRequest<PrivacySettings>("/api/privacy/settings", {
      method: "PUT",
      body,
      token,
    }),
  exportData: (token: string) =>
    apiRequest<Record<string, unknown>>("/api/privacy/export-data", {
      method: "POST",
      token,
      timeoutMs: 60000,
    }),
  deleteAccount: (token: string) =>
    apiRequest("/api/privacy/account", { method: "DELETE", token }),
};

// ── Onboarding ───────────────────────────────────────────────────────────
export const onboardingApi = {
  complete: (
    token: string,
    input: {
      preferred_name: string;
      wellness_goals?: string[];
      preferred_style?: string;
      onboarding_completed: boolean;
    }
  ) =>
    apiRequest("/api/onboarding/complete", { method: "POST", body: input, token }),
};

// ── Admin (role-gated by backend; only used when user.role === "admin") ──
export const admin = {
  analytics: (token: string) => apiRequest<AdminAnalytics>("/api/admin/analytics", { token }),
};