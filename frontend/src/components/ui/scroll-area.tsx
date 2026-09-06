"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal" | "both"
  hideScrollbar?: boolean
}

export function ScrollArea({
  orientation = "vertical",
  hideScrollbar = false,
  className,
  children,
  ...props
}: ScrollAreaProps) {
  const scrollbarClasses = hideScrollbar
    ? "scrollbar-none"
    : orientation === "both"
      ? "[scrollbar-width:thin] [scrollbar-color:theme(colors.slate.400)_transparent]"
      : "overflow-y-auto [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.400)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/50 [&::-webkit-scrollbar-thumb]:hover:bg-slate-400 [&::-webkit-scrollbar-track]:bg-transparent"

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full",
          orientation !== "horizontal" && orientation !== "both" && "overflow-y-auto",
          orientation === "horizontal" && "overflow-x-auto",
          orientation === "both" && "overflow-auto",
          scrollbarClasses
        )}
      >
        {children}
      </div>
    </div>
  )
}