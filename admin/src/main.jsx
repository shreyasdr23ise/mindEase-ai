import React, { useEffect, useState, createContext, useContext } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider, useAuth } from '../components/AuthContext.jsx'
import LoginPage from '../auth/LoginPage.jsx'
import DashboardPage from '../dashboard/DashboardPage.jsx'
import UsersPage from '../users/UsersPage.jsx'
import ActivityLogsPage from '../activity-logs/ActivityLogsPage.jsx'
import AnalyticsPage from '../analytics/AnalyticsPage.jsx'
import SettingsPage from '../settings/SettingsPage.jsx'

function currentRoute() {
  const hash = window.location.hash.replace(/^#/, '')
  return hash || '/'
}

export function useRoute() {
  const [route, setRoute] = useState(currentRoute())
  useEffect(() => {
    const onChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return [route, (path) => { window.location.hash = path }]
}

function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}

function Shell() {
  const [route, go] = useRoute()
  const { authed } = useAuth()

  if (!authed) {
    return <LoginPage />
  }

  const page =
    route.startsWith('/users') ? <UsersPage route={route} go={go} /> :
    route.startsWith('/activity-logs') ? <ActivityLogsPage go={go} /> :
    route.startsWith('/analytics') ? <AnalyticsPage go={go} /> :
    route.startsWith('/settings') ? <SettingsPage go={go} /> :
    <DashboardPage go={go} />

  return (
    <div className="app">
      <Sidebar route={route} go={go} />
      <main className="content">{page}</main>
    </div>
  )
}

function Sidebar({ route, go }) {
  const { signOut } = useAuth()
  const items = [
    ['/dashboard', 'Dashboard'],
    ['/users', 'Users'],
    ['/activity-logs', 'Activity Logs'],
    ['/analytics', 'Analytics'],
    ['/settings', 'Settings'],
  ]
  return (
    <nav className="sidebar">
      <div className="logo">MindEase</div>
      <div className="logo-sub">Admin</div>
      <ul>
        {items.map(([href, label]) => (
          <li key={href}>
            <button
              className={`nav-item ${route.startsWith(href) ? 'active' : ''}`}
              onClick={() => go(href)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <button className="btn ghost" onClick={signOut}>
          Sign out
        </button>
      </div>
    </nav>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)