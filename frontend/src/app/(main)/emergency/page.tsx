"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Phone,
  Globe,
  Clock,
  Info,
  HeartPulse,
  Shield,
  MessageCircle,
  Users,
  Stethoscope,
  Ambulance,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
} from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

interface EmergencyResource {
  id: string
  organization?: string
  name?: string
  phone?: string
  website?: string
  availability?: string
  availability_hours?: string
  description?: string
  country?: string
}

const DEFAULT_COUNTRIES = [
  "Global",
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "India",
  "Germany",
  "France",
]

const HELP_LEVELS = [
  {
    title: "Self-Care",
    icon: HeartPulse,
    description: "Everyday practices you can use on your own to support your wellbeing.",
    examples: ["Taking a walk", "Deep breathing", "Sleeping enough", "Connecting with nature", "Journaling"],
    badgeVariant: "success",
    badgeLabel: "Everyday",
  },
  {
    title: "Talk to Someone",
    icon: MessageCircle,
    description: "Reach out to a trusted friend, family member, or support line. Talking helps.",
    examples: ["Calling a friend", "Texting a helpline", "Sharing how you feel with family", "Joining a support group"],
    badgeVariant: "teal",
    badgeLabel: "Reach out",
  },
  {
    title: "Professional Consultation",
    icon: Stethoscope,
    description: "Book an appointment with a therapist, counselor, psychologist, or doctor.",
    examples: ["Scheduling therapy sessions", "Visiting your family doctor", "Seeing a psychiatrist", "Trying online counseling"],
    badgeVariant: "info",
    badgeLabel: "Professional",
  },
  {
    title: "Urgent Help",
    icon: AlertTriangle,
    description: "When things feel overwhelming and you need help today, reach a crisis line now.",
    examples: ["Calling a crisis hotline", "Going to urgent care", "Using an emergency chat service"],
    badgeVariant: "warning",
    badgeLabel: "Urgent",
  },
  {
    title: "Emergency Support",
    icon: Ambulance,
    description: "If there's immediate danger to yourself or someone else, get emergency help.",
    examples: ["Calling 911 / 112 / local emergency number", "Heading to the nearest emergency room"],
    badgeVariant: "destructive",
    badgeLabel: "Emergency",
  },
]

function normalizeResource(raw: unknown): EmergencyResource {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(d.id ?? d.resource_id ?? `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    organization: typeof d.organization === "string" ? d.organization : typeof d.name === "string" ? d.name : undefined,
    phone: typeof d.phone === "string" ? d.phone : typeof d.phone_number === "string" ? d.phone_number : undefined,
    website: typeof d.website === "string" ? d.website : typeof d.url === "string" ? d.url : undefined,
    availability: typeof d.availability === "string" ? d.availability : typeof d.availability_hours === "string" ? d.availability_hours : undefined,
    description: typeof d.description === "string" ? d.description : undefined,
    country: typeof d.country === "string" ? d.country : undefined,
  }
}

function displayName(r: EmergencyResource): string {
  return r.organization ?? r.name ?? "Unknown Organization"
}

export default function EmergencyPage() {
  const [resources, setResources] = React.useState<EmergencyResource[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState(false)
  const [country, setCountry] = React.useState(DEFAULT_COUNTRIES[0])
  const [countrySelectOpen, setCountrySelectOpen] = React.useState(false)
  const wrapRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setLoadError(false)
      try {
        const raw = await api.emergency.getResources()
        const list = (Array.isArray(raw) ? raw : []).map(normalizeResource)
        if (active) setResources(list)
      } catch {
        if (active) setLoadError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  React.useEffect(() => {
    const onDocumentClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setCountrySelectOpen(false)
    }
    document.addEventListener("mousedown", onDocumentClick)
    return () => document.removeEventListener("mousedown", onDocumentClick)
  }, [])

  const filtered = React.useMemo(() => {
    if (country === "Global") return resources
    return resources.filter((r) => {
      const c = (r.country ?? "")
      return c.toLowerCase().includes(country.toLowerCase()) || country.toLowerCase().includes(c.toLowerCase())
    })
  }, [resources, country])

  const allPhones = React.useMemo(() => {
    const phones = filtered.map((r) => r.phone).filter((p): p is string => !!p)
    if (phones.length > 0) return phones
    const global = resources.map((r) => r.phone).filter((p): p is string => !!p)
    return global.length > 0 ? global : ["911"]
  }, [filtered, resources])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-11 w-full max-w-xs rounded-xl" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Crisis header */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/90 via-indigo-50/70 to-slate-50/60 p-6 sm:p-8 dark:border-blue-500/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="absolute -bottom-16 right-16 h-40 w-40 rounded-full bg-teal-500/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-3xl">
              You are not alone
            </h1>
            <p className="mt-2 max-w-xl text-base text-slate-600 dark:text-slate-300">
              If you are in immediate danger, please call emergency services now.
            </p>
          </div>
          <Button
            size="lg"
            variant="destructive"
            className="shrink-0"
            onClick={() => {
              if (allPhones.length > 0) window.location.href = `tel:${allPhones[0]}`
            }}
          >
            <Phone className="h-5 w-5" />
            Call Emergency
          </Button>
        </div>
      </div>

      {/* Country selector */}
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Globe className="h-4 w-4 text-blue-500" />
          Choose your country to see local resources
        </p>
        <div ref={wrapRef} className="relative max-w-xs">
          <button
            onClick={() => setCountrySelectOpen((o) => !o)}
            className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-800 shadow-sm transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <span>{country}</span>
            <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", countrySelectOpen && "rotate-180")} />
          </button>
          <AnimatePresence>
            {countrySelectOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute z-40 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
              >
                {[...new Set([...DEFAULT_COUNTRIES, ...resources.map((r) => r.country).filter((c): c is string => !!c)])].map((c) => (
                  <li key={c}>
                    <button
                      onClick={() => {
                        setCountry(c)
                        setCountrySelectOpen(false)
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        c === country
                          ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      )}
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Resources list */}
      {loadError && resources.length === 0 ? (
        <EmptyState
          icon={<Phone className="h-7 w-7" />}
          title="Couldn't load emergency resources"
          description="We couldn't reach our resource database. Please call a local emergency line or reach out to someone you trust."
          action={
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Globe className="h-7 w-7" />}
          title="No resources for this country yet"
          description="We're still adding resources for this region. Please check the Global list or contact a nearby helpline."
          action={
            <Button onClick={() => setCountry("Global")} variant="outline">
              Show global resources
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((resource) => {
              const phone = resource.phone ?? ""
              const website = resource.website ?? ""
              return (
                <motion.div
                  key={resource.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                >
                  <Card hoverable className="p-0">
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-teal-400/15">
                              <Shield className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                            </div>
                            <h3 className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">
                              {displayName(resource)}
                            </h3>
                          </div>
                          {resource.availability && (
                            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <Clock className="h-3.5 w-3.5" />
                              {resource.availability}
                            </p>
                          )}
                          {resource.description && (
                            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                              {resource.description}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                          {phone && (
                            <Button
                              variant="destructive"
                              onClick={() => { window.location.href = `tel:${phone}` }}
                              className="w-full sm:w-auto"
                            >
                              <Phone className="h-4 w-4" />
                              Call
                              <span className="font-semibold">{phone}</span>
                            </Button>
                          )}
                          {website && (
                            <a
                              href={website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-transparent px-5 text-sm font-medium text-slate-700 transition-colors hover:border-blue-500/50 hover:bg-blue-50/50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10 dark:hover:text-blue-300 sm:w-auto"
                            >
                              <Globe className="h-4 w-4" />
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {allPhones.length > 0 && (
            <div className="rounded-2xl border border-red-200/70 bg-red-50/60 p-5 dark:border-red-500/20 dark:bg-red-500/[0.06]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Ambulance className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                      In immediate danger?
                    </p>
                    <p className="text-sm text-red-600/80 dark:text-red-300/70">
                      Call now — you deserve help, and help is available.
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={() => { window.location.href = `tel:${allPhones[0]}` }}
                >
                  <Phone className="h-5 w-5" />
                  Call {allPhones[0]}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* When should I seek help guide */}
      <div className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 dark:text-slate-100">
            <Info className="h-5 w-5 text-blue-500" />
            When should I seek help?
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            This is the journey from everyday care to emergency support. You can reach any level at any time — there is no wrong step.
          </p>
        </div>

        <div className="relative space-y-3">
          <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-400 via-blue-400 to-red-500/70 sm:left-6" />
          {HELP_LEVELS.map((level, i) => {
            const Icon = level.icon
            const badgeVariants = {
              success: "success",
              teal: "teal" as const,
              info: "info",
              warning: "warning",
              destructive: "destructive",
            }[level.badgeVariant]
            return (
              <motion.div
                key={level.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative"
              >
                <div className="group ml-0 flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-50 to-slate-100 ring-4 ring-white dark:from-slate-800 dark:to-slate-800 dark:ring-slate-900 sm:h-12 sm:w-12">
                    <Icon className={cn("h-5 w-5", i === 4 ? "text-red-500" : i === 3 ? "text-amber-500" : i === 2 ? "text-blue-500" : i === 1 ? "text-teal-500" : "text-emerald-500")} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                        {i + 1}. {level.title}
                      </h3>
                      <Badge variant={badgeVariants as "success" | "teal" | "info" | "warning" | "destructive"}>
                        {level.badgeLabel}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {level.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {level.examples.map((ex) => (
                        <span key={ex} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-blue-500 dark:text-blue-400" />
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              A note on seeking help
            </p>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Reaching out for help is a sign of strength, not weakness. Whether it is a friend, a helpline, or a professional — you deserve support, and it exists. If this page was helpful, you can also chat with MindEase AI for gentle guidance.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}