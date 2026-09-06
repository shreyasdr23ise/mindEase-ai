"use client"

import { motion } from "framer-motion"
import {
  MessageCircle,
  Smile,
  BookOpen,
  Heart,
  Pill,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: MessageCircle,
    title: "AI Chat Support",
    description:
      "Talk to a caring AI companion that listens without judgment, 24 hours a day.",
    gradient: "from-blue-500 to-sky-400",
  },
  {
    icon: Smile,
    title: "Mood Tracking",
    description:
      "Log how you feel daily and watch patterns emerge with clear visual trends.",
    gradient: "from-teal-500 to-emerald-400",
  },
  {
    icon: BookOpen,
    title: "Private Journal",
    description:
      "A safe, encrypted space to write your thoughts, vent, and reflect on growth.",
    gradient: "from-purple-500 to-violet-400",
  },
  {
    icon: Heart,
    title: "Wellness Center",
    description:
      "Guided breathing, grounding techniques, and exercises tailored to how you feel.",
    gradient: "from-rose-500 to-pink-400",
  },
  {
    icon: Pill,
    title: "Medicine Info",
    description:
      "Reliable, plain-language information about common psychiatric medications.",
    gradient: "from-amber-500 to-orange-400",
  },
  {
    icon: UserCheck,
    title: "Professional Help",
    description:
      "A directory of verified counselors and an easy way to request appointments.",
    gradient: "from-indigo-500 to-blue-400",
  },
  {
    icon: ShieldAlert,
    title: "Crisis Support",
    description:
      "Early warning signals and time-sensitive guidance when things feel heavy.",
    gradient: "from-red-500 to-rose-400",
  },
  {
    icon: ShieldCheck,
    title: "Privacy First",
    description:
      "Your data belongs to you. Encrypted, private, and never sold — ever.",
    gradient: "from-slate-600 to-slate-400",
  },
]

export function FeaturesSection() {
  return (
    <section className="relative bg-white py-24 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Features
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Everything you need, in one calm place
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            Thoughtfully designed tools to help you understand, express, and care for how
            you feel.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: (i % 4) * 0.08 }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 hover:border-blue-500/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40"
              >
                <div
                  className={cn(
                    "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30",
                    feature.gradient
                  )}
                />
                <div
                  className={cn(
                    "mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                    feature.gradient
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-slate-100">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}