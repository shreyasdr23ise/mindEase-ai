"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { MessageCircle, Smile, Heart, AlertTriangle } from "lucide-react"
import { AiOrb } from "@/components/shared/ai-orb"
import { Button } from "@/components/ui/button"

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

function Particles() {
  const particles = Array.from({ length: 18 })
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((_, i) => {
        const left = (i * 53) % 100
        const size = 3 + ((i * 7) % 7)
        const delay = (i % 9) * 0.6
        const duration = 8 + ((i * 13) % 10)
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-gradient-to-tr from-blue-400/40 to-purple-300/40"
            style={{ left: `${left}%`, top: `${(i * 37) % 100}%`, width: size, height: size }}
            animate={{ y: [0, -40, 0], x: [0, 12, 0], opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
          />
        )
      })}
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-teal-50 to-purple-50 pb-24 pt-20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:pt-28">
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-blue-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-1/5 h-96 w-96 rounded-full bg-purple-400/25 blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-1/3 h-64 w-64 rounded-full bg-teal-300/25 blur-3xl" />
      <Particles />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
        <div className="max-w-2xl">
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/70 px-4 py-1.5 text-xs font-medium text-blue-700 backdrop-blur dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
            Always here, day and night
          </motion.p>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl"
          >
            Your space to{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-teal-500 bg-clip-text text-transparent">
              talk, reflect
            </span>{" "}
            and feel supported.
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-300"
          >
            MindEase AI is a compassionate companion for your mental well-being. Chat with
            a supportive AI, track your moods, journal your thoughts, and access wellness
            resources — all in one private, calming space.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-9 flex flex-wrap gap-3.5"
          >
            <Link href="/register">
              <Button size="lg" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Start Conversation
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="gap-2">
                <Smile className="h-4 w-4" />
                Check Your Mood
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                <Heart className="h-4 w-4" />
                Explore Wellness
              </Button>
            </Link>
            <Link href="/emergency">
              <Button size="lg" variant="destructive" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Emergency Help
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex items-center justify-center"
        >
          <div className="relative">
            <motion.div
              className="absolute -inset-10 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-2xl"
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <AiOrb size={220} />
          </div>
        </motion.div>
      </div>
    </section>
  )
}