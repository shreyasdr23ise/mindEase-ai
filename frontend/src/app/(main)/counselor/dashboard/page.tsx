"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  ShieldCheck,
  ShieldAlert,
  Inbox,
  CalendarDays,
  Clock,
  UserRound,
  Lock,
  BadgeCheck,
  X,
  Check,
  HeartPulse,
  AlertTriangle,
  ArrowLeft,
  TrendingUp,
  RefreshCw,
  Activity,
  Users,
} from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { cn, formatDate, truncate } from "@/lib/utils"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth-store"

const DECISIONS_KEY = "mindEase_counselor_decisions"

type Decision = "accepted" | "rejected" | "completed"

interface CounselorRequest {
  id: string
  user_id?: string
  user_name?: string
  is_anonymous?: boolean
  anonymous?: boolean
  anonymous_label?: string
  message?: string
  preferred_date?: string
  preferred_time?: string
  status?: string
  severity?: string
  created_at?: string
}

function normalizeRequest(raw: unknown): CounselorRequest {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(d.id ?? d.request_id ?? `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    user_id: typeof d.user_id === "string" ? d.user_id : undefined,
    user_name: typeof d.user_name === "string" ? d.user_name : typeof d.name === "string" ? d.name : undefined,
    is_anonymous: typeof d.is_anonymous === "boolean" ? d.is_anonymous : typeof d.anonymous === "boolean" ? d.anonymous : undefined,
    anonymous_label: typeof d.anonymous_label === "string" ? d.anonymous_label : undefined,
    message: typeof d.message === "string" ? d.message : undefined,
    preferred_date: typeof d.preferred_date === "string" ? d.preferred_date : undefined,
    preferred_time: typeof d.preferred_time === "string" ? d.preferred_time : undefined,
    status: typeof d.status === "string" ? d.status : undefined,
    severity: typeof d.severity === "string" ? d.severity : undefined,
    created_at: typeof d.created_at === "string" ? d.created_at : undefined,
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const CRISIS_KEYWORDS = [
  "suicide",
  "suicidal",
  "kill myself",
  "end my life",
  "self harm",
  "self-harm",
  "selfharm",
  "hurt myself",
  "no reason to live",
  "want to die",
  "hopeless",
]

function isCrisisRequest(request: CounselorRequest): boolean {
  const severity = (request.severity ?? "").toLowerCase()
  if (severity.includes("critical") || severity.includes("high") || severity.includes("severe")) return true
  const message = (request.message ?? "").toLowerCase()
  return CRISIS_KEYWORDS.some((keyword) => message.includes(keyword))
}

function getStatusInfo(status: string): {
  variant: "warning" | "success" | "destructive" | "info" | "secondary"
  label: string
} {
  const s = status.toLowerCase()
  if (s.includes("accept") || s.includes("active") || s.includes("confirm")) {
    return { variant: "success", label: "Active" }
  }
  if (s.includes("reject") || s.includes("decline") || s.includes("denied")) {
    return { variant: "destructive", label: "Rejected" }
  }
  if (s.includes("complete") || s.includes("finish") || s.includes("done")) {
    return { variant: "info", label: "Completed" }
  }
  if (s.includes("cancel") || s.includes("withdraw")) {
    return { variant: "secondary", label: "Cancelled" }
  }
  return { variant: "warning", label: "Pending" }
}

function userLabel(request: CounselorRequest): string {
  const anonymous = request.is_anonymous || request.anonymous
  if (anonymous) {
    return request.anonymous_label ?? "Anonymous user"
  }
  return request.user_name ?? "User"
}

function formatDateShort(dateStr?: string): string {
  if (!dateStr) return "Recently"
  try {
    return formatDate(dateStr, { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return dateStr
  }
}

interface StatCardProps {
  label: string
  value: number
  icon: React.ElementType
  accent: string
  delay?: number
  alert?: boolean
}

function StatCard({ label, value, icon: Icon, accent, delay = 0, alert = false }: StatCardProps) {
  return (
    <motion.div variants={fadeUp} custom={delay}>
      <Card
        hoverable
        className={cn(
          "flex h-full flex-col gap-3 p-4",
          alert && "border-red-300/70 dark:border-red-500/30"
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
            accent
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-auto">
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {value.toLocaleString()}
          </span>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </Card>
    </motion.div>
  )
}

function AccessDenied() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[60vh] flex-col items-center justify-center gap-5"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500/15 to-amber-400/15 text-red-500 dark:text-red-400">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Access denied</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          This area is reserved for verified MindEase counselors and administrators. If you
          believe this is a mistake, please contact your support team.
        </p>
      </div>
      <Link href="/dashboard">
        <Button variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Button>
      </Link>
    </motion.div>
  )
}

export default function CounselorDashboardPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const [requests, setRequests] = React.useState<CounselorRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState(false)
  const [reloadKey, setReloadKey] = React.useState(0)
  const [pendingAction, setPendingAction] = React.useState<string | null>(null)

  const [decisions, setDecisions] = React.useState<Record<string, Decision>>(() => {
    if (typeof window === "undefined") return {}
    try {
      return JSON.parse(window.localStorage.getItem(DECISIONS_KEY) ?? "{}") as Record<string, Decision>
    } catch {
      return {}
    }
  })

  const role = (user?.role ?? "").toLowerCase()
  const isAllowed = role === "counselor" || role === "admin"
  const firstName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Counselor"

  React.useEffect(() => {
    if (!user) {
      router.replace("/login")
    }
  }, [user, router])

  React.useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setLoadError(false)
      try {
        const raw = await api.counselors.getRequests()
        if (!active) return
        setRequests((Array.isArray(raw) ? raw : []).map(normalizeRequest))
      } catch {
        if (active) setLoadError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [reloadKey])

  const applyDecision = (id: string, next: Decision) => {
    const updated = { ...decisions, [id]: next }
    setDecisions(updated)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DECISIONS_KEY, JSON.stringify(updated))
    }
  }

  const lockRequest = (id: string) => {
    setPendingAction(id)
    setTimeout(() => setPendingAction(null), 800)
  }

  const handleAccept = (request: CounselorRequest) => {
    lockRequest(request.id)
    applyDecision(request.id, "accepted")
    toast.success("Request accepted", `${userLabel(request)} can now start a session with you.`)
  }

  const handleReject = (request: CounselorRequest) => {
    lockRequest(request.id)
    applyDecision(request.id, "rejected")
    toast.info("Request rejected", `You declined the request from ${userLabel(request)}.`)
  }

  const handleComplete = (request: CounselorRequest) => {
    lockRequest(request.id)
    applyDecision(request.id, "completed")
    toast.success("Session completed", `Great work — the session with ${userLabel(request)} has been closed.`)
  }

  const enriched = React.useMemo(
    () =>
      requests.map((request) => ({
        ...request,
        _status: decisions[request.id] ?? request.status ?? "pending",
      })),
    [requests, decisions]
  )

  const pendingRequests = React.useMemo(
    () => enriched.filter((r) => {
      const s = r._status.toLowerCase()
      return !(
        s.includes("accept") || s.includes("active") || s.includes("confirm") ||
        s.includes("reject") || s.includes("decline") || s.includes("denied") ||
        s.includes("complete") || s.includes("finish") || s.includes("done") ||
        s.includes("cancel") || s.includes("withdraw")
      )
    }),
    [enriched]
  )

  const activeSessions = React.useMemo(
    () => enriched.filter((r) => {
      const s = r._status.toLowerCase()
      return s.includes("accept") || s.includes("active") || s.includes("confirm")
    }),
    [enriched]
  )

  const completedSessions = React.useMemo(
    () => enriched.filter((r) => {
      const s = r._status.toLowerCase()
      return s.includes("complete") || s.includes("finish") || s.includes("done")
    }),
    [enriched]
  )

  const crisisRequests = React.useMemo(() => enriched.filter(isCrisisRequest), [enriched])

  const consentedRequests = React.useMemo(
    () => enriched.filter((r) => (r as CounselorRequest & { mood_consent?: boolean }).mood_consent !== false),
    [enriched]
  )

  const stats = [
    { label: "Pending Requests", value: pendingRequests.length, icon: Inbox, accent: "from-amber-500 to-orange-400" },
    { label: "Active Sessions", value: activeSessions.length, icon: Activity, accent: "from-emerald-500 to-teal-400" },
    ...(crisisRequests.length > 0
      ? [{ label: "Crisis Alerts", value: crisisRequests.length, icon: AlertTriangle, accent: "from-red-500 to-rose-400", alert: true }]
      : []),
    { label: "Sessions Completed", value: completedSessions.length, icon: BadgeCheck, accent: "from-blue-500 to-sky-400" },
  ]

  if (!user) {
    return null
  }

  if (!isAllowed) {
    return <AccessDenied />
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      className="space-y-8"
    >
      {/* Header banner */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-teal-50 via-emerald-50 to-blue-50 p-6 sm:p-8 dark:border-slate-800 dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-blue-950/40"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-50 sm:text-3xl">
                Counselor Dashboard
              </h1>
              <Badge variant="success">
                <ShieldCheck className="h-3 w-3" />
                {role === "admin" ? "Admin access" : "Verified"}
              </Badge>
            </div>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              Welcome back, {firstName} — here&apos;s what your users need today.
            </p>
          </div>
          <Avatar name={user?.name || user?.email || "Counselor"} size="lg" online />
        </div>
      </motion.div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      )}

      {loadError && requests.length === 0 ? (
        <EmptyState
          icon={<RefreshCw className="h-7 w-7" />}
          title="Couldn't load requests"
          description="We couldn't reach the request feed. Please check your connection and try again."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setLoadError(false)
                setReloadKey((k) => k + 1)
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          }
        />
      ) : (
        <>
          {/* Response requests */}
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                  <Inbox className="h-5 w-5 text-amber-500" />
                  Response requests
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Users who asked to connect with you
                </p>
              </div>
              <Badge variant="warning">{pendingRequests.length} pending</Badge>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 rounded-2xl" />
                ))}
              </div>
            ) : pendingRequests.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-7 w-7" />}
                title="No pending requests"
                description="When a user requests to work with you, it will show up here for review."
              />
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {pendingRequests.map((request) => {
                    const info = getStatusInfo(request._status)
                    const anonymous = request.is_anonymous || request.anonymous
                    return (
                      <motion.div
                        key={request.id}
                        layout
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 300, damping: 26 }}
                      >
                        <Card className="p-5">
                          <CardContent className="p-0">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <Avatar name={anonymous ? "?" : userLabel(request)} size="sm" />
                                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                                      {userLabel(request)}
                                    </h3>
                                  </div>
                                  {anonymous && (
                                    <Badge variant="secondary">
                                      <UserRound className="h-3 w-3" />
                                      Anonymous
                                    </Badge>
                                  )}
                                  <Badge variant={info.variant}>{info.label}</Badge>
                                </div>

                                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                                  {request.created_at && (
                                    <span className="flex items-center gap-1">
                                      <CalendarDays className="h-3.5 w-3.5" />
                                      Requested {formatDateShort(request.created_at)}
                                    </span>
                                  )}
                                  {request.preferred_date && (
                                    <span className="flex items-center gap-1">
                                      <CalendarDays className="h-3.5 w-3.5" />
                                      {formatDateShort(request.preferred_date)}
                                    </span>
                                  )}
                                  {request.preferred_time && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5" />
                                      {request.preferred_time}
                                    </span>
                                  )}
                                </div>

                                {request.message && (
                                  <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                                    {truncate(request.message, 220)}
                                  </p>
                                )}

                                {isCrisisRequest(request) && (
                                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200/70 bg-red-50/60 px-4 py-3 text-xs text-red-700 dark:border-red-500/25 dark:bg-red-500/[0.07] dark:text-red-300">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p>
                                      This request may involve elevated distress. Follow your
                                      support protocol and prioritize this user&apos;s safety.
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="flex shrink-0 items-center gap-2 lg:flex-col">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-emerald-600 hover:border-emerald-500/50 hover:bg-emerald-50/50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                                  onClick={() => handleAccept(request)}
                                  disabled={pendingAction === request.id}
                                >
                                  {pendingAction === request.id ? (
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-500" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                                  onClick={() => handleReject(request)}
                                  disabled={pendingAction === request.id}
                                >
                                  <X className="h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* Active sessions */}
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  Active sessions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Accepted requests you&apos;re currently supporting
                </p>
              </div>
              <Badge variant="success">{activeSessions.length} active</Badge>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            ) : activeSessions.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-7 w-7" />}
                title="No active sessions"
                description="When you accept a request, it moves here and you can track and complete the session."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {activeSessions.map((session) => {
                    const anonymous = session.is_anonymous || session.anonymous
                    return (
                      <motion.div
                        key={session.id}
                        layout
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 300, damping: 26 }}
                      >
                        <Card hoverable className="h-full p-5">
                          <CardContent className="p-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-400/15 text-emerald-500 dark:text-emerald-400">
                                  {anonymous ? <UserRound className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    {userLabel(session)}
                                  </h3>
                                  <p className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                    <CalendarDays className="h-3 w-3" />
                                    Started {formatDateShort(session.created_at)}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="success">
                                <HeartPulse className="h-3 w-3" />
                                In progress
                              </Badge>
                            </div>

                            {session.message && (
                              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                {truncate(session.message, 140)}
                              </p>
                            )}

                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                              <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                                <Clock className="h-3.5 w-3.5" />
                                Session with {anonymous ? "anonymous user" : "user"}
                              </span>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                                onClick={() => handleComplete(session)}
                                disabled={pendingAction === session.id}
                              >
                                {pendingAction === session.id ? (
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-500" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                Complete session
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* Client support overview */}
          <section className="grid gap-4 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <Card className="h-full p-5">
                <div className="mb-4">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
                    <TrendingUp className="h-5 w-5 text-teal-500" />
                    Consented support overview
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Anonymized trends from users who&apos;ve opted in to share their wellbeing journey
                  </p>
                </div>

                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 rounded-full" />
                    ))}
                  </div>
                ) : consentedRequests.length === 0 ? (
                  <EmptyState
                    icon={<TrendingUp className="h-7 w-7" />}
                    title="Awaiting consent data"
                    description="Mood summaries appear here only for users who have consented to share anonymized insights with their counselor."
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Consented users</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {consentedRequests.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Active cases</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {activeSessions.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Completed sessions</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {completedSessions.length}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50">
                      <span className="text-slate-500 dark:text-slate-400">
                        This week&apos;s support activity
                      </span>
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {activeSessions.length + completedSessions.length} touchpoints
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card
                className={cn(
                  "h-full p-5",
                  crisisRequests.length > 0 && "border-red-300/70 dark:border-red-500/30"
                )}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Crisis alerts
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      High-severity flags that need your attention
                    </p>
                  </div>
                  {crisisRequests.length > 0 && (
                    <Badge variant="destructive">{crisisRequests.length} flags</Badge>
                  )}
                </div>

                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-xl" />
                    ))}
                  </div>
                ) : crisisRequests.length === 0 ? (
                  <EmptyState
                    icon={<HeartPulse className="h-7 w-7" />}
                    title="No crisis alerts"
                    description="There are no high-severity flags right now. You'll be notified if the system detects elevated risk."
                  />
                ) : (
                  <div className="space-y-3">
                    {crisisRequests.slice(0, 5).map((request) => {
                      const anonymous = request.is_anonymous || request.anonymous
                      return (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50/50 p-3.5 dark:border-red-500/20 dark:bg-red-500/[0.06]"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                            {anonymous ? <UserRound className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-red-900 dark:text-red-200">
                              {anonymous ? "Anonymous user" : "A consented user"} ·{" "}
                              {formatDateShort(request.created_at)}
                            </p>
                            <p className="text-xs text-red-600/80 dark:text-red-300/70">
                              High-severity flag detected. Open the associated session for full context.
                            </p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </motion.div>
          </section>

          {/* Privacy & consent banner */}
          <motion.div variants={fadeUp}>
            <div className="flex flex-col gap-4 rounded-2xl border border-blue-200/70 bg-blue-50/60 p-5 sm:flex-row sm:items-start dark:border-blue-500/20 dark:bg-blue-500/[0.08]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <Lock className="h-5 w-5" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  Privacy &amp; consent first
                </p>
                <p className="mt-1 max-w-2xl text-slate-500 dark:text-slate-400">
                  You can only see information users have consented to share. Sensitive details are
                  never shown unless a user has expressly authorized access, and all insights are
                  anonymized. Never access or disclose user data outside of active, authorized sessions.
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  MindEase AI logs only the actions required for your support duties and nothing more.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}