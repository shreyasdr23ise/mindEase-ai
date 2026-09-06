import React from 'react'

const PALETTE = {
  auth: '#6b7280',
  onboarding: '#6b7280',
  chat: '#2563eb',
  mood: '#7c3aed',
  journal: '#db2777',
  wellness: '#059669',
  medicine: '#0d9488',
  emergency: '#dc2626',
  crisis: '#dc2626',
  counselor: '#d97706',
  profile: '#0891b2',
  settings: '#475569',
  admin: '#111827',
  navigation: '#374151',
}

export function CategoryBadge({ category }) {
  return (
    <span
      className="badge"
      style={{ background: PALETTE[category] || '#6b7280' }}
    >
      {category}
    </span>
  )
}

export function StatusBadge({ status }) {
  const ok = status !== 'failed'
  return <span className={`badge ${ok ? 'ok' : 'err'}`}>{status}</span>
}

export function EventTypeBadge({ type }) {
  return <span className="event-type">{type}</span>
}