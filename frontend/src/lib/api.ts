const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const TOKEN_KEY = "mindEase_token"

export interface ChatResponse {
  response: string
  conversation_id: string
  emotion?: { emotion?: string; confidence?: number; severity?: string }
  intent?: { intent?: string; confidence?: number }
  suggested_actions?: string[]
  is_crisis?: boolean
  crisis_severity?: string
}

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null
    return window.localStorage.getItem(TOKEN_KEY)
  }

  setToken(token: string) {
    if (typeof window === "undefined") return
    window.localStorage.setItem(TOKEN_KEY, token)
  }

  clearToken() {
    if (typeof window === "undefined") return
    window.localStorage.removeItem(TOKEN_KEY)
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    const token = this.getToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`
      let data: unknown
      try {
        data = await response.json()
        if (data && typeof data === "object" && "detail" in (data as Record<string, unknown>)) {
          const detail = (data as Record<string, unknown>).detail
          if (typeof detail === "string") {
            message = detail
          }
        }
      } catch {
        // no response body to parse
      }
      throw new ApiError(response.status, message, data)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }

  get<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: "GET" })
  }

  post<T>(path: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(path: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  patch<T>(path: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: "DELETE" })
  }

  // ── Auth ──────────────────────────────────────────────────────────────
  auth = {
    register: async (data: { name?: string; email: string; password: string }) => {
      const res = await this.post<{ access_token: string; user?: unknown }>(
        "/api/auth/register",
        {
          email: data.email,
          password: data.password,
          username: data.name?.trim() || data.email.split("@")[0],
          full_name: data.name?.trim() || null,
        }
      )
      return { token: res.access_token, user: res.user }
    },
    login: async (data: { email: string; password: string }) => {
      const res = await this.post<{ access_token: string; user?: unknown }>(
        "/api/auth/login",
        data
      )
      return { token: res.access_token, user: res.user }
    },
    logout: () => this.post<Record<string, never>>("/api/auth/logout"),
    getMe: async () => {
      const user = await this.get<unknown>("/api/auth/me")
      return { user }
    },
  }

  // ── Chat ──────────────────────────────────────────────────────────────
  chat = {
    sendMessage: (data: { message: string; conversation_id?: string }) =>
      this.post<ChatResponse>("/api/chat/message", data),
    getConversations: () => this.get<unknown[]>("/api/chat/conversations"),
    getConversation: (id: string) => this.get<unknown>(`/api/chat/conversations/${id}`),
    updateConversation: (id: string, data: { title?: string }) =>
      this.patch<unknown>(`/api/chat/conversations/${id}`, data),
    deleteConversation: (id: string) =>
      this.delete<Record<string, never>>(`/api/chat/conversations/${id}`),
  }

  // ── Mood ──────────────────────────────────────────────────────────────
  mood = {
    createMood: async (data: { mood: string; level?: number; note?: string }) => {
      const level = data.level ?? 3
      const res = await this.post<Record<string, unknown>>("/api/mood/", {
        mood: data.mood,
        stress_level: level,
        anxiety_level: level,
        note: data.note ?? null,
      })
      return { ...res, level: typeof res.stress_level === "number" ? (res.stress_level as number) : undefined }
    },
    getMoodHistory: async () => {
      const history = await this.get<unknown[]>("/api/mood/")
      return Array.isArray(history) ? history : []
    },
    getHistory: () => this.get<unknown>("/api/mood/history"),
    deleteMood: (id: string) => this.delete<Record<string, never>>(`/api/mood/${id}`),
  }

  // ── Journal ───────────────────────────────────────────────────────────
  journal = {
    create: (data: { title?: string; content: string; mood?: string }) =>
      this.post<unknown>("/api/journal/", data),
    getAll: () => this.get<unknown[]>("/api/journal/"),
    getById: (id: string) => this.get<unknown>(`/api/journal/${id}`),
    update: (id: string, data: { title?: string; content?: string }) =>
      this.patch<unknown>(`/api/journal/${id}`, data),
    delete: (id: string) => this.delete<Record<string, never>>(`/api/journal/${id}`),
  }

  // ── Wellness ──────────────────────────────────────────────────────────
  wellness = {
    getExercises: () => this.get<unknown[]>("/api/wellness/"),
    getExercise: (id: string) => this.get<unknown>(`/api/wellness/${id}`),
    createSession: (data: {
      exercise_id: string
      completed?: boolean
      duration_seconds?: number
      notes?: string
      rating?: number
    }) => this.post<unknown>("/api/wellness/session", data),
    getSessions: () => this.get<unknown[]>("/api/wellness/sessions/history"),
  }

  // ── Medicine ──────────────────────────────────────────────────────────
  medicine = {
    search: async (query: string) => {
      const res = await this.get<{ medicines: unknown[]; total: number }>(
        `/api/medicine/search?q=${encodeURIComponent(query)}`
      )
      return Array.isArray(res.medicines) ? res.medicines : []
    },
    getAll: async () => {
      const res = await this.get<{ medicines: unknown[]; total: number }>("/api/medicine")
      return Array.isArray(res.medicines) ? res.medicines : []
    },
    getById: (id: string) => this.get<unknown>(`/api/medicine/${id}`),
  }

  // ── Emergency ─────────────────────────────────────────────────────────
  emergency = {
    getResources: () => this.get<unknown[]>("/api/emergency/"),
  }

  // ── Crisis ────────────────────────────────────────────────────────────
  crisis = {
    analyze: (data: { message: string }) =>
      this.post<{ severity?: string; advice?: string }>("/api/crisis/analyze", data),
    reportEvent: (data: { severity: string; details?: string }) =>
      this.post<unknown>("/api/crisis/event", data),
  }

  // ── Counselors ────────────────────────────────────────────────────────
  counselors = {
    getAll: () => this.get<unknown[]>("/api/counselors/"),
    getById: (id: string) => this.get<unknown>(`/api/counselors/${id}`),
    createRequest: (data: { counselor_id: string; message?: string }) =>
      this.post<unknown>("/api/counselors/request", data),
    getRequests: () => this.get<unknown[]>("/api/counselors/requests/mine"),
  }

  // ── Admin ─────────────────────────────────────────────────────────────
  admin = {
    getUsers: () => this.get<unknown[]>("/api/admin/users"),
    getAnalytics: () => this.get<unknown>("/api/admin/analytics"),
    getAuditLogs: () => this.get<unknown[]>("/api/admin/audit-logs"),
  }

  // ── Privacy ───────────────────────────────────────────────────────────
  privacy = {
    getSettings: () => this.get<unknown>("/api/privacy/settings"),
    updateSettings: (data: Record<string, unknown>) =>
      this.put<unknown>("/api/privacy/settings", data),
    deleteAccount: () => this.delete<Record<string, never>>("/api/privacy/account"),
    exportData: () => this.post<unknown>("/api/privacy/export-data"),
  }

  // ── Onboarding ────────────────────────────────────────────────────────
  onboarding = {
    complete: (data: Record<string, unknown>) =>
      this.post<unknown>("/api/onboarding/complete", data),
  }
}

export const api = new ApiClient()