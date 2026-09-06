"use client"

import { motion } from "framer-motion"
import { Heart, MessageCircleHeart, Ear, ShieldCheck } from "lucide-react"
import { AiOrb } from "@/components/shared/ai-orb"

const capabilities = [
  {
    icon: MessageCircleHeart,
    title: "A non-judgmental listener",
    description:
      "Say anything. MindEase responds with empathy and warmth, whatever you're going through.",
  },
  {
    icon: Ear,
    title: "Tuned to how you feel",
    description:
      "The AI reads emotional signals in your words and gently adapts its tone to match you.",
  },
  {
    icon: ShieldCheck,
    title: "Safety-aware responses",
    description:
      "When it detects distress, it responds with care and directs you to helpful resources.",
  },
  {
    icon: Heart,
    title: "Support for any moment",
    description:
      "Rough day, quiet worry, or something great to share — a listening ear whenever you need it.",
  },
]

export function AiSupportSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 py-24 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-950">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-sm font-semibold uppercase tracking-widest text-teal-300"
          >
            Emotional support, reimagined
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            An AI that listens with heart
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 max-w-xl text-lg text-blue-100"
          >
            Powered by thoughtful, clinically-informed prompting, MindEase AI blends
            empathy with evidence-based techniques like active listening, reflection, and
            gentle reframing.
          </motion.p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {capabilities.map((cap, i) => {
              const Icon = cap.icon
              return (
                <motion.div
                  key={cap.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"
                >
                  <Icon className="mb-3 h-6 w-6 text-teal-300" />
                  <h3 className="mb-1.5 text-sm font-semibold text-white">{cap.title}</h3>
                  <p className="text-sm leading-relaxed text-blue-100/80">
                    {cap.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center"
        >
          <div className="relative">
            <div className="absolute -inset-12 rounded-full bg-white/10 blur-2xl" />
            <AiOrb size={240} />
          </div>
        </motion.div>
      </div>
    </section>
  )
}