import React from 'react'
import { api } from '../services/api.js'
import { useFetch } from '../components/useFetch.js'
import { Spinner, ErrorNote, Card, StatCard } from '../components/UI.jsx'

export default function AnalyticsPage() {
  const { data, error, loading } = useFetch(() => api.get('/api/admin/analytics'), [])

  if (loading) return <Spinner />
  if (error) return <ErrorNote message={error} />
  if (!data) return null

  return (
    <div>
      <h1>Analytics</h1>
      <p className="muted">Platform-wide usage metrics.</p>

      <div className="stats-grid">
        <StatCard label="Total users" value={data.total_users} />
        <StatCard label="Active users today" value={data.active_users_today} />
        <StatCard label="Conversations" value={data.total_conversations} />
        <StatCard label="Messages" value={data.total_messages} />
        <StatCard label="Mood logs" value={data.total_mood_logs} />
        <StatCard label="Journal entries" value={data.total_journal_entries} />
        <StatCard label="Wellness sessions" value={data.total_wellness_sessions} />
        <StatCard label="Crisis events" value={data.total_crisis_events} />
        <StatCard label="Counselors" value={data.total_counselors} />
      </div>

      <Card title="Notes">
        <p className="muted">
          These totals are computed server-side from the production database.
          The Activity Logs page gives per-event detail for the same underlying data.
        </p>
      </Card>
    </div>
  )
}