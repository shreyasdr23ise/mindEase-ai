"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Pill,
  LifeBuoy,
  Dumbbell,
  FileClock,
  ShieldAlert,
  Shield,
  TrendingUp,
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Activity,
  MessageCircle,
  BookOpen,
  Heart,
  AlertTriangle,
  Globe,
  Clock,
  CalendarDays,
  BadgeCheck,
  Ban,
  Briefcase,
  Mail,
  Phone,
} from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Modal } from "@/components/ui/modal"
import { Avatar } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { cn, formatDate, truncate } from "@/lib/utils"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth-store"

// ── Types ──────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  created_at?: string
  last_active?: string
}

interface AdminCounselor {
  id: string
  name: string
  email: string
  specialty: string
  experience_years?: number
  status: string
  approved: boolean
  created_at?: string
}

interface Medicine {
  id: string
  name: string
  category: string
  description: string
  uses: string
  dosage: string
  side_effects: string
  created_at: string
}

interface EmergencyResource {
  id: string
  name: string
  country: string
  phone: string
  website: string
  availability: string
  description: string
  last_verified: string
}

interface WellnessExercise {
  id: string
  title: string
  description: string
  category: string
  duration_seconds?: number
  steps: string[]
  active: boolean
  created_at: string
}

interface AuditLog {
  id: string
  user: string
  email: string
  action: string
  details?: string
  timestamp: string
  ip_address: string
}

interface AdminDb {
  medicines: Medicine[]
  resources: EmergencyResource[]
  exercises: WellnessExercise[]
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#3b82f6", "#14b8a6", "#8b5cf6", "#f59e0b", "#f43f5e", "#94a3b8"]

const WEEK_AGO_TIMESTAMP = Date.now() - 7 * 24 * 60 * 60 * 1000

const DB_KEY = "mindEase_admin_db"

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function emptyDb(): AdminDb {
  return { medicines: [], resources: [], exercises: [] }
}

function loadDb(): AdminDb {
  if (typeof window === "undefined") return emptyDb()
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DB_KEY) ?? "null") as AdminDb | null
    if (!parsed) return emptyDb()
    return {
      medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
      resources: Array.isArray(parsed.resources) ? parsed.resources : [],
      exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
    }
  } catch {
    return emptyDb()
  }
}

function saveDb(db: AdminDb) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizeUser(raw: unknown): AdminUser {
  const d = (raw ?? {}) as Record<string, unknown>
  const activeField = d.active as boolean | undefined
  const status = str(d.status, activeField === false ? "inactive" : "active").toLowerCase()
  return {
    id: String(d.id ?? d.user_id ?? newId("u")),
    name: str(d.name, str(d.full_name, "User")),
    email: str(d.email, "user@mindease.ai"),
    role: str(d.role, "user").toLowerCase(),
    status: status.includes("inactive") || status.includes("disabled") || activeField === false ? "inactive" : "active",
    created_at: str(d.created_at, str(d.createdAt, str(d.joined_at))),
    last_active: str(d.last_active, str(d.lastActive)),
  }
}

function normalizeCounselor(raw: unknown): AdminCounselor {
  const d = (raw ?? {}) as Record<string, unknown>
  const status = str(d.status, d.active === false ? "inactive" : "active").toLowerCase()
  return {
    id: String(d.id ?? d.counselor_id ?? newId("c")),
    name: str(d.name, "Counselor"),
    email: str(d.email),
    specialty: str(d.specialty, str(d.specialties, "Mental Health")),
    experience_years: typeof d.experience_years === "number" ? d.experience_years : num(d.experience || d.years_experience || 0) || undefined,
    status: status.includes("inactive") || d.active === false ? "inactive" : "active",
    approved: (d.approved as boolean | undefined) ?? true,
    created_at: str(d.created_at, str(d.joined_at)),
  }
}

function normalizeLog(raw: unknown): AuditLog {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(d.id ?? d.log_id ?? newId("l")),
    user: str(d.user, str(d.user_name, str(d.name, "Unknown"))),
    email: str(d.email),
    action: str(d.action, "unknown"),
    details: str(d.details, str(d.description)),
    timestamp: str(d.timestamp, str(d.created_at)),
    ip_address: str(d.ip_address, str(d.ip, "—")),
  }
}

function todayIso(): string {
  return new Date().toISOString()
}

async function sync(path: string, method: "post" | "put" | "patch" | "delete", body?: unknown) {
  try {
    if (method === "post") await api.post(path, body)
    else if (method === "put") await api.put(path, body)
    else if (method === "patch") await api.patch(path, body)
    else await api.delete(path)
  } catch {
    // Server sync may not be available in this environment — the local
    // admin state remains the source of truth for the current session.
  }
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = React.useState(0)

  React.useEffect(() => {
    let raf = 0
    const start = performance.now()
    const duration = 900
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <span>{display.toLocaleString()}</span>
}

function RoleBadge({ role }: { role: string }) {
  const r = role.toLowerCase()
  const variant =
    r === "admin" ? "purple" : r === "counselor" ? "teal" : r === "user" ? "default" : "secondary"
  return <Badge variant={variant as "purple" | "teal" | "default" | "secondary"}>{role}</Badge>
}

function ActiveBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s.includes("active")) return <Badge variant="success">Active</Badge>
  if (s.includes("pending")) return <Badge variant="warning">Pending</Badge>
  return <Badge variant="secondary">Inactive</Badge>
}

function StatGridItem({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ElementType
  accent: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <Card hoverable className="flex h-full flex-col gap-3 p-4">
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
            <AnimatedNumber value={value} />
          </span>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </Card>
    </motion.div>
  )
}

function Pagination({
  page,
  totalPages,
  onPage,
  total,
}: {
  page: number
  totalPages: number
  onPage: (page: number) => void
  total: number
}) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Showing {total} {total === 1 ? "record" : "records"}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

const chartTooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.3)",
  background: "rgba(255,255,255,0.92)",
  color: "#1e293b",
  backdropFilter: "blur(8px)",
} as const

// ── Overview tab ───────────────────────────────────────────────────────────

function seriesFromSeries(data: unknown): { label: string; value: number }[] {
  return arr(data)
    .map((row) => {
      const d = (row ?? {}) as Record<string, unknown>
      const date = str(d.date, str(d.day, str(d.created_at, ""))).slice(0, 10)
      const value = num(d.count ?? d.total ?? d.users ?? d.mood_logs ?? d.conversations ?? d.value)
      return { date, value }
    })
    .filter((item) => item.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item, i) => ({ label: prettyDate(item.date, i), value: item.value }))
}

function prettyDate(dateStr: string, index: number): string {
  try {
    return formatDate(dateStr, { month: "short", day: "numeric" })
  } catch {
    return index === 0 ? "Start" : ""
  }
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
          This area is restricted to MindEase administrators. Please return to your dashboard.
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

// ── Dashboard page ─────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "users", label: "Users", icon: Users },
  { value: "counselors", label: "Counselors", icon: UserCheck },
  { value: "medicines", label: "Medicines", icon: Pill },
  { value: "resources", label: "Emergency Resources", icon: LifeBuoy },
  { value: "wellness", label: "Wellness", icon: Dumbbell },
  { value: "audit", label: "Audit Logs", icon: FileClock },
] as const

type Section = (typeof NAV_SECTIONS)[number]["value"]

export default function AdminDashboardPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const [section, setSection] = React.useState<Section>("overview")

  const [analytics, setAnalytics] = React.useState<Record<string, unknown> | null>(null)
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [counselors, setCounselors] = React.useState<AdminCounselor[]>([])
  const [logs, setLogs] = React.useState<AuditLog[]>([])
  const [db, setDb] = React.useState<AdminDb>(() => loadDb())

  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState(false)
  const [reloadKey, setReloadKey] = React.useState(0)

  const role = (user?.role ?? "").toLowerCase()
  const isAdmin = role === "admin"

  React.useEffect(() => {
    if (!user) router.replace("/login")
  }, [user, router])

  React.useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setLoadError(false)
      const [usersRes, analyticsRes, logsRes, counselorsRes] = await Promise.allSettled([
        api.admin.getUsers(),
        api.admin.getAnalytics(),
        api.admin.getAuditLogs(),
        api.counselors.getAll(),
      ])
      if (!active) return
      if (usersRes.status === "fulfilled") {
        setUsers(arr(usersRes.value).map(normalizeUser))
      } else {
        setLoadError(true)
      }
      if (analyticsRes.status === "fulfilled") {
        const a = (analyticsRes.value ?? {}) as Record<string, unknown>
        setAnalytics(a)

        const meds = arr(a.medicines ?? a.medicine_list)
        const res = arr(a.emergency_resources ?? a.resources)
        const exs = arr(a.exercises ?? a.wellness_exercises)
        setDb((prev) => ({
          medicines: meds.length > 0 ? meds.map((m) => normalizeMedicine(m, prev.medicines)) : prev.medicines,
          resources: res.length > 0 ? res.map((r) => normalizeResource(r, prev.resources)) : prev.resources,
          exercises: exs.length > 0 ? exs.map((e) => normalizeExercise(e, prev.exercises)) : prev.exercises,
        }))
      }
      if (logsRes.status === "fulfilled") setLogs(arr(logsRes.value).map(normalizeLog))
      if (counselorsRes.status === "fulfilled") {
        setCounselors(arr(counselorsRes.value).map(normalizeCounselor))
      }
      setLoading(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [reloadKey])

  React.useEffect(() => {
    saveDb(db)
  }, [db])

  const logAction = (action: string, details?: string) => {
    const entry: AuditLog = {
      id: newId("l"),
      user: user?.name || user?.email || "admin",
      email: user?.email || "admin@mindease.ai",
      action,
      details,
      timestamp: todayIso(),
      ip_address: "127.0.0.1",
    }
    setLogs((prev) => [entry, ...prev])
  }

  // ── Users ──
  const handleRoleChange = (id: string, newRole: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)))
    const target = users.find((u) => u.id === id)
    toast.success("Role updated", `${target?.name ?? "User"} is now ${newRole}.`)
    logAction(`Changed ${target?.name ?? "a user"}'s role`, `→ ${newRole}`)
    void sync(`/admin/users/${id}`, "patch", { role: newRole })
  }

  const handleDeactivate = (id: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: "inactive" } : u)))
    const target = users.find((u) => u.id === id)
    toast.info("User deactivated", `${target?.name ?? "User"} no longer has access.`)
    logAction("Deactivated user", target?.email)
    void sync(`/admin/users/${id}`, "patch", { active: false })
  }

  // ── Counselors ──
  const handleAddCounselor = (data: { name: string; email: string; specialty: string; experience_years: number }) => {
    const entry: AdminCounselor = {
      id: newId("c"),
      name: data.name,
      email: data.email,
      specialty: data.specialty,
      experience_years: data.experience_years,
      status: "pending",
      approved: false,
      created_at: todayIso(),
    }
    setCounselors((prev) => [entry, ...prev])
    toast.success("Counselor added", `${data.name} has been invited for review.`)
    logAction("Added counselor", data.email)
    void sync("/admin/counselors", "post", data)
  }

  const handleToggleCounselor = (id: string, field: "approved" | "status") => {
    const target = counselors.find((c) => c.id === id)
    if (!target) return
    if (field === "approved") {
      const next = !target.approved
      setCounselors((prev) => prev.map((c) => (c.id === id ? { ...c, approved: next } : c)))
      toast.success(next ? "Counselor approved" : "Approval withdrawn", target.name)
      logAction(next ? "Approved counselor" : "Withdrew approval", target.email)
      void sync(`/admin/counselors/${id}`, "patch", { approved: next })
    } else {
      const next = target.status === "active" ? "inactive" : "active"
      setCounselors((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: next } : c))
      )
      toast.success(next === "active" ? "Counselor activated" : "Counselor deactivated", target.name)
      logAction(next === "active" ? "Activated counselor" : "Deactivated counselor", target.email)
      void sync(`/admin/counselors/${id}`, "patch", { active: next === "active" })
    }
  }

  // ── Medicines ──
  const handleAddMedicine = (data: Omit<Medicine, "id" | "created_at">) => {
    const entry: Medicine = { ...data, id: newId("m"), created_at: todayIso() }
    setDb((prev) => ({ ...prev, medicines: [entry, ...prev.medicines] }))
    toast.success("Medicine added", data.name)
    logAction("Added medicine", data.name)
    void sync("/admin/medicines", "post", data)
  }

  const handleUpdateMedicine = (id: string, data: Omit<Medicine, "id" | "created_at">) => {
    setDb((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m) => (m.id === id ? { ...m, ...data } : m)),
    }))
    toast.success("Medicine updated", data.name)
    logAction("Updated medicine", data.name)
    void sync(`/admin/medicines/${id}`, "put", data)
  }

  const handleDeleteMedicine = (id: string) => {
    const target = db.medicines.find((m) => m.id === id)
    setDb((prev) => ({ ...prev, medicines: prev.medicines.filter((m) => m.id !== id) }))
    toast.success("Medicine deleted", target?.name ?? "Entry removed")
    logAction("Deleted medicine", target?.name)
    void sync(`/admin/medicines/${id}`, "delete")
  }

  // ── Resources ──
  const handleAddResource = (data: Omit<EmergencyResource, "id">) => {
    const entry: EmergencyResource = { ...data, id: newId("r") }
    setDb((prev) => ({ ...prev, resources: [entry, ...prev.resources] }))
    toast.success("Resource added", data.name)
    logAction("Added emergency resource", data.name)
    void sync("/admin/emergency-resources", "post", data)
  }

  const handleUpdateResource = (id: string, data: Omit<EmergencyResource, "id">) => {
    setDb((prev) => ({
      ...prev,
      resources: prev.resources.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }))
    toast.success("Resource updated", data.name)
    logAction("Updated emergency resource", data.name)
    void sync(`/admin/emergency-resources/${id}`, "put", data)
  }

  const handleDeleteResource = (id: string) => {
    const target = db.resources.find((r) => r.id === id)
    setDb((prev) => ({ ...prev, resources: prev.resources.filter((r) => r.id !== id) }))
    toast.success("Resource deleted", target?.name ?? "Entry removed")
    logAction("Deleted emergency resource", target?.name)
    void sync(`/admin/emergency-resources/${id}`, "delete")
  }

  // ── Wellness ──
  const handleAddExercise = (data: Omit<WellnessExercise, "id" | "created_at">) => {
    const entry: WellnessExercise = { ...data, id: newId("w"), created_at: todayIso() }
    setDb((prev) => ({ ...prev, exercises: [entry, ...prev.exercises] }))
    toast.success("Exercise added", data.title)
    logAction("Added wellness exercise", data.title)
    void sync("/admin/wellness/exercises", "post", data)
  }

  const handleUpdateExercise = (id: string, data: Omit<WellnessExercise, "id" | "created_at">) => {
    setDb((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e) => (e.id === id ? { ...e, ...data } : e)),
    }))
    toast.success("Exercise updated", data.title)
    logAction("Updated wellness exercise", data.title)
    void sync(`/admin/wellness/exercises/${id}`, "put", data)
  }

  const handleToggleExercise = (id: string) => {
    const target = db.exercises.find((e) => e.id === id)
    if (!target) return
    const next = !target.active
    setDb((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e) => (e.id === id ? { ...e, active: next } : e)),
    }))
    toast.success(next ? "Exercise activated" : "Exercise deactivated", target.title)
    logAction(next ? "Activated exercise" : "Deactivated exercise", target.title)
    void sync(`/admin/wellness/exercises/${id}`, "patch", { active: next })
  }

  if (!user) return null
  if (!isAdmin) return <AccessDenied />

  const analyticsData = analytics ?? {}

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Oversee users, care providers, medicines, resources, and platform safety"
        action={
          <div className="flex items-center gap-2">
            <Badge variant="purple">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => setReloadKey((k) => k + 1)}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        {/* Nav */}
        <aside>
          <nav className="flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {NAV_SECTIONS.map((item) => {
              const Icon = item.icon
              const activeSection = section === item.value
              return (
                <button
                  key={item.value}
                  onClick={() => setSection(item.value)}
                  className={cn(
                    "relative flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200",
                    activeSection
                      ? "text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  )}
                >
                  {activeSection && (
                    <motion.span
                      layoutId="admin-nav-active"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 shadow-lg shadow-blue-500/30"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      "relative z-10 h-4 w-4 shrink-0",
                      activeSection ? "text-white" : "text-slate-400 dark:text-slate-500"
                    )}
                  />
                  <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-72 rounded-2xl" />
              <Skeleton className="h-72 rounded-2xl" />
            </div>
          ) : loadError && users.length === 0 ? (
            <EmptyState
              icon={<RefreshCw className="h-7 w-7" />}
              title="Couldn't load admin data"
              description="We couldn't reach the admin service. Please check your connection and try again."
              action={
                <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
              }
            />
          ) : (
            <>
              {section === "overview" && (
                <OverviewTab analytics={analyticsData} users={users} onRefresh={() => setReloadKey((k) => k + 1)} />
              )}
              {section === "users" && (
                <UsersTab users={users} onRoleChange={handleRoleChange} onDeactivate={handleDeactivate} onRefresh={() => setReloadKey((k) => k + 1)} />
              )}
              {section === "counselors" && (
                <CounselorsTab
                  counselors={counselors}
                  onAdd={handleAddCounselor}
                  onToggle={handleToggleCounselor}
                  onRefresh={() => setReloadKey((k) => k + 1)}
                />
              )}
              {section === "medicines" && (
                <MedicinesTab medicines={db.medicines} onAdd={handleAddMedicine} onUpdate={handleUpdateMedicine} onDelete={handleDeleteMedicine} />
              )}
              {section === "resources" && (
                <ResourcesTab resources={db.resources} onAdd={handleAddResource} onUpdate={handleUpdateResource} onDelete={handleDeleteResource} />
              )}
              {section === "wellness" && (
                <WellnessTab exercises={db.exercises} onAdd={handleAddExercise} onUpdate={handleUpdateExercise} onToggle={handleToggleExercise} />
              )}
              {section === "audit" && (
                <AuditLogsTab logs={logs} onRefresh={() => setReloadKey((k) => k + 1)} />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  Normalizers used when seeding medicines/resources/exercises from analytics
// ════════════════════════════════════════════════════════════════════════════

function normalizeMedicine(raw: unknown, existing: Medicine[]): Medicine {
  const d = (raw ?? {}) as Record<string, unknown>
  const id = String(d.id ?? d.medicine_id ?? newId("m"))
  const match = existing.find((m) => m.id === id)
  if (match) return match
  return {
    id,
    name: str(d.name, str(d.generic_name, "Medicine")),
    category: str(d.category, str(d.type, "General")),
    description: str(d.description),
    uses: str(d.uses, str(d.indications)),
    dosage: str(d.dosage, str(d.dose)),
    side_effects: str(d.side_effects),
    created_at: str(d.created_at, str(d.createdAt, todayIso())),
  }
}

function normalizeResource(raw: unknown, existing: EmergencyResource[]): EmergencyResource {
  const d = (raw ?? {}) as Record<string, unknown>
  const id = String(d.id ?? d.resource_id ?? newId("r"))
  const match = existing.find((r) => r.id === id)
  if (match) return match
  return {
    id,
    name: str(d.name, str(d.organization, "Resource")),
    country: str(d.country, "Global"),
    phone: str(d.phone, str(d.phone_number)),
    website: str(d.website, str(d.url)),
    availability: str(d.availability, str(d.availability_hours)),
    description: str(d.description),
    last_verified: str(d.last_verified, str(d.last_verified_at, todayIso())),
  }
}

function normalizeExercise(raw: unknown, existing: WellnessExercise[]): WellnessExercise {
  const d = (raw ?? {}) as Record<string, unknown>
  const id = String(d.id ?? d.exercise_id ?? newId("w"))
  const match = existing.find((e) => e.id === id)
  if (match) return match
  return {
    id,
    title: str(d.title, str(d.name, "Exercise")),
    description: str(d.description),
    category: str(d.category, "Breathing"),
    duration_seconds: typeof d.duration_seconds === "number" ? d.duration_seconds : undefined,
    steps: Array.isArray(d.steps) ? d.steps.map(String) : [],
    active: (d.active as boolean | undefined) ?? true,
    created_at: str(d.created_at, str(d.createdAt, todayIso())),
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  Overview
// ════════════════════════════════════════════════════════════════════════════

function OverviewTab({
  analytics,
  users,
  onRefresh,
}: {
  analytics: Record<string, unknown>
  users: AdminUser[]
  onRefresh: () => void
}) {
  const activeUsers = users.filter((u) => {
    if (u.status !== "active") return false
    const last = u.last_active ? new Date(u.last_active).getTime() : undefined
    return last ? last >= WEEK_AGO_TIMESTAMP : true
  })

  const stats: { label: string; value: number; icon: React.ElementType; accent: string }[] = [
    {
      label: "Total Users",
      value: num(analytics.total_users) || users.length,
      icon: Users,
      accent: "from-blue-500 to-sky-400",
    },
    {
      label: "Active Users (Week)",
      value: activeUsers.length,
      icon: Activity,
      accent: "from-emerald-500 to-teal-400",
    },
    {
      label: "Total Conversations",
      value: num(analytics.total_conversations),
      icon: MessageCircle,
      accent: "from-purple-500 to-violet-400",
    },
    {
      label: "Mood Check-ins",
      value: num(analytics.total_mood_checkins ?? analytics.mood_checkins ?? analytics.total_mood_logs),
      icon: Heart,
      accent: "from-rose-500 to-pink-400",
    },
    {
      label: "Journal Entries",
      value: num(analytics.total_journals ?? analytics.journal_entries),
      icon: BookOpen,
      accent: "from-amber-500 to-orange-400",
    },
    {
      label: "Wellness Sessions",
      value: num(analytics.total_wellness_sessions ?? analytics.wellness_sessions),
      icon: Dumbbell,
      accent: "from-cyan-500 to-sky-400",
    },
    {
      label: "Crisis Events",
      value: num(analytics.total_crisis_events ?? analytics.crisis_events),
      icon: AlertTriangle,
      accent: "from-red-500 to-rose-400",
    },
    {
      label: "Medicine Searches",
      value: num(analytics.total_medicine_searches ?? analytics.medicine_searches),
      icon: Pill,
      accent: "from-slate-500 to-slate-400",
    },
  ]

  // Users over time
  const usersSeries = React.useMemo(() => {
    if (Array.isArray(analytics.users_over_time) && analytics.users_over_time.length > 0) {
      return seriesFromSeries(analytics.users_over_time)
    }
    const buckets = new Map<string, number>()
    users.forEach((u) => {
      const day = (u.created_at ?? "").slice(0, 10)
      if (day) buckets.set(day, (buckets.get(day) ?? 0) + 1)
    })
    const dates = Array.from(buckets.keys()).sort()
    if (dates.length === 0) {
      const last14: { label: string; value: number }[] = []
      for (let i = 13; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        last14.push({
          label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: 0,
        })
      }
      return last14
    }
    let running = 0
    return dates.map((day) => {
      running += buckets.get(day) ?? 0
      return { label: prettyDate(day, 0), value: running }
    })
  }, [analytics, users])

  const moodSeries = React.useMemo(() => {
    const raw = analytics.mood_logs ?? analytics.mood_checkins_per_day ?? analytics.mood
    if (Array.isArray(raw) && raw.length > 0) return seriesFromSeries(raw)
    return []
  }, [analytics])

  const conversationSeries = React.useMemo(() => {
    const raw = analytics.conversations ?? analytics.conversations_over_time
    if (Array.isArray(raw) && raw.length > 0) return seriesFromSeries(raw)
    return []
  }, [analytics])

  // Role distribution pie
  const roleData = React.useMemo(() => {
    const counts = new Map<string, number>()
    users.forEach((u) => counts.set(u.role || "user", (counts.get(u.role || "user") ?? 0) + 1))
    if (counts.size === 0) return []
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))
  }, [users])

  const hasZeroSeries = (series: { value: number }[]) =>
    series.length > 0 && series.every((d) => d.value === 0)

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatGridItem key={stat.label} {...stat} />
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Users over time
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cumulative registered users across the platform
            </p>
          </div>
          {hasZeroSeries(usersSeries) ? (
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title="No user growth data yet"
              description="As people sign up, their growth over time will appear here."
              action={
                <Button size="sm" variant="outline" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              }
            />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usersSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} name="Users" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
              <Heart className="h-4 w-4 text-rose-500" />
              Mood check-ins per day
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily mood logs recorded by users
            </p>
          </div>
          {moodSeries.length === 0 ? (
            <EmptyState
              icon={<Heart className="h-7 w-7" />}
              title="No mood data yet"
              description="Daily mood check-ins will appear here once users begin logging."
              action={
                <Button size="sm" variant="outline" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              }
            />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
                  <Bar dataKey="value" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Check-ins" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
              <MessageCircle className="h-4 w-4 text-purple-500" />
              Conversation volume
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Number of AI conversations started over time
            </p>
          </div>
          {conversationSeries.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-7 w-7" />}
              title="No conversation data yet"
              description="Conversation volume will appear here as users chat with MindEase AI."
              action={
                <Button size="sm" variant="outline" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              }
            />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversationSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} name="Conversations" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
              <Users className="h-4 w-4 text-teal-500" />
              Users by role
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution of accounts by role
            </p>
          </div>
          {roleData.length === 0 ? (
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title="No users yet"
              description="Role distribution will appear once accounts exist."
            />
          ) : (
            <>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={66}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {roleData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5">
                {roleData.map((item, i) => (
                  <li key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 capitalize text-slate-500 dark:text-slate-400">
                      <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {item.name}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{item.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  Users
// ════════════════════════════════════════════════════════════════════════════

const PAGE_SIZE = 8

function UsersTab({
  users,
  onRoleChange,
  onDeactivate,
  onRefresh,
}: {
  users: AdminUser[]
  onRoleChange: (id: string, role: string) => void
  onDeactivate: (id: string) => void
  onRefresh: () => void
}) {
  const [query, setQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false
      if (!q) return true
      return `${u.name} ${u.email}`.toLowerCase().includes(q)
    })
  }, [users, query, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              All users
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filtered.length} {filtered.length === 1 ? "user" : "users"} shown
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              icon={<Search className="h-4 w-4" />}
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:w-60"
            />
            <Select
              options={[
                { value: "all", label: "All roles" },
                { value: "user", label: "User" },
                { value: "counselor", label: "Counselor" },
                { value: "admin", label: "Admin" },
              ]}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="Role"
              className="sm:w-40"
            />
            <Button variant="outline" size="icon" onClick={onRefresh} title="Refresh users">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="No users found"
            description={query ? "Try a different search term." : "No users have signed up yet."}
            action={
              query ? (
                <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="px-3 py-2.5 font-medium">User</th>
                  <th className="px-3 py-2.5 font-medium">Email</th>
                  <th className="px-3 py-2.5 font-medium">Role</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Created</th>
                  <th className="px-3 py-2.5 font-medium">Last active</th>
                  <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pageRows.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} size="sm" />
                        <span className="font-medium text-slate-800 dark:text-slate-100">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="px-3 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-3 py-3">
                      <ActiveBadge status={u.status} />
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                      {u.created_at ? formatDate(u.created_at, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                      {u.last_active ? formatDate(u.last_active, { month: "short", day: "numeric" }) : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Select
                          options={[
                            { value: "user", label: "User" },
                            { value: "counselor", label: "Counselor" },
                            { value: "admin", label: "Admin" },
                          ]}
                          value={u.role}
                          onChange={(role) => onRoleChange(u.id, role)}
                          placeholder="Role"
                          className="w-32"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={u.status === "inactive"}
                          onClick={() => onDeactivate(u.id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                        >
                          <Ban className="h-4 w-4" />
                          Deactivate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={safePage} totalPages={totalPages} onPage={setPage} total={filtered.length} />
      </CardContent>
    </Card>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  Counselors
// ════════════════════════════════════════════════════════════════════════════

const COUNSELOR_SPECIALTIES = [
  "Anxiety",
  "Depression",
  "Trauma",
  "Relationships",
  "Stress",
  "Grief",
  "Addiction",
  "LGBTQ+",
  "Sleep",
  "General Mental Health",
]

function CounselorsTab({
  counselors,
  onAdd,
  onToggle,
  onRefresh,
}: {
  counselors: AdminCounselor[]
  onAdd: (data: { name: string; email: string; specialty: string; experience_years: number }) => void
  onToggle: (id: string, field: "approved" | "status") => void
  onRefresh: () => void
}) {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [specialty, setSpecialty] = React.useState("General Mental Health")
  const [experience, setExperience] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const resetForm = () => {
    setName("")
    setEmail("")
    setSpecialty("General Mental Health")
    setExperience("")
  }

  const submit = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Missing details", "Name and email are required to add a counselor.")
      return
    }
    setSubmitting(true)
    try {
      onAdd({
        name: name.trim(),
        email: email.trim(),
        specialty,
        experience_years: Number(experience) || 0,
      })
      setModalOpen(false)
      resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Counselor directory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {counselors.length} counselor{counselors.length === 1 ? "" : "s"} on the platform
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={onRefresh} title="Refresh counselors">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Add counselor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {counselors.length === 0 ? (
        <EmptyState
          icon={<UserCheck className="h-7 w-7" />}
          title="No counselors yet"
          description="Add your first counselor to start matching users with professional support."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add counselor
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {counselors.map((counselor) => (
            <motion.div
              key={counselor.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <Card hoverable className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <Avatar name={counselor.name} size="lg" />
                  <div className="flex flex-col items-end gap-1.5">
                    <ActiveBadge status={counselor.status} />
                    {counselor.approved ? (
                      <Badge variant="success">
                        <BadgeCheck className="h-3 w-3" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <Clock className="h-3 w-3" />
                        Pending review
                      </Badge>
                    )}
                  </div>
                </div>

                <h3 className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-100">
                  {counselor.name}
                </h3>
                <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Mail className="h-3.5 w-3.5" />
                  {counselor.email || "—"}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="default">{counselor.specialty}</Badge>
                  {counselor.experience_years !== undefined && (
                    <Badge variant="outline">
                      <Briefcase className="h-3 w-3" />
                      {counselor.experience_years} yrs
                    </Badge>
                  )}
                </div>

                {counselor.created_at && (
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                    Joined {formatDate(counselor.created_at, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}

                <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <Switch
                    label="Approved"
                    description="Can appear in the user directory"
                    checked={counselor.approved}
                    onCheckedChange={() => onToggle(counselor.id, "approved")}
                  />
                  <Switch
                    label="Active"
                    description="Can accept requests and hold sessions"
                    checked={counselor.status === "active"}
                    onCheckedChange={() => onToggle(counselor.id, "status")}
                  />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add a counselor"
        description="Invite a mental health professional to the platform"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} disabled={submitting}>
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {submitting ? "Adding..." : "Add counselor"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full name" placeholder="Dr. Jane Smith" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" placeholder="jane@clinic.example" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Select
            label="Specialty"
            options={COUNSELOR_SPECIALTIES.map((s) => ({ value: s, label: s }))}
            value={specialty}
            onChange={setSpecialty}
          />
          <Input
            label="Years of experience"
            type="number"
            min={0}
            placeholder="e.g. 5"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  Medicines
// ════════════════════════════════════════════════════════════════════════════

function MedicinesTab({
  medicines,
  onAdd,
  onUpdate,
  onDelete,
}: {
  medicines: Medicine[]
  onAdd: (data: Omit<Medicine, "id" | "created_at">) => void
  onUpdate: (id: string, data: Omit<Medicine, "id" | "created_at">) => void
  onDelete: (id: string) => void
}) {
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Medicine | null>(null)

  const emptyForm: Omit<Medicine, "id" | "created_at"> = {
    name: "",
    category: "",
    description: "",
    uses: "",
    dosage: "",
    side_effects: "",
  }
  const [form, setForm] = React.useState(emptyForm)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return medicines
    return medicines.filter((m) => `${m.name} ${m.category} ${m.uses} ${m.description}`.toLowerCase().includes(q))
  }, [medicines, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (medicine: Medicine) => {
    setEditing(medicine)
    setForm({
      name: medicine.name,
      category: medicine.category,
      description: medicine.description,
      uses: medicine.uses,
      dosage: medicine.dosage,
      side_effects: medicine.side_effects,
    })
    setModalOpen(true)
  }

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Name required", "Please enter the medicine name.")
      return
    }
    const payload = { ...form, name: form.name.trim(), category: form.category.trim() || "General" }
    if (editing) onUpdate(editing.id, payload)
    else onAdd(payload)
    setModalOpen(false)
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Medicine database
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {medicines.length} {medicines.length === 1 ? "entry" : "entries"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              icon={<Search className="h-4 w-4" />}
              placeholder="Search medicines..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:w-64"
            />
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add medicine
            </Button>
          </div>
        </div>

        {medicines.length === 0 ? (
          <EmptyState
            icon={<Pill className="h-7 w-7" />}
            title="No medicines yet"
            description="Add medication information so users can look it up safely."
            action={
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" />
                Add medicine
              </Button>
            }
          />
        ) : pageRows.length === 0 ? (
          <EmptyState
            icon={<Pill className="h-7 w-7" />}
            title="No medicines match"
            description="Try a different search term."
            action={
              <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="px-3 py-2.5 font-medium">Name</th>
                  <th className="px-3 py-2.5 font-medium">Category</th>
                  <th className="px-3 py-2.5 font-medium">Uses</th>
                  <th className="px-3 py-2.5 font-medium">Added</th>
                  <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pageRows.map((medicine) => (
                  <tr key={medicine.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                          <Pill className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-100">{medicine.name}</p>
                          {medicine.description && (
                            <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                              {truncate(medicine.description, 48)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="default">{medicine.category || "General"}</Badge>
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-slate-500 dark:text-slate-400">
                      {medicine.uses || "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                      {formatDate(medicine.created_at, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => openEdit(medicine)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(medicine.id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={safePage} totalPages={totalPages} onPage={setPage} total={filtered.length} />

        {modalOpen && (
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title={editing ? "Edit medicine" : "Add medicine"}
            description={editing ? `Update details for ${editing.name}` : "Add medication information for the lookup database"}
            footer={
              <>
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submit}>
                  <Check className="h-4 w-4" />
                  {editing ? "Save changes" : "Add medicine"}
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Name" placeholder="e.g. Sertraline" value={form.name} onChange={set("name")} />
                <Input label="Category" placeholder="e.g. Antidepressant" value={form.category} onChange={set("category")} />
              </div>
              <Input label="Uses" placeholder="Treats depression, anxiety..." value={form.uses} onChange={set("uses")} />
              <Textarea label="Description" placeholder="Overview of the medicine..." value={form.description} onChange={set("description")} />
              <Input label="Dosage" placeholder="e.g. 50mg once daily" value={form.dosage} onChange={set("dosage")} />
              <Textarea label="Side effects" placeholder="Nausea, dizziness..." value={form.side_effects} onChange={set("side_effects")} />
            </div>
          </Modal>
        )}
      </CardContent>
    </Card>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  Emergency resources
// ════════════════════════════════════════════════════════════════════════════

function ResourcesTab({
  resources,
  onAdd,
  onUpdate,
  onDelete,
}: {
  resources: EmergencyResource[]
  onAdd: (data: Omit<EmergencyResource, "id">) => void
  onUpdate: (id: string, data: Omit<EmergencyResource, "id">) => void
  onDelete: (id: string) => void
}) {
  const [query, setQuery] = React.useState("")
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<EmergencyResource | null>(null)

  const emptyForm: Omit<EmergencyResource, "id"> = {
    name: "",
    country: "Global",
    phone: "",
    website: "",
    availability: "",
    description: "",
    last_verified: todayIso().slice(0, 10),
  }
  const [form, setForm] = React.useState(emptyForm)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return resources
    return resources.filter((r) =>
      `${r.name} ${r.country} ${r.phone} ${r.description}`.toLowerCase().includes(q)
    )
  }, [resources, query])

  const grouped = React.useMemo(() => {
    const map = new Map<string, EmergencyResource[]>()
    filtered.forEach((r) => {
      const country = r.country || "Global"
      const list = map.get(country) ?? []
      list.push(r)
      map.set(country, list)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (resource: EmergencyResource) => {
    setEditing(resource)
    setForm({
      name: resource.name,
      country: resource.country,
      phone: resource.phone,
      website: resource.website,
      availability: resource.availability,
      description: resource.description,
      last_verified: resource.last_verified.slice(0, 10),
    })
    setModalOpen(true)
  }

  const submit = () => {
    if (!form.name.trim() || !form.country.trim()) {
      toast.error("Missing details", "Name and country are required.")
      return
    }
    const payload = {
      ...form,
      name: form.name.trim(),
      country: form.country.trim(),
      last_verified: form.last_verified || todayIso(),
    }
    if (editing) onUpdate(editing.id, payload)
    else onAdd(payload)
    setModalOpen(false)
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Emergency resources
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Helplines and support services grouped by country
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                icon={<Search className="h-4 w-4" />}
                placeholder="Search resources..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="sm:w-64"
              />
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" />
                Add resource
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {resources.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy className="h-7 w-7" />}
          title="No resources yet"
          description="Add emergency helplines and support services so users can reach help quickly."
          action={
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add resource
            </Button>
          }
        />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={<Globe className="h-7 w-7" />}
          title="No resources match"
          description="Try a different search term."
          action={
            <Button variant="outline" size="sm" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([country, list]) => (
            <section key={country}>
              <div className="mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{country}</h4>
                <Badge variant="secondary">{list.length}</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((resource) => (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  >
                    <Card hoverable className="flex h-full flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/15 to-rose-400/15 text-red-500 dark:text-red-400">
                          <LifeBuoy className="h-5 w-5" />
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => openEdit(resource)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(resource.id)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <h4 className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-100">
                        {resource.name}
                      </h4>

                      <div className="mt-2 space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                        {resource.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {resource.phone}
                          </p>
                        )}
                        {resource.availability && (
                          <p className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {resource.availability}
                          </p>
                        )}
                        {resource.website && (
                          <p className="flex items-center gap-2 truncate">
                            <Globe className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{resource.website.replace(/^https?:\/\//, "")}</span>
                          </p>
                        )}
                      </div>

                      {resource.description && (
                        <p className="mt-2 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                          {truncate(resource.description, 120)}
                        </p>
                      )}

                      <div className="mt-auto pt-3">
                        <p className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                          <CalendarDays className="h-3 w-3" />
                          Last verified {resource.last_verified ? formatDate(resource.last_verified, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit resource" : "Add resource"}
        description={editing ? `Update details for ${editing.name}` : "Add a helpline or support service for users"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>
              <Check className="h-4 w-4" />
              {editing ? "Save changes" : "Add resource"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Organization name" placeholder="e.g. Crisis Support Line" value={form.name} onChange={set("name")} />
          <Input label="Country" placeholder="e.g. United States" value={form.country} onChange={set("country")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone" placeholder="+1 800 555 0199" value={form.phone} onChange={set("phone")} />
            <Input label="Website" placeholder="https://example.org" value={form.website} onChange={set("website")} />
          </div>
          <Input label="Availability" placeholder="e.g. 24/7" value={form.availability} onChange={set("availability")} />
          <Input label="Last verified" type="date" value={form.last_verified} onChange={set("last_verified")} />
          <Textarea label="Description" placeholder="What this service offers..." value={form.description} onChange={set("description")} />
        </div>
      </Modal>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  Wellness
// ════════════════════════════════════════════════════════════════════════════

const EXERCISE_CATEGORIES = ["Breathing", "Grounding", "Meditation", "Mindfulness", "Body Scan", "Visualization"]

function WellnessTab({
  exercises,
  onAdd,
  onUpdate,
  onToggle,
}: {
  exercises: WellnessExercise[]
  onAdd: (data: Omit<WellnessExercise, "id" | "created_at">) => void
  onUpdate: (id: string, data: Omit<WellnessExercise, "id" | "created_at">) => void
  onToggle: (id: string) => void
}) {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<WellnessExercise | null>(null)

  const emptyForm: Omit<WellnessExercise, "id" | "created_at"> = {
    title: "",
    description: "",
    category: "Breathing",
    duration_seconds: undefined,
    steps: [],
    active: true,
  }
  const [form, setForm] = React.useState(emptyForm)
  const [stepsText, setStepsText] = React.useState("")

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setStepsText("")
    setModalOpen(true)
  }

  const openEdit = (exercise: WellnessExercise) => {
    setEditing(exercise)
    setForm({
      title: exercise.title,
      description: exercise.description,
      category: exercise.category,
      duration_seconds: exercise.duration_seconds,
      steps: exercise.steps,
      active: exercise.active,
    })
    setStepsText(exercise.steps.join("\n"))
    setModalOpen(true)
  }

  const submit = () => {
    if (!form.title.trim()) {
      toast.error("Title required", "Please enter an exercise title.")
      return
    }
    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      steps: stepsText.split("\n").map((s) => s.trim()).filter(Boolean),
    }
    if (editing) onUpdate(editing.id, payload)
    else onAdd(payload)
    setModalOpen(false)
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Wellness exercises
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"} ·{" "}
                {exercises.filter((e) => e.active).length} active
              </p>
            </div>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add exercise
            </Button>
          </div>
        </CardContent>
      </Card>

      {exercises.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="h-7 w-7" />}
          title="No exercises yet"
          description="Add breathing, grounding, and mindfulness exercises for users."
          action={
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add exercise
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {exercises.map((exercise) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <Card
                hoverable
                className={cn(
                  "flex h-full flex-col p-5",
                  !exercise.active && "opacity-70"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg",
                      exercise.active ? "bg-gradient-to-br from-purple-500 to-violet-400" : "bg-slate-400"
                    )}
                  >
                    <Dumbbell className="h-5 w-5" />
                  </div>
                  {exercise.active ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>

                <h4 className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-100">
                  {exercise.title}
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {exercise.category}
                  {exercise.duration_seconds
                    ? ` · ${Math.round(exercise.duration_seconds / 60)} min`
                    : ""}
                </p>
                {exercise.description && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {truncate(exercise.description, 110)}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <Switch
                    label="Active"
                    checked={exercise.active}
                    onCheckedChange={() => onToggle(exercise.id)}
                  />
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => openEdit(exercise)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit exercise" : "Add exercise"}
        description={editing ? `Update ${editing.title}` : "Create a guided wellness exercise for users"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>
              <Check className="h-4 w-4" />
              {editing ? "Save changes" : "Add exercise"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Title" placeholder="e.g. Box Breathing" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          <Select
            label="Category"
            options={EXERCISE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            value={form.category}
            onChange={(category) => setForm((prev) => ({ ...prev, category }))}
          />
          <Textarea label="Description" placeholder="What does this exercise do?" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          <Input
            label="Duration (seconds)"
            type="number"
            min={0}
            placeholder="e.g. 300"
            value={form.duration_seconds ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, duration_seconds: e.target.value ? Number(e.target.value) : undefined }))}
          />
          <Textarea
            label="Steps (one per line)"
            placeholder={"Breathe in for 4 seconds\nHold for 4 seconds\nBreathe out for 4 seconds"}
            value={stepsText}
            onChange={(e) => setStepsText(e.target.value)}
            className="min-h-28"
          />
        </div>
      </Modal>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  Audit logs
// ════════════════════════════════════════════════════════════════════════════

const AUDIT_ACTION_FILTERS = ["all", "user", "counselor", "medicine", "resource", "exercise", "role", "deleted", "added", "updated", "approved", "activated"]

function AuditLogsTab({ logs, onRefresh }: { logs: AuditLog[]; onRefresh: () => void }) {
  const [actionFilter, setActionFilter] = React.useState("all")
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return logs.filter((log) => {
      if (actionFilter !== "all" && !log.action.toLowerCase().includes(actionFilter)) return false
      if (!q) return true
      return `${log.user} ${log.email} ${log.action} ${log.details ?? ""}`.toLowerCase().includes(q)
    })
  }, [logs, actionFilter, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Audit trail
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every administrative action is recorded for accountability
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              icon={<Search className="h-4 w-4" />}
              placeholder="Search logs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:w-56"
            />
            <Select
              options={AUDIT_ACTION_FILTERS.map((a) => ({ value: a, label: a === "all" ? "All actions" : a }))}
              value={actionFilter}
              onChange={setActionFilter}
              placeholder="Action type"
              className="sm:w-44"
            />
            <Button variant="outline" size="icon" onClick={onRefresh} title="Refresh logs">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {logs.length === 0 ? (
          <EmptyState
            icon={<FileClock className="h-7 w-7" />}
            title="No audit logs yet"
            description="Administrative actions will be recorded here automatically."
          />
        ) : pageRows.length === 0 ? (
          <EmptyState
            icon={<FileClock className="h-7 w-7" />}
            title="No matching logs"
            description="Try a different action type or search term."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="px-3 py-2.5 font-medium">User</th>
                  <th className="px-3 py-2.5 font-medium">Action</th>
                  <th className="px-3 py-2.5 font-medium">Details</th>
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">IP address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pageRows.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={log.user} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800 dark:text-slate-100">{log.user}</p>
                          <p className="truncate text-xs text-slate-400 dark:text-slate-500">{log.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="default">{log.action}</Badge>
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-slate-500 dark:text-slate-400">
                      {log.details || "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                      {log.timestamp ? formatDate(log.timestamp, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-400 dark:text-slate-500">
                      {log.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={safePage} totalPages={totalPages} onPage={setPage} total={filtered.length} />
      </CardContent>
    </Card>
  )
}