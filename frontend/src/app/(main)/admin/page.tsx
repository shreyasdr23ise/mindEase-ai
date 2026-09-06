"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LoadingPage } from "@/components/shared/loading-page"

export default function AdminIndexPage() {
  const router = useRouter()

  React.useEffect(() => {
    router.replace("/admin/dashboard")
  }, [router])

  return <LoadingPage message="Opening admin dashboard..." />
}