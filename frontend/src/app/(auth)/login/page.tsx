"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Mail, Lock, Eye, EyeOff, LogIn, UserRound, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const setUser = useAuthStore((s) => s.setUser)

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = React.useState(false)

  const validate = (): boolean => {
    const next: typeof errors = {}
    if (!email.trim()) next.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Please enter a valid email"
    if (!password) next.password = "Password is required"
    else if (password.length < 6) next.password = "Password must be at least 6 characters"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(email.trim(), password)
      toast.success("Welcome back", "Your well-being space is ready.")
      router.replace("/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed"
      toast.error("Couldn't log you in", message)
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = async () => {
    setLoading(true)
    window.localStorage.setItem("mindEase_anonymous", "true")
    const guestUser = { id: "guest", name: "Guest", email: "guest@mindease.ai" }
    setUser(guestUser)
    toast.success("Continuing as guest", "Exploring MindEase AI anonymously.")
    router.replace("/dashboard")
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
          }}
          error={errors.email}
          disabled={loading}
        />
        <div className="relative">
          <Input
            id="login-password"
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
            }}
            error={errors.password}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-9 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => toast.info("Password reset", "Password reset is not available in the demo. Use the demo credentials below.")}
            className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
          >
            Forgot password?
          </button>
          <span className="text-xs text-slate-400">Don&apos;t have an account?</span>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Signing in...
            </span>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Login
            </>
          )}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleGuest}
          disabled={loading}
        >
          <UserRound className="h-4 w-4" />
          Continue as Guest
        </Button>

        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-center dark:border-blue-500/20 dark:bg-blue-500/10">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Demo credentials
            <span className="mx-1.5 text-slate-300 dark:text-slate-600">•</span>
            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">demo@mindease.ai</span>
            <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">demo123</span>
          </p>
        </div>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
        <Sparkles className="h-3.5 w-3.5 text-teal-500" />
        New to MindEase AI?
        <Link
          href="/register"
          className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          Create an account
        </Link>
      </p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={cn("text-center text-xs text-slate-400 dark:text-slate-500")}
      >
        Your conversations stay private and secure with MindEase AI.
      </motion.p>
    </div>
  )
}
