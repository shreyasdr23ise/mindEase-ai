"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "light" | "dark"

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme) => {
        const root = document.documentElement
        if (theme === "dark") {
          root.classList.add("dark")
        } else {
          root.classList.remove("dark")
        }
        root.style.colorScheme = theme
        set({ theme })
      },
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === "light" ? "dark" : "light"
          const root = document.documentElement
          if (next === "dark") root.classList.add("dark")
          else root.classList.remove("dark")
          root.style.colorScheme = next
          return { theme: next }
        }),
    }),
    {
      name: "mindEase-theme",
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          const root = document.documentElement
          if (state.theme === "dark") root.classList.add("dark")
          else root.classList.remove("dark")
          root.style.colorScheme = state.theme
        }
      },
    }
  )
)