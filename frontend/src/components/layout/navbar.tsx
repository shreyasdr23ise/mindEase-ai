"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Sun,
  Moon,
  Bell,
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useThemeStore } from "@/store/theme-store"
import { useAuthStore } from "@/store/auth-store"
import { Avatar } from "@/components/ui/avatar"
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "@/components/ui/dropdown"
import { toast } from "@/components/ui/toast"

interface NavbarProps {
  title: string
  onOpenMobileSidebar: () => void
}

export function Navbar({ title, onOpenMobileSidebar }: NavbarProps) {
  const router = useRouter()
  const { theme, toggleTheme } = useThemeStore()
  const { user, logout } = useAuthStore()
  const isDark = theme === "dark"

  const handleLogout = async () => {
    await logout()
    toast.success("Logged out", "See you soon. Take care of yourself.")
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/75 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onOpenMobileSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <motion.h1
          key={title}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="truncate text-lg font-bold tracking-tight text-slate-800 dark:text-white"
        >
          {title}
        </motion.h1>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search..."
              className="h-9 w-40 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:w-56 focus:border-blue-500/50 focus:bg-white focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
            />
          </div>

          {/* Notifications */}
          <button
            className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
          </button>

          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
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

          {/* User menu */}
          <Dropdown
            width="w-60"
            trigger={
              <button className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                <Avatar
                  name={user?.name || user?.email || "User"}
                  size="sm"
                />
                <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
              </button>
            }
          >
            <DropdownLabel>
              Signed in as
              <span className="mt-0.5 block truncate text-xs font-normal normal-case tracking-normal text-slate-500 dark:text-slate-400">
                {user?.email || "guest@mindease.ai"}
              </span>
            </DropdownLabel>
            <DropdownSeparator />
            <DropdownItem icon={<User className="h-4 w-4" />} onClick={() => router.push("/profile")}>
              Profile
            </DropdownItem>
            <DropdownItem icon={<Settings className="h-4 w-4" />} onClick={() => router.push("/settings")}>
              Settings
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem icon={<LogOut className="h-4 w-4" />} destructive onClick={handleLogout}>
              Logout
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </header>
  )
}