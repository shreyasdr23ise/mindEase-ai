import React, { useState } from 'react'
import { api } from '../services/api.js'
import { useFetch } from '../components/useFetch.js'
import { Spinner, ErrorNote, EmptyNote, Card, StatCard } from '../components/UI.jsx'
import { CategoryBadge, StatusBadge, EventTypeBadge } from '../components/Badges.jsx'

export default function UsersPage({ route, go }) {
  const match = route.match(/^\/users\/([^/]+)$/)
  if (match) {
    return <UserDetail userId={match[1]} go={go} />
  }
  return <UserList go={go} />
}

function UserList({ go }) {
  const { data, error, loading } = useFetch(() => api.get('/api/admin/users'), [])
  return (
    <div>
      <h1>Users</h1>
      <p className="muted">All registered accounts.</p>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorNote message={error} />
      ) : !data || !data.length ? (
        <EmptyNote />
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Onboarding</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr
                  key={u.id}
                  className="clickable"
                  onClick={() => go(`/users/${u.id}`)}
                  title="View details"
                >
                  <td>{u.email}</td>
                  <td>{u.full_name || u.username}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'admin' : 'user'}`}>{u.role}</span></td>
                  <td>
                    <StatusBadge status={u.is_active ? 'success' : 'failed'} />
                  </td>
                  <td className="muted">{u.onboarding_completed ? 'yes' : 'no'}</td>
                  <td className="muted nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function fmt(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

function UserDetail({ userId, go }) {
  const [actionMsg, setActionMsg] = useState('')
  const { data, error, loading, setData } = useFetch(
    () => api.get(`/api/admin/users/${userId}`),
    [userId]
  )

  const deactivate = async () => {
    if (!window.confirm('Deactivate this user? They will not be able to sign in.')) return
    try {
      await api.post(`/api/admin/users/${userId}/deactivate`)
      setActionMsg('User deactivated.')
      setData({ ...data, is_active: false })
    } catch (err) {
      setActionMsg(err.message || 'Failed to deactivate.')
    }
  }

  const remove = async () => {
    if (!window.confirm('Permanently delete this user? All their data and logs will be removed. This cannot be undone.')) return
    try {
      await api.del(`/api/admin/users/${userId}`)
      alert('User deleted permanently.')
      go('/users')
    } catch (err) {
      setActionMsg(err.message || 'Failed to delete user.')
    }
  }

  return (
    <div>
      <button className="btn ghost small" onClick={() => go('/users')}>← Back to users</button>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorNote message={error} />
      ) : data ? (
        <>
          <h1>{data.full_name || data.email}</h1>
          <p className="muted">{data.email}</p>

          {actionMsg && <div className="alert">{actionMsg}</div>}

          <div className="stats-grid">
            <StatCard label="Events" value={data.total_events} />
            <StatCard label="Logins" value={data.login_count} />
            <StatCard label="Failed logins" value={data.failed_login_count} />
            <StatCard label="Chat messages" value={data.chat_messages} />
            <StatCard label="Mood check-ins" value={data.mood_checkins} />
            <StatCard label="Journal entries" value={data.journal_entries} />
            <StatCard label="Wellness sessions" value={data.wellness_sessions} />
            <StatCard label="Crisis events" value={data.crisis_events} />
          </div>

          <div className="grid-2">
            <Card title="Profile">
              <table className="table kv">
                <tbody>
                  <tr><td>Email</td><td>{data.email}</td></tr>
                  <tr><td>Full name</td><td>{data.full_name || '—'}</td></tr>
                  <tr><td>Preferred name</td><td>{data.preferred_name || '—'}</td></tr>
                  <tr><td>Role</td><td>{data.role}</td></tr>
                  <tr><td>Active</td><td>{data.is_active ? 'Yes' : 'No'}</td></tr>
                  <tr><td>Onboarding</td><td>{data.onboarding_completed ? 'Completed' : 'Incomplete'}</td></tr>
                  <tr><td>Joined</td><td>{fmt(data.created_at)}</td></tr>
                  <tr><td>Last activity</td><td>{fmt(data.last_event_at)}</td></tr>
                </tbody>
              </table>
              {data.is_active && (
                <button className="btn danger" onClick={deactivate}>Deactivate user</button>
              )}
              <button className="btn danger" onClick={remove} style={{ marginLeft: 8 }}>
                Delete user
              </button>
            </Card>

            <Card title="Recent activity">
              {!data.recent_events.length ? (
                <p className="muted">No activity recorded.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Event</th>
                      <th>Category</th>
                      <th>Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_events.map((row) => (
                      <tr key={row.id}>
                        <td className="nowrap">{fmt(row.timestamp)}</td>
                        <td><EventTypeBadge type={row.event_type} /></td>
                        <td><CategoryBadge category={row.event_category} /></td>
                        <td className="muted">
                          {[row.device_manufacturer, row.device_model].filter(Boolean).join(' ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}