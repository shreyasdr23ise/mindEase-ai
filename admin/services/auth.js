// Authentication service. Credentials are entered at the login page and sent
// to the backend over HTTPS; the password is never stored or hardcoded in the
// admin app. The backend verifies the role and returns the JWT.
import { api, setToken, clearToken, getToken, API_BASE } from './api.js'

export async function login(email, password) {
  const data = await api.post('/api/auth/login', { email, password })
  const role = data.user && data.user.role
  if (role !== 'admin') {
    // A non-admin token would be rejected by every admin endpoint anyway;
    // reject early so we never hold a useless token.
    clearToken()
    throw new Error('This account does not have admin access.')
  }
  setToken(data.access_token)
  return data.user
}

export function logout() {
  clearToken()
}

export function isLoggedIn() {
  return Boolean(getToken())
}

export { getToken, API_BASE }