"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  LayoutDashboard,
  MessageCircle,
  Smile,
  BookOpen,
  Heart,
  Pill,
  UserCheck,
  AlertTriangle,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LogoMark } from "@/components/shared/logo-mark"
import { useAuthStore } from "@/store/auth-store"
import { Avatar } from "@/components/ui/avatar"
import { Tooltip } from "@/components/ui/tooltip"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/mood", label: "Mood", icon: Smile },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/wellness", label: "Wellness", icon: Heart },
  { href: "/medicines", label: "Medicines", icon: Pill },
  { href: "/counselors", label: "Professional Help", icon: UserCheck },
  { href: "/emergency", label: "Emergency", icon: AlertTriangle },
]

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <LogoMark className="h-9 w-9" />
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          className="flex flex-col leading-tight"
        >
          <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-base font-bold text-transparent dark:from-blue-400 dark:to-teal-300">
            MindEase
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
            AI Care
          </span>
        </motion.div>
      )}
    </div>
  )
}

interface SidebarContentProps {
  collapsed: boolean
  onToggle?: () => void
  isMobile?: boolean
  onNavigate?: () => void
}

function SidebarContent({
  collapsed,
  onToggle,
  isMobile = false,
  onNavigate,
}: SidebarContentProps) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 pt-5">
        <Logo collapsed={collapsed} />
        {isMobile && (
          <button
            onClick={onNavigate}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          const link = (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                collapsed && !isMobile && "justify-center px-2.5",
                active
                  ? "text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              )}
            >
              {active && (
                <motion.span
                  layoutId={isMobile ? "mobile-nav-active" : "desktop-nav-active"}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 shadow-lg shadow-blue-500/30"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  active ? "text-white" : "text-slate-400 group-hover:text-blue-500 dark:text-slate-400"
                )}
              />
              {!collapsed && (
                <span className="relative z-10 truncate">{item.label}</span>
              )}
              {collapsed && !isMobile && item.label && (
                <span className="relative z-10 h-1.5 w-1.5 rounded-full bg-teal-400" />
              )}
            </Link>
          )

          if (collapsed && !isMobile) {
            return (
              <Tooltip key={item.href} content={item.label} side="right">
                {link}
              </Tooltip>
            )
          }
          return link
        })}
      </nav>

      <div className="border-t border-slate-200/70 p-3 dark:border-slate-800">
        {!collapsed || isMobile ? (
          <button
            onClick={onToggle}
            className={cn(
              "mb-2 flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300",
              isMobile && "hidden lg:block"
            )}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="mb-2 mx-auto flex w-8 items-center justify-center rounded-lg py-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Expand sidebar"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
          <Avatar name={user?.name || user?.email || "User"} size="sm" online />
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                {user?.name || user?.email?.split("@")[0] || "Guest"}
              </p>
              <p className="truncate text-xs text-slate-400">Member</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "sticky top-0 z-30 hidden h-screen shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur-xl transition-[width] duration-300 dark:border-slate-800 dark:bg-slate-900/70 lg:block",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={onToggleCollapsed}
        />
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 overflow-hidden bg-white shadow-2xl dark:bg-slate-900 lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <SidebarContent
                collapsed={false}
                isMobile
                onToggle={onToggleCollapsed}
                onNavigate={onCloseMobile}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}