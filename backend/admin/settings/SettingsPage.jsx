import React from 'react'
import { API_BASE } from '../services/api.js'
import { Card } from '../components/UI.jsx'

export default function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <p className="muted">Connection and account details for this admin dashboard.</p>

      <Card title="Connection">
        <table className="table kv">
          <tbody>
            <tr>
              <td>Backend API</td>
              <td><code>{API_BASE}</code></td>
            </tr>
            <tr>
              <td>Transport</td>
              <td>HTTPS (TLS)</td>
            </tr>
            <tr>
              <td>Admin authorization</td>
              <td>Enforced by the backend (401/403) — the frontend never bypasses it.</td>
            </tr>
            <tr>
              <td>Credentials storage</td>
              <td>Password is entered at sign-in only; never stored in this app.</td>
            </tr>
            <tr>
              <td>Admin account</td>
              <td><code>shreyasde157@gmail.com</code></td>
            </tr>
          </tbody>
        </table>
      </Card>

      <Card title="Security notes">
        <ul className="notes">
          <li>Tokens are kept only in the browser's local storage for the session.</li>
          <li>All mutations (deactivate user, etc.) are validated server-side.</li>
          <li>Activity and audit events are recorded for admin actions too.</li>
        </ul>
      </Card>
    </div>
  )
}