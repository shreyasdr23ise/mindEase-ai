"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const moodMap: Record<string, { emoji: string; label: string; color: string }> = {
  very_bad: { emoji: "😢", label: "Very Bad", color: "text-red-500" },
  bad: { emoji: "😞", label: "Bad", color: "text-orange-400" },
  neutral: { emoji: "😐", label: "Neutral", color: "text-slate-500" },
  good: { emoji: "🙂", label: "Good", color: "text-teal-500" },
  very_good: { emoji: "😄", label: "Very Good", color: "text-emerald-500" },
}

interface MoodEmojiProps {
  mood: string
  size?: "sm" | "md" | "lg" | "xl"
  showLabel?: boolean
  className?: string
}

const sizeClasses = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-6xl",
  xl: "text-8xl",
}

export function MoodEmoji({
  mood,
  size = "md",
  showLabel = false,
  className,
}: MoodEmojiProps) {
  const lower = mood.toLowerCase()
  const config = moodMap[lower] ?? {
    emoji: "💭",
    label: lower,
    color: "text-slate-400",
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <motion.span
        className={cn("select-none leading-none", sizeClasses[size], config.color)}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        whileHover={{ scale: 1.15, rotate: 10 }}
      >
        {config.emoji}
      </motion.span>
      {showLabel && (
        <span className="text-sm font-medium capitalize text-slate-600 dark:text-slate-300">
          {config.label}
        </span>
      )}
    </div>
  )
}