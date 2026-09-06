"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Smile,
  Activity,
  Heart,
  TrendingUp,
  Calendar,
  Clock,
  Trash2,
  MessageSquare,
  NotebookPen,
  Wind,
  Brain,
  Check,
} from "lucide-react"
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { PageHeader } from "@/components/shared/page-header"
import { MoodEmoji } from "@/components/shared/mood-emoji"
import { EmptyState } from "@/components/shared/empty-state"
import { Card } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/ui/modal"
import { Tabs } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/toast"
import { cn, formatDate } from "@/lib/utils"
import { useMoodStore, type MoodEntry, type MoodLevel } from "@/store/mood-store"

const MOOD_OPTIONS: { value: MoodLevel; emoji: string; label: string }[] = [
  { value: "very_bad", emoji: "😢", label: "Very bad" },
  { value: "bad", emoji: "😞", label: "Bad" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "very_good", emoji: "😄", label: "Very good" },
]

const MOOD_SCORE: Record<string, number> = {
  very_bad: 1,
  bad: 2,
  neutral: 3,
  good: 4,
  very_good: 5,
}

const MOOD_ACCENT: Record<string, string> = {
  very_bad: "border-red-500 bg-red-50/60 shadow-lg shadow-red-500/20 dark:bg-red-500/10",
  bad: "border-orange-400 bg-orange-50/60 shadow-lg shadow-orange-500/20 dark:bg-orange-500/10",
  neutral: "border-slate-400 bg-slate-50 shadow-lg shadow-slate-400/20 dark:bg-slate-800/60",
  good: "border-teal-500 bg-teal-50/60 shadow-lg shadow-teal-500/20 dark:bg-teal-500/10",
  very_good: "border-emerald-500 bg-emerald-50/60 shadow-lg shadow-emerald-500/20 dark:bg-emerald-500/10",
}

const MOOD_EMOJI_COLOR: Record<string, string> = {
  "very bad": "#f43f5e",
  bad: "#f59e0b",
  neutral: "#94a3b8",
  good: "#14b8a6",
  "very good": "#34d399",
}

const PIE_FALLBACK = ["#3b82f6", "#14b8a6", "#8b5cf6", "#f59e0b", "#f43f5e", "#94a3b8"]

const CHECKIN_MESSAGES: Record<string, string> = {
  very_bad: "I'm sorry today is hard. Checking in takes real strength — please be gentle with yourself.",
  bad: "Thanks for tuning into your feelings. Even the smallest step counts.",
  neutral: "Thanks for checking in. Even the middle days matter.",
  good: "That's lovely to hear. Hold onto that spark.",
  very_good: "Wonderful! Savor this moment — you've earned it.",
}

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.3)",
  background: "rgba(255,255,255,0.92)",
  color: "#1e293b",
  backdropFilter: "blur(8px)",
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

interface Extras {
  stress: number
  anxiety: number
}

function LevelSlider({
  icon: Icon,
  label,
  value,
  onChange,
  from,
  to,
}: {
  icon: React.ElementType
  label: string
  value: number
  onChange: (v: number) => void
  from: string
  to: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          {label}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {value}/5
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="h-2.5 w-full cursor-pointer rounded-full outline-none"
        style={{ background: `linear-gradient(to right, ${from}, ${to})`, accentColor: to }}
      />
    </div>
  )
}

export default function MoodPage() {
  const moodHistory = useMoodStore((s) => s.moodHistory)
  const loadHistory = useMoodStore((s) => s.loadHistory)
  const createMood = useMoodStore((s) => s.createMood)
  const deleteMood = useMoodStore((s) => s.deleteMood)

  const [loading, setLoading] = React.useState(true)
  const [selected, setSelected] = React.useState<MoodLevel>("neutral")
  const [stress, setStress] = React.useState(3)
  const [anxiety, setAnxiety] = React.useState(3)
  const [note, setNote] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [savedEntry, setSavedEntry] = React.useState<MoodEntry | null>(null)
  const [extras, setExtras] = React.useState<Record<string, Extras>>({})
  const [range, setRange] = React.useState("week")
  const [deleteTarget, setDeleteTarget] = React.useState<MoodEntry | null>(null)
  const [busyDelete, setBusyDelete] = React.useState(false)

  React.useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        await loadHistory()
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [loadHistory])

  const sortedAsc = React.useMemo(
    () =>
      [...moodHistory].sort(
        (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
      ),
    [moodHistory]
  )

  const chartData = React.useMemo(() => {
    const days = range === "month" ? 30 : 7
    const out: {
      label: string
      name: string
      score: number
      stress: number
      anxiety: number
    }[] = []
    const today = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const entries = sortedAsc.filter((e) => e.created_at?.startsWith(key))
      const latest = entries[entries.length - 1]
      const score = latest ? (MOOD_SCORE[latest.mood] ?? latest.level ?? 0) : 0
      out.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        name: key,
        score,
        stress: latest ? (extras[latest.id]?.stress ?? latest.level ?? score) : 0,
        anxiety: latest ? (extras[latest.id]?.anxiety ?? latest.level ?? score) : 0,
      })
    }
    return out
  }, [sortedAsc, range, extras])

  const hasChartData = chartData.some((d) => d.score > 0)

  const emotionData = React.useMemo(() => {
    if (moodHistory.length === 0) return []
    const counts = new Map<string, number>()
    moodHistory.forEach((e) => {
      const label = String(e.mood).toLowerCase().replace(/_/g, " ")
      counts.set(label, (counts.get(label) ?? 0) + 1)
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))
  }, [moodHistory])

  const resetForm = () => {
    setSelected("neutral")
    setStress(3)
    setAnxiety(3)
    setNote("")
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const level = Math.round((stress + anxiety) / 2)
      const entry = await createMood(selected, level, note.trim() || undefined)
      setExtras((prev) => ({ ...prev, [entry.id]: { stress, anxiety } }))
      setSavedEntry(entry)
      toast.success("Check-in saved", "Thanks for checking in with yourself.")
      resetForm()
    } catch {
      toast.error("Couldn't save your check-in", "Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setBusyDelete(true)
    try {
      await deleteMood(deleteTarget.id)
      setExtras((prev) => {
        const next = { ...prev }
        delete next[deleteTarget.id]
        return next
      })
      toast.success("Entry deleted", "This mood entry has been removed.")
      setDeleteTarget(null)
    } catch {
      toast.error("Couldn't delete entry", "Please try again.")
    } finally {
      setBusyDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <PageHeader
          title="How are you feeling?"
          subtitle="A daily check-in helps you notice patterns and build self-awareness, one moment at a time."
        />
      </motion.div>

      {/* Mood selector */}
      <motion.div variants={fadeUp}>
        <Card className="p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {MOOD_OPTIONS.map((option) => {
              const isSelected = selected === option.value
              return (
                <motion.button
                  key={option.value}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelected(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 transition-all duration-200",
                    isSelected
                      ? cn(MOOD_ACCENT[option.value])
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-400/50 hover:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/5"
                  )}
                >
                  <MoodEmoji mood={option.value} size="lg" />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"
                    )}
                  >
                    {option.label}
                  </span>
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-md"
                    >
                      <Check className="h-3 w-3" />
                    </motion.span>
                  )}
                </motion.button>
              )
            })}
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <LevelSlider
              icon={Activity}
              label="Stress level"
              value={stress}
              onChange={setStress}
              from="#34d399"
              to="#f43f5e"
            />
            <LevelSlider
              icon={Heart}
              label="Anxiety level"
              value={anxiety}
              onChange={setAnxiety}
              from="#38bdf8"
              to="#a78bfa"
            />
          </div>

          <div className="mt-6">
            <Textarea
              label="How are you feeling right now?"
              placeholder="Optional — a few words about what's on your mind..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-24"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Smile className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save check-in"}
            </Button>
          </div>
        </Card>

        {/* Post-check-in reflection */}
        <AnimatePresence>
          {savedEntry && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="mt-4"
            >
              <Card className="border-teal-200/70 bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50 p-5 dark:border-teal-500/20 dark:from-blue-950/40 dark:via-teal-950/30 dark:to-emerald-950/40">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20">
                      <Smile className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        Thanks for checking in.
                      </p>
                      <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-300">
                        {CHECKIN_MESSAGES[savedEntry.mood] ?? CHECKIN_MESSAGES.neutral}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/chat" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
                      <MessageSquare className="h-4 w-4" />
                      Talk to MindEase
                    </Link>
                    <Link href="/wellness" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      <Wind className="h-4 w-4" />
                      Calming exercise
                    </Link>
                    <Link href="/journal" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      <NotebookPen className="h-4 w-4" />
                      Write in Journal
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Trends */}
      <motion.div variants={fadeUp}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              <TrendingUp className="h-4 w-4 text-teal-500" />
              Your trends
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Observe the rhythm of your moods over time
            </p>
          </div>
          <Tabs
            tabs={[
              { value: "week", label: "Weekly", icon: <Calendar className="h-4 w-4" /> },
              { value: "month", label: "Monthly", icon: <TrendingUp className="h-4 w-4" /> },
            ]}
            value={range}
            onValueChange={setRange}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Mood trend
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily mood score on a calm scale
            </p>
            {!hasChartData ? (
              <EmptyState
                icon={<Brain className="h-7 w-7" />}
                title="No mood data yet"
                description="Save your first check-in to see mood trends here."
                className="mt-4 border-0 bg-slate-50/50 py-10 dark:bg-slate-900/40"
              />
            ) : (
              <div className="mt-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      name="Mood"
                      stroke="#14b8a6"
                      strokeWidth={2.5}
                      fill="url(#moodGradient)"
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <Heart className="h-4 w-4 text-rose-500" />
              Stress & anxiety
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Intensity levels on a 1–5 scale
            </p>
            {!hasChartData ? (
              <EmptyState
                icon={<Activity className="h-7 w-7" />}
                title="No intensity data yet"
                description="Your stress and anxiety levels will appear as you check in."
                className="mt-4 border-0 bg-slate-50/50 py-10 dark:bg-slate-900/40"
              />
            ) : (
              <div className="mt-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="stress" name="Stress" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="anxiety" name="Anxiety" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <Smile className="h-4 w-4 text-purple-500" />
              Emotion mix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              How your moods have been distributed
            </p>
            {emotionData.length === 0 ? (
              <EmptyState
                icon={<Smile className="h-7 w-7" />}
                title="No emotions recorded yet"
                description="Check in a few times to build your emotion mix."
                className="mt-4 border-0 bg-slate-50/50 py-10 dark:bg-slate-900/40"
              />
            ) : (
              <div className="mt-4 h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emotionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={62}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {emotionData.map((item, i) => (
                        <Cell
                          key={item.name}
                          fill={MOOD_EMOJI_COLOR[item.name] ?? PIE_FALLBACK[i % PIE_FALLBACK.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {emotionData.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {emotionData.map((item, i) => (
                  <li key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 capitalize text-slate-500 dark:text-slate-400">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: MOOD_EMOJI_COLOR[item.name] ?? PIE_FALLBACK[i % PIE_FALLBACK.length] }}
                      />
                      {item.name}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {item.value}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </motion.div>

      {/* History */}
      <motion.div variants={fadeUp}>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
                <Clock className="h-4 w-4 text-blue-500" />
                Check-in history
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your recent mood entries, newest first
              </p>
            </div>
            {moodHistory.length > 0 && (
              <Badge variant="teal">{moodHistory.length} entries</Badge>
            )}
          </div>

          {moodHistory.length === 0 ? (
            <EmptyState
              icon={<Smile className="h-7 w-7" />}
              title="No check-ins yet"
              description="Save your first check-in above and it will show up here."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {moodHistory.map((entry) => {
                const extra = extras[entry.id]
                const level = entry.level
                return (
                  <div key={entry.id} className="flex items-center gap-3 py-3">
                    <MoodEmoji mood={String(entry.mood)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium capitalize text-slate-800 dark:text-slate-100">
                          {String(entry.mood).replace(/_/g, " ")}
                        </p>
                        {typeof level === "number" && (
                          <Badge variant="secondary">{level}/5</Badge>
                        )}
                        {typeof extra?.stress === "number" && (
                          <Badge variant="warning">Stress {extra.stress}</Badge>
                        )}
                        {typeof extra?.anxiety === "number" && (
                          <Badge variant="default">Anxiety {extra.anxiety}</Badge>
                        )}
                      </div>
                      {entry.note && (
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {entry.note}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {entry.created_at
                          ? formatDate(entry.created_at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                          : ""}
                      </span>
                      <button
                        onClick={() => setDeleteTarget(entry)}
                        aria-label="Delete check-in"
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Delete confirmation */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete this check-in?"
        description="This mood entry will be permanently removed from your history."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()} disabled={busyDelete}>
              {busyDelete ? "Deleting..." : "Yes, delete"}
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <MoodEmoji mood={String(deleteTarget.mood)} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
                {String(deleteTarget.mood).replace(/_/g, " ")}
              </p>
              {deleteTarget.created_at && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(deleteTarget.created_at, { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              )}
              {deleteTarget.note && (
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                  {deleteTarget.note}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}