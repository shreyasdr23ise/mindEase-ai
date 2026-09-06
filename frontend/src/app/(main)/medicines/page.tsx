"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  Pill,
  Search,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Brain,
  Moon,
  Heart,
  Shield,
  Zap,
  Wind,
  Dumbbell,
  Stethoscope,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

interface Medicine {
  id: string
  name: string
  generic_name?: string
  category?: string
  description?: string
  side_effects?: string[]
  warnings?: string[]
  uses?: string[]
}

const CATEGORIES = [
  { value: "all", label: "All", icon: Pill },
  { value: "pain-relief", label: "Pain Relief", icon: Zap },
  { value: "antidepressants", label: "Antidepressants", icon: Brain },
  { value: "anti-anxiety", label: "Anti-Anxiety", icon: Shield },
  { value: "sleep-aids", label: "Sleep Aids", icon: Moon },
  { value: "supplements", label: "Supplements", icon: Dumbbell },
  { value: "allergy", label: "Allergy", icon: Wind },
  { value: "cardiovascular", label: "Cardiovascular", icon: Heart },
  { value: "general", label: "General", icon: Stethoscope },
]

function normalizeMedicine(raw: unknown): Medicine {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(d.id ?? d.medicine_id ?? `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    name: String(d.name ?? d.brand_name ?? "Unknown Medicine"),
    generic_name: typeof d.generic_name === "string" ? d.generic_name : undefined,
    category: typeof d.category === "string" ? d.category : undefined,
    description: typeof d.description === "string" ? d.description : undefined,
    side_effects: Array.isArray(d.side_effects) ? d.side_effects.map(String) : undefined,
    warnings: Array.isArray(d.warnings) ? d.warnings.map(String) : undefined,
    uses: Array.isArray(d.uses) ? d.uses.map(String) : undefined,
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  "pain-relief": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  antidepressants: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  "anti-anxiety": "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "sleep-aids": "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  supplements: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  allergy: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  cardiovascular: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  general: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
}

export default function MedicinesPage() {
  const router = useRouter()
  const [medicines, setMedicines] = React.useState<Medicine[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState("all")
  const [searching, setSearching] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setLoadError(false)
      try {
        const raw = await api.medicine.search("")
        if (active) {
          const list = (Array.isArray(raw) ? raw : []).map(normalizeMedicine)
          setMedicines(list)
        }
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
  }, [])

  const handleSearch = React.useCallback(async (q: string) => {
    setQuery(q)
    if (!q.trim()) {
      try {
        const raw = await api.medicine.search("")
        setMedicines((Array.isArray(raw) ? raw : []).map(normalizeMedicine))
      } catch {
        // keep existing list
      }
      return
    }
    setSearching(true)
    try {
      const raw = await api.medicine.search(q.trim())
      setMedicines((Array.isArray(raw) ? raw : []).map(normalizeMedicine))
    } catch {
      toast.error("Search failed", "Could not search medicines. Please try again.")
    } finally {
      setSearching(false)
    }
  }, [])

  const filtered = React.useMemo(() => {
    return medicines.filter((m) => {
      if (category !== "all") {
        const cat = (m.category ?? "").toLowerCase().replace(/\s+/g, "-")
        if (cat !== category) return false
      }
      if (query.trim()) {
        const q = query.toLowerCase()
        const haystack = `${m.name} ${m.generic_name ?? ""} ${m.category ?? ""} ${m.description ?? ""}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [medicines, category, query])

  const scrollCategories = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    const amount = 200
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-11 w-full max-w-lg rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Medicine Information"
        subtitle="General educational information about medicines"
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-amber-300/70 bg-gradient-to-r from-amber-50/80 to-orange-50/60 p-4 dark:border-amber-500/25 dark:from-amber-950/30 dark:to-orange-950/20"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              General information only
            </p>
            <p className="mt-0.5 text-sm text-amber-700/80 dark:text-amber-300/70">
              This is not a prescription or personalized medical advice. Always consult a healthcare professional before starting, stopping, or changing any medication.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="relative max-w-lg">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Search medicines by name, category, or use..."
          value={query}
          onChange={(e) => void handleSearch(e.target.value)}
          endIcon={searching ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" /> : undefined}
        />
      </div>

      <div className="relative">
        <button
          onClick={() => scrollCategories("left")}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow-md transition-colors hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900"
          aria-label="Scroll left"
        >
          <ChevronRight className="h-4 w-4 rotate-180 text-slate-600 dark:text-slate-300" />
        </button>
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-2 overflow-x-auto px-6 py-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat.value
            return (
              <motion.button
                key={cat.value}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10 dark:border-blue-400 dark:bg-blue-500/15 dark:text-blue-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:text-blue-300"
                )}
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
              </motion.button>
            )
          })}
        </div>
        <button
          onClick={() => scrollCategories("right")}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow-md transition-colors hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {loadError && medicines.length === 0 ? (
        <EmptyState
          icon={<Pill className="h-7 w-7" />}
          title="Couldn't load medicines"
          description="We couldn't reach the medicine database. Check your connection and try again."
          action={
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-7 w-7" />}
          title="No medicines found"
          description="Try a different search term or change the category filter."
          action={
            query || category !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("")
                  setCategory("all")
                  void handleSearch("")
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((med) => {
              const catKey = (med.category ?? "").toLowerCase().replace(/\s+/g, "-")
              return (
                <motion.button
                  key={med.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  onClick={() => router.push(`/medicines/${med.id}`)}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-teal-400/15">
                      <Pill className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-600 dark:group-hover:text-blue-400" />
                  </div>

                  <div className="mt-3">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                      {med.name}
                    </h3>
                    {med.generic_name && (
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        {med.generic_name}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {med.category && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          CATEGORY_COLORS[catKey] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        )}
                      >
                        {med.category}
                      </span>
                    )}
                  </div>

                  {med.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {med.description}
                    </p>
                  )}
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-500 dark:text-blue-400" />
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Important reminder
            </p>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              The information provided here is for educational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
