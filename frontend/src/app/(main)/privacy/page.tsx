"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  ShieldCheck,
  Share2,
  Database,
  Clock,
  Trash2,
  Download,
  MessageSquare,
  BookOpen,
  Smile,
  Lock,
  FileText,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { api } from "@/lib/api"

type PrivacySettings = Record<string, boolean | string>

interface RetentionOption {
  value: string
  label: string
}

const RETENTION_OPTIONS: RetentionOption[] = [
  { value: "forever", label: "Keep forever" },
  { value: "1_year", label: "1 year" },
  { value: "6_months", label: "6 months" },
  { value: "3_months", label: "3 months" },
  { value: "30_days", label: "30 days" },
]

export default function PrivacyPage() {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [settings, setSettings] = React.useState<PrivacySettings>({
    share_anonymized_data: true,
    share_session_insights: false,
    data_retention: "forever",
    auto_delete_conversations: false,
  })
  const [deleteTarget, setDeleteTarget] = React.useState<null | "mood" | "journal" | "chat">(null)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    let active = true
    api.privacy
      .getSettings()
      .then((res) => {
        if (active && res && typeof res === "object") {
          setSettings((prev) => ({ ...prev, ...(res as PrivacySettings) }))
        }
      })
      .catch(() => {
        // use defaults
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const updateSetting = async (key: string, value: boolean | string) => {
    setSettings((s) => ({ ...s, [key]: value }))
    setSaving(true)
    try {
      await api.privacy.updateSettings({ [key]: value })
      toast.success("Settings saved", "Your privacy preferences are up to date.")
    } catch {
      toast.error("Couldn't save settings", "Please try again.")
      setSettings((s) => ({ ...s }))
    } finally {
      setSaving(false)
    }
  }

  const exportData = async () => {
    try {
      const data = await api.privacy.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `mindease-data-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Data exported", "A copy of your data has been downloaded.")
    } catch {
      toast.error("Export failed", "We couldn't generate your export right now.")
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget === "mood") {
        const moods = (await api.mood.getMoodHistory()) as { id: string }[]
        await Promise.all(moods.map((m) => api.mood.deleteMood(m.id)))
        toast.success("Mood history cleared", "All mood logs have been deleted.")
      } else if (deleteTarget === "journal") {
        const entries = (await api.journal.getAll()) as { id: string }[]
        await Promise.all(entries.map((j) => api.journal.delete(j.id)))
        toast.success("Journal cleared", "All journal entries have been deleted.")
      } else if (deleteTarget === "chat") {
        const convs = (await api.chat.getConversations()) as { id: string }[]
        await Promise.all(convs.map((c) => api.chat.deleteConversation(c.id)))
        toast.success("Conversations cleared", "All conversations have been deleted.")
      }
    } catch {
      toast.error("Deletion failed", "Some data could not be removed. Please try again.")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Intro */}
      <div className="flex items-center gap-4 rounded-2xl border border-teal-200/70 bg-teal-50/60 p-5 dark:border-teal-500/20 dark:bg-teal-500/10">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-400 text-white shadow-lg">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Your privacy is our priority
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            You own your data. These controls let you decide exactly what is stored, shared and
            retained. Changes apply immediately.
          </p>
        </div>
      </div>

      {/* Data sharing */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-blue-500" />
            Data sharing
          </CardTitle>
          <CardDescription>Control what MindEase shares and how it&apos;s used</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Switch
            label="Share anonymized data"
            description="Contribute de-identified usage insights to help improve MindEase for everyone."
            checked={settings.share_anonymized_data !== false}
            onCheckedChange={(v) => updateSetting("share_anonymized_data", v)}
            disabled={saving}
          />
          <Switch
            label="Personalize with past conversations"
            description="Allow MindEase to reference earlier chats to give more relevant support."
            checked={settings.share_session_insights !== false}
            onCheckedChange={(v) => updateSetting("share_session_insights", v)}
            disabled={saving}
          />
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  End-to-end protected
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Chats are encrypted in transit and at rest. We never sell your data.
                </p>
              </div>
            </div>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
              <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retention */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" />
            Data retention
          </CardTitle>
          <CardDescription>How long we keep your personal data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Select
            label="Retention period"
            options={RETENTION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={String(settings.data_retention ?? "forever")}
            onChange={(v) => updateSetting("data_retention", v)}
          />
          <Switch
            label="Auto-delete conversations"
            description="Automatically remove old conversations after the retention period."
            checked={settings.auto_delete_conversations === true}
            onCheckedChange={(v) => updateSetting("auto_delete_conversations", v)}
            disabled={saving}
          />
        </CardContent>
      </Card>

      {/* Export & delete */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-4 w-4 text-blue-500" />
            Your data
          </CardTitle>
          <CardDescription>Export a full copy, or remove specific data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Full data export
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Download all your data as a JSON file.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4" />
              Export data
            </Button>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                key: "mood" as const,
                label: "Delete mood history",
                icon: Smile,
                desc: "Removes all mood check-ins",
              },
              {
                key: "journal" as const,
                label: "Delete journal",
                icon: BookOpen,
                desc: "Removes all journal entries",
              },
              {
                key: "chat" as const,
                label: "Delete conversations",
                icon: MessageSquare,
                desc: "Removes all chat history",
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setDeleteTarget(item.key)}
                  className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10 dark:border-slate-800"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{item.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-amber-200/70 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <Database className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Deleted data is permanently removed and cannot be recovered. If you wish to
              delete your entire account, visit{" "}
              <a href="/profile" className="font-semibold text-amber-600 hover:underline dark:text-amber-400">
                Profile settings
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete selected data?"
        description={
          deleteTarget === "mood"
            ? "This permanently deletes your entire mood history."
            : deleteTarget === "journal"
              ? "This permanently deletes all your journal entries."
              : "This permanently deletes all your conversations with MindEase."
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? (
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 animate-pulse" />
                  Deleting...
                </span>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This action cannot be undone. Your data will be permanently and immediately removed
          from our systems.
        </p>
      </Modal>
    </motion.div>
  )
}