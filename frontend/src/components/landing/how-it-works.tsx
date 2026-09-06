"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { UserPlus, MessageCircle, Smile, LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create your account",
    description:
      "Sign up with your email and a few details. Your data stays private and encrypted.",
  },
  {
    icon: MessageCircle,
    step: "02",
    title: "Start a conversation",
    description:
      "Chat with MindEase anytime. No appointments, no waiting, no judgment.",
  },
  {
    icon: Smile,
    step: "03",
    title: "Track how you feel",
    description:
      "Log your mood daily and build insights that help you notice what matters.",
  },
  {
    icon: LifeBuoy,
    step: "04",
    title: "Get the support you need",
    description:
      "From guided wellness to professional counselors and crisis help — connect to care.",
  },
]

export function HowItWorks() {
  return (
    <section className="relative bg-gradient-to-b from-slate-50 to-white py-24 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">
            How it works
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            A few steps to feeling more supported
          </h2>
        </motion.div>

        <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent lg:block" />
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="relative text-center lg:text-left"
              >
                <div className="mb-5 inline-flex">
                  <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                  </div>
                </div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-500">
                  Step {step.step}
                </p>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-slate-100">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {step.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-14 text-center"
        >
          <Link href="/register">
            <Button size="lg">
              Get started for free
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}