"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface TypingIndicatorProps {
  className?: string
  dots?: number
  size?: "sm" | "md"
}

export function TypingIndicator({
  className,
  dots = 3,
  size = "md",
}: TypingIndicatorProps) {
  const dotClass = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      aria-label="MindEase is typing"
    >
      {Array.from({ length: dots }).map((_, i) => (
        <motion.span
          key={i}
          className={cn(
            "rounded-full bg-gradient-to-r from-blue-400 to-teal-400",
            dotClass
          )}
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}