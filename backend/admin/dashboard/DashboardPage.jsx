import React from 'react'
import { api } from '../services/api.js'
import { useFetch } from '../components/useFetch.js'
import { StatCard, Card, Spinner, ErrorNote } from '../components/UI.jsx'
import { CategoryBadge } from '../components/Badges.jsx'

export default function DashboardPage() {
  const { data, error, loading } = useFetch(() => api.get('/api/admin/dashboard'), [])

  if (loading) return <Spinner />
  if (error) return <ErrorNote message={error} />
  if (!data) return null

  const categories = Object.entries(data.by_category || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">Community health at a glance.</p>

      <div className="stats-grid">
        <StatCard label="Total events" value={data.total_events} sub="All time" />
        <StatCard label="Events today" value={data.events_today} />
        <StatCard label="Logins today" value={data.logins_today} />
        <StatCard label="Active users today" value={data.active_users_today} />
        <StatCard label="Failed logins today" value={data.failed_logins_today} />
      </div>

      <div className="grid-2">
        <Card title="Activity by category">
          {categories.length === 0 ? (
            <p className="muted">No activity recorded yet.</p>
          ) : (
            <table className="table">
              <tbody>
                {categories.map(([cat, count]) => (
                  <tr key={cat}>
                    <td>
                      <CategoryBadge category={cat} />
                    </td>
                    <td className="right">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Common events">
          <table className="table">
            <tbody>
              {Object.entries(data.by_event_type || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([event, count]) => (
                  <tr key={event}>
                    <td>{event}</td>
                    <td className="right">{count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}