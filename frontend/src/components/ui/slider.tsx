"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  min?: number
  max?: number
  step?: number
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  onComplete?: (value: number) => void
  label?: string
  description?: string
  showValue?: boolean
  formatValue?: (value: number) => string
  className?: string
}

export function Slider({
  min = 1,
  max = 10,
  step = 1,
  value,
  defaultValue = min,
  onChange,
  onComplete,
  label,
  description,
  showValue = false,
  formatValue,
  className,
}: SliderProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [isDragging, setIsDragging] = React.useState(false)
  const trackRef = React.useRef<HTMLDivElement>(null)

  const currentValue = isControlled ? (value ?? min) : internalValue
  const percentage = ((currentValue - min) / (max - min)) * 100

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    updateFromClientX(e.clientX)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) updateFromClientX(e.clientX)
  }

  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    onComplete?.(currentValue)
  }

  const updateFromClientX = (clientX: number) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const raw = min + ratio * (max - min)
    const stepped = Math.round((raw - min) / step) * step + min
    const clamped = Math.min(max, Math.max(min, stepped))
    setInternalValue(clamped)
    onChange?.(clamped)
  }

  return (
    <div className={cn("w-full select-none", className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between">
          <div>
            {label && (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
            )}
            {description && (
              <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>
            )}
          </div>
          {showValue && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              {formatValue ? formatValue(currentValue) : currentValue}
            </span>
          )}
        </div>
      )}
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={currentValue}
        aria-label={label}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onKeyDown={(e) => {
          const delta = e.key === "ArrowRight" || e.key === "ArrowUp" ? step : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -step : 0
          if (delta) {
            e.preventDefault()
            const next = Math.min(max, Math.max(min, currentValue + delta))
            setInternalValue(next)
            onChange?.(next)
          }
        }}
        className="relative flex h-6 w-full cursor-pointer touch-none items-center outline-none"
      >
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-400"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div
          className={cn(
            "pointer-events-none absolute h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 shadow-md ring-4 transition-transform duration-150",
            isDragging ? "scale-110 ring-blue-500/20" : "ring-white dark:ring-slate-900"
          )}
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
    </div>
  )
}