"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface AiOrbProps {
  size?: number
  className?: string
  reacting?: boolean
  pulseSpeed?: number
}

export function AiOrb({
  size = 120,
  className,
  reacting = false,
  pulseSpeed = 3,
}: AiOrbProps) {
  return (
    <motion.div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/30 via-purple-400/20 to-teal-400/30 blur-md"
        animate={{ scale: reacting ? [1, 1.25, 1] : [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* mid ring */}
      <motion.div
        className="absolute inset-[8%] rounded-full bg-gradient-to-tr from-blue-500/40 to-teal-400/30 backdrop-blur-sm"
        animate={{ scale: [1, 1.08, 1], rotate: [0, 180, 360] }}
        transition={{
          scale: { duration: pulseSpeed, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 24, repeat: Infinity, ease: "linear" },
        }}
      />
      {/* core */}
      <motion.div
        className="absolute inset-[22%] flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-purple-500 to-teal-400 shadow-2xl shadow-blue-500/40"
        animate={{
          scale: reacting ? [1, 1.12, 1] : 1,
          boxShadow: [
            "0 10px 30px -6px rgba(59,130,246,0.5)",
            "0 10px 44px -4px rgba(139,92,246,0.6)",
            "0 10px 30px -6px rgba(59,130,246,0.5)",
          ],
        }}
        transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="h-1/3 w-1/3 text-white/95" strokeWidth={2} />
      </motion.div>
      {/* orbiting sparkles */}
      {[0, 90, 180, 270].map((angle) => (
        <motion.div
          key={angle}
          className="absolute h-2 w-2 rounded-full bg-teal-300/70"
          style={{ inset: "6%" }}
          animate={{
            rotate: 360,
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="absolute h-2 w-2 rounded-full bg-teal-300/80"
            style={{
              transform: `rotate(${angle}deg) translateX(${size * 0.36}px)`,
            }}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}