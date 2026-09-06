// API client for the MindEase production backend.
//
// No secrets live in this folder. The base URL points at the public HTTPS
// backend; admin authorization is enforced server-side (401/403), never by
// the frontend alone.

export const API_BASE =
  import.meta.env.VITE_API_URL || 'https://mindease-backend-r87i.onrender.com'

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail || `Request failed with status ${status}`)
    this.status = status
  }
}

export function getToken() {
  try {
    return localStorage.getItem('mindease_admin_token') || ''
  } catch {
    return ''
  }
}

export function setToken(token) {
  try {
    localStorage.setItem('mindease_admin_token', token)
  } catch {
    /* ignore */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem('mindease_admin_token')
  } catch {
    /* ignore */
  }
}

function newSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'sess-' + Math.random().toString(36).slice(2)
}

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken()
  const headers = {
    Accept: 'application/json',
    'X-Request-Id':
      (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) || newSessionId(),
    'X-Session-Id': newSessionId(),
    'X-Device-Type': 'web',
    'X-Os': 'browser',
    'X-App-Version': 'admin-1.0.0',
    'X-Network-Type': 'wifi',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    throw new ApiError(0, 'Cannot reach the backend. Check your connection.')
  }

  if (res.status === 401) {
    clearToken()
  }
  if (res.status === 204) return null

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    const detail = data && data.detail ? String(data.detail) : res.statusText
    throw new ApiError(res.status, detail)
  }
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  async download(path, filename) {
    const token = getToken()
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        Accept: 'text/csv',
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    if (res.status === 401) clearToken()
    if (!res.ok) {
      throw new ApiError(res.status, 'Export failed.')
    }
    const blob = await res.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename || 'activity_logs.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  },
}