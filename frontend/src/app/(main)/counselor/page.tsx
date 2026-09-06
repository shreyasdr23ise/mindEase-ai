"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LoadingPage } from "@/components/shared/loading-page"

export default function CounselorIndexPage() {
  const router = useRouter()

  React.useEffect(() => {
    router.replace("/counselor/dashboard")
  }, [router])

  return <LoadingPage message="Opening counselor dashboard..." />
}