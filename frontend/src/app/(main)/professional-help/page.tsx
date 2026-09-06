"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Shield,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Briefcase,
  RefreshCw,
  Calendar,
  IndianRupee,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Avatar } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Modal } from "@/components/ui/modal"
import { Tabs } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import { api } from "@/lib/api"

interface Counselor {
  id: string
  name: string
  specialty?: string
  specialties?: string[]
  experience_years?: number
  location?: string
  rating?: number
  online?: boolean
  fee?: number
  bio?: string
  avatar?: string
  availability?: string[]
  schedule?: string[]
}

interface RequestEntry {
  id: string
  counselor_id?: string
  counselor_name?: string
  message?: string
  preferred_date?: string
  preferred_time?: string
  status?: string
  created_at?: string
}

const SPECIALTIES = ["All Specialties", "Anxiety", "Depression", "Trauma", "Relationships", "Stress", "Grief", "Addiction", "LGBTQ+", "Sleep"]

function normalizeCounselor(raw: unknown): Counselor {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(d.id ?? d.counselor_id ?? `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    name: String(d.name ?? "Counselor"),
    specialty: typeof d.specialty === "string" ? d.specialty : undefined,
    specialties: Array.isArray(d.specialties) ? d.specialties.map(String) : undefined,
    experience_years: typeof d.experience_years === "number" ? d.experience_years : typeof d.experience === "number" ? d.experience : typeof d.years_experience === "number" ? d.years_experience : undefined,
    location: typeof d.location === "string" ? d.location : undefined,
    rating: typeof d.rating === "number" ? d.rating : typeof d.average_rating === "number" ? d.average_rating : undefined,
    online: typeof d.online === "boolean" ? d.online : typeof d.is_online === "boolean" ? d.is_online : undefined,
    fee: typeof d.fee === "number" ? d.fee : typeof d.fee_per_session === "number" ? d.fee_per_session : typeof d.consultation_fee === "number" ? d.consultation_fee : undefined,
    bio: typeof d.bio === "string" ? d.bio : typeof d.description === "string" ? d.description : undefined,
    avatar: typeof d.avatar === "string" ? d.avatar : undefined,
    availability: Array.isArray(d.availability) ? d.availability.map(String) : Array.isArray(d.schedule) ? d.schedule.map(String) : undefined,
  }
}

function normalizeRequest(raw: unknown): RequestEntry {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(d.id ?? d.request_id ?? `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    counselor_id: typeof d.counselor_id === "string" ? d.counselor_id : undefined,
    counselor_name: typeof d.counselor_name === "string" ? d.counselor_name : undefined,
    message: typeof d.message === "string" ? d.message : undefined,
    preferred_date: typeof d.preferred_date === "string" ? d.preferred_date : undefined,
    preferred_time: typeof d.preferred_time === "string" ? d.preferred_time : undefined,
    status: typeof d.status === "string" ? d.status : undefined,
    created_at: typeof d.created_at === "string" ? d.created_at : undefined,
  }
}

function getStatusBadge(status: string): { variant: "warning" | "success" | "destructive" | "info"; label: string } {
  const s = status.toLowerCase()
  if (s.includes("accept") || s.includes("confirm")) return { variant: "success", label: "Accepted" }
  if (s.includes("reject") || s.includes("decline") || s.includes("denied")) return { variant: "destructive", label: "Rejected" }
  if (s.includes("complete") || s.includes("finish") || s.includes("done")) return { variant: "info", label: "Completed" }
  return { variant: "warning", label: "Pending" }
}

function formatDateShort(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

export default function ProfessionalHelpPage() {
  const [counselors, setCounselors] = React.useState<Counselor[]>([])
  const [requests, setRequests] = React.useState<RequestEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadingRequests, setLoadingRequests] = React.useState(true)
  const [loadError, setLoadError] = React.useState(false)
  const [reloadKey, setReloadKey] = React.useState(0)
  const [activeTab, setActiveTab] = React.useState("explore")

  const [query, setQuery] = React.useState("")
  const [specialty, setSpecialty] = React.useState("All Specialties")
  const [filterOnline, setFilterOnline] = React.useState("all")
  const [filterRating, setFilterRating] = React.useState("all")
  const [sortBy, setSortBy] = React.useState("rating")

  const [selected, setSelected] = React.useState<Counselor | null>(null)
  const [requestMessage, setRequestMessage] = React.useState("")
  const [requestDate, setRequestDate] = React.useState("")
  const [requestTime, setRequestTime] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    let active = true
    async function loadCounselors() {
      try {
        const raw = await api.counselors.getAll()
        if (!active) return
        setCounselors((Array.isArray(raw) ? raw : []).map(normalizeCounselor))
      } catch {
        if (active) setLoadError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    async function loadRequests() {
      try {
        const raw = await api.counselors.getRequests()
        if (!active) return
        setRequests((Array.isArray(raw) ? raw : []).map(normalizeRequest))
      } catch {
        // requests are optional — silently skip
      } finally {
        if (active) setLoadingRequests(false)
      }
    }
    void loadCounselors()
    void loadRequests()
    return () => {
      active = false
    }
  }, [reloadKey])

  const retryLoad = () => {
    setLoadError(false)
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  const filtered = React.useMemo(() => {
    let list = counselors.filter((c) => {
      if (specialty !== "All Specialties") {
        const cSpecialty = (c.specialty ?? "").toLowerCase()
        const cSpecialties = (c.specialties ?? []).map((s) => s.toLowerCase())
        if (!cSpecialty.includes(specialty.toLowerCase()) && !cSpecialties.includes(specialty.toLowerCase())) return false
      }
      if (filterOnline === "online" && !c.online) return false
      if (filterOnline === "offline" && c.online) return false
      if (filterRating === "4.5" && (c.rating ?? 0) < 4.5) return false
      if (filterRating === "4" && (c.rating ?? 0) < 4) return false
      if (filterRating === "3" && (c.rating ?? 0) < 3) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        const hay = `${c.name} ${c.specialty ?? ""} ${(c.specialties ?? []).join(" ")} ${c.location ?? ""} ${c.bio ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    if (sortBy === "rating") list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    else if (sortBy === "experience") list = [...list].sort((a, b) => (b.experience_years ?? 0) - (a.experience_years ?? 0))
    else if (sortBy === "fee") list = [...list].sort((a, b) => (a.fee ?? 0) - (b.fee ?? 0))

    return list
  }, [counselors, query, specialty, filterOnline, filterRating, sortBy])

  const filterCount = [
    specialty !== "All Specialties",
    filterOnline !== "all",
    filterRating !== "all",
  ].filter(Boolean).length

  const openCounselor = (c: Counselor) => {
    setSelected(c)
    setRequestMessage("")
    setRequestDate("")
    setRequestTime("")
  }

  const handleRequest = async () => {
    if (!selected) return
    if (!requestMessage.trim()) {
      toast.error("Write a short message", "Tell the counselor a little about what you're looking for.")
      return
    }
    setSubmitting(true)
    try {
      const created = await api.counselors.createRequest({
        counselor_id: selected.id,
        message: requestMessage.trim(),
      })
      const normalized = normalizeRequest(created)
      setRequests((prev) => [normalized, ...prev])
      toast.success("Request sent", `${selected.name} will get back to you soon.`)
      setSelected(null)
    } catch {
      toast.error("Couldn't send request", "Please check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Professional Support"
        subtitle="Connect with mental health professionals"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Shield className="h-3.5 w-3.5" />
            MindEase AI is not a substitute for professional care.
          </span>
        }
      />

      <Tabs
        tabs={[
          { value: "explore", label: "Explore counselors", icon: <Search className="h-4 w-4" /> },
          { value: "requests", label: "My requests", icon: <MessageCircle className="h-4 w-4" /> },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      {activeTab === "explore" ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
            <Input
              icon={<Search className="h-4 w-4" />}
              placeholder="Search by name, specialty, or location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select
              options={SPECIALTIES.map((s) => ({ value: s, label: s }))}
              value={specialty}
              onChange={setSpecialty}
              placeholder="Specialty"
              label=""
              className="sm:w-44"
            />
            <Select
              options={[
                { value: "all", label: "All availability" },
                { value: "online", label: "Online only" },
                { value: "offline", label: "In-person only" },
              ]}
              value={filterOnline}
              onChange={setFilterOnline}
              placeholder="Availability"
              className="sm:w-44"
            />
            <Select
              options={[
                { value: "all", label: "Any rating" },
                { value: "4.5", label: "4.5+ stars" },
                { value: "4", label: "4+ stars" },
                { value: "3", label: "3+ stars" },
              ]}
              value={filterRating}
              onChange={setFilterRating}
              placeholder="Rating"
              className="sm:w-40"
            />
            <Select
              options={[
                { value: "rating", label: "Sort: Top rated" },
                { value: "experience", label: "Sort: Most experienced" },
                { value: "fee", label: "Sort: Lowest fee" },
              ]}
              value={sortBy}
              onChange={setSortBy}
              placeholder="Sort by"
              className="sm:w-48"
            />
          </div>

          {loadError && counselors.length === 0 ? (
            <EmptyState
              icon={<SlidersHorizontal className="h-7 w-7" />}
              title="Couldn't load counselors"
              description="We couldn't reach the counselor directory. Please check your connection and try again."
              action={
                <Button onClick={retryLoad} variant="outline">
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="h-7 w-7" />}
              title="No counselors match"
              description="Try adjusting your filters or clearing your search."
              action={
                query || filterCount > 0 ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery("")
                      setSpecialty("All Specialties")
                      setFilterOnline("all")
                      setFilterRating("all")
                      setSortBy("rating")
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
                {filtered.map((counselor) => {
                  const specialties = counselor.specialties ?? (counselor.specialty ? [counselor.specialty] : [])
                  return (
                    <motion.button
                      key={counselor.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      onClick={() => openCounselor(counselor)}
                      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <Avatar
                          name={counselor.name}
                          src={counselor.avatar}
                          size="lg"
                          online={counselor.online}
                        />
                        {counselor.online ? (
                          <Badge variant="success">Online</Badge>
                        ) : (
                          <Badge variant="secondary">Offline</Badge>
                        )}
                      </div>

                      <div className="mt-3">
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                          {counselor.name}
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                          {counselor.specialty ?? (specialties[0] ?? "Mental Health")}
                        </p>
                      </div>

                      {(counselor.rating !== undefined || counselor.experience_years !== undefined || counselor.location) && (
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                          {counselor.rating !== undefined && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              {counselor.rating.toFixed(1)}
                            </span>
                          )}
                          {counselor.experience_years !== undefined && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5" />
                              {counselor.experience_years} yrs
                            </span>
                          )}
                          {counselor.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {counselor.location}
                            </span>
                          )}
                        </div>
                      )}

                      {specialties.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {specialties.slice(0, 3).map((s) => (
                            <span key={s} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {counselor.fee !== undefined && (
                        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
                          <Clock className="h-4 w-4 text-slate-400" />
                          ₹{counselor.fee} / session
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      ) : (
        <>
          {loadingRequests ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-7 w-7" />}
              title="No requests yet"
              description="When you request a consultation with a counselor, your requests will appear here."
              action={
                <Button onClick={() => setActiveTab("explore")} variant="outline">
                  <Search className="h-4 w-4" />
                  Browse counselors
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {Array.from(new Set(requests.map((r) => r.id))).map((requestId) => {
                const request = requests.find((r) => r.id === requestId) ?? requests[0]
                if (!request) return null
                const status = getStatusBadge(request.status ?? "pending")
                const StatusIcon = status.variant === "success" ? CheckCircle2 : status.variant === "destructive" ? XCircle : status.variant === "info" ? Clock : HelpCircle
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardContent className="p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                                {request.counselor_name ?? "Counselor"}
                              </h3>
                              <Badge variant={status.variant}>
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </div>
                            {request.created_at && (
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                                <Calendar className="h-3.5 w-3.5" />
                                Requested {formatDateShort(request.created_at)}
                              </p>
                            )}
                            {request.message && (
                              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                {request.message}
                              </p>
                            )}
                            {(request.preferred_date || request.preferred_time) && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {request.preferred_date && (
                                  <Badge variant="outline">
                                    <Calendar className="h-3 w-3" />
                                    {formatDateShort(request.preferred_date)}
                                  </Badge>
                                )}
                                {request.preferred_time && (
                                  <Badge variant="outline">
                                    <Clock className="h-3 w-3" />
                                    {request.preferred_time}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Phone className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Counselor detail */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name}
        description={selected?.specialty ?? "Mental Health Professional"}
        className="max-w-2xl"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={selected.name} src={selected.avatar} size="xl" online={selected.online} />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {selected.online ? (
                    <Badge variant="success">Online</Badge>
                  ) : (
                    <Badge variant="secondary">Offline</Badge>
                  )}
                  {selected.rating !== undefined && (
                    <Badge variant="warning">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {selected.rating.toFixed(1)}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                  {selected.experience_years !== undefined && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {selected.experience_years} years experience
                    </span>
                  )}
                  {selected.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {selected.location}
                    </span>
                  )}
                  {selected.fee !== undefined && (
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {selected.fee} / session
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selected.bio && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  About
                </p>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {selected.bio}
                </p>
              </div>
            )}

            {(selected.specialties ?? (selected.specialty ? [selected.specialty] : [])).length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Specialties
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(selected.specialties ?? (selected.specialty ? [selected.specialty] : [])).map((s) => (
                    <Badge key={s} variant="default">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {selected.availability && selected.availability.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Availability
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.availability.map((slot) => (
                    <Badge key={slot} variant="outline">
                      <Clock className="h-3 w-3" />
                      {slot}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-blue-200/70 bg-blue-50/60 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Request a consultation
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
Tell the counselor a little about what you are looking for.
              </p>
              <div className="mt-4 space-y-3">
                <Textarea
                  label="Message"
                  placeholder="Hi, I'm looking for support with..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="min-h-28"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Preferred date"
                    type="date"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                  />
                  <Input
                    label="Preferred time"
                    type="time"
                    value={requestTime}
                    onChange={(e) => setRequestTime(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => void handleRequest()} disabled={submitting}>
                    {submitting ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                    {submitting ? "Sending..." : "Request Consultation"}
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              Requests are sent to the counselor for review. MindEase AI does not provide medical care — this connects you with independent professionals.
            </p>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}