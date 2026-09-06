"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function LogoMark({ className }: { className?: string }) {
  const rawId = React.useId()
  const gradId = `me-grad-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`

  return (
    <svg
      viewBox="0 0 512 512"
      role="img"
      aria-label="MindEase AI logo"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="118" fill={`url(#${gradId})`} />
      <path
        fill="#ffffff"
        d="M256 396 C140 322 76 240 76 174 C76 126 112 96 156 96 C210 96 256 134 256 168 C256 134 302 96 356 96 C400 96 436 126 436 174 C436 240 372 322 256 396 Z"
      />
      <path
        fill="none"
        stroke="#0f766e"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M104 250 H178 L212 192 L252 296 L288 218 L322 250 H408"
      />
      <rect x="326" y="70" width="36" height="98" rx="12" fill="#ffffff" />
      <rect x="284" y="112" width="120" height="36" rx="12" fill="#ffffff" />
    </svg>
  )
}