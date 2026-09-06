"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  Send,
  Plus,
  Search,
  Trash2,
  Edit3,
  Menu,
  X,
  Sparkles,
  ShieldAlert,
  MoreVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/toast"
import { AiOrb } from "@/components/shared/ai-orb"
import { EmotionBadge } from "@/components/shared/emotion-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { TypingIndicator } from "@/components/shared/typing-indicator"
import { cn, formatDate, truncate } from "@/lib/utils"
import { api } from "@/lib/api"
import { useChatStore, type Conversation, type ChatMessage } from "@/store/chat-store"

const WELCOME_MESSAGE =
  "Hi, I'm MindEase. I'm here to listen, without judgment. How are you feeling today?"

const SUGGESTED_PROMPTS = [
  "I'm feeling stressed",
  "Help me calm down",
  "I want to talk about my day",
  "Give me a breathing exercise",
  "Help me understand my feelings",
  "Tell me about a medicine",
]

interface DisplayMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  sentiment?: string
  crisis?: boolean
  suggestedActions?: string[]
  isError?: boolean
}

interface ParsedChatResponse {
  content: string
  sentiment?: string
  crisis?: boolean
  suggestedActions?: string[]
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function parseCrisisFlag(value: unknown): boolean {
  if (value === true) return true
  if (typeof value === "number") return value > 0
  if (typeof value === "string") {
    const t = value.trim().toLowerCase()
    return t.length > 0 && !["false", "none", "0", "no", "null"].includes(t)
  }
  return false
}

function parseChatResponse(res: unknown): ParsedChatResponse {
  const data = (res ?? {}) as Record<string, unknown>
  let content = ""
  let sentiment: string | undefined
  let crisis: boolean | undefined
  let suggestedActions: string[] = []

  if (typeof data.response === "string") {
    content = data.response
  } else {
    const raw = data.message
    if (typeof raw === "string") {
      content = raw
    } else if (raw && typeof raw === "object") {
      const msg = raw as Record<string, unknown>
      if (typeof msg.reply === "string") content = msg.reply
      else if (typeof msg.content === "string") content = msg.content
      if (typeof msg.failure === "string" && !content) content = msg.failure
      if (typeof msg.sentiment === "string") sentiment = msg.sentiment
      crisis = parseCrisisFlag(msg.crisis ?? msg.is_crisis)
      if (Array.isArray(msg.suggested_actions)) {
        suggestedActions = msg.suggested_actions.map((a) => String(a))
      }
    }
  }

  if (!content && typeof data.reply === "string") content = data.reply
  if (!content) {
    content =
      "I'm sorry, I couldn't reach the support service right now. Please try again in a moment."
  }
  if (!sentiment && typeof data.sentiment === "string") sentiment = data.sentiment
  if (!sentiment && typeof data.emotion === "string") sentiment = data.emotion
  if (!sentiment && data.emotion && typeof data.emotion === "object") {
    const e = (data.emotion as Record<string, unknown>).emotion
    if (typeof e === "string") sentiment = e
  }
  if (crisis === undefined) crisis = parseCrisisFlag(data.crisis ?? data.is_crisis)
  if (suggestedActions.length === 0 && Array.isArray(data.suggested_actions)) {
    suggestedActions = data.suggested_actions.map((a) => String(a))
  }

  return { content, sentiment, crisis, suggestedActions }
}

function formatMessageTime(ts?: string) {
  if (!ts) return ""
  const date = new Date(ts)
  if (Number.isNaN(date.getTime())) return ""
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  return sameDay
    ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : formatDate(ts, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

function getConversationTitle(conversation: Conversation | null | undefined) {
  if (!conversation) return "New conversation"
  if (conversation.title && conversation.title.trim()) return conversation.title
  const userMessage = conversation.messages?.find((m: ChatMessage) => m.role === "user")
  if (userMessage?.content) return truncate(userMessage.content, 42)
  return "New conversation"
}

function getQuickActions(message: DisplayMessage): string[] {
  if (message.suggestedActions && message.suggestedActions.length > 0) {
    return message.suggestedActions
  }
  const s = (message.sentiment ?? "").toLowerCase()
  if (["stress", "anxious", "nervous", "worried", "overwhelmed"].some((k) => s.includes(k))) {
    return ["Give me a breathing exercise", "Help me calm down", "Tell me more"]
  }
  if (["sad", "lonely", "low", "down", "angry", "frustrated", "hopeless"].some((k) => s.includes(k))) {
    return ["I could use support", "How can I feel better?", "Help me understand this feeling"]
  }
  if (["happy", "joy", "calm", "good", "great", "peaceful", "grateful"].some((k) => s.includes(k))) {
    return ["What can I do to keep this going?", "Help me plan a good day", "I want to share more"]
  }
  return ["Help me understand my feelings", "Give me a breathing exercise", "I want to talk about my day"]
}

function AiAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-purple-500 to-teal-400 text-white shadow-lg shadow-blue-500/20",
        className
      )}
    >
      <Sparkles className="h-4 w-4" />
    </div>
  )
}

const messageVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
}

function toDisplayMessage(m: ChatMessage): DisplayMessage {
  return {
    id: m.id ?? makeId(),
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
    timestamp: m.timestamp ?? new Date().toISOString(),
    sentiment: m.sentiment,
  }
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams<{ id?: string }>()
  const conversationId = typeof params.id === "string" ? params.id : params.id?.[0]

  const conversations = useChatStore((s) => s.conversations)
  const isLoading = useChatStore((s) => s.isLoading)
  const loadConversations = useChatStore((s) => s.loadConversations)
  const loadConversation = useChatStore((s) => s.loadConversation)
  const updateConversation = useChatStore((s) => s.updateConversation)
  const deleteConversation = useChatStore((s) => s.deleteConversation)

  const [messages, setMessages] = React.useState<DisplayMessage[]>([])
  const [loadingConv, setLoadingConv] = React.useState(true)
  const [convTitle, setConvTitle] = React.useState("")
  const [input, setInput] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [crisis, setCrisis] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [modalState, setModalState] = React.useState<
    { type: "rename" | "delete"; conversation: Conversation } | null
  >(null)
  const [renameValue, setRenameValue] = React.useState("")
  const [busyDelete, setBusyDelete] = React.useState(false)
  const [busyRename, setBusyRename] = React.useState(false)
  const [ctxMenu, setCtxMenu] = React.useState<{ id: string; x: number; y: number } | null>(null)

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  React.useEffect(() => {
    if (!conversationId) return
    const id = conversationId
    let active = true
    async function load() {
      setLoadingConv(true)
      setCrisis(false)
      setMessages([])
      try {
        const conv = await loadConversation(id)
        if (!active) return
        const seeded = (conv.messages ?? []).map(toDisplayMessage)
        setMessages(seeded.length > 0 ? seeded : [toDisplayMessage({ role: "assistant", content: WELCOME_MESSAGE, timestamp: new Date().toISOString() })])
        setConvTitle(conv.title ?? "")
      } catch {
        if (!active) return
        setMessages([toDisplayMessage({ role: "assistant", content: WELCOME_MESSAGE, timestamp: new Date().toISOString() })])
        setConvTitle("")
      } finally {
        if (active) setLoadingConv(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [conversationId, loadConversation])

  React.useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isSending, crisis])

  React.useEffect(() => {
    const close = () => setCtxMenu(null)
    document.addEventListener("click", close)
    document.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => {
      document.removeEventListener("click", close)
      document.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
    }
  }, [])

  const activeConversation = conversations.find((c) => c.id === conversationId)

  const filteredConversations = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) =>
      getConversationTitle(c).toLowerCase().includes(q)
    )
  }, [conversations, search])

  const hasStarted = messages.some((m) => m.role === "user")

  const autoGrowTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`
  }

  const handleSend = async (raw: string) => {
    const text = raw.trim()
    if (!text || isSending || !conversationId) return
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"

    const userMessage: DisplayMessage = {
      id: makeId(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsSending(true)
    setCrisis(false)

    try {
      const res = await api.chat.sendMessage({ message: text, conversation_id: conversationId })
      const parsed = parseChatResponse(res)
      const aiMessage: DisplayMessage = {
        id: makeId(),
        role: "assistant",
        content: parsed.content,
        timestamp: new Date().toISOString(),
        sentiment: parsed.sentiment,
        crisis: parsed.crisis,
        suggestedActions: parsed.suggestedActions,
      }
      setMessages((prev) => [...prev, aiMessage])
      if (parsed.crisis) setCrisis(true)
      void loadConversations()
    } catch {
      const errorMessage: DisplayMessage = {
        id: makeId(),
        role: "assistant",
        content:
          "I'm sorry, I couldn't reach the support service right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        isError: true,
      }
      setMessages((prev) => [...prev, errorMessage])
      toast.error("Couldn't send message", "Please check your connection and try again.")
    } finally {
      setIsSending(false)
    }
  }

  const startNewChat = () => {
    setInput("")
    setDrawerOpen(false)
    router.push("/chat")
  }

  const handleSelect = (id: string) => {
    setDrawerOpen(false)
    if (id !== conversationId) router.push(`/chat/${id}`)
  }

  const openRename = (conversation: Conversation) => {
    setModalState({ type: "rename", conversation })
    setRenameValue(conversation.title ?? "")
  }

  const openDelete = (conversation: Conversation) => {
    setModalState({ type: "delete", conversation })
  }

  const openContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const conversation = conversations.find((c) => c.id === id)
    if (!conversation) return
    setCtxMenu({ id, x: Math.min(e.clientX, window.innerWidth - 176), y: Math.min(e.clientY, window.innerHeight - 128) })
  }

  const confirmRename = async () => {
    if (!modalState || modalState.type !== "rename") return
    const title = renameValue.trim()
    if (!title) {
      toast.error("Title required", "Please enter a name for this conversation.")
      return
    }
    setBusyRename(true)
    try {
      await updateConversation(modalState.conversation.id, { title })
      toast.success("Conversation renamed", "Your conversation title has been updated.")
      setModalState(null)
    } catch {
      toast.error("Couldn't rename conversation", "Please try again.")
    } finally {
      setBusyRename(false)
    }
  }

  const confirmDelete = async () => {
    if (!modalState || modalState.type !== "delete") return
    setBusyDelete(true)
    try {
      const { id } = modalState.conversation
      await deleteConversation(id)
      toast.success("Conversation deleted", "This conversation has been removed.")
      setModalState(null)
      if (id === conversationId) {
        router.push("/chat")
      }
    } catch {
      toast.error("Couldn't delete conversation", "Please try again.")
    } finally {
      setBusyDelete(false)
    }
  }

  const headerTitle =
    activeConversation ? getConversationTitle(activeConversation) : convTitle || "Conversation"
  const headerSubtitle = loadingConv
    ? "Loading conversation..."
    : isSending
      ? "MindEase is thinking..."
      : "MindEase is listening"

  const conversationList = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button className="w-full" onClick={() => { startNewChat(); onNavigate?.() }}>
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500/50 focus:bg-white focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:focus:bg-slate-800"
          />
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))
        ) : filteredConversations.length === 0 ? (
          <EmptyState
            className="border-0 bg-transparent px-2 py-8"
            icon={<Sparkles className="h-6 w-6" />}
            title={search ? "No conversations found" : "No conversations yet"}
            description={
              search
                ? "Try a different search term."
                : "Start chatting with MindEase and your conversations will appear here."
            }
          />
        ) : (
          filteredConversations.map((conversation) => {
            const title = getConversationTitle(conversation)
            const active = conversationId === conversation.id
            return (
              <div
                key={conversation.id}
                role="button"
                tabIndex={0}
                onClick={() => { handleSelect(conversation.id); onNavigate?.() }}
                onContextMenu={(e) => openContextMenu(e, conversation.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleSelect(conversation.id)
                    onNavigate?.()
                  }
                }}
                className={cn(
                  "group flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                  active
                    ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-medium", active ? "text-white" : "text-slate-800 dark:text-slate-100")}>
                    {title}
                  </p>
                  <p className={cn("mt-0.5 text-xs", active ? "text-blue-100" : "text-slate-400 dark:text-slate-500")}>
                    {formatDate(conversation.updated_at ?? conversation.created_at ?? new Date(), {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {active && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-teal-300" />
                )}
                <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openRename(conversation)
                    }}
                    aria-label="Rename conversation"
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      active ? "text-blue-100 hover:bg-white/20" : "text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    )}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openDelete(conversation)
                    }}
                    aria-label="Delete conversation"
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      active ? "text-blue-100 hover:bg-white/20" : "text-slate-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  const renderMessage = (message: DisplayMessage) =>
    message.role === "user" ? (
      <motion.div
        key={message.id}
        variants={messageVariants}
        initial="hidden"
        animate="show"
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] sm:max-w-[70%]">
          <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 to-purple-600 px-4 py-3 text-sm leading-relaxed text-white shadow-lg shadow-blue-500/20">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="mt-1 pr-1 text-right text-[10px] font-medium text-slate-400 dark:text-slate-500">
            {formatMessageTime(message.timestamp)}
          </p>
        </div>
      </motion.div>
    ) : (
      <motion.div
        key={message.id}
        variants={messageVariants}
        initial="hidden"
        animate="show"
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="flex items-start gap-2.5"
      >
        <AiAvatar className="mt-0.5" />
        <div className="max-w-[85%] sm:max-w-[72%]">
          <Card
            className={cn(
              "rounded-2xl rounded-bl-md border-slate-200/70 bg-slate-50 px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/70",
              message.isError && "border-red-200/70 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
            )}
          >
            {message.sentiment && (
              <div className="mb-2">
                <EmotionBadge emotion={message.sentiment} />
              </div>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {message.content}
            </p>
          </Card>
          <div className="mt-2 flex flex-wrap gap-2">
            {getQuickActions(message).map((action) => (
              <motion.button
                key={action}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => void handleSend(action)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-teal-400/60 hover:bg-teal-50 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-400/50 dark:hover:bg-teal-500/10 dark:hover:text-teal-300"
              >
                {action}
              </motion.button>
            ))}
          </div>
          <p className="mt-1 pl-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
            {formatMessageTime(message.timestamp)}
          </p>
        </div>
      </motion.div>
    )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex h-[calc(100dvh-7rem)] min-h-[30rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60 md:flex">
        {conversationList()}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white shadow-2xl dark:bg-slate-900 md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Conversations
                </p>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close conversations"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="pt-2">
                {conversationList(() => setDrawerOpen(false))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
            aria-label="Open conversations"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative">
            <AiOrb size={34} pulseSpeed={2.6} reacting={isSending || loadingConv} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {headerTitle}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {headerSubtitle}
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <Badge variant="teal">Private &amp; supportive</Badge>
          </div>
        </div>

        {/* Crisis banner */}
        <AnimatePresence>
          {crisis && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mx-3 mt-3 flex items-start gap-3 rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-300">
                    You matter, and help is available right now.
                  </p>
                  <p className="mt-0.5 text-xs text-red-500/90 dark:text-red-300/80">
                    If you&apos;re in immediate danger, please reach someone you trust or contact a
                    local crisis service.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href="/emergency">
                      <Button size="sm" variant="destructive">
                        Get Help Now
                      </Button>
                    </Link>
                    <Link href="/emergency">
                      <Button size="sm" variant="outline">
                        Find Crisis Support
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {loadingConv ? (
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              <div className="flex items-start gap-2.5">
                <AiAvatar />
                <Card className="w-2/3 space-y-3 rounded-2xl rounded-bl-md border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/70">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                </Card>
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-10 w-1/2 rounded-2xl rounded-br-md" />
              </div>
              <div className="flex items-start gap-2.5">
                <AiAvatar />
                <Card className="w-3/4 space-y-3 rounded-2xl rounded-bl-md border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/70">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/6" />
                </Card>
              </div>
            </div>
          ) : !hasStarted ? (
            <div className="flex h-full flex-col items-center justify-center gap-6">
              <AiOrb size={92} reacting={isSending} />
              <div className="text-center">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Hi, I&apos;m MindEase.
                </h2>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  A compassionate space to talk, reflect and feel supported. Pick a prompt or
                  share anything on your mind.
                </p>
              </div>
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2"
              >
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <motion.button
                    key={prompt}
                    variants={messageVariants}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => void handleSend(prompt)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-teal-400/60 hover:bg-teal-50 hover:text-teal-800 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-teal-400/50 dark:hover:bg-teal-500/10 dark:hover:text-teal-200"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.map((message) => renderMessage(message))}
              {isSending && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5"
                >
                  <AiAvatar />
                  <Card className="rounded-2xl rounded-bl-md border-slate-200/70 bg-slate-50 px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/70">
                    <TypingIndicator />
                  </Card>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm transition-colors focus-within:border-blue-500/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/70 dark:focus-within:bg-slate-800">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  autoGrowTextarea()
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    void handleSend(input)
                  }
                }}
                rows={1}
                disabled={loadingConv || !conversationId}
                placeholder="Share how you're feeling..."
                aria-label="Message MindEase"
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <Button
                size="icon"
                disabled={!input.trim() || isSending || loadingConv || !conversationId}
                onClick={() => void handleSend(input)}
                aria-label="Send message"
              >
                {isSending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-slate-400 dark:text-slate-500">
              MindEase is an AI companion, not a substitute for professional care. In crisis?
              Reach out to local emergency services immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {ctxMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            style={{ top: ctxMenu.y, left: ctxMenu.x }}
            className="fixed z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                const conversation = conversations.find((c) => c.id === ctxMenu.id)
                setCtxMenu(null)
                if (conversation) openRename(conversation)
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Edit3 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              Rename
            </button>
            <button
              onClick={() => {
                const conversation = conversations.find((c) => c.id === ctxMenu.id)
                setCtxMenu(null)
                if (conversation) openDelete(conversation)
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename / Delete modal */}
      <Modal
        open={modalState !== null}
        onClose={() => setModalState(null)}
        title={modalState?.type === "rename" ? "Rename conversation" : "Delete conversation?"}
        description={
          modalState?.type === "rename"
            ? "Give this conversation a name you'll remember."
            : modalState?.type === "delete"
              ? "This conversation and all its messages will be permanently removed."
              : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalState(null)}>
              Cancel
            </Button>
            {modalState?.type === "rename" ? (
              <Button onClick={confirmRename} disabled={busyRename}>
                {busyRename ? "Saving..." : "Save name"}
              </Button>
            ) : (
              <Button variant="destructive" onClick={confirmDelete} disabled={busyDelete}>
                {busyDelete ? "Deleting..." : "Yes, delete"}
              </Button>
            )}
          </>
        }
      >
        {modalState?.type === "rename" ? (
          <Input
            label="Conversation title"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="e.g. Morning reflections"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                void confirmRename()
              }
            }}
          />
        ) : (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 dark:bg-red-500/10">
            <MoreVertical className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="text-sm text-slate-600 dark:text-slate-300">
              <p className="font-semibold text-red-600 dark:text-red-400">
                This action is permanent
              </p>
              <p className="mt-1">
                All messages in &ldquo;
                {modalState?.conversation ? getConversationTitle(modalState.conversation) : ""}
                &rdquo; will be deleted immediately.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}