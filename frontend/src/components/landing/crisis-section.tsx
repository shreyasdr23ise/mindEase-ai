"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  PhoneCall,
  HeartHandshake,
  MapPin,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const hotlines = [
  {
    name: "988 Suicide & Crisis Lifeline (US)",
    detail: "Call or text 988",
    note: "24/7, free and confidential",
  },
  {
    name: "Crisis Text Line",
    detail: "Text HOME to 741741",
    note: "24/7 text support",
  },
  {
    name: "National Helpline (SAMHSA, US)",
    detail: "Call 1-800-662-4357",
    note: "Treatment and support, 24/7",
  },
]

export function CrisisSection() {
  return (
    <section className="relative bg-slate-50 py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
            className="mx-auto mb-12 max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-red-600 dark:text-red-400">
            In crisis?
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            You matter. Help is available right now.
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            MindEase AI is a supportive companion, but it is not a crisis service. If you
            are in immediate danger, call your local emergency number right away.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
          {hotlines.map((line, i) => {
            const Icon = i === 0 ? PhoneCall : i === 1 ? HeartHandshake : MapPin
            return (
              <motion.div
                key={line.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="flex flex-col items-start rounded-2xl border border-red-500/20 bg-white p-6 shadow-sm dark:bg-slate-800"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100">
                  {line.name}
                </h3>
                <p className="mt-1.5 text-lg font-bold text-red-500">{line.detail}</p>
                <p className="mt-0.5 text-xs text-slate-400">{line.note}</p>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:text-left"
        >
          <div className="flex shrink-0 items-center justify-center rounded-full bg-amber-100 p-3 dark:bg-amber-500/15">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Inside MindEase, the AI also watches for warning signs.
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              When it senses distress, it responds with gentle, time-sensitive guidance and
              directs you to resources.
            </p>
          </div>
          <Link href="/emergency">
            <Button variant="destructive" className="shrink-0 gap-2">
              Emergency resources
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}