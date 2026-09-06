"use client"

import { motion } from "framer-motion"
import {
  Lock,
  EyeOff,
  Database,
  ShieldCheck,
  FileText,
  Trash2,
  Fingerprint,
} from "lucide-react"

const privacyPoints = [
  {
    icon: Lock,
    title: "End-to-end privacy",
    description:
      "Your chats, journal entries, and mood logs are stored securely and never shared with third parties.",
  },
  {
    icon: EyeOff,
    title: "You stay anonymous",
    description:
      "No social graph, no public profile, no advertising — your well-being is not a product.",
  },
  {
    icon: Database,
    title: "You own your data",
    description:
      "Export or permanently delete everything you've shared with MindEase, any time.",
  },
  {
    icon: Fingerprint,
    title: "Secure by design",
    description:
      "Authentication, encryption in transit and at rest, and strict access controls throughout.",
  },
]

const badges = [
  { icon: ShieldCheck, label: "Encrypted storage" },
  { icon: FileText, label: "Transparent policies" },
  { icon: Trash2, label: "Delete anytime" },
]

export function PrivacySection() {
  return (
    <section className="relative bg-white py-24 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-14 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-sm font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">
              Privacy &amp; Safety
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              What you share with us stays with you
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
              Mental health is deeply personal. That&apos;s why privacy isn&apos;t a setting at
              MindEase — it&apos;s the foundation.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {badges.map((b, i) => {
                const Icon = b.icon
                return (
                  <motion.div
                    key={b.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <Icon className="h-4 w-4 text-purple-500" />
                    {b.label}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {privacyPoints.map((point, i) => {
              const Icon = point.icon
              return (
                <motion.div
                  key={point.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-purple-500/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-500/40"
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-400 text-white shadow-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {point.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {point.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}