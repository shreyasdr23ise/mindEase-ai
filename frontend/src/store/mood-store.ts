"use client"

import { create } from "zustand"
import { api } from "@/lib/api"

export type MoodLevel =
  | "very_bad"
  | "bad"
  | "neutral"
  | "good"
  | "very_good"

export interface MoodEntry {
  id: string
  mood: MoodLevel | string
  level?: number
  note?: string
  created_at?: string
}

interface MoodState {
  moodHistory: MoodEntry[]
  currentMood: MoodEntry | null
  isLoading: boolean
  loadHistory: () => Promise<void>
  createMood: (mood: MoodLevel, level?: number, note?: string) => Promise<MoodEntry>
  deleteMood: (id: string) => Promise<void>
}

export const useMoodStore = create<MoodState>((set, get) => ({
  moodHistory: [],
  currentMood: null,
  isLoading: false,

  loadHistory: async () => {
    set({ isLoading: true })
    try {
      const history = (await api.mood.getMoodHistory()) as MoodEntry[]
      const sorted = Array.isArray(history)
        ? [...history].sort(
            (a, b) =>
              new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
          )
        : []
      set({
        moodHistory: sorted,
        currentMood: sorted[0] ?? null,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  createMood: async (mood, level, note) => {
    const entry = (await api.mood.createMood({ mood, level, note })) as MoodEntry
    set({ moodHistory: [entry, ...get().moodHistory], currentMood: entry })
    return entry
  },

  deleteMood: async (id) => {
    await api.mood.deleteMood(id)
    const moodHistory = get().moodHistory.filter((m) => m.id !== id)
    set({
      moodHistory,
      currentMood: moodHistory[0] ?? null,
    })
  },
}))