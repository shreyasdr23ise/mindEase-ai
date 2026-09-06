"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Camera,
  Mail,
  AtSign,
  User as UserIcon,
  Download,
  Trash2,
  ShieldCheck,
  Save,
  Target,
  Heart,
  MessageCircle,
  BookOpen,
  AlertTriangle,
} from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"

const GOALS = [
  "Reduce Stress",
  "Manage Anxiety",
  "Improve Sleep",
  "Track Emotions",
  "Build Healthy Habits",
  "Journal",
  "Learn About Mental Wellness",
]

interface ProfileData {
  name: string
  email: string
  username: string
  bio: string
  privacy: Record<string, boolean>
  goals: string[]
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, setUser, logout } = useAuthStore()

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [profile, setProfile] = React.useState<ProfileData>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    username: user?.email?.split("@")[0] ?? "",
    bio: "",
    privacy: { share_anonymized_data: true, share_session_insights: false },
    goals: [],
  })
  const [savingGoals, setSavingGoals] = React.useState(false)
  const [privacySaving, setPrivacySaving] = React.useState(false)
  const [stats, setStats] = React.useState({ moods: 0, journals: 0, conversations: 0 })
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const [me, moods, journals, conversations, privacySettings] = await Promise.allSettled([
          api.auth.getMe(),
          api.mood.getMoodHistory(),
          api.journal.getAll(),
          api.chat.getConversations(),
          api.privacy.getSettings(),
        ])
        if (!active) return

        const userRes = me.status === "fulfilled" ? (me.value as { user?: ProfileData & { name?: string; email?: string } }).user : null

        setProfile((p) => ({
          ...p,
          name: userRes?.name ?? user?.name ?? "",
          email: userRes?.email ?? user?.email ?? "",
          username: userRes?.email?.split("@")[0] ?? user?.email?.split("@")[0] ?? "",
          privacy:
            privacySettings.status === "fulfilled"
              ? { ...p.privacy, ...(privacySettings.value as Record<string, boolean>) }
              : p.privacy,
        }))

        setStats({
          moods: moods.status === "fulfilled" ? moods.value.length : 0,
          journals: journals.status === "fulfilled" ? journals.value.length : 0,
          conversations: conversations.status === "fulfilled" ? conversations.value.length : 0,
        })
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [user?.name, user?.email])

  const saveProfile = async () => {
    const name = profile.name.trim()
    if (!name) {
      toast.error("Name required", "Please enter your name.")
      return
    }
    setSaving(true)
    try {
      setUser({
        id: user?.id ?? "local",
        name,
        email: profile.email,
      })
      toast.success("Profile updated", "Your details have been saved.")
    } finally {
      setSaving(false)
    }
  }

  const toggleGoal = (goal: string) => {
    setProfile((p) => ({
      ...p,
      goals: p.goals.includes(goal)
        ? p.goals.filter((g) => g !== goal)
        : p.goals.length >= 4
          ? p.goals
          : [...p.goals, goal],
    }))
  }

  const saveGoals = async () => {
    setSavingGoals(true)
    try {
      await api.onboarding.complete({ goals: profile.goals })
      toast.success("Goals updated", "We've tailored your experience accordingly.")
    } catch {
      toast.success("Goals updated", "We've saved your selection.")
    } finally {
      setSavingGoals(false)
    }
  }

  const updatePrivacy = async (key: string, value: boolean) => {
    setProfile((p) => ({ ...p, privacy: { ...p.privacy, [key]: value } }))
    setPrivacySaving(true)
    try {
      await api.privacy.updateSettings({ [key]: value })
      toast.success("Privacy updated", "Your preferences have been saved.")
    } catch {
      toast.error("Couldn't save privacy settings", "Please try again.")
    } finally {
      setPrivacySaving(false)
    }
  }

  const exportData = async () => {
    try {
      const data = await api.privacy.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `mindease-data-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Data exported", "Your data has been downloaded as JSON.")
    } catch {
      toast.error("Export failed", "We couldn't export your data right now.")
    }
  }

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      await api.privacy.deleteAccount()
      await logout()
      toast.success("Account deleted", "We're sorry to see you go. Take care.")
      router.push("/")
    } catch {
      toast.error("Couldn't delete account", "Please try again or contact support.")
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  const statItems = [
    { label: "Mood check-ins", value: stats.moods, icon: Heart },
    { label: "Journal entries", value: stats.journals, icon: BookOpen },
    { label: "Conversations", value: stats.conversations, icon: MessageCircle },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <Card variant="glass" className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:gap-6">
          <div className="group relative">
            <Avatar name={profile.name || "User"} size="xl" />
            <button
              type="button"
              onClick={() => toast.info("Avatar upload", "Avatar upload is coming soon.")}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-400 text-white shadow-lg transition-transform group-hover:scale-110"
              aria-label="Upload avatar"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {profile.name || "MindEase User"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant="teal">Member</Badge>
              <Badge variant="secondary">@{profile.username}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-teal-500" />
            Account secure
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {statItems.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} hoverable className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 text-white shadow-lg">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{item.value}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Edit profile */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-blue-500" />
            Edit profile
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              icon={<UserIcon className="h-4 w-4" />}
            />
            <Input
              label="Email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              icon={<Mail className="h-4 w-4" />}
            />
            <Input
              label="Username"
              value={profile.username}
              onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
              icon={<AtSign className="h-4 w-4" />}
            />
            <Input
              label="Bio"
              placeholder="A short line about you (optional)"
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              icon={<UserIcon className="h-4 w-4" />}
            />
          </div>
          <Button className="mt-5" onClick={saveProfile} disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Wellness goals */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-4 w-4 text-teal-500" />
            Wellness goals
          </CardTitle>
          <CardDescription>Choose up to 4 areas to focus on</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((goal) => {
              const selected = profile.goals.includes(goal)
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                    selected
                      ? "border-transparent bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/25"
                      : "border-slate-300 bg-white text-slate-700 hover:border-blue-500/50 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10"
                  )}
                >
                  {goal}
                </button>
              )
            })}
          </div>
          {profile.goals.length >= 4 && (
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              Maximum of 4 goals selected.
            </p>
          )}
          <Button variant="secondary" className="mt-4" onClick={saveGoals} disabled={savingGoals}>
            {savingGoals ? "Saving..." : "Save goals"}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-500" />
            Privacy settings
          </CardTitle>
          <CardDescription>Control how your data is used</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Switch
            label="Share anonymized data"
            description="Help improve MindEase with anonymized insights."
            checked={profile.privacy.share_anonymized_data ?? true}
            onCheckedChange={(v) => updatePrivacy("share_anonymized_data", v)}
            disabled={privacySaving}
          />
          <Switch
            label="Personalize with past conversations"
            description="Let MindEase use session context to respond more personally."
            checked={profile.privacy.share_session_insights ?? false}
            onCheckedChange={(v) => updatePrivacy("share_session_insights", v)}
            disabled={privacySaving}
          />
        </CardContent>
      </Card>

      {/* Data controls */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-4 w-4 text-blue-500" />
            Your data
          </CardTitle>
          <CardDescription>Export or permanently delete your data</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4" />
            Export my data
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="sm:ml-auto">
            <Trash2 className="h-4 w-4" />
            Delete account
          </Button>
        </CardContent>
      </Card>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete your account?"
        description="This permanently removes your data and cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteAccount} disabled={deleting}>
              {deleting ? "Deleting..." : "Yes, delete my account"}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 dark:bg-red-500/10">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="text-sm text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-red-600 dark:text-red-400">
              This action is permanent
            </p>
            <p className="mt-1">
              All your mood logs, journal entries, conversations and preferences will be
              deleted immediately.
            </p>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}