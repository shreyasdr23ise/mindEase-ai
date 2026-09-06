"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Heart,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  PartyPopper,
  Check,
  ArrowRight,
} from "lucide-react"
import { AiOrb } from "@/components/shared/ai-orb"
import { MoodEmoji } from "@/components/shared/mood-emoji"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/toast"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

const GOAL_OPTIONS = [
  "Reduce Stress",
  "Manage Anxiety",
  "Improve Sleep",
  "Track Emotions",
  "Build Healthy Habits",
  "Journal",
  "Learn About Mental Wellness",
]

const STYLE_OPTIONS = [
  {
    value: "warm_empathetic",
    label: "Warm & Empathetic",
    description: "Nurturing, gentle and supportive. Great for comfort and reassurance.",
    emoji: "🤗",
  },
  {
    value: "calm_direct",
    label: "Calm & Direct",
    description: "Clear, grounded and practical. Great for structured guidance.",
    emoji: "🎯",
  },
  {
    value: "friendly_casual",
    label: "Friendly & Casual",
    description: "Relaxed, playful and light. Great for everyday chats.",
    emoji: "😊",
  },
]

const MOOD_OPTIONS = [
  { value: "very_bad", label: "Very Low", emoji: "😢" },
  { value: "bad", label: "Low", emoji: "😞" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "good", label: "Good", emoji: "🙂" },
  { value: "very_good", label: "Great", emoji: "😄" },
]

const PRIVACY_OPTIONS = [
  {
    key: "share_anonymized_data",
    label: "Share anonymized data",
    description: "Help us improve MindEase by sharing anonymized usage insights.",
  },
  {
    key: "share_session_insights",
    label: "Share session insights",
    description: "Allow our AI to use past conversations to personalize responses.",
  },
  {
    key: "keep_mood_history",
    label: "Keep mood history",
    description: "Store your mood logs locally to power trends and insights.",
  },
  {
    key: "allow_activity_reminders",
    label: "Activity reminders",
    description: "Gentle nudges to check in on your well-being throughout the day.",
  },
]

const TOTAL_STEPS = 7

const stepVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction >= 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction >= 0 ? -60 : 60 }),
}

interface OnboardingData {
  displayName: string
  goals: string[]
  interactionStyle: string
  moodBaseline: string
  privacy: Record<string, boolean>
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(0)
  const [direction, setDirection] = React.useState(1)

  const [data, setData] = React.useState<OnboardingData>({
    displayName: "",
    goals: [],
    interactionStyle: "",
    moodBaseline: "",
    privacy: {
      share_anonymized_data: true,
      share_session_insights: false,
      keep_mood_history: true,
      allow_activity_reminders: true,
    },
  })
  const [displayNameError, setDisplayNameError] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const goTo = (next: number) => {
    setDirection(next >= step ? 1 : -1)
    setStep(Math.min(TOTAL_STEPS - 1, Math.max(0, next)))
  }

  const next = () => {
    if (step === 1 && !data.displayName.trim()) {
      setDisplayNameError("Please tell us what to call you")
      return
    }
    if (step === 1) setDisplayNameError("")
    goTo(step + 1)
  }

  const skipStep = () => {
    if (step === 1 && !data.displayName.trim()) {
      const fallback = "Friend"
      setData((d) => ({ ...d, displayName: fallback }))
      toast.info("Using 'Friend' for now", "You can change your name anytime in Profile.")
    }
    goTo(step + 1)
  }

  const toggleGoal = (goal: string) => {
    setData((d) => ({
      ...d,
      goals: d.goals.includes(goal)
        ? d.goals.filter((g) => g !== goal)
        : d.goals.length >= 4
          ? d.goals
          : [...d.goals, goal],
    }))
  }

  const finish = async () => {
    setSaving(true)
    try {
      await api.onboarding.complete({
        display_name: data.displayName.trim() || "Friend",
        goals: data.goals,
        interaction_style: data.interactionStyle || "warm_empathetic",
        mood_baseline: data.moodBaseline || null,
        privacy: data.privacy,
        completed_at: new Date().toISOString(),
      })
      toast.success("You're all set!", "Welcome to your MindEase AI space.")
      router.replace("/dashboard")
    } catch {
      toast.error("Couldn't save preferences", "You can still explore — we'll use default settings.")
      router.replace("/dashboard")
    } finally {
      setSaving(false)
    }
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center px-4 py-8">
      {/* Progress */}
      <div className="mb-8 w-full max-w-xl">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Getting set up</span>
          <span>
            Step {step + 1} of {TOTAL_STEPS}
          </span>
        </div>
        <Progress value={progress} color="teal" size="sm" />
      </div>

      {/* Step content */}
      <div className="relative w-full flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full"
          >
            {/* Step 1 — Welcome */}
            {step === 0 && (
              <div className="flex flex-col items-center gap-8 py-10 text-center">
                <AiOrb size={170} pulseSpeed={3.5} />
                <div className="space-y-3">
                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-3xl font-bold text-transparent dark:from-blue-400 dark:to-teal-300 sm:text-4xl"
                  >
                    Welcome to MindEase AI
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mx-auto max-w-md text-slate-600 dark:text-slate-300"
                  >
                    A gentle space to talk, reflect and care for your mental well-being.
                    Let&apos;s personalize a few things so MindEase can support you best.
                  </motion.p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-teal-500" /> Private by default
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" /> No judgment
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-500" /> You stay in control
                  </span>
                </div>
              </div>
            )}

            {/* Step 2 — Display name */}
            {step === 1 && (
              <div className="space-y-6 py-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    What should we call you?
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    This is how MindEase will greet you. You can change it anytime.
                  </p>
                </div>
                <div className="mx-auto max-w-sm">
                  <Input
                    autoFocus
                    label="Display name"
                    placeholder="e.g. Alex"
                    value={data.displayName}
                    onChange={(e) => {
                      setData((d) => ({ ...d, displayName: e.target.value }))
                      if (displayNameError) setDisplayNameError("")
                    }}
                    error={displayNameError}
                  />
                </div>
              </div>
            )}

            {/* Step 3 — Goals */}
            {step === 2 && (
              <div className="space-y-6 py-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    What would you like to focus on?
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    Pick up to 4 goals — we&apos;ll tailor experiences around them.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2.5">
                  {GOAL_OPTIONS.map((goal, i) => {
                    const selected = data.goals.includes(goal)
                    return (
                      <motion.button
                        key={goal}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleGoal(goal)}
                        className={cn(
                          "relative flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                          selected
                            ? "border-transparent bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/25"
                            : "border-slate-300 bg-white text-slate-700 hover:border-blue-500/50 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10"
                        )}
                      >
                        {selected && <Check className="h-4 w-4" />}
                        {goal}
                        {!selected && data.goals.length >= 4 && (
                          <span className="sr-only">disabled</span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
                {data.goals.length >= 4 && (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                    Maximum of 4 goals selected.
                  </p>
                )}
              </div>
            )}

            {/* Step 4 — Interaction style */}
            {step === 3 && (
              <div className="space-y-6 py-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    How would you like your AI companion to talk?
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    Choose a style that feels most comfortable to you.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {STYLE_OPTIONS.map((style) => {
                    const selected = data.interactionStyle === style.value
                    return (
                      <motion.button
                        key={style.value}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setData((d) => ({ ...d, interactionStyle: style.value }))}
                        className={cn(
                          "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200",
                          selected
                            ? "border-blue-500 bg-blue-50/70 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30 dark:border-blue-500 dark:bg-blue-500/10"
                            : "border-slate-200 bg-white hover:border-blue-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                        )}
                      >
                        <span className="text-2xl">{style.emoji}</span>
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            selected
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-slate-800 dark:text-slate-100"
                          )}
                        >
                          {style.label}
                        </span>
                        <span className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {style.description}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 5 — Mood baseline */}
            {step === 4 && (
              <div className="space-y-6 py-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    How are you feeling right now?
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    Optional — this gives MindEase a helpful starting point.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                  {MOOD_OPTIONS.map((mood) => {
                    const selected = data.moodBaseline === mood.value
                    return (
                      <motion.button
                        key={mood.value}
                        type="button"
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setData((d) => ({ ...d, moodBaseline: mood.value }))}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-2xl border px-4 py-3 transition-all duration-200",
                          selected
                            ? "border-teal-500 bg-teal-50/70 shadow-lg shadow-teal-500/10 ring-2 ring-teal-500/30 dark:border-teal-400 dark:bg-teal-500/10"
                            : "border-slate-200 bg-white hover:border-teal-500/40 dark:border-slate-800 dark:bg-slate-900"
                        )}
                      >
                        <motion.span
                          aria-hidden
                          animate={selected ? { scale: 1.15 } : { scale: 1 }}
                          className="text-3xl leading-none"
                        >
                          {mood.emoji}
                        </motion.span>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            selected
                              ? "text-teal-700 dark:text-teal-300"
                              : "text-slate-500 dark:text-slate-400"
                          )}
                        >
                          {mood.label}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 6 — Privacy */}
            {step === 5 && (
              <div className="space-y-6 py-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    Your privacy, your call
                  </h2>
                  <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
                    You control what&apos;s shared. These defaults keep your data safe —
                    change them anytime in Settings.
                  </p>
                </div>
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/60">
                  {PRIVACY_OPTIONS.map((option) => (
                    <div
                      key={option.key}
                      className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0 last:pb-1 dark:border-slate-800"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {option.label}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {option.description}
                        </p>
                      </div>
                      <Switch
                        checked={data.privacy[option.key]}
                        onCheckedChange={(checked) =>
                          setData((d) => ({
                            ...d,
                            privacy: { ...d.privacy, [option.key]: checked },
                          }))
                        }
                        aria-label={option.label}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7 — Finish */}
            {step === 6 && (
              <div className="flex flex-col items-center gap-8 py-10 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 shadow-2xl shadow-teal-500/30"
                >
                  <PartyPopper className="h-12 w-12 text-white" />
                </motion.div>
                <div className="space-y-3">
                  <motion.h2
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-3xl font-bold text-slate-800 dark:text-slate-100"
                  >
                    You&apos;re all set{data.displayName ? `, ${data.displayName.trim()}` : ""}!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mx-auto max-w-md text-slate-600 dark:text-slate-300"
                  >
                    Everything is ready. Let&apos;s step into your calm, private space and take
                    the first step for your well-being.
                  </motion.p>
                </div>
                <div className="flex items-center gap-3">
                  <MoodEmoji mood={data.moodBaseline || "neutral"} size="lg" />
                  <MoodEmoji mood="good" size="lg" />
                  <MoodEmoji mood="very_good" size="lg" />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex w-full max-w-xl items-center justify-between gap-3">
        {step > 0 ? (
          <Button variant="outline" onClick={() => goTo(step - 1)} disabled={saving}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <span />
        )}

        {step < TOTAL_STEPS - 1 ? (
          <div className="ml-auto flex items-center gap-2">
            {step === 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  toast.info("Skipping setup", "You can personalize everything later in Settings.")
                  router.replace("/dashboard")
                }}
              >
                Skip
              </Button>
            )}
            {step === 1 || step === 2 || step === 3 || step === 4 ? (
              <Button variant="ghost" onClick={skipStep}>
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
            ) : null}
            <Button onClick={next}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            className="ml-auto"
            onClick={finish}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Setting things up...
              </>
            ) : (
              <>
                Start your journey
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}