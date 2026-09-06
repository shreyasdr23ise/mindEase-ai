"use client"

import * as React from "react"
import Image from "next/image"
import { cn, getInitials } from "@/lib/utils"

interface AvatarProps {
  name?: string
  src?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
  online?: boolean
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
}

export function Avatar({ name, src, size = "md", className, online }: AvatarProps) {
  const [failed, setFailed] = React.useState(false)
  const initials = getInitials(name || "?")

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full font-semibold",
          sizeClasses[size]
        )}
      >
        {src && !failed ? (
          <Image
            src={src}
            alt={name ?? "avatar"}
            fill
            sizes="80px"
            className="object-cover"
            onError={() => setFailed(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-400 text-white">
            {initials}
          </div>
        )}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
      )}
    </div>
  )
}