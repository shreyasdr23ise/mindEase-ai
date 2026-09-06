"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Clock, Sparkles } from "lucide-react"
import {
  CATEGORY_STYLES,
  DIFFICULTY_STYLES,
  ExerciseRunner,
  FALLBACK_EXERCISES,
  normalizeExercise,
  type Exercise,
  type ExerciseCategory,
} from "@/components/wellness/exercise-runner"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Tabs } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

type CategoryValue = "all" | ExerciseCategory

function sessionExerciseId(raw: unknown): string | undefined {
  const d = (raw ?? {}) as Record<string, unknown>
  if (typeof d.exercise_id === "string") return d.exercise_id
  const nested = d.exercise as Record<string, unknown> | undefined
  if (nested && typeof nested.id === "string") return nested.id
  if (typeof d.exerciseId === "string") return d.exerciseId
  return undefined
}

export default function WellnessPage() {
  const [exercises, setExercises] = React.useState<Exercise[]>([])
  const [loading, setLoading] = React.useState(true)
  const [category, setCategory] = React.useState<CategoryValue>("all")
  const [selected, setSelected] = React.useState<Exercise | null>(null)
  const [runner, setRunner] = React.useState<Exercise | null>(null)
  const [completedIds, setCompletedIds] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    let active = true
    async function load() {
      try {
        const raw = await api.wellness.getExercises()
        const list = (Array.isArray(raw) ? raw : [])
          .map(normalizeExercise)
          .filter((e) => e.title !== "Wellness exercise")
        if (active) {
          if (list.length > 0) {
            setExercises(list)
          } else {
            setExercises(FALLBACK_EXERCISES)
            toast.info("Using built-in exercises", "The online wellness library is empty right now.")
          }
        }
      } catch {
        if (active) {
          setExercises(FALLBACK_EXERCISES)
          toast.info("Using built-in exercises", "The wellness library is offline, so you're seeing built-in exercises.")
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    async function loadSessions() {
      try {
        const sessions = await api.wellness.getSessions()
        if (!active) return
        const ids = new Set<string>()
        if (Array.isArray(sessions)) {
          sessions.forEach((s) => {
            const id = sessionExerciseId(s)
            if (id) ids.add(id)
          })
        }
        setCompletedIds(ids)
      } catch {
        // sessions are offline — quietly skip
      }
    }
    void load()
    void loadSessions()
    return () => {
      active = false
    }
  }, [])

  const tabs = React.useMemo(
    () => [
      { value: "all", label: "All", icon: <Sparkles className="h-4 w-4" /> },
      ...(Object.keys(CATEGORY_STYLES) as ExerciseCategory[]).map((cat) => {
        const style = CATEGORY_STYLES[cat]
        return { value: cat, label: style.label, icon: <style.icon className="h-4 w-4" /> }
      }),
    ],
    []
  )

  const filtered = React.useMemo(
    () => (category === "all" ? exercises : exercises.filter((e) => e.category === category)),
    [exercises, category]
  )

  const handleLog = React.useCallback(
    async (exercise: Exercise, durationSeconds: number, notes?: string) => {
      try {
        await api.wellness.createSession({
          exercise_id: exercise.id,
          completed: true,
          duration_seconds: Math.max(1, Math.round(durationSeconds)),
          notes,
        })
        setCompletedIds((prev) => new Set(prev).add(exercise.id))
        toast.success("Session saved", `Nice work with “${exercise.title}”.`)
      } catch {
        toast.error("Couldn't log your session", "Your practice still counts — we just couldn't reach the server.")
      }
    },
    []
  )

  const startSelected = () => {
    if (!selected) return
    setRunner(selected)
    setSelected(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-11 w-full max-w-2xl rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={cn("h-48 rounded-2xl", i % 2 === 0 && "lg:translate-y-3")} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Wellness Center"
        subtitle="Small, science-informed practices for calm, focus, sleep, and steadier days."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={tabs} value={category} onValueChange={(v) => setCategory(v as CategoryValue)} />
        {(completedIds.size > 0 || exercises.length > 0) && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Badge variant="success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {completedIds.size} completed
            </Badge>
            <Badge variant="secondary">{exercises.length} exercises</Badge>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-7 w-7" />}
          title="No exercises here yet"
          description="Check back soon — we're adding more practices to this category."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((exercise) => {
              const style = CATEGORY_STYLES[exercise.category]
              const difficulty = DIFFICULTY_STYLES[exercise.difficulty] ?? DIFFICULTY_STYLES.medium
              const completed = completedIds.has(exercise.id)
              return (
                <motion.button
                  key={exercise.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  onClick={() => setSelected(exercise)}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors duration-300 hover:border-blue-500/40 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", style.iconBox)}>
                      <style.icon className="h-5 w-5" />
                    </div>
                    {completed && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", style.chip)}>
                      <style.icon className="h-3.5 w-3.5" />
                      {style.label}
                    </span>
                    <h3 className="mt-2.5 text-base font-semibold text-slate-800 dark:text-slate-100">
                      {exercise.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                      {exercise.description}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3" />
                      {exercise.duration} min
                    </Badge>
                    <Badge variant={difficulty.badge}>{difficulty.label}</Badge>
                    <ArrowRight className="ml-auto h-4 w-4 text-blue-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  </div>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Detail preview */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title}
        description={selected?.description}
        className="max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button onClick={startSelected}>
              Start exercise
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        }
      >
        {selected && (() => {
          const catStyle = CATEGORY_STYLES[selected.category];
          const CatIcon = catStyle.icon;
          return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={catStyle.badge}>
                <CatIcon className="h-3.5 w-3.5" />
                {catStyle.label}
              </Badge>
              <Badge variant="secondary">
                <Clock className="h-3 w-3" />
                {selected.duration} min
              </Badge>
              <Badge variant={DIFFICULTY_STYLES[selected.difficulty]?.badge ?? "secondary"}>
                {DIFFICULTY_STYLES[selected.difficulty]?.label ?? "Medium"}
              </Badge>
            </div>

            {selected.steps && selected.steps.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  How it works
                </p>
                <ol className="space-y-2.5">
                  {selected.steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {selected.tips && selected.tips.length > 0 && (
              <p className="rounded-xl border border-teal-200/70 bg-teal-50/70 px-4 py-3 text-xs leading-relaxed text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
                💡 {selected.tips[0]}
              </p>
            )}
          </div>
          );
        })()}
      </Modal>

      {/* Full-screen runner */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {runner && (
              <div className="fixed inset-0 z-[70] overflow-y-auto">
                <motion.div
                  className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setRunner(null)}
                />
                <div className="relative z-10 flex min-h-full items-center justify-center p-0 sm:p-6">
                  <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className="w-full max-w-xl overflow-hidden rounded-none bg-white shadow-2xl sm:rounded-2xl dark:border dark:border-slate-800 dark:bg-slate-900"
                  >
                    <ExerciseRunner
                      key={runner.id}
                      exercise={runner}
                      onExit={() => setRunner(null)}
                      onLog={handleLog}
                    />
                  </motion.div>
                </div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </motion.div>
  )
}