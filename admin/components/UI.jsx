import React from 'react'

export function StatCard({ label, value, sub }) {
  return (
    <div className="stat">
      <div className="stat-value">{value == null ? '—' : value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

export function Spinner() {
  return <div className="spinner" />
}

export function ErrorNote({ message }) {
  return <div className="alert error">{message}</div>
}

export function EmptyNote({ message }) {
  return <div className="alert">{message || 'No data.'}</div>
}

export function Card({ title, children, actions }) {
  return (
    <div className="card">
      {(title || actions) && (
        <div className="card-head">
          {title && <h2>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}