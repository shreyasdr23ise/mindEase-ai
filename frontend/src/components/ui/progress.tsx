"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressProps {
  value: number
  max?: number
  className?: string
  indicatorClassName?: string
  showLabel?: boolean
  color?: "blue" | "teal" | "purple" | "red" | "amber"
  size?: "sm" | "md" | "lg"
}

export function Progress({
  value,
  max = 100,
  className,
  indicatorClassName,
  showLabel = false,
  color = "blue",
  size = "md",
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const colorClasses = {
    blue: "bg-gradient-to-r from-blue-500 to-sky-400",
    teal: "bg-gradient-to-r from-teal-500 to-emerald-400",
    purple: "bg-gradient-to-r from-purple-500 to-violet-400",
    red: "bg-gradient-to-r from-red-500 to-rose-400",
    amber: "bg-gradient-to-r from-amber-500 to-orange-400",
  }[color]

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }[size]

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("relative w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800", sizeClasses)}>
        <motion.div
          className={cn("relative h-full overflow-hidden rounded-full", colorClasses, indicatorClassName)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          <div className="absolute inset-0 animate-[progress-shine_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </motion.div>
      </div>
      {showLabel && (
        <div className="mt-1.5 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  )
}