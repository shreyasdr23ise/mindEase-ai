"use client"

import * as React from "react"
import { useThemeStore } from "@/store/theme-store"

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemeStore((s) => s.theme)

  React.useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") root.classList.add("dark")
    else root.classList.remove("dark")
    root.style.colorScheme = theme
  }, [theme])

  return <>{children}</>
}