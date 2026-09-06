"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"

const productLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Chat", href: "/chat" },
  { label: "Mood Tracker", href: "/mood" },
  { label: "Journal", href: "/journal" },
  { label: "Wellness", href: "/wellness" },
]

const supportLinks = [
  { label: "Medicines", href: "/medicines" },
  { label: "Professional Help", href: "/counselors" },
  { label: "Emergency Support", href: "/emergency" },
  { label: "Privacy Settings", href: "/privacy" },
]

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-14 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-400 shadow-lg shadow-blue-500/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-lg font-bold text-transparent dark:from-blue-400 dark:to-teal-300">
                MindEase AI
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              A private, compassionate space for your mental well-being. Talk, reflect,
              track, and grow — at your own pace.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Explore
            </h3>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Support
            </h3>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              Disclaimer:
            </strong>{" "}
            MindEase AI provides supportive conversation and general wellness information
            only. It does not diagnose, treat, or cure any medical or mental health
            condition and is not a substitute for professional care. If you are in crisis
            or experiencing an emergency, please contact your local emergency services or a
            crisis helpline immediately.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} MindEase AI. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}