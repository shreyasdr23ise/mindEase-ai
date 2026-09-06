import React, { useEffect, useState } from 'react'
import { api, clearToken } from '../services/api.js'
import { useAuth } from './AuthContext.jsx'
import { Spinner, ErrorNote } from './UI.jsx'

// Small helper to keep all page fetching consistent:
// shows a spinner, surfaces errors, and logs the user out if the token dies.
export function useFetch(fn, deps = []) {
  const { signOut } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fn()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 401) {
          clearToken()
          signOut()
          return
        }
        setError(err.message || 'Request failed.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, error, loading, setData }
}