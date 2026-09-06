import React, { useEffect, useState } from 'react'
import { api, API_BASE } from '../services/api.js'
import { useFetch } from '../components/useFetch.js'
import { Spinner, ErrorNote, EmptyNote, Card } from '../components/UI.jsx'
import { CategoryBadge, StatusBadge, EventTypeBadge } from '../components/Badges.jsx'
import { Pagination } from '../components/Pagination.jsx'

function fmt(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

export default function ActivityLogsPage({ go }) {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [q, setQ] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventCategory, setEventCategory] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('desc')
  const [userFilter, setUserFilter] = useState('')
  const [applied, setApplied] = useState('')

  const query = new URLSearchParams({ page: String(page), page_size: String(pageSize), sort })
  if (applied.q) query.set('q', applied.q)
  if (applied.type) query.set('event_type', applied.type)
  if (applied.category) query.set('event_category', applied.category)
  if (applied.status) query.set('status', applied.status)
  if (applied.userFilter) query.set('user_id', applied.userFilter)

  const { data, error, loading } = useFetch(
    () => api.get(`/api/admin/activity?${query.toString()}`),
    [page, applied, sort]
  )

  useEffect(() => {
    setPage(1)
  }, [applied])

  const apply = () => {
    setApplied({ q, type: eventType, category: eventCategory, status, userFilter })
  }

  const reset = () => {
    setQ('')
    setEventType('')
    setEventCategory('')
    setStatus('')
    setUserFilter('')
    setApplied({})
    setPage(1)
  }

  const downloadCsv = async () => {
    const url = new URL('/api/admin/activity/export', API_BASE)
    if (applied.q) url.searchParams.set('q', applied.q)
    if (applied.type) url.searchParams.set('event_type', applied.type)
    if (applied.category) url.searchParams.set('event_category', applied.category)
    if (applied.status) url.searchParams.set('status', applied.status)
    if (applied.userFilter) url.searchParams.set('user_id', applied.userFilter)
    url.searchParams.set('limit', '1000')
    try {
      await api.download(url.pathname + url.search, 'activity_logs.csv')
    } catch (err) {
      window.alert(err.message || 'Export failed.')
    }
  }

  return (
    <div>
      <div className="card-head">
        <h1>Activity Logs</h1>
        <button className="btn" onClick={downloadCsv}>
          Export CSV
        </button>
      </div>
      <p className="muted">Centralized, searchable record of platform events.</p>

      <Card title="Filters">
        <div className="filters">
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search (event, device, OS, ID…)"
          />
          <input
            className="input"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="Event type (e.g. LOGIN)"
          />
          <select className="input" value={eventCategory} onChange={(e) => setEventCategory(e.target.value)}>
            <option value="">Category (any)</option>
            {['auth', 'onboarding', 'chat', 'mood', 'journal', 'wellness', 'medicine', 'emergency', 'crisis', 'counselor', 'profile', 'settings', 'admin', 'navigation'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Status (any)</option>
            <option value="success">success</option>
            <option value="failed">failed</option>
          </select>
          <input
            className="input"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="User ID"
          />
          <button className="btn" onClick={apply}>Apply</button>
          <button className="btn ghost" onClick={reset}>Reset</button>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorNote message={error} />
      ) : !data || !data.items.length ? (
        <EmptyNote message="No activity matched the filters." />
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Category</th>
                <th>Status</th>
                <th>Device</th>
                <th>OS</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => row.user_id && go(`/users/${row.user_id}`)}
                  className="clickable"
                  title="Open user"
                >
                  <td className="nowrap">{fmt(row.timestamp)}</td>
                  <td>
                    <EventTypeBadge type={row.event_type} />
                    {row.metadata && row.metadata.result_count != null && (
                      <span className="muted small"> · {row.metadata.result_count}</span>
                    )}
                  </td>
                  <td><CategoryBadge category={row.event_category} /></td>
                  <td><StatusBadge status={row.status} /></td>
                  <td className="muted">
                    {[row.device_manufacturer, row.device_model].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="muted">
                    {[row.os, row.os_version].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="muted">{row.user_id ? String(row.user_id).slice(0, 8) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={data.page} pageSize={pageSize} total={data.total} onChange={setPage} />
        </div>
      )}
    </div>
  )
}