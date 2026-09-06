"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeConfig = {
  sm: { track: "h-5 w-9", knob: "h-4 w-4", knobOn: "translate-x-4" },
  md: { track: "h-6 w-11", knob: "h-5 w-5", knobOn: "translate-x-5" },
  lg: { track: "h-7 w-13", knob: "h-6 w-6", knobOn: "translate-x-6" },
}

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
  size = "md",
}: SwitchProps) {
  const isControlled = checked !== undefined
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
  const isChecked = isControlled ? checked : internalChecked

  const toggle = () => {
    if (disabled) return
    const next = !isChecked
    if (!isControlled) setInternalChecked(next)
    onCheckedChange?.(next)
  }

  const { track, knob, knobOn } = sizeConfig[size]

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={label}
        onClick={toggle}
        disabled={disabled}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
          isChecked
            ? "bg-gradient-to-r from-blue-500 to-teal-400"
            : "bg-slate-300 dark:bg-slate-700",
          disabled && "cursor-not-allowed opacity-50",
          track
        )}
      >
        <AnimatePresence initial={false}>
          <motion.span
            className={cn(
              "rounded-full bg-white shadow-sm",
              knob
            )}
            initial={false}
            animate={{ x: isChecked ? parseInt(knobOn) : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </AnimatePresence>
      </button>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  )
}