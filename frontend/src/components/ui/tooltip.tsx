"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  sideOffset?: number
  delay?: number
  className?: string
}

export function Tooltip({
  content,
  children,
  side = "top",
  sideOffset = 8,
  delay = 300,
  className,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  const computePosition = () => {
    const wrap = wrapRef.current
    const tooltip = tooltipRef.current
    if (!wrap || !tooltip) return
    const rect = wrap.getBoundingClientRect()
    const tRect = tooltip.getBoundingClientRect()

    let top = 0
    let left = 0
    switch (side) {
      case "top":
        top = rect.top - tRect.height - sideOffset
        left = rect.left + rect.width / 2 - tRect.width / 2
        break
      case "bottom":
        top = rect.bottom + sideOffset
        left = rect.left + rect.width / 2 - tRect.width / 2
        break
      case "left":
        top = rect.top + rect.height / 2 - tRect.height / 2
        left = rect.left - tRect.width - sideOffset
        break
      case "right":
        top = rect.top + rect.height / 2 - tRect.height / 2
        left = rect.right + sideOffset
        break
    }
    setPosition({ top, left })
  }

  const show = () => {
    timerRef.current = setTimeout(() => {
      computePosition()
      setOpen(true)
    }, delay)
  }

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setOpen(false)
  }

  return (
    <div
      ref={wrapRef}
      className="inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={tooltipRef}
            style={{ position: "fixed", top: position.top, left: position.left, zIndex: 60 }}
            initial={{ opacity: 0, scale: 0.9, y: side === "top" ? 4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: side === "top" ? 4 : 0 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "pointer-events-none whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-100 shadow-lg dark:bg-slate-100 dark:text-slate-800",
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}