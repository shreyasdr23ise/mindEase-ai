"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Pill,
  AlertTriangle,
  ShieldAlert,
  Info,
  Clock,
  ExternalLink,
  BookOpen,
  AlertCircle,
  Stethoscope,
  Shield,
  Activity,
  Calendar,
} from "lucide-react"
import { LoadingPage } from "@/components/shared/loading-page"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api"

interface MedicineDetail {
  id: string
  name: string
  generic_name?: string
  category?: string
  description?: string
  uses?: string[]
  side_effects?: string[]
  warnings?: string[]
  precautions?: string[]
  administration?: string
  interactions?: string[]
  source_url?: string
  source_name?: string
  last_updated?: string
}

function normalizeDetail(raw: unknown): MedicineDetail {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(d.id ?? d.medicine_id ?? ""),
    name: String(d.name ?? d.brand_name ?? "Unknown Medicine"),
    generic_name: typeof d.generic_name === "string" ? d.generic_name : undefined,
    category: typeof d.category === "string" ? d.category : undefined,
    description: typeof d.description === "string" ? d.description : undefined,
    uses: Array.isArray(d.uses) ? d.uses.map(String) : Array.isArray(d.common_uses) ? d.common_uses.map(String) : undefined,
    side_effects: Array.isArray(d.side_effects) ? d.side_effects.map(String) : undefined,
    warnings: Array.isArray(d.warnings) ? d.warnings.map(String) : undefined,
    precautions: Array.isArray(d.precautions) ? d.precautions.map(String) : undefined,
    administration: typeof d.administration === "string" ? d.administration : typeof d.administration_info === "string" ? d.administration_info : undefined,
    interactions: Array.isArray(d.interactions) ? d.interactions.map(String) : Array.isArray(d.interaction_warnings) ? d.interaction_warnings.map(String) : undefined,
    source_url: typeof d.source_url === "string" ? d.source_url : undefined,
    source_name: typeof d.source_name === "string" ? d.source_name : undefined,
    last_updated: typeof d.last_updated === "string" ? d.last_updated : typeof d.updated_at === "string" ? d.updated_at : undefined,
  }
}

function formatDateShort(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

export default function MedicineDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = String(params?.id ?? "")
  const [medicine, setMedicine] = React.useState<MedicineDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    if (!id) return
    let active = true
    async function load() {
      try {
        const raw = await api.medicine.getById(id)
        if (active) setMedicine(normalizeDetail(raw))
      } catch {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [id])

  if (!id) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <EmptyState
          icon={<Pill className="h-7 w-7" />}
          title="Medicine not found"
          description="We couldn't find information about this medicine."
          action={
            <Button onClick={() => router.push("/medicines")} variant="outline">
              Browse medicines
            </Button>
          }
        />
      </div>
    )
  }

  if (loading) return <LoadingPage message="Loading medicine information..." />

  if (error || !medicine) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <EmptyState
          icon={<Pill className="h-7 w-7" />}
          title="Medicine not found"
          description="We couldn't find information about this medicine."
          action={
            <Button onClick={() => router.push("/medicines")} variant="outline">
              Browse medicines
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="-ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to medicines
      </Button>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-teal-400/15">
            <Pill className="h-6 w-6 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {medicine.name}
            </h1>
            {medicine.generic_name && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Generic: {medicine.generic_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {medicine.category && (
            <Badge variant="default">
              <BookOpen className="h-3 w-3" />
              {medicine.category}
            </Badge>
          )}
          {medicine.last_updated && (
            <Badge variant="secondary">
              <Calendar className="h-3 w-3" />
              Updated {formatDateShort(medicine.last_updated)}
            </Badge>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-amber-300/70 bg-gradient-to-r from-amber-50/80 to-orange-50/60 p-4 dark:border-amber-500/25 dark:from-amber-950/30 dark:to-orange-950/20"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Disclaimer
            </p>
            <p className="mt-0.5 text-sm text-amber-700/80 dark:text-amber-300/70">
              This information is for general educational purposes only and is not a substitute for professional medical advice. Always consult your healthcare provider before making any decisions about your medication.
            </p>
          </div>
        </div>
      </motion.div>

      {medicine.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4 text-blue-500" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {medicine.description}
            </p>
          </CardContent>
        </Card>
      )}

      {medicine.uses && medicine.uses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="h-4 w-4 text-teal-500" />
              Common Uses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {medicine.uses.map((use, i) => (
                <Badge key={i} variant="teal">{use}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {medicine.side_effects && medicine.side_effects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-amber-500" />
              Side Effects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {medicine.side_effects.map((effect, i) => (
                <Badge key={i} variant="warning">{effect}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {medicine.warnings && medicine.warnings.length > 0 && (
        <div className="rounded-2xl border border-red-300/70 bg-red-50/60 p-5 dark:border-red-500/25 dark:bg-red-500/[0.07]">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="text-base font-semibold text-red-800 dark:text-red-200">
              Warnings
            </h3>
          </div>
          <ul className="space-y-2">
            {medicine.warnings.map((warning, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700/90 dark:text-red-300/80">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {medicine.precautions && medicine.precautions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-blue-500" />
              Precautions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {medicine.precautions.map((precaution, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  <span>{precaution}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {medicine.administration && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-purple-500" />
              Administration Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {medicine.administration}
            </p>
          </CardContent>
        </Card>
      )}

      {medicine.interactions && medicine.interactions.length > 0 && (
        <div className="rounded-2xl border border-orange-300/70 bg-orange-50/60 p-5 dark:border-orange-500/25 dark:bg-orange-500/[0.07]">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-base font-semibold text-orange-800 dark:text-orange-200">
              Interaction Warnings
            </h3>
          </div>
          <ul className="space-y-2">
            {medicine.interactions.map((interaction, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-orange-700/90 dark:text-orange-300/80">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{interaction}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="h-4 w-4 text-rose-500" />
            When to Seek Professional Help
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
            Contact a healthcare professional immediately if you experience:
          </p>
          <ul className="space-y-2">
            {[
              "Severe or unexpected side effects",
              "Allergic reactions (rash, swelling, difficulty breathing)",
              "Symptoms that worsen or don't improve",
              "Any concerning changes in your health",
              "Questions about your medication or treatment plan",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {medicine.source_url && (
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Source: {medicine.source_name ?? "External Reference"}
              </p>
            </div>
            <a
              href={medicine.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Visit
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </CardContent>
        </Card>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-500 dark:text-blue-400" />
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Important reminder
            </p>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              The information provided here is for educational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read here.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
