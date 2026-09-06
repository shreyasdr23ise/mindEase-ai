"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  NotebookPen,
  Plus,
  Search,
  Trash2,
  PenLine,
  X,
  Sparkles,
  RefreshCw,
  Quote,
  Clock,
  Feather,
  WandSparkles,
  ShieldCheck,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { MoodEmoji } from "@/components/shared/mood-emoji"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/ui/modal"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/toast"
import { cn, formatDate } from "@/lib/utils"
import { api } from "@/lib/api"

interface JournalEntry {
  id: string
  title?: string
  content: string
  mood?: string
  created_at?: string
  updated_at?: string
}

interface ReflectionState {
  text: string
  source: "ai" | "local" | "pending"
}

const MOOD_OPTIONS = [
  { value: "very_bad", label: "Very bad" },
  { value: "bad", label: "Bad" },
  { value: "neutral", label: "Neutral" },
  { value: "good", label: "Good" },
  { value: "very_good", label: "Very good" },
]

const WRITING_PROMPTS = [
  "What was one thing that made today difficult?",
  "What went well today, even a little?",
  "What are you grateful for today?",
  "What's on your mind right now?",
  "If today had a title, what would it be?",
]

const MOOD_ACCENT: Record<string, string> = {
  very_bad: "border-red-300/70 bg-red-50/40 dark:border-red-500/25 dark:bg-red-500/[0.07]",
  bad: "border-orange-300/70 bg-orange-50/40 dark:border-orange-500/25 dark:bg-orange-500/[0.07]",
  neutral: "border-slate-300/70 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-800/40",
  good: "border-teal-300/70 bg-teal-50/40 dark:border-teal-500/25 dark:bg-teal-500/[0.07]",
  very_good: "border-emerald-300/70 bg-emerald-50/40 dark:border-emerald-500/25 dark:bg-emerald-500/[0.07]",
}

const LOCAL_REFLECTION =
  "Thank you for writing this down. From what you shared, it sounds like today carried its own weight — and putting it into words is a brave first step, one you've already taken. Whatever you're feeling makes sense, and you don't have to make sense of everything at once. Read this back to yourself tomorrow and notice how it sits a little differently. You showed up for yourself today, and that counts."

function normalizeEntry(raw: unknown): JournalEntry {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(d.id ?? d.entry_id ?? `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    title: typeof d.title === "string" ? d.title : undefined,
    content: String(d.content ?? d.body ?? d.text ?? ""),
    mood: typeof d.mood === "string" ? d.mood : undefined,
    created_at:
      typeof d.created_at === "string"
        ? d.created_at
        : typeof d.createdAt === "string"
          ? d.createdAt
          : undefined,
    updated_at: typeof d.updated_at === "string" ? d.updated_at : undefined,
  }
}

function wordCount(text: string) {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

function readingTime(text: string) {
  return Math.max(1, Math.round(wordCount(text) / 200))
}

function pickPrompt() {
  return WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)]
}

function extractReply(res: unknown): string {
  const data = (res ?? {}) as Record<string, unknown>
  const raw = data.message
  if (typeof raw === "string" && raw.trim()) return raw.trim()
  if (raw && typeof raw === "object") {
    const msg = raw as Record<string, unknown>
    if (typeof msg.reply === "string" && msg.reply.trim()) return msg.reply.trim()
    if (typeof msg.content === "string" && msg.content.trim()) return msg.content.trim()
  }
  if (typeof data.reply === "string" && data.reply.trim()) return data.reply.trim()
  return ""
}

export default function JournalPage() {
  const [entries, setEntries] = React.useState<JournalEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [moodFilter, setMoodFilter] = React.useState("all")

  const [editorOpen, setEditorOpen] = React.useState(false)
  const [editingEntry, setEditingEntry] = React.useState<JournalEntry | null>(null)
  const [draftTitle, setDraftTitle] = React.useState("")
  const [draftContent, setDraftContent] = React.useState("")
  const [draftMood, setDraftMood] = React.useState("neutral")
  const [prompt, setPrompt] = React.useState<string>(WRITING_PROMPTS[0])
  const [saving, setSaving] = React.useState(false)
  const areaRef = React.useRef<HTMLTextAreaElement | null>(null)

  const [detailEntryId, setDetailEntryId] = React.useState<string | null>(null)
  const [reflections, setReflections] = React.useState<Record<string, ReflectionState>>({})
  const [reflectionBusyId, setReflectionBusyId] = React.useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = React.useState<JournalEntry | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const loadEntries = React.useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const raw = await api.journal.getAll()
      const list = (Array.isArray(raw) ? raw : []).map(normalizeEntry).filter((e) => e.content.trim().length > 0)
      list.sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      )
      setEntries(list)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadEntries()
  }, [loadEntries])

  React.useEffect(() => {
    const el = areaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [draftContent, editorOpen])

  const detailEntry = detailEntryId ? entries.find((e) => e.id === detailEntryId) ?? null : null

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((e) => {
      if (moodFilter !== "all" && e.mood !== moodFilter) return false
      if (!q) return true
      const hay = `${e.title ?? ""} ${e.content}`.toLowerCase()
      return hay.includes(q)
    })
  }, [entries, query, moodFilter])

  const openNew = () => {
    setEditingEntry(null)
    setDraftTitle("")
    setDraftContent("")
    setDraftMood("neutral")
    setPrompt(pickPrompt())
    setEditorOpen(true)
  }

  const openEdit = (entry: JournalEntry) => {
    setDetailEntryId(null)
    setEditingEntry(entry)
    setDraftTitle(entry.title ?? "")
    setDraftContent(entry.content)
    setDraftMood(entry.mood ?? "neutral")
    setPrompt(pickPrompt())
    setEditorOpen(true)
  }

  const handleSave = async () => {
    const content = draftContent.trim()
    if (!content) {
      toast.error("Write a little first", "Your entry needs a few words before saving.")
      return
    }
    setSaving(true)
    try {
      if (editingEntry) {
        const updated = (await api.journal.update(editingEntry.id, {
          title: draftTitle.trim() || undefined,
          content,
        })) as unknown
        const normalized = normalizeEntry(updated)
        setEntries((prev) =>
          prev.map((e) => (e.id === editingEntry.id ? { ...e, ...normalized, content } : e))
        )
        toast.success("Entry updated", "Your journal entry has been saved.")
      } else {
        const created = (await api.journal.create({
          title: draftTitle.trim() || undefined,
          content,
          mood: draftMood || undefined,
        })) as unknown
        const normalized = { ...normalizeEntry(created), content }
        setEntries((prev) => [normalized, ...prev])
        toast.success("Entry saved", "Noted — this writing is yours to keep.")
      }
      setEditorOpen(false)
      setEditingEntry(null)
    } catch {
      toast.error("Couldn't save your entry", "Please check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleReflection = async (entry: JournalEntry) => {
    setReflectionBusyId(entry.id)
    setReflections((prev) => ({ ...prev, [entry.id]: { text: "", source: "pending" } }))
    try {
      const res = await api.chat.sendMessage({
        message: `Write a kind, supportive reflection about this private journal entry. Keep it to one short, warm paragraph — non-clinical.\n\nJournal entry:\n${entry.content}`,
      })
      const text = extractReply(res)
      if (text) {
        setReflections((prev) => ({ ...prev, [entry.id]: { text, source: "ai" } }))
      } else {
        setReflections((prev) => ({ ...prev, [entry.id]: { text: LOCAL_REFLECTION, source: "local" } }))
        toast.info("A gentle reflection", "The AI couldn't be reached, so here's a gentle reflection instead.")
      }
    } catch {
      setReflections((prev) => ({ ...prev, [entry.id]: { text: LOCAL_REFLECTION, source: "local" } }))
      toast.info("A gentle reflection", "The AI couldn't be reached, so here's a gentle reflection instead.")
    } finally {
      setReflectionBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.journal.delete(deleteTarget.id)
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      setDetailEntryId(null)
      toast.success("Entry deleted", "This journal entry has been removed.")
      setDeleteTarget(null)
    } catch {
      toast.error("Couldn't delete entry", "Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  const reflection = detailEntry ? reflections[detailEntry.id] : undefined

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={cn("mb-5 break-inside-avoid rounded-2xl", i % 3 === 0 ? "h-48" : i % 3 === 1 ? "h-56" : "h-40")} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="My journal"
        subtitle="A private space to untangle your thoughts, one entry at a time."
        action={
          <Button size="lg" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Write entry
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Search entries..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select
          options={[{ value: "all", label: "All moods" }, ...MOOD_OPTIONS.map((m) => ({ value: m.value, label: m.label }))]}
          value={moodFilter}
          onChange={setMoodFilter}
          className="w-44"
        />
        {entries.length > 0 && <Badge variant="teal">{entries.length} entries</Badge>}
      </div>

      {loadError && entries.length === 0 ? (
        <EmptyState
          icon={<NotebookPen className="h-7 w-7" />}
          title="Couldn't load your journal"
          description="We couldn't reach your journal right now. Check your connection and try again."
          action={
            <Button onClick={() => void loadEntries()} variant="outline">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          }
        />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<Feather className="h-7 w-7" />}
          title="Your journal is empty"
          description="Writing a few honest lines can make a cloudy mind feel lighter. Start with a word, a feeling, or one small moment."
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Write your first entry
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-7 w-7" />}
          title="No entries match"
          description="Try a different search or clear your mood filter."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("")
                setMoodFilter("all")
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((entry) => {
              const title = entry.title?.trim() || "Untitled entry"
              return (
                <motion.article
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  onClick={() => setDetailEntryId(entry.id)}
                  className={cn(
                    "group mb-5 cursor-pointer break-inside-avoid rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 dark:bg-slate-900",
                    entry.mood
                      ? MOOD_ACCENT[entry.mood] ?? "border-slate-200 dark:border-slate-800"
                      : "border-slate-200 dark:border-slate-800"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-slate-800 dark:text-slate-100">
                        {title}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                        {entry.created_at
                          ? formatDate(entry.created_at, { month: "short", day: "numeric", year: "numeric" })
                          : "Just now"}
                      </p>
                    </div>
                    {entry.mood && <MoodEmoji mood={entry.mood} size="sm" />}
                  </div>
                  <p className="mt-3 line-clamp-6 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {entry.content}
                  </p>
                  <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    <span>{wordCount(entry.content)} words</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {readingTime(entry.content)} min read
                    </span>
                    <span className="ml-auto opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      Open entry
                    </span>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Full-screen editor */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {editorOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-6">
                <motion.div
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setEditorOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="relative z-10 flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-auto sm:max-h-[88vh] sm:rounded-2xl dark:border dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <div>
                      <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                        {editingEntry ? "Edit entry" : "New journal entry"}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Private to you · stored on your account
                      </p>
                    </div>
                    <button
                      onClick={() => setEditorOpen(false)}
                      aria-label="Close editor"
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                    {!draftContent.trim() && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-blue-200/70 bg-blue-50/60 p-4 dark:border-blue-500/20 dark:bg-blue-500/10"
                      >
                        <div className="flex items-start gap-3">
                          <Quote className="mt-0.5 h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">
                              Writing prompt
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                              {prompt}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setPrompt(pickPrompt())}
                          aria-label="New prompt"
                          className="rounded-lg p-1.5 text-blue-500 transition-colors hover:bg-blue-100 dark:hover:bg-blue-500/15"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </motion.div>
                    )}

                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        How you&apos;re feeling
                      </p>
                      <div className="grid grid-cols-5 gap-2">
                        {MOOD_OPTIONS.map((m) => {
                          const active = draftMood === m.value
                          return (
                            <motion.button
                              key={m.value}
                              whileHover={{ y: -3 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setDraftMood(m.value)}
                              className={cn(
                                "flex flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-3 transition-all",
                                active
                                  ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20 dark:border-blue-400 dark:bg-blue-500/15"
                                  : "border-slate-200 bg-white hover:border-blue-400/40 dark:border-slate-700 dark:bg-slate-800/70"
                              )}
                            >
                              <MoodEmoji mood={m.value} size="sm" />
                              <span
                                className={cn(
                                  "text-center text-[11px] font-medium leading-tight",
                                  active
                                    ? "text-blue-700 dark:text-blue-300"
                                    : "text-slate-600 dark:text-slate-300"
                                )}
                              >
                                {m.label}
                              </span>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    <Input
                      label="Title"
                      placeholder="Give your entry a title (optional)"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                    />

                    <Textarea
                      ref={areaRef}
                      label="Your writing"
                      placeholder="Start anywhere — a feeling, a moment, a few honest words..."
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      className="min-h-[40vh] resize-none text-[15px] leading-relaxed sm:min-h-[32vh]"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                    <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {draftContent.trim() ? `${wordCount(draftContent)} words` : "Empty entry"}
                      </span>
                      {draftContent.trim() && <span>{readingTime(draftContent)} min read</span>}
                    </div>
                    <Button onClick={() => void handleSave()} disabled={saving}>
                      {saving ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : (
                        <Feather className="h-4 w-4" />
                      )}
                      {saving ? "Saving..." : editingEntry ? "Save changes" : "Save entry"}
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Detail */}
      <Modal
        open={detailEntry !== null}
        onClose={() => setDetailEntryId(null)}
        title={detailEntry?.title?.trim() || "Untitled entry"}
        description={
          detailEntry?.created_at
            ? formatDate(detailEntry.created_at, {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : undefined
        }
        className="max-w-2xl"
        footer={
          detailEntry && (
            <>
              <Button
                variant="ghost"
                className="mr-auto !text-red-500 hover:!bg-red-50 dark:hover:!bg-red-500/10"
                onClick={() => setDeleteTarget(detailEntry)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button variant="secondary" onClick={() => openEdit(detailEntry)}>
                <PenLine className="h-4 w-4" />
                Edit
              </Button>
              <Button onClick={() => setDetailEntryId(null)}>
                <NotebookPen className="h-4 w-4" />
                Done
              </Button>
            </>
          )
        }
      >
        {detailEntry && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              {detailEntry.mood && <MoodEmoji mood={detailEntry.mood} size="sm" />}
              {detailEntry.mood && (
                <Badge variant="secondary">{String(detailEntry.mood).replace(/_/g, " ")}</Badge>
              )}
              <Badge variant="outline">{wordCount(detailEntry.content)} words</Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3" />
                {readingTime(detailEntry.content)} min read
              </Badge>
            </div>

            <div className="whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-[15px] leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
              {detailEntry.content}
            </div>

            <div className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/80 to-emerald-50/60 p-5 dark:border-teal-500/20 dark:from-teal-950/30 dark:to-emerald-950/30">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    <WandSparkles className="h-4 w-4 text-teal-500" />
                    Reflective insight
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    A gentle, AI-assisted perspective on what you wrote.
                  </p>
                </div>
                {!reflection && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleReflection(detailEntry)}
                    disabled={reflectionBusyId === detailEntry.id}
                  >
                    {reflectionBusyId === detailEntry.id ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {reflectionBusyId === detailEntry.id ? "Reflecting..." : "Get reflection"}
                  </Button>
                )}
              </div>

              {reflection && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                >
                  {reflection.text}
                </motion.p>
              )}

              <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                AI-generated reflection — not clinical advice.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete this entry?"
        description="This journal entry will be permanently removed. There's no undo."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? "Deleting..." : "Yes, delete"}
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {deleteTarget.title?.trim() || "Untitled entry"}
            </p>
            <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-slate-500 dark:text-slate-400">
              {deleteTarget.content}
            </p>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}