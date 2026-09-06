"use client"

import hotToast, { Toaster as HotToaster, type Toast } from "react-hot-toast"
import { CheckCircle2, AlertCircle, Info, XCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

const toastStyles = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    borderClass: "border-emerald-500/30",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-500",
    borderClass: "border-red-500/30",
  },
  warning: {
    icon: AlertCircle,
    iconClass: "text-amber-500",
    borderClass: "border-amber-500/30",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-500",
    borderClass: "border-blue-500/30",
  },
}

type ToastType = keyof typeof toastStyles

export function showToast(type: ToastType, title: string, description?: string) {
  const { icon: Icon, iconClass, borderClass } = toastStyles[type]
  return hotToast.custom(
    (t: Toast) => (
      <AnimatePresence>
        {t.visible && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-4 shadow-xl shadow-slate-900/5 dark:bg-slate-900 dark:shadow-black/40",
              borderClass
            )}
          >
            <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconClass)} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {title}
              </p>
              {description && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={() => hotToast.dismiss(t.id)}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    ),
    { duration: 4000 }
  )
}

export const toast = {
  success: (title: string, description?: string) => showToast("success", title, description),
  error: (title: string, description?: string) => showToast("error", title, description),
  warning: (title: string, description?: string) => showToast("warning", title, description),
  info: (title: string, description?: string) => showToast("info", title, description),
  dismiss: (id?: string) => hotToast.dismiss(id),
}

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "transparent",
          boxShadow: "none",
          padding: 0,
        },
      }}
    />
  )
}