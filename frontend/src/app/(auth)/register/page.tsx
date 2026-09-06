"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { UserPlus, User, Mail, AtSign, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"

interface FormErrors {
  name?: string
  email?: string
  username?: string
  password?: string
  confirmPassword?: string
}

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "At least one number", test: (p: string) => /\d/.test(p) },
  { label: "A letter and a symbol", test: (p: string) => /[a-zA-Z]/.test(p) && /[^a-zA-Z0-9]/.test(p) },
]

export default function RegisterPage() {
  const router = useRouter()
  const register = useAuthStore((s) => s.register)

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [loading, setLoading] = React.useState(false)

  const passwordPassed = (rule: (typeof passwordRules)[number]) => rule.test(password)

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!name.trim()) next.name = "Full name is required"
    else if (name.trim().length < 2) next.name = "Name must be at least 2 characters"
    if (!email.trim()) next.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Please enter a valid email"
    if (!username.trim()) next.username = "Username is required"
    else if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username.trim()))
      next.username = "3-20 characters, letters, numbers, _ or ."
    if (!password) next.password = "Password is required"
    else if (password.length < 8) next.password = "Password must be at least 8 characters"
    else if (!passwordRules.every((r) => r.test(password)))
      next.password = "Password must include a number and a symbol"
    if (!confirmPassword) next.confirmPassword = "Please confirm your password"
    else if (confirmPassword !== password) next.confirmPassword = "Passwords do not match"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register(email.trim(), password, name.trim())
      toast.success("Account created", "Welcome to MindEase AI. Let's set you up.")
      router.replace("/onboarding")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed"
      toast.error("Couldn't create your account", message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="register-name"
          label="Full Name"
          autoComplete="name"
          placeholder="Alex Rivera"
          icon={<User className="h-4 w-4" />}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
          }}
          error={errors.name}
          disabled={loading}
        />
        <Input
          id="register-email"
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
        <Input
          id="register-username"
          label="Username"
          autoComplete="username"
          placeholder="alex_rivera"
          icon={<AtSign className="h-4 w-4" />}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
            if (errors.username) setErrors((p) => ({ ...p, username: undefined }))
          }}
          error={errors.username}
          disabled={loading}
        />
        <div className="space-y-4">
          <div className="relative">
            <Input
              id="register-password"
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
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
          {password && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-1"
            >
              {passwordRules.map((rule) => {
                const passed = passwordPassed(rule)
                return (
                  <li
                    key={rule.label}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-colors",
                      passed ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full border",
                        passed
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      )}
                    >
                      {passed ? (
                        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-none stroke-current stroke-2">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span className="h-1 w-1 rounded-full bg-slate-400" />
                      )}
                    </span>
                    {rule.label}
                  </li>
                )
              })}
            </motion.ul>
          )}
          <div className="relative">
            <Input
              id="register-confirm"
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              icon={<Lock className="h-4 w-4" />}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }))
              }}
              error={errors.confirmPassword}
              disabled={loading}
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Creating account...
            </span>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Create Account
            </>
          )}
        </Button>
      </form>

      <p className="flex items-center justify-center gap-1.5 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?
        <Link
          href="/login"
          className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          Log in
        </Link>
      </p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-xs text-slate-400 dark:text-slate-500"
      >
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </motion.p>
    </div>
  )
}
