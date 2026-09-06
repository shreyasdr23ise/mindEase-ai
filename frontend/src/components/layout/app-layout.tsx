"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { LoadingPage } from "@/components/shared/loading-page"
import { useAuthStore } from "@/store/auth-store"
import { Toaster } from "@/components/ui/toast"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/chat": "Chat with MindEase",
  "/mood": "Mood Tracker",
  "/journal": "My Journal",
  "/wellness": "Wellness Center",
  "/medicines": "Medicines",
  "/counselors": "Professional Help",
  "/emergency": "Emergency Support",
  "/counselor/dashboard": "Counselor Dashboard",
  "/admin/dashboard": "Admin Dashboard",
  "/profile": "Profile",
  "/settings": "Settings",
  "/onboarding": "Getting Started",
}

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [hydrated] = React.useState(() => typeof window !== "undefined")
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  React.useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login")
    }
  }, [hydrated, isAuthenticated, router])

  if (!hydrated) {
    return <LoadingPage />
  }

  if (!isAuthenticated) {
    return null
  }

  const title = pageTitles[pathname] ?? "MindEase AI"

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar title={title} onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}