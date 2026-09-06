"use client"

import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, Sun, Moon, X } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { LogoMark } from "@/components/shared/logo-mark"
import { useThemeStore } from "@/store/theme-store"

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Privacy", href: "#privacy" },
  { label: "Crisis support", href: "#crisis" },
]

export function LandingNavbar() {
  const { theme, toggleTheme } = useThemeStore()
  const [open, setOpen] = React.useState(false)
  const isDark = theme === "dark"

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/75 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark className="h-9 w-9" />
          <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-lg font-bold text-transparent dark:from-blue-400 dark:to-teal-300">
            MindEase AI
          </span>
        </Link>

        <nav className="ml-8 hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                className="block"
              >
                {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Get started</Button>
            </Link>
          </div>

          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-950 lg:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-2 px-3 pt-3">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">Log in</Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button className="w-full">Get started</Button>
                </Link>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}