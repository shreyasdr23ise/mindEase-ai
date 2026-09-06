"use client"

import { create } from "zustand"
import { api } from "@/lib/api"

export interface ChatMessage {
  id?: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: string
  sentiment?: string
}

export interface Conversation {
  id: string
  title?: string
  created_at?: string
  updated_at?: string
  messages?: ChatMessage[]
}

interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
  sendMessage: (content: string) => Promise<ChatMessage>
  loadConversations: () => Promise<void>
  loadConversation: (id: string) => Promise<Conversation>
  updateConversation: (id: string, data: { title?: string }) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  createNewConversation: () => void
  setLoading: (loading: boolean) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isSending: false,

  sendMessage: async (content) => {
    set({ isSending: true })

    const userMessage: ChatMessage = { role: "user", content, timestamp: new Date().toISOString() }
    set({ messages: [...get().messages, userMessage] })

    try {
      const res = (await api.chat.sendMessage({
        message: content,
        conversation_id: get().currentConversation?.id,
      })) as { message?: unknown }

      let assistantContent = ""
      let sentiment: string | undefined

      if (res.message && typeof res.message === "object") {
        const msg = res.message as Record<string, unknown>
        if (msg.reply) assistantContent = String(msg.reply)
        else if (msg.content) assistantContent = String(msg.content)
        else assistantContent = JSON.stringify(msg, null, 2)
        sentiment = msg.sentiment ? String(msg.sentiment) : undefined
      } else if (res.message) {
        assistantContent = String(res.message)
      } else {
        assistantContent = "I'm here for you. Tell me more about how you're feeling."
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: assistantContent,
        sentiment,
        timestamp: new Date().toISOString(),
      }

      set({ messages: [...get().messages, assistantMessage], isSending: false })
      void get().loadConversations()
      return assistantMessage
    } catch (error) {
      set({ isSending: false })
      const errorMessage: ChatMessage = {
        role: "assistant",
        content:
          "I'm sorry, I couldn't reach the support service right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      }
      set({ messages: [...get().messages, errorMessage] })
      throw error
    }
  },

  loadConversations: async () => {
    set({ isLoading: true })
    try {
      const conversations = (await api.chat.getConversations()) as Conversation[]
      set({ conversations: Array.isArray(conversations) ? conversations : [] })
    } finally {
      set({ isLoading: false })
    }
  },

  loadConversation: async (id) => {
    set({ isLoading: true })
    try {
      const conversation = (await api.chat.getConversation(id)) as Conversation
      set({
        currentConversation: conversation,
        messages: conversation.messages ?? [],
      })
      return conversation
    } finally {
      set({ isLoading: false })
    }
  },

  updateConversation: async (id, data) => {
    await api.chat.updateConversation(id, data)
    await get().loadConversations()
  },

  deleteConversation: async (id) => {
    await api.chat.deleteConversation(id)
    const conversations = get().conversations.filter((c) => c.id !== id)
    const current =
      get().currentConversation?.id === id ? null : get().currentConversation
    set({
      conversations,
      currentConversation: current,
      messages: current ? get().messages : [],
    })
  },

  createNewConversation: () => {
    set({
      currentConversation: null,
      messages: [
        {
          role: "assistant",
          content:
            "Hi, I'm MindEase. I'm here to listen, without judgment. How are you feeling today?",
          timestamp: new Date().toISOString(),
        },
      ],
    })
  },

  setLoading: (loading) => set({ isLoading: loading }),
}))