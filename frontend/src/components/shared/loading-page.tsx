"use client"

import { motion } from "framer-motion"
import { AiOrb } from "@/components/shared/ai-orb"

interface LoadingPageProps {
  message?: string
}

export function LoadingPage({ message = "Loading your space..." }: LoadingPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <AiOrb size={96} />
      <motion.p
        className="text-sm font-medium text-slate-500 dark:text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  )
}