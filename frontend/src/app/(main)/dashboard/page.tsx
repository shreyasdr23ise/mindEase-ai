"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Smile,
  Activity,
  Flame,
  MessageCircle,
  BookOpen,
  Heart,
  MessageSquare,
  Brain,
  Dumbbell,
  NotebookPen,
  Pill,
  UserCheck,
  ArrowRight,
  TrendingUp,
  PieChart as PieChartIcon,
  Clock,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { MoodEmoji } from "@/components/shared/mood-emoji"
import { EmptyState } from "@/components/shared/empty-state"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDate, truncate } from "@/lib/utils"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth-store"
import { useMoodStore, type MoodEntry } from "@/store/mood-store"
import type { Conversation, ChatMessage } from "@/store/chat-store"

interface JournalEntry {
  id: string
  title?: string
  content?: string
  mood?: string
  created_at?: string
}

interface WellnessSession {
  id: string
  exercise_id?: string
  rating?: number
  created_at?: string
}

const MOOD_SCORE: Record<string, number> = {
  very_bad: 1,
  bad: 2,
  neutral: 3,
  good: 4,
  very_good: 5,
}

const PIE_COLORS = ["#3b82f6", "#14b8a6", "#8b5cf6", "#f59e0b", "#f43f5e", "#94a3b8"]

const quickActions = [
  {
    href: "/chat",
    title: "Talk to MindEase",
    description: "Chat about anything on your mind",
    icon: MessageSquare,
    gradient: "from-blue-500 to-sky-400",
  },
  {
    href: "/mood",
    title: "Check Mood",
    description: "Log how you're feeling right now",
    icon: Smile,
    gradient: "from-teal-500 to-emerald-400",
  },
  {
    href: "/wellness",
    title: "Start Exercise",
    description: "Breathing and grounding techniques",
    icon: Dumbbell,
    gradient: "from-purple-500 to-violet-400",
  },
  {
    href: "/journal",
    title: "Write Journal",
    description: "Reflect and release your thoughts",
    icon: NotebookPen,
    gradient: "from-amber-500 to-orange-400",
  },
  {
    href: "/medicines",
    title: "Medicine Info",
    description: "Look up medication information",
    icon: Pill,
    gradient: "from-rose-500 to-pink-400",
  },
  {
    href: "/counselors",
    title: "Professional Help",
    description: "Connect with counselors and experts",
    icon: UserCheck,
    gradient: "from-slate-500 to-slate-400",
  },
]

interface StatDatum {
  label: string
  value: number
  icon: React.ElementType
  accent: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { loadHistory } = useMoodStore()

  const [loading, setLoading] = React.useState(true)
  const [moods, setMoods] = React.useState<MoodEntry[]>([])
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [journals, setJournals] = React.useState<JournalEntry[]>([])
  const [sessions, setSessions] = React.useState<WellnessSession[]>([])

  const firstName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Friend"

  React.useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const [moodRes, chatRes, journalRes, wellnessRes] = await Promise.allSettled([
          api.mood.getMoodHistory(),
          api.chat.getConversations(),
          api.journal.getAll(),
          api.wellness.getSessions(),
        ])

        if (!active) return
        if (moodRes.status === "fulfilled") setMoods((moodRes.value as MoodEntry[]) ?? [])
        if (chatRes.status === "fulfilled")
          setConversations((chatRes.value as Conversation[]) ?? [])
        if (journalRes.status === "fulfilled")
          setJournals((journalRes.value as JournalEntry[]) ?? [])
        if (wellnessRes.status === "fulfilled")
          setSessions((wellnessRes.value as WellnessSession[]) ?? [])

        void loadHistory()
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [loadHistory])

  // ── Derived data ────────────────────────────────────────────────────
  const sortedMoods = React.useMemo(
    () => [...moods].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()),
    [moods]
  )
  const todayMood = sortedMoods[0]?.mood ?? null

  const avgLevel = React.useMemo(() => {
    if (sortedMoods.length === 0) return 0
    const sum = sortedMoods.reduce((acc, m) => acc + (MOOD_SCORE[m.mood] ?? 0), 0)
    return Math.round((sum / sortedMoods.length) * 20)
  }, [sortedMoods])

  // wellness streak (approx: simple consecutive-day count from mood logs)
  const streak = React.useMemo(() => {
    const days = new Set(
      sortedMoods
        .map((m) => m.created_at?.slice(0, 10))
        .filter(Boolean) as string[]
    )
    let count = 0
    const cursor = new Date()
    while (days.has(cursor.toISOString().slice(0, 10))) {
      count += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return count
  }, [sortedMoods])

  const stats: StatDatum[] = [
    {
      label: "Today's Mood",
      value: todayMood ? MOOD_SCORE[todayMood] ?? 0 : 0,
      icon: Smile,
      accent: "from-blue-500 to-sky-400",
    },
    {
      label: "Stress Level",
      value: Math.max(0, 100 - avgLevel),
      icon: Activity,
      accent: "from-teal-500 to-emerald-400",
    },
    {
      label: "Wellness Streak",
      value: streak,
      icon: Flame,
      accent: "from-orange-500 to-amber-400",
    },
    {
      label: "Total Conversations",
      value: conversations.length,
      icon: MessageCircle,
      accent: "from-purple-500 to-violet-400",
    },
    {
      label: "Journal Entries",
      value: journals.length,
      icon: BookOpen,
      accent: "from-rose-500 to-pink-400",
    },
    {
      label: "Wellness Sessions",
      value: sessions.length,
      icon: Heart,
      accent: "from-slate-500 to-slate-400",
    },
  ]

  // 7-day trend
  const trendData = React.useMemo(() => {
    const days: { label: string; score: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().slice(0, 10)
      const entry = sortedMoods.find((m) => m.created_at?.startsWith(key))
      days.push({
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        score: entry ? MOOD_SCORE[entry.mood] ?? 0 : 0,
      })
    }
    return days
  }, [sortedMoods])

  // emotion distribution
  const emotionData = React.useMemo(() => {
    if (sortedMoods.length === 0) return []
    const counts = new Map<string, number>()
    // pull sentiment labels from conversation messages too
    conversations.forEach((conv) => {
      conv.messages?.forEach((msg: ChatMessage) => {
        const s = msg.sentiment
        if (s && typeof s === "string" && s !== "neutral") {
          const label = s.toLowerCase()
          counts.set(label, (counts.get(label) ?? 0) + 1)
        }
      })
    })
    sortedMoods.forEach((m) => {
      const label = m.mood.toLowerCase()
      counts.set(label, (counts.get(label) ?? 0) + 1)
    })
    if (counts.size === 0) return []
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))
  }, [sortedMoods, conversations])

  // recent activity
  const recent = React.useMemo(() => {
    const activities: {
      id: string
      type: "mood" | "journal" | "chat"
      title: string
      detail: string
      time: string
    }[] = []

    sortedMoods.slice(0, 5).forEach((m) => {
      activities.push({
        id: `mood-${m.id}`,
        type: "mood",
        title: `Logged mood: ${m.mood?.replace("_", " ")}`,
        detail: m.note ? truncate(m.note, 60) : "Tracked how you were feeling",
        time: m.created_at ?? "",
      })
    })
    journals.slice(0, 5).forEach((j) => {
      activities.push({
        id: `journal-${j.id}`,
        type: "journal",
        title: `Journal entry: ${j.title || "Untitled"}`,
        detail: j.content ? truncate(j.content, 60) : "Wrote in your journal",
        time: j.created_at ?? "",
      })
    })
    conversations.slice(0, 5).forEach((c) => {
      activities.push({
        id: `chat-${c.id}`,
        type: "chat",
        title: `Conversation: ${c.title || "With MindEase"}`,
        detail: `Started ${c.created_at ? formatDate(c.created_at) : "recently"}`,
        time: c.updated_at || c.created_at || "",
      })
    })

    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5)
  }, [sortedMoods, journals, conversations])

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-8"
    >
      {/* Greeting */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-blue-50 via-teal-50 to-purple-50 p-6 sm:p-8 dark:border-slate-800 dark:from-blue-950/40 dark:via-teal-950/30 dark:to-purple-950/40"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-50 sm:text-3xl"
            >
              {greeting}, {firstName} <span className="inline-block animate-wave">👋</span>
            </motion.h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              {dateLabel} · How are you feeling today? I&apos;m here for you.
            </p>
          </div>
          {todayMood ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 px-4 py-3 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/50">
              <MoodEmoji mood={todayMood} size="md" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Today&apos;s mood
                </p>
                <p className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
                  {todayMood?.replace("_", " ")}
                </p>
              </div>
            </div>
          ) : (
            <Link
              href="/mood"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Smile className="h-4 w-4" />
              Log today&apos;s mood
            </Link>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          const isMood = stat.label === "Today's Mood"
          const card = (
            <Card hoverable className="flex h-full flex-col gap-3 p-4">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                  stat.accent
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-auto">
                {isMood ? (
                  <div className="flex items-center gap-2">
                    <MoodEmoji mood={todayMood ?? "neutral"} size="sm" />
                    <span className="text-lg font-bold capitalize text-slate-800 dark:text-slate-100">
                      {todayMood ? todayMood.replace("_", " ") : "—"}
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {stat.value}
                  </span>
                )}
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
                {stat.label === "Stress Level" && (
                  <Progress
                    value={stat.value}
                    color={stat.value < 40 ? "teal" : stat.value < 70 ? "amber" : "red"}
                    size="sm"
                    className="mt-2"
                  />
                )}
              </div>
            </Card>
          )
          return (
            <motion.div key={stat.label} variants={fadeUp} custom={i}>
              {isMood ? (
                <Link href="/mood" className="block">
                  {card}
                </Link>
              ) : (
                card
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Quick actions */}
      <div>
        <motion.h2 variants={fadeUp} className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Quick actions
        </motion.h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <motion.div key={action.href} variants={fadeUp}>
                <Link href={action.href}>
                  <Card hoverable className="group flex items-center gap-4 p-4">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-200 group-hover:scale-110",
                        action.gradient
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {action.title}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-500" />
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* 7-day mood trend */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="h-full p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
                  <TrendingUp className="h-4 w-4 text-teal-500" />
                  7-day mood trend
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daily average mood on a calm scale
                </p>
              </div>
            </div>
            {trendData.every((d) => d.score === 0) ? (
              <EmptyState
                icon={<Brain className="h-7 w-7" />}
                title="No mood data yet"
                description="Log your mood to see your week at a glance."
                action={
                  <Link href="/mood">
                    <Button size="sm">Check in now</Button>
                  </Link>
                }
              />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(148,163,184,0.3)",
                        background: "rgba(255,255,255,0.92)",
                        color: "#1e293b",
                        backdropFilter: "blur(8px)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
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
        </motion.div>

        {/* Emotion distribution */}
        <motion.div variants={fadeUp}>
          <Card className="h-full p-5">
            <div className="mb-4">
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
                <PieChartIcon className="h-4 w-4 text-purple-500" />
                Emotion mix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                How your feelings have been distributed
              </p>
            </div>
            {emotionData.length === 0 ? (
              <EmptyState
                icon={<Brain className="h-7 w-7" />}
                title="No emotions recorded yet"
                description="Chat with MindEase or log moods to build your emotion mix."
              />
            ) : (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emotionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {emotionData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(148,163,184,0.3)",
                        background: "rgba(255,255,255,0.92)",
                        color: "#1e293b",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {emotionData.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {emotionData.slice(0, 4).map((item, i) => (
                  <li key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 capitalize text-slate-500 dark:text-slate-400">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      {item.name.replace("_", " ")}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {item.value}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Recent activity */}
      <motion.div variants={fadeUp}>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
                <Clock className="h-4 w-4 text-blue-500" />
                Recent activity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your latest check-ins, reflections and conversations
              </p>
            </div>
            {recent.length > 0 && (
              <Link href="/journal" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                View all
              </Link>
            )}
          </div>
          {recent.length === 0 ? (
            <EmptyState
              icon={<Smile className="h-7 w-7" />}
              title="Nothing here yet"
              description="Your activity will appear here as you chat, log moods and write journal entries."
              action={
                <Link href="/chat">
                  <Button size="sm">Start your first chat</Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((activity) => {
                const IconConfig = {
                  mood: { icon: Smile, bg: "bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400" },
                  journal: { icon: BookOpen, bg: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" },
                  chat: { icon: MessageCircle, bg: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" },
                }[activity.type]
                return (
                  <div key={activity.id} className="flex items-center gap-3 py-3">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", IconConfig.bg)}>
                      <IconConfig.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium capitalize text-slate-800 dark:text-slate-100">
                        {activity.title}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {activity.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                      {activity.time ? formatDate(activity.time, { month: "short", day: "numeric" }) : ""}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}