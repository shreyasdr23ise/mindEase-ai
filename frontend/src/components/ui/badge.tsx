"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
        destructive: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
        info: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
        secondary: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        outline: "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300",
        purple: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
        teal: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }