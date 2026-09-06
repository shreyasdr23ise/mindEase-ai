"use client"

import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"

export default function MainRouteLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}
