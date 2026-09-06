"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface EmotionConfig {
  label: string
  color: string
  icon: React.ReactNode
  className?: string
}

interface EmotionBadgeProps {
  emotion: string
  configs?: Record<string, EmotionConfig>
}

const defaultConfigs: Record<string, EmotionConfig> = {
  happy: {
    label: "Happy",
    color: "emerald",
    icon: <span aria-hidden>😊</span>,
  },
  joy: {
    label: "Joyful",
    color: "emerald",
    icon: <span aria-hidden>😄</span>,
  },
  great: { label: "Great", color: "emerald", icon: <span aria-hidden>😄</span> },
  good: { label: "Good", color: "teal", icon: <span aria-hidden>🙂</span> },
  calm: { label: "Calm", color: "teal", icon: <span aria-hidden>😌</span> },
  peaceful: { label: "Peaceful", color: "teal", icon: <span aria-hidden>😌</span> },
  neutral: { label: "Neutral", color: "secondary", icon: <span aria-hidden>😐</span> },
  okay: { label: "Okay", color: "secondary", icon: <span aria-hidden>😐</span> },
  anxious: { label: "Anxious", color: "amber", icon: <span aria-hidden>😰</span> },
  nervous: { label: "Nervous", color: "amber", icon: <span aria-hidden>😟</span> },
  worried: { label: "Worried", color: "amber", icon: <span aria-hidden>😟</span> },
  sad: { label: "Sad", color: "purple", icon: <span aria-hidden>😢</span> },
  lonely: { label: "Lonely", color: "purple", icon: <span aria-hidden>💔</span> },
  low: { label: "Low", color: "purple", icon: <span aria-hidden>😔</span> },
  down: { label: "Down", color: "purple", icon: <span aria-hidden>😔</span> },
  angry: { label: "Angry", color: "destructive", icon: <span aria-hidden>😠</span> },
  frustrated: {
    label: "Frustrated",
    color: "destructive",
    icon: <span aria-hidden>😤</span> },
  stressed: {
    label: "Stressed",
    color: "amber",
    icon: <span aria-hidden>😣</span>,
  },
  overwhelmed: {
    label: "Overwhelmed",
    color: "destructive",
    icon: <span aria-hidden>😫</span>,
  },
}

const colorVariantMap: Record<string, "default" | "success" | "warning" | "destructive" | "info" | "secondary" | "outline" | "purple" | "teal"> = {
  default: "default",
  emerald: "success",
  teal: "teal",
  purple: "purple",
  amber: "warning",
  destructive: "destructive",
  secondary: "secondary",
  info: "info",
  outline: "outline",
}

export function EmotionBadge({ emotion, configs }: EmotionBadgeProps) {
  const normalized = emotion.toLowerCase().trim()
  const config =
    configs?.[normalized] ??
    configs?.[emotion] ??
    defaultConfigs[normalized] ??
    defaultConfigs[emotion]
  const variant = config ? colorVariantMap[config.color] ?? "default" : "default"

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <Badge variant={variant} className={cn("gap-1.5 py-1 pl-2 pr-3 text-xs", config?.className)}>
        {config?.icon && <span className="text-sm">{config.icon}</span>}
        {config?.label ?? emotion}
      </Badge>
    </motion.div>
  )
}