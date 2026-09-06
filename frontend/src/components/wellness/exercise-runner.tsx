"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Wind,
  Waves,
  Sparkles,
  Star,
  Heart,
  HeartPulse,
  Brain,
  Moon,
  Footprints,
  Eye,
  Hand,
  Ear,
  Flower,
  Coffee,
  Play,
  Pause,
  Square,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  RefreshCw,
  X,
  Quote,
  WandSparkles,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MoodEmoji } from "@/components/shared/mood-emoji"
import { cn } from "@/lib/utils"

export type ExerciseCategory =
  | "breathing"
  | "grounding"
  | "mindfulness"
  | "stress"
  | "cbt"
  | "sleep"
  | "gratitude"

export type Difficulty = "easy" | "medium" | "hard"

export interface Exercise {
  id: string
  title: string
  description?: string
  category: ExerciseCategory
  duration: number
  difficulty: Difficulty
  steps?: string[]
  tips?: string[]
}

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "secondary"
  | "outline"
  | "purple"
  | "teal"

export interface CategoryStyle {
  label: string
  icon: LucideIcon
  badge: BadgeVariant
  chip: string
  iconBox: string
  gradient: string
}

export const CATEGORY_STYLES: Record<ExerciseCategory, CategoryStyle> = {
  breathing: {
    label: "Breathing",
    icon: Wind,
    badge: "teal",
    chip: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
    iconBox: "bg-teal-500/12 text-teal-600 dark:text-teal-300",
    gradient: "from-teal-500 to-emerald-400",
  },
  grounding: {
    label: "Grounding",
    icon: Footprints,
    badge: "success",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    iconBox: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
    gradient: "from-emerald-500 to-green-400",
  },
  mindfulness: {
    label: "Mindfulness",
    icon: Waves,
    badge: "info",
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    iconBox: "bg-sky-500/12 text-sky-600 dark:text-sky-300",
    gradient: "from-sky-500 to-cyan-400",
  },
  stress: {
    label: "Stress Relief",
    icon: HeartPulse,
    badge: "warning",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    iconBox: "bg-amber-500/12 text-amber-600 dark:text-amber-300",
    gradient: "from-amber-500 to-orange-400",
  },
  cbt: {
    label: "CBT",
    icon: Brain,
    badge: "default",
    chip: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    iconBox: "bg-blue-500/12 text-blue-600 dark:text-blue-300",
    gradient: "from-blue-500 to-violet-400",
  },
  sleep: {
    label: "Sleep",
    icon: Moon,
    badge: "purple",
    chip: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
    iconBox: "bg-purple-500/12 text-purple-600 dark:text-purple-300",
    gradient: "from-purple-500 to-indigo-400",
  },
  gratitude: {
    label: "Positive Reflection",
    icon: Sparkles,
    badge: "outline",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    iconBox: "bg-rose-500/12 text-rose-600 dark:text-rose-300",
    gradient: "from-rose-500 to-pink-400",
  },
}

export const DIFFICULTY_STYLES: Record<
  Difficulty,
  { label: string; badge: BadgeVariant }
> = {
  easy: { label: "Easy", badge: "success" },
  medium: { label: "Medium", badge: "warning" },
  hard: { label: "Challenging", badge: "destructive" },
}

export function normalizeDifficulty(value: unknown): Difficulty {
  const v = String(value ?? "").toLowerCase()
  if (v.includes("hard") || v.includes("medium")) return v.startsWith("h") ? "hard" : "medium"
  if (v.includes("challenge")) return "hard"
  if (v.includes("easy") || v.includes("beginner")) return "easy"
  return "medium"
}

export function normalizeCategory(value: unknown): ExerciseCategory {
  const v = String(value ?? "").toLowerCase().replace(/[^a-z]/g, "")
  const slug = v.replace(/(ground|group)/, "grounding").replace(/(reflect|positive|gratitude|grate)/, "gratitude")
  if (slug.includes("breath")) return "breathing"
  if (slug.includes("ground")) return "grounding"
  if (slug.includes("mind")) return "mindfulness"
  if (slug.includes("stress") || slug.includes("relief") || slug.includes("relax")) return "stress"
  if (slug.includes("cbt") || slug.includes("cognitive")) return "cbt"
  if (slug.includes("sleep")) return "sleep"
  if (slug.includes("gratitude") || slug.includes("reflect") || slug.includes("positive")) return "gratitude"
  return "breathing"
}

export function normalizeExercise(raw: unknown): Exercise {
  const data = (raw ?? {}) as Record<string, unknown>
  const durationRaw = data.duration ?? data.duration_minutes ?? data.minutes ?? 3
  const duration = typeof durationRaw === "number" ? durationRaw : Number(durationRaw) || 3
  return {
    id: String(data.id ?? data.exercise_id ?? `exercise-${Math.random().toString(36).slice(2, 8)}`),
    title: String(data.title ?? data.name ?? "Wellness exercise"),
    description:
      typeof data.description === "string"
        ? data.description
        : typeof data.subtitle === "string"
          ? data.subtitle
          : undefined,
    category: normalizeCategory(data.category ?? data.type ?? data.kind),
    duration: Math.max(1, Math.min(30, Math.round(duration))),
    difficulty: normalizeDifficulty(data.difficulty ?? data.level),
    steps: Array.isArray(data.steps) ? data.steps.map((s) => String(s)) : undefined,
    tips: Array.isArray(data.tips) ? data.tips.map((t) => String(t)) : Array.isArray(data.benefits) ? data.benefits.map((t) => String(t)) : undefined,
  }
}

export const FALLBACK_EXERCISES: Exercise[] = [
  {
    id: "breathing-box",
    title: "4-4-4 Box Breathing",
    description:
      "A gentle, structured breath to steady your nervous system. Inhale, hold, exhale — each for four counts — and feel your shoulders soften.",
    category: "breathing",
    duration: 2,
    difficulty: "easy",
    steps: [
      "Sit comfortably with your back supported and both feet on the floor.",
      "Close your eyes, or soften your gaze on a single point.",
      "Follow the orb: inhale slowly for 4 seconds (your belly expands).",
      "Hold gently for 4 seconds — no need to force it.",
      "Exhale fully and slowly for 4 seconds.",
      "Repeat for several rounds and notice how your body feels after.",
    ],
    tips: [
      "Breathe in through your nose and out through your nose or mouth.",
      "If 4 seconds feels too long, shorten it — the rhythm matters more than the count.",
      "Find a quiet spot where you won't be interrupted.",
    ],
  },
  {
    id: "grounding-54321",
    title: "5-4-3-2-1 Grounding",
    description:
      "A classic calming technique that uses your five senses to gently bring you back to the present moment when you feel overwhelmed.",
    category: "grounding",
    duration: 3,
    difficulty: "easy",
    steps: [
      "Name 5 things you can see around you.",
      "Notice 4 things you can physically touch or feel.",
      "Listen for 3 things you can hear.",
      "Identify 2 things you can smell.",
      "Find 1 thing you can taste.",
    ],
    tips: [
      "Go slowly — this is about noticing, not racing.",
      "Say the items out loud or quietly to yourself.",
      "You can repeat the cycle as many times as you need.",
    ],
  },
  {
    id: "mindfulness-meditation",
    title: "Guided Mini-Meditation",
    description:
      "A short guided practice that anchors your attention to the breath and invites a sense of spaciousness and calm.",
    category: "mindfulness",
    duration: 3,
    difficulty: "easy",
    steps: [
      "Get settled and create a comfortable posture.",
      "Let the timer guide you through a few minutes of mindful stillness.",
      "Anchor your attention on the sensation of breathing.",
      "When your mind wanders, gently guide it back — that's the practice.",
    ],
    tips: [
      "Soft lighting or gentle background sounds can help ambience.",
      "It's normal for thoughts to come up; simply observe them.",
    ],
  },
  {
    id: "pmr-stress",
    title: "Progressive Muscle Relaxation",
    description:
      "Tense and release each muscle group to dissolve the body tension that often travels with stress.",
    category: "stress",
    duration: 5,
    difficulty: "medium",
    steps: [
      "Tense each body part for about 5 seconds.",
      "Notice the sensation of holding the tension.",
      "Release completely and let the area feel heavy for about 10 seconds.",
      "Move slowly through the body from head to toe.",
    ],
    tips: [
      "Avoid tensing areas that are injured or painful.",
      "Best done lying down or in a comfortable chair.",
    ],
  },
  {
    id: "cbt-reframe",
    title: "Thought Reframing (CBT)",
    description:
      "A structured, educational exercise to examine an automatic thought and gently build a more balanced perspective.",
    category: "cbt",
    duration: 6,
    difficulty: "medium",
    steps: [
      "Describe the situation that triggered a thought.",
      "Name your automatic thought.",
      "Identify the emotion it stirred.",
      "List the evidence that supports the thought.",
      "List the evidence that doesn't support it.",
      "Write a more balanced, compassionate thought.",
    ],
    tips: [
      "Be honest with yourself — there are no wrong answers.",
      "This is an educational tool, not a substitute for therapy.",
    ],
  },
  {
    id: "sleep-winddown",
    title: "Sleep Wind-Down",
    description:
      "A soothing sequence to help your body and mind prepare for a restful night's sleep.",
    category: "sleep",
    duration: 5,
    difficulty: "easy",
    steps: [
      "Dim the lights and reduce screen brightness.",
      "Take a few slow, calming breaths.",
      "Let your shoulders and jaw soften.",
      "Imagine a wave of relaxation moving down your body.",
    ],
    tips: [
      "Pair this with a consistent bedtime to strengthen your routine.",
      "Keep your bedroom cool and quiet if you can.",
    ],
  },
  {
    id: "gratitude-reflection",
    title: "Gratitude & Positive Reflection",
    description:
      "Turn your attention toward the good — big or small — and leave with a few gentle affirmations.",
    category: "gratitude",
    duration: 4,
    difficulty: "easy",
    steps: [
      "Name a few things you are grateful for today.",
      "Pick an affirmation that resonates with you.",
      "Sit with the warm feeling for a moment.",
      "Save your reflection and revisit it whenever you need a lift.",
    ],
    tips: [
      "Small moments count — a kind word, a warm drink, a quiet minute.",
      "Re-reading past reflections can brighten a hard day.",
    ],
  },
]

export const GRATITUDE_PROMPTS = [
  "What made you smile today, even for a moment?",
  "Who or what are you grateful to have in your life right now?",
  "What is something your body did for you today?",
  "What is a simple pleasure you noticed today?",
  "What challenge, however small, did you get through?",
]

export const AFFIRMATIONS = [
  "I am allowed to take things one step at a time.",
  "I am doing the best I can with what I have.",
  "My feelings are valid, and they come and go.",
  "I deserve kindness — starting with my own.",
  "I can pause, breathe, and choose again.",
  "I am stronger than I sometimes remember.",
  "It's okay to ask for help.",
  "Rest is productive, and I am worthy of it.",
]

const BREATH_CYCLE_MS = 12_000
const TARGET_CYCLES = 6
const TOTAL_BREATHING_MS = BREATH_CYCLE_MS * TARGET_CYCLES

const BREATH_PHASES = [
  { key: "inhale", label: "Inhale", seconds: 4 },
  { key: "hold", label: "Hold", seconds: 4 },
  { key: "exhale", label: "Exhale", seconds: 4 },
]

interface RunnerProps {
  exercise: Exercise
  onFinish: (durationSeconds: number, notes?: string) => void
}

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function easeIn(t: number) {
  return t * t * t
}

export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const rest = s % 60
  if (m <= 0) return `${s}s`
  return rest > 0 ? `${m}m ${rest}s` : `${m}m`
}

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

function CatChip({ category }: { category: ExerciseCategory }) {
  const style = CATEGORY_STYLES[category]
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", style.chip)}>
      <style.icon className="h-3.5 w-3.5" />
      {style.label}
    </span>
  )
}

function RunnerTopBar({
  exercise,
  onExit,
  right,
}: {
  exercise: Exercise
  onExit?: () => void
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <CatChip category={exercise.category} />
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
        {exercise.title}
      </p>
      {right}
      {onExit && (
        <button
          onClick={onExit}
          aria-label="Exit exercise"
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

function StepProgress({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-400"
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
        {value} / {max}
      </span>
    </div>
  )
}

/* ── Breathing ─────────────────────────────────────────────── */

function BreathingRunner({ exercise: _exercise, onFinish }: RunnerProps) {
  const [status, setStatus] = React.useState<"idle" | "running" | "paused" | "finished">("idle")
  const [elapsed, setElapsed] = React.useState(0)
  const startedAt = React.useRef<number | null>(null)
  const pausedAccum = React.useRef(0)
  const pausedAt = React.useRef<number | null>(null)
  const finishedRef = React.useRef(false)

  const statusRef = React.useRef(status)
  statusRef.current = status
  const onFinishRef = React.useRef(onFinish)
  onFinishRef.current = onFinish

  const end = React.useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setStatus("finished")
    onFinishRef.current(TOTAL_BREATHING_MS / 1000)
  }, [])

  React.useEffect(() => {
    const iv = window.setInterval(() => {
      if (statusRef.current !== "running" || !startedAt.current) return
      const now = Date.now()
      const e = now - startedAt.current - pausedAccum.current
      setElapsed(e)
      if (e >= TOTAL_BREATHING_MS) end()
    }, 100)
    return () => window.clearInterval(iv)
  }, [end])

  const start = () => {
    finishedRef.current = false
    startedAt.current = Date.now()
    pausedAccum.current = 0
    pausedAt.current = null
    setElapsed(0)
    setStatus("running")
  }

  const pause = () => {
    if (status !== "running" || finishedRef.current) return
    pausedAt.current = Date.now()
    setStatus("paused")
  }

  const resume = () => {
    if (status !== "paused") return
    if (pausedAt.current) pausedAccum.current += Date.now() - pausedAt.current
    pausedAt.current = null
    setStatus("running")
  }

  const stop = () => {
    finishedRef.current = false
    startedAt.current = null
    pausedAccum.current = 0
    pausedAt.current = null
    setElapsed(0)
    setStatus("idle")
  }

  const inCycle = elapsed % BREATH_CYCLE_MS
  const phaseIndex = Math.min(2, Math.floor(inCycle / 4000))
  const phaseProgress = (inCycle % 4000) / 4000
  const cycle = Math.min(TARGET_CYCLES, Math.floor(elapsed / BREATH_CYCLE_MS))
  const phase = BREATH_PHASES[phaseIndex]
  const secondsLeft = Math.max(1, Math.ceil(4 - phaseProgress * 4))
  const overall = elapsed / TOTAL_BREATHING_MS

  const scale =
    phaseIndex === 0
      ? 1 + 0.65 * easeOut(phaseProgress)
      : phaseIndex === 1
        ? 1.65
        : 1.65 - 0.65 * easeIn(phaseProgress)

  const R = 88
  const CIRC = 2 * Math.PI * R
  const ringOffset = CIRC * (1 - Math.min(1, overall))

  const orbColor =
    phaseIndex === 0
      ? "bg-gradient-to-br from-teal-400 to-emerald-500"
      : phaseIndex === 1
        ? "bg-gradient-to-br from-teal-500 to-cyan-500"
        : "bg-gradient-to-br from-emerald-500 to-teal-300"

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        {status === "idle" ? (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            6 calm breathing cycles · about {formatDuration(TOTAL_BREATHING_MS / 1000)}
          </p>
        ) : (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Cycle {Math.min(cycle + 1, TARGET_CYCLES)} of {TARGET_CYCLES}
          </p>
        )}
      </div>

      <div className="relative h-64 w-64">
        <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
          <circle cx="100" cy="100" r={R} fill="none" strokeWidth="6" className="stroke-slate-200 dark:stroke-slate-700" />
          <motion.circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className="stroke-teal-500 dark:stroke-teal-400"
            strokeDasharray={CIRC}
            animate={{ strokeDashoffset: ringOffset }}
            transition={{ duration: 0.15, ease: "linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className={cn("relative flex h-24 w-24 items-center justify-center rounded-full shadow-2xl shadow-teal-500/30", orbColor)}
            animate={{ scale }}
            transition={{ duration: 0.12, ease: "linear" }}
          >
            <motion.div
              className="absolute inset-[-14%] rounded-full bg-teal-400/30 blur-xl"
              animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-[-30%] rounded-full bg-teal-300/20 blur-2xl"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="relative z-10 text-3xl" aria-hidden>
              {phaseIndex === 0 ? "🌊" : phaseIndex === 1 ? "🪷" : "🍃"}
            </span>
          </motion.div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={status === "idle" ? "ready" : phase.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="min-w-[9rem]"
          >
            <p className="text-2xl font-bold capitalize tracking-tight text-slate-800 dark:text-slate-100">
              {status === "idle" ? "Ready" : status === "paused" ? "Paused" : phase.label}
            </p>
            {status !== "idle" && status !== "paused" && (
              <p className="mt-1 text-sm tabular-nums text-slate-500 dark:text-slate-400">
                {secondsLeft} …breathe
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          Inhale 4s
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-purple-400" />
          Hold 4s
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-teal-400" />
          Exhale 4s
        </span>
      </div>

      <div className="flex items-center gap-3">
        {status === "idle" ? (
          <Button size="lg" onClick={start}>
            <Play className="h-4 w-4" />
            Start breathing
          </Button>
        ) : (
          <>
            {status === "running" ? (
              <Button variant="secondary" onClick={pause}>
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            ) : (
              <Button variant="secondary" onClick={resume}>
                <Play className="h-4 w-4" />
                Resume
              </Button>
            )}
            <Button variant="ghost" onClick={stop}>
              <Square className="h-4 w-4" />
              Stop
            </Button>
          </>
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Session timer · {formatClock(elapsed / 1000)} / {formatClock(TOTAL_BREATHING_MS / 1000)}
      </p>
    </div>
  )
}

/* ── Grounding ─────────────────────────────────────────────── */

const GROUNDING_STEPS: {
  count: number
  verb: string
  title: string
  hint: string
  icon: LucideIcon
}[] = [
  { count: 5, verb: "see", title: "5 things you can see", hint: "Look around and notice colors, shapes, and textures.", icon: Eye },
  { count: 4, verb: "touch", title: "4 things you can touch", hint: "Feel the fabric, the air, the ground beneath you.", icon: Hand },
  { count: 3, verb: "hear", title: "3 things you can hear", hint: "Listen closely — near sounds and far sounds.", icon: Ear },
  { count: 2, verb: "smell", title: "2 things you can smell", hint: "Take a gentle sniff of the air around you.", icon: Flower },
  { count: 1, verb: "taste", title: "1 thing you can taste", hint: "Notice the flavor in your mouth, or sip some water.", icon: Coffee },
]

function GroundingRunner({ exercise: _exercise, onFinish }: RunnerProps) {
  const [step, setStep] = React.useState(0)
  const [answers, setAnswers] = React.useState<string[][]>(GROUNDING_STEPS.map((s) => Array(s.count).fill("")))
  const [elapsed, setElapsed] = React.useState(0)
  const startRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    startRef.current = Date.now()
    const iv = window.setInterval(() => {
      if (startRef.current) setElapsed((Date.now() - startRef.current) / 1000)
    }, 1000)
    return () => window.clearInterval(iv)
  }, [])

  const current = GROUNDING_STEPS[step]
  const setValue = (i: number, value: string) => {
    setAnswers((prev) => {
      const next = prev.map((row) => [...row])
      next[step][i] = value
      return next
    })
  }

  const next = () => {
    if (step >= GROUNDING_STEPS.length - 1) {
      const notes = answers
        .flat()
        .filter(Boolean)
        .join(", ")
      onFinish(Math.max(30, Math.round(elapsed)), notes || undefined)
      return
    }
    setStep((s) => s + 1)
  }

  return (
    <div className="flex flex-col gap-5 py-2">
      <StepProgress value={step + 1} max={GROUNDING_STEPS.length} />

      <div className="flex h-8 items-center justify-center gap-2">
        {GROUNDING_STEPS.map((s, i) => (
          <motion.span
            key={s.verb}
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              i <= step ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
            )}
            animate={{ scale: i === step ? 1.5 : 1 }}
          />
        ))}
      </div>

      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
          <current.icon className="h-7 w-7" />
        </div>
        <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {current.title}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{current.hint}</p>
      </div>

      <div className="mx-auto grid w-full max-w-md gap-3">
        {Array.from({ length: current.count }).map((_, i) => (
          <Input
            key={i}
            value={answers[step][i]}
            onChange={(e) => setValue(i, e.target.value)}
            placeholder={`Thing ${i + 1}`}
            className="bg-white dark:bg-slate-800/70"
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={next}>
          {step >= GROUNDING_STEPS.length - 1 ? "Finish" : "Next"}
          {step >= GROUNDING_STEPS.length - 1 ? <CheckCircle2 className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

/* ── CBT ──────────────────────────────────────────────────── */

const CBT_STEPS = [
  {
    key: "situation",
    title: "Describe the situation",
    hint: "What happened, and where, and when? Stick to the facts as best you can.",
  },
  {
    key: "thought",
    title: "What was your automatic thought?",
    hint: "The thought that popped into your head first, no matter how harsh.",
  },
  {
    key: "emotion",
    title: "What emotion did you feel?",
    hint: "Choose the mood that best matches how it made you feel.",
  },
  {
    key: "for",
    title: "Evidence for this thought",
    hint: "What supports this thought? Be specific.",
  },
  {
    key: "against",
    title: "Evidence against this thought",
    hint: "What doesn't fit, or what would a kind friend point out?",
  },
  {
    key: "balanced",
    title: "What's a more balanced thought?",
    hint: "A fairer, more compassionate way to look at this.",
  },
] as const

const MOOD_CHOICES = [
  { value: "very_bad", label: "Very bad" },
  { value: "bad", label: "Bad" },
  { value: "neutral", label: "Neutral" },
  { value: "good", label: "Good" },
  { value: "very_good", label: "Very good" },
]

function CbtRunner({ exercise: _exercise, onFinish }: RunnerProps) {
  const [step, setStep] = React.useState(0)
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const startRef = React.useRef<number | null>(Date.now())

  const current = CBT_STEPS[step]
  const isLast = step === CBT_STEPS.length - 1
  const value = answers[current.key] ?? ""

  const setValue = (v: string) => setAnswers((prev) => ({ ...prev, [current.key]: v }))

  const finish = () => {
    const minutes = Math.max(1, Math.round((Date.now() - (startRef.current ?? Date.now())) / 60000))
    const notes = [answers.situation, answers.thought, answers.balanced].filter(Boolean).join(" | ")
    onFinish(minutes * 60, notes || undefined)
  }

  return (
    <div className="flex flex-col gap-5 py-2">
      <StepProgress value={step + 1} max={CBT_STEPS.length} />

      <motion.div key={current.key} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500 dark:text-blue-400">
            Step {step + 1} of {CBT_STEPS.length}
          </p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{current.title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{current.hint}</p>
        </div>

        {current.key === "emotion" ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {MOOD_CHOICES.map((m) => {
              const active = value === m.value
              return (
                <motion.button
                  key={m.value}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setValue(m.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 transition-all",
                    active
                      ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20 dark:border-blue-400 dark:bg-blue-500/15"
                      : "border-slate-200 bg-white hover:border-blue-400/40 dark:border-slate-700 dark:bg-slate-800/70"
                  )}
                >
                  <MoodEmoji mood={m.value} size="sm" />
                  <span className={cn("text-xs font-medium", active ? "text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-300")}>
                    {m.label}
                  </span>
                </motion.button>
              )
            })}
          </div>
        ) : (
          <Textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Write here... you don't need perfect words."
            className="min-h-32 bg-white text-[15px] leading-relaxed dark:bg-slate-800/70"
          />
        )}
      </motion.div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        {isLast ? (
          <Button onClick={finish}>
            Finish
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => Math.min(CBT_STEPS.length - 1, s + 1))}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        CBT-inspired educational exercise — not psychotherapy.
      </p>
    </div>
  )
}

/* ── Mindfulness ───────────────────────────────────────────── */

const MINDFULNESS_CHECKPOINTS = [
  { at: 0.0, message: "Settle in. Let your body rest into this moment." },
  { at: 0.2, message: "Notice the rise and fall of your breath, all on its own." },
  { at: 0.45, message: "If your mind wanders, that's okay — gently return to your breath." },
  { at: 0.7, message: "Let your shoulders drop and soften your jaw." },
  { at: 0.9, message: "Almost done. Take one full, easy breath." },
]

function MindfulnessRunner({ exercise: _exercise, onFinish }: RunnerProps) {
  const [minutes, setMinutes] = React.useState(3)
  const [status, setStatus] = React.useState<"idle" | "running" | "paused" | "finished">("idle")
  const [remaining, setRemaining] = React.useState(minutes * 60)
  const finishedRef = React.useRef(false)
  const totalMs = minutes * 60_000
  const pausedAccum = React.useRef(0)

  const statusRef = React.useRef(status)
  statusRef.current = status
  const totalRef = React.useRef(totalMs)
  totalRef.current = totalMs
  const onFinishRef = React.useRef(onFinish)
  onFinishRef.current = onFinish

  const end = React.useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setStatus("finished")
    onFinishRef.current(totalRef.current / 1000)
  }, [])

  React.useEffect(() => {
    if (status !== "running") return
    const started = Date.now()
    const iv = window.setInterval(() => {
      const elapsed = Date.now() - started - pausedAccum.current
      const left = Math.max(0, Math.ceil((totalRef.current - elapsed) / 1000))
      setRemaining(left)
      if (elapsed >= totalRef.current) end()
    }, 250)
    return () => window.clearInterval(iv)
  }, [status, end])

  const start = () => {
    finishedRef.current = false
    pausedAccum.current = 0
    setRemaining(minutes * 60)
    setStatus("running")
  }

  const pause = () => setStatus("paused")
  const resume = () => setStatus("running")
  const stop = () => {
    finishedRef.current = false
    pausedAccum.current = 0
    setRemaining(minutes * 60)
    setStatus("idle")
  }

  const pct = 1 - remaining / (minutes * 60)
  const done = Math.max(0, minutes * 60 - remaining)
  const checkpoint = [...MINDFULNESS_CHECKPOINTS].reverse().find((c) => pct >= c.at)

  if (status === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full bg-sky-400/20 blur-2xl"
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-4xl shadow-2xl shadow-sky-500/30">
            🌬️
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Choose your length
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            A few quiet minutes with gentle cues along the way.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[1, 3, 5].map((m) => (
            <Button
              key={m}
              variant={minutes === m ? "default" : "secondary"}
              onClick={() => setMinutes(m)}
            >
              {m} min
            </Button>
          ))}
        </div>

        <div className="rounded-xl border border-sky-200/70 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
          💡 Ambient idea: soft lamp light or gentle instrumental music can make this feel extra calming.
        </div>

        <Button size="lg" onClick={start}>
          <Play className="h-4 w-4" />
          Begin meditation
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="relative flex h-56 w-56 items-center justify-center">
        <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
          <circle cx="100" cy="100" r="88" fill="none" strokeWidth="6" className="stroke-slate-200 dark:stroke-slate-700" />
          <motion.circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className="stroke-sky-500 dark:stroke-sky-400"
            strokeDasharray={2 * Math.PI * 88}
            animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - pct) }}
            transition={{ duration: 0.4 }}
          />
        </svg>
        <motion.div
          className="absolute inset-10 rounded-full bg-gradient-to-br from-sky-400/25 to-cyan-300/25 blur-md"
          animate={{ scale: status === "running" ? [1, 1.12, 1] : 1 }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex h-full w-full items-center justify-center text-5xl">
            {status === "paused" ? "⏸️" : "🕊️"}
          </div>
        </motion.div>
      </div>

      <div className="text-4xl font-bold tabular-nums tracking-tight text-slate-800 dark:text-slate-100">
        {formatClock(remaining)}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={checkpoint?.message ?? "rest"}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4 }}
          className="max-w-sm rounded-2xl border border-sky-200/70 bg-sky-50 px-5 py-4 text-sm font-medium text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200"
        >
          {checkpoint?.message ?? "Breathe with the circle."}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-3">
        {status === "running" ? (
          <Button variant="secondary" onClick={pause}>
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        ) : (
          <Button variant="secondary" onClick={resume}>
            <Play className="h-4 w-4" />
            Resume
          </Button>
        )}
        <Button variant="ghost" onClick={stop}>
          <Square className="h-4 w-4" />
          Stop
        </Button>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        {formatDuration(done)} in · {minutes} min session
      </p>
    </div>
  )
}

/* ── Stress relief (PMR) ───────────────────────────────────── */

const PMR_PARTS = [
  { name: "Hands & fingers", area: "Clench both fists gently." },
  { name: "Arms", area: "Bend your elbows and tense your arms." },
  { name: "Shoulders", area: "Shrug your shoulders up toward your ears." },
  { name: "Neck & jaw", area: "Gently press your jaw and tilt your head back a touch." },
  { name: "Face", area: "Squeeze your eyes and scrunch your face." },
  { name: "Chest & belly", area: "Take in a breath and tighten your core." },
  { name: "Legs", area: "Press your thighs and straighten your legs." },
  { name: "Calves & feet", area: "Point your toes and curl your feet." },
]

const TENSE_MS = 5_000
const RELAX_MS = 10_000

function StressRunner({ exercise: _exercise, onFinish }: RunnerProps) {
  const [part, setPart] = React.useState(0)
  const [stage, setStage] = React.useState<"tense" | "relax">("tense")
  const [countdown, setCountdown] = React.useState(TENSE_MS / 1000)
  const [status, setStatus] = React.useState<"running" | "paused">("running")
  const stageEndRef = React.useRef<number | null>(null)
  const pausedAccumRef = React.useRef(0)
  const finishedRef = React.useRef(false)
  const startRef = React.useRef(Date.now())

  const statusRef = React.useRef(status)
  statusRef.current = status
  const onFinishRef = React.useRef(onFinish)
  onFinishRef.current = onFinish

  React.useEffect(() => {
    const iv = window.setInterval(() => {
      if (statusRef.current !== "running") return
      const now = Date.now()
      let elapsedSinceStage = now - (stageEndRef.current ?? 0)
      if (elapsedSinceStage < 0) elapsedSinceStage = 0
      const stageTotal = stage === "tense" ? TENSE_MS : RELAX_MS
      const left = stageTotal - elapsedSinceStage
      setCountdown(Math.max(0, Math.ceil(left / 1000)))
      if (left <= 0 && !finishedRef.current) {
        if (stage === "tense") {
          setStage("relax")
          stageEndRef.current = now
        } else if (part >= PMR_PARTS.length - 1) {
          finishedRef.current = true
          onFinishRef.current(Math.max(30, Math.round((now - startRef.current) / 1000)))
        } else {
          setPart((p) => p + 1)
          setStage("tense")
          stageEndRef.current = now
        }
      }
    }, 100)
    return () => window.clearInterval(iv)
  }, [part, stage])

  React.useEffect(() => {
    setCountdown(stage === "tense" ? TENSE_MS / 1000 : RELAX_MS / 1000)
    stageEndRef.current = null
  }, [part, stage])

  const togglePause = () => {
    setStatus((s) => {
      if (s === "paused") {
        stageEndRef.current = null
        startRef.current += pausedAccumRef.current
        pausedAccumRef.current = 0
        return "running"
      }
      pausedAccumRef.current = Date.now()
      return "paused"
    })
  }

  const reset = () => {
    finishedRef.current = false
    setPart(0)
    setStage("tense")
    setCountdown(TENSE_MS / 1000)
    stageEndRef.current = null
    pausedAccumRef.current = 0
    startRef.current = Date.now()
    setStatus("running")
  }

  const current = PMR_PARTS[part]

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <StepProgress value={part + 1} max={PMR_PARTS.length} />

      <div className="flex h-12 items-center gap-2">
        {PMR_PARTS.map((p, i) => (
          <motion.span
            key={p.name}
            className={cn(
              "h-2.5 rounded-full transition-all",
              i < part ? "bg-emerald-500" : i === part ? "bg-amber-400 w-6" : "bg-slate-200 dark:bg-slate-700 w-2.5"
            )}
          />
        ))}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500 dark:text-amber-400">
          {stage === "tense" ? "Tense" : "Release"} — {countdown}s
        </p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{current.name}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{current.area}</p>
      </div>

      <motion.div
        key={`${part}-${stage}`}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: stage === "tense" ? 1 : 0.92, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className={cn(
          "flex h-28 w-28 items-center justify-center rounded-full text-4xl shadow-xl",
          stage === "tense"
            ? "bg-gradient-to-br from-amber-500 to-orange-400 shadow-amber-500/30"
            : "bg-gradient-to-br from-emerald-500 to-teal-400 shadow-emerald-500/30"
        )}
      >
        {stage === "tense" ? "💪" : "😌"}
      </motion.div>

      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {stage === "tense"
          ? "Hold the tension gently for 5 seconds. Notice it."
          : "Let go completely. Let this area feel soft and heavy for 10 seconds."}
      </p>

      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={togglePause}>
          {status === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {status === "running" ? "Pause" : "Resume"}
        </Button>
        <Button variant="ghost" onClick={reset}>
          <RefreshCw className="h-4 w-4" />
          Restart
        </Button>
      </div>
    </div>
  )
}

/* ── Sleep wind-down ───────────────────────────────────────── */

const SLEEP_STEPS = [
  {
    key: "dim",
    icon: Moon,
    title: "Dim the lights",
    body: "Lower bright lights and screens. Let the room become softer.",
  },
  {
    key: "unplug",
    icon: Coffee,
    title: "Put screens aside",
    body: "Set your phone aside for a few minutes — it can always wait.",
  },
  {
    key: "breathe",
    icon: Wind,
    title: "Calm your breathing",
    body: "Take slow breaths: in through your nose, out slowly through your mouth.",
  },
  {
    key: "scan",
    icon: Footprints,
    title: "Body scan",
    body: "From your feet up to your head, invite each part to relax.",
  },
]

function SleepRunner({ exercise: _exercise, onFinish }: RunnerProps) {
  const [step, setStep] = React.useState(0)
  const [elapsed, setElapsed] = React.useState(0)
  const startRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    startRef.current = Date.now()
    const iv = window.setInterval(() => {
      if (startRef.current) setElapsed((Date.now() - startRef.current) / 1000)
    }, 1000)
    return () => window.clearInterval(iv)
  }, [])

  const current = SLEEP_STEPS[step]

  return (
    <div className="flex flex-col gap-6 py-2">
      <StepProgress value={step + 1} max={SLEEP_STEPS.length} />

      <motion.div
        key={current.key}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center gap-4 py-4 text-center"
      >
        <motion.div
          className="flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-500/15 text-purple-600 dark:text-purple-300"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <current.icon className="h-9 w-9" />
        </motion.div>
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{current.title}</h3>
          <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">{current.body}</p>
        </div>
        <motion.div
          className="h-10 w-40 rounded-full bg-gradient-to-r from-purple-300/40 to-teal-200/40 blur-sm"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </motion.div>

      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        {step >= SLEEP_STEPS.length - 1 ? (
          <Button size="lg" onClick={() => onFinish(Math.max(30, Math.round(elapsed)))}>
            <Moon className="h-4 w-4" />
            Go settle in
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => Math.min(SLEEP_STEPS.length - 1, s + 1))}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

/* ── Positive reflection ───────────────────────────────────── */

function GratitudeRunner({ exercise: _exercise, onFinish }: RunnerProps) {
  const [prompts, setPrompts] = React.useState(() => {
    const arr = [...GRATITUDE_PROMPTS]
    let seed = Date.now() % arr.length
    const out: string[] = []
    while (arr.length > 0) {
      seed = (seed * 31 + 7) % arr.length
      out.push(arr.splice(seed, 1)[0])
      if (arr.length === 0) break
      seed = seed % Math.max(1, arr.length)
    }
    return out.slice(0, 3)
  })
  const [grateful, setGrateful] = React.useState(["", "", ""])
  const [affirmations, setAffirmations] = React.useState<string[]>([])
  const [elapsed, setElapsed] = React.useState(0)
  const startRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    startRef.current = Date.now()
    const iv = window.setInterval(() => {
      if (startRef.current) setElapsed((Date.now() - startRef.current) / 1000)
    }, 1000)
    return () => window.clearInterval(iv)
  }, [])

  const shuffle = () => {
    const arr = [...GRATITUDE_PROMPTS]
    const out: string[] = []
    while (arr.length > 0) out.push(arr.splice(Math.floor(Math.random() * arr.length), 1)[0])
    setPrompts(out.slice(0, 3))
  }

  const toggleAffirmation = (a: string) => {
    setAffirmations((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }

  const save = () => {
    const lines = grateful.filter(Boolean)
    const note = lines.length ? lines.join(" | ") : affirmation
    onFinish(Math.max(30, Math.round(elapsed)), note || undefined)
  }

  const affirmation = affirmations.length > 0 ? `I feel: ${affirmations.join(", ")}` : undefined

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Gratitude & affirmation
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Small reflections, big brightness.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={shuffle}>
          <RefreshCw className="h-3.5 w-3.5" />
          New prompts
        </Button>
      </div>

      <div className="grid gap-3">
        {prompts.map((prompt, i) => (
          <div key={prompt} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <p className="flex items-start gap-2 text-sm font-medium text-rose-600 dark:text-rose-300">
              <Quote className="mt-0.5 h-4 w-4 shrink-0" />
              {prompt}
            </p>
            <Input
              value={grateful[i]}
              onChange={(e) => setGrateful((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
              placeholder="Your answer..."
              className="mt-3 bg-slate-50 dark:bg-slate-900/60"
            />
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Pick an affirmation to keep</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {AFFIRMATIONS.map((a) => {
            const active = affirmations.includes(a)
            return (
              <motion.button
                key={a}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleAffirmation(a)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                  active
                    ? "border-rose-400/60 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200"
                    : "border-slate-200 bg-white text-slate-600 hover:border-rose-300 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300"
                )}
              >
                <span>{a}</span>
                {active && <Check className="h-4 w-4 shrink-0" />}
              </motion.button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <Button size="lg" onClick={save} disabled={grateful.every((g) => !g.trim()) && affirmations.length === 0}>
          <Star className="h-4 w-4" />
          Save my reflection
        </Button>
      </div>
    </div>
  )
}

/* ── Done view ─────────────────────────────────────────────── */

function DoneView({ seconds, notes, onPracticeAgain, onFinishAndExit }: { seconds?: number; notes?: string; onPracticeAgain: () => void; onFinishAndExit: () => void }) {
  const confetti = React.useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        left: (i * 61) % 100,
        delay: (i % 8) * 0.12,
        color: ["#14b8a6", "#8b5cf6", "#f59e0b", "#3b82f6", "#ec4899"][i % 5],
        size: 6 + ((i * 7) % 8),
      })),
    []
  )

  return (
    <div className="relative flex flex-col items-center gap-5 overflow-hidden px-4 py-10 text-center">
      {confetti.map((c, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute top-1/3 rounded-sm"
          style={{ left: `${c.left}%`, width: c.size, height: c.size, background: c.color }}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{ y: [0, 220], opacity: [0.9, 0], rotate: 360 }}
          transition={{ duration: 1.6, delay: c.delay, ease: "easeOut" }}
        />
      ))}

      <motion.div
        initial={{ scale: 0, rotate: -25 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 15 }}
        className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-400 text-white shadow-2xl shadow-teal-500/40"
      >
        <PartyPopper className="h-10 w-10" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">You did it 💛</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {seconds !== undefined ? `Great work — ${formatDuration(seconds)} of mindful practice.` : "A small step, taken with care."}
        </p>
      </motion.div>

      {notes && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-sm rounded-2xl border border-teal-200/70 bg-teal-50/70 px-5 py-3 text-sm text-slate-600 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-slate-300"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-500">Your reflection</p>
          <p className="mt-1 line-clamp-4 break-words text-left">{notes}</p>
        </motion.div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" onClick={onPracticeAgain}>
          <RefreshCw className="h-4 w-4" />
          Practice again
        </Button>
        <Button onClick={onFinishAndExit}>
          <CheckCircle2 className="h-4 w-4" />
          Done
        </Button>
      </div>

      <p className="max-w-xs text-xs text-slate-400 dark:text-slate-500">
        These exercises support everyday well-being but are not a substitute for professional care.
      </p>
    </div>
  )
}

/* ── Runner orchestrator ───────────────────────────────────── */

const RUNNERS: Record<ExerciseCategory, React.ComponentType<RunnerProps>> = {
  breathing: BreathingRunner,
  grounding: GroundingRunner,
  mindfulness: MindfulnessRunner,
  stress: StressRunner,
  cbt: CbtRunner,
  sleep: SleepRunner,
  gratitude: GratitudeRunner,
}

interface ExerciseRunnerProps {
  exercise: Exercise
  onExit?: () => void
  onLog: (exercise: Exercise, durationSeconds: number, notes?: string) => void
  className?: string
}

export function ExerciseRunner({ exercise, onExit, onLog, className }: ExerciseRunnerProps) {
  const [phase, setPhase] = React.useState<"intro" | "active" | "done">("intro")
  const [sessionKey, setSessionKey] = React.useState(0)
  const [result, setResult] = React.useState<{ seconds?: number; notes?: string }>({})
  const loggedRef = React.useRef(false)

  const Runner = RUNNERS[exercise.category] ?? BreathingRunner

  const handleLog = React.useCallback(
    (seconds: number, notes?: string) => {
      if (loggedRef.current) return
      loggedRef.current = true
      setResult({ seconds, notes })
      setPhase("done")
      onLog(exercise, seconds, notes)
    },
    [exercise, onLog]
  )

  const practiceAgain = () => {
    loggedRef.current = false
    setResult({})
    setSessionKey((k) => k + 1)
    setPhase("active")
  }

  const categoryStyle = CATEGORY_STYLES[exercise.category]

  return (
    <div className={cn("flex flex-col", className)}>
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col gap-5 p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-3">
              <Badge variant={categoryStyle.badge}>
                <categoryStyle.icon className="h-3.5 w-3.5" />
                {categoryStyle.label}
              </Badge>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">⏱ {exercise.duration} min</Badge>
                <Badge variant={DIFFICULTY_STYLES[exercise.difficulty]?.badge ?? "secondary"}>
                  {DIFFICULTY_STYLES[exercise.difficulty]?.label ?? "Medium"}
                </Badge>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{exercise.title}</h2>
              {exercise.description && (
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{exercise.description}</p>
              )}
            </div>

            {exercise.steps && exercise.steps.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  How it works
                </p>
                <ol className="space-y-2.5">
                  {exercise.steps.map((s, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{s}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>
            )}

            {exercise.tips && exercise.tips.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Gentle tips
                </p>
                <ul className="space-y-1.5">
                  {exercise.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Heart className="mt-1 h-3.5 w-3.5 shrink-0 text-rose-400" />
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              {onExit && (
                <Button variant="ghost" onClick={onExit}>
                  Back
                </Button>
              )}
              <Button size="lg" className="flex-1 sm:flex-none" onClick={() => setPhase("active")}>
                <Play className="h-4 w-4" />
                Start exercise
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "active" && (
          <motion.div
            key={`active-${sessionKey}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="px-5 py-6 sm:px-8"
          >
            <div className="mb-5">
              <RunnerTopBar exercise={exercise} onExit={onExit} right={null} />
            </div>
            <Runner key={sessionKey} exercise={exercise} onFinish={handleLog} />
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key={`done-${sessionKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-4"
          >
            <DoneView
              seconds={result.seconds}
              notes={result.notes}
              onPracticeAgain={practiceAgain}
              onFinishAndExit={() => {
                onExit?.()
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { WandSparkles }