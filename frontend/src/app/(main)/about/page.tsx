"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Sparkles,
  Brain,
  ShieldCheck,
  AlertTriangle,
  Heart,
  MessageCircle,
  Bot,
  Lock,
  Users,
  Cpu,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AiOrb } from "@/components/shared/ai-orb"
import { PageHeader } from "@/components/shared/page-header"

const TECH_STACK = [
  {
    icon: Bot,
    title: "AI Conversations",
    description:
      "Powered by a fine-tuned LLM with crisis detection and empathetic response generation.",
  },
  {
    icon: Brain,
    title: "Sentiment & Mood Analysis",
    description:
      "Natural language understanding that reads emotional tone and maps it to mood over time.",
  },
  {
    icon: Heart,
    title: "Wellness & Clinical Data",
    description:
      "Curated exercises, medicine information and counselor matching grounded in clinical sources.",
  },
  {
    icon: Lock,
    title: "Private & Secure Stack",
    description:
      "JWT-authenticated REST API with encryption in transit and at rest. Your data, your call.",
  },
]

const SAFETY_POINTS = [
  {
    icon: Lock,
    title: "Privacy first",
    description:
      "Your conversations are encrypted and never sold. You control sharing, retention and deletion at any time.",
  },
  {
    icon: ShieldCheck,
    title: "Crisis awareness",
    description:
      "MindEase continuously monitors for distress signals and surfaces professional resources when you need them most.",
  },
  {
    icon: Users,
    title: "Human support available",
    description:
      "AI is no substitute for professional care. We connect you with counselors and crisis services whenever necessary.",
  },
  {
    icon: Cpu,
    title: "Transparent AI",
    description:
      "We're open about how our models work and regularly audit them for bias and safety.",
  },
]

const TEAM = [
  { name: "Alex Rivera", role: "Product & Design" },
  { name: "Priya Sharma", role: "AI Research" },
  { name: "Marcus Chen", role: "Engineering" },
]

function HowItWorksStep({
  step,
  title,
  description,
}: {
  step: number
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-400 text-sm font-bold text-white shadow-lg shadow-blue-500/25">
        {step}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  )
}

export default function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <PageHeader
        title="About MindEase AI"
        subtitle="Your compassionate, private companion for mental well-being."
      />

      {/* Hero */}
      <Card variant="glass" className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-8 p-8 text-center sm:flex-row sm:text-left">
          <div className="shrink-0">
            <AiOrb size={130} pulseSpeed={4} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              A space to talk, reflect and feel supported
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              MindEase AI combines conversational AI, mood tracking, journaling and wellness
              resources into one calm, private space. It listens without judgment, notices how you&apos;re
              feeling over time, and gently guides you toward healthier habits — while always keeping
              professional help within reach when it&apos;s needed.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant="teal">
                <Sparkles className="h-3 w-3" />
                v0.1.0 Beta
              </Badge>
              <Badge variant="secondary">Next.js 16</Badge>
              <Badge variant="secondary">Tailwind CSS</Badge>
              <Badge variant="secondary">Recharts</Badge>
              <Badge variant="secondary">Framer Motion</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technology stack */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Technology stack
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TECH_STACK.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} hoverable className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 text-white shadow-lg">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {item.description}
                </p>
              </Card>
            )
          })}
        </div>
      </div>

      {/* How AI works */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            How the AI works
          </CardTitle>
          <CardDescription>Simplified — no jargon, just how it helps you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <HowItWorksStep
            step={1}
            title="You talk, it listens"
            description="Share anything in the chat. MindEase reads the emotional tone behind your words — calm, anxious, sad, hopeful."
          />
          <HowItWorksStep
            step={2}
            title="It responds with care"
            description="Responses are generated to be empathetic and grounded, matching the interaction style you chose during setup."
          />
          <HowItWorksStep
            step={3}
            title="It watches for distress"
            description="If language suggests a crisis, MindEase pauses conversation and provides crisis resources or counselor contacts immediately."
          />
          <HowItWorksStep
            step={4}
            title="You build insights over time"
            description="Mood logs, journal reflections and conversations combine into your personal trends — so you can see progress week over week."
          />
        </CardContent>
      </Card>

      {/* Safety & privacy */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Our commitment to safety &amp; privacy
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {SAFETY_POINTS.map((point) => {
            const Icon = point.icon
            return (
              <Card key={point.title} hoverable className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-400 text-white shadow-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {point.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {point.description}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <Card className="border-amber-200/70 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5">
        <CardContent className="flex items-start gap-3 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="text-sm text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              Important disclaimer
            </p>
            <p className="mt-1 leading-relaxed">
              MindEase AI is an experimental mental wellness tool and is{" "}
              <strong>not a substitute for professional medical advice, diagnosis or treatment</strong>.
              It does not provide clinical care and cannot replace a licensed therapist, psychologist
              or physician. If you are in crisis or experiencing thoughts of self-harm, please reach
              out to a local emergency service or a qualified helpline immediately.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Team */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Built with care
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TEAM.map((member) => (
            <Card key={member.name} hoverable className="p-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-400 text-lg font-bold text-white shadow-lg">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {member.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{member.role}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Version */}
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 p-5 text-center dark:border-slate-700">
        <MessageCircle className="h-4 w-4 text-slate-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          MindEase AI Beta · Version 0.1.0 · Built by a small team with big hearts. Feedback is
          always welcome — your well-being is our priority.
        </p>
      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} MindEase AI. All rights reserved.
      </p>
    </motion.div>
  )
}