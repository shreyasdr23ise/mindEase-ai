"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface TabsProps {
  tabs: { value: string; label: React.ReactNode; icon?: React.ReactNode }[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
}

export function Tabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  className,
}: TabsProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? tabs[0]?.value ?? "")
  const activeValue = isControlled ? (value ?? "") : internalValue

  const select = (v: string) => {
    if (!isControlled) setInternalValue(v)
    onValueChange?.(v)
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800",
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === activeValue
        return (
          <button
            key={tab.value}
            onClick={() => select(tab.value)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors duration-200",
              active
                ? "text-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-indicator-${className ?? "default"}`}
                className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-slate-900"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            {tab.icon && (
              <span className="relative z-10">{tab.icon}</span>
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}