"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { LoadingPage } from "@/components/shared/loading-page"
import { LogoMark } from "@/components/shared/logo-mark"
import { useAuthStore } from "@/store/auth-store"
import { Toaster } from "@/components/ui/toast"

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const [hydrated] = React.useState(() => typeof window !== "undefined")
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()

  React.useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [hydrated, isAuthenticated, router])

  if (!hydrated) {
    return <LoadingPage />
  }

  if (isAuthenticated) {
    return null
  }

  const defaultTitle = pathname?.includes("register") ? "Create your account" : "Welcome back"
  const defaultSubtitle =
    pathname?.includes("register")
      ? "Start your journey toward better mental well-being."
      : "Log in to continue supporting your well-being."

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-teal-50 to-purple-50 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-600/15" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-600/15" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-600/15" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full"
      >
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-12 w-12" />
            <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-2xl font-bold text-transparent dark:from-blue-400 dark:to-teal-300">
              MindEase AI
            </span>
          </div>
          <div className="mt-3 text-center">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              {title ?? defaultTitle}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {subtitle ?? defaultSubtitle}
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="mx-auto w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/80 p-7 shadow-2xl shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/30"
        >
          {children}
        </motion.div>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          MindEase AI is not a crisis service. If you are in crisis, please reach out to
          a local emergency service or helpline.
        </p>
      </motion.div>

      <Toaster />
    </div>
  )
}