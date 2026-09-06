"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { api } from "@/lib/api"

export interface User {
  id: string
  name?: string
  email: string
  role?: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  loadMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await api.auth.login({ email, password })
        if (res.token) {
          api.setToken(res.token)
          set({ token: res.token, user: (res.user as User) ?? null, isAuthenticated: true })
        } else {
          throw new Error("Login response did not include a token")
        }
      },

      register: async (email, password, name) => {
        const res = await api.auth.register({ email, password, name })
        if (res.token) {
          api.setToken(res.token)
          set({ token: res.token, user: (res.user as User) ?? null, isAuthenticated: true })
        } else {
          throw new Error("Registration response did not include a token")
        }
      },

      logout: async () => {
        try {
          await api.auth.logout()
        } catch {
          // ignore network errors on logout
        }
        api.clearToken()
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => {
        if (token) {
          api.setToken(token)
        } else {
          api.clearToken()
        }
        set({ token, isAuthenticated: !!token })
      },

      loadMe: async () => {
        try {
          const res = await api.auth.getMe()
          const user = res.user as User
          set({ user, isAuthenticated: true })
        } catch {
          api.clearToken()
          set({ user: null, token: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: "mindEase-auth",
      partialize: (state) => ({ token: state.token, user: state.user }) as AuthState,
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.setToken(state.token)
          api.auth
            .getMe()
            .then((res) => state.setUser((res.user as User) ?? null))
            .catch(() => {
              api.clearToken()
              state.setToken(null)
            })
        }
      },
    }
  )
)
