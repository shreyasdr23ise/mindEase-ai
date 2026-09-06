import React, { useState, createContext, useContext } from 'react'
import { isLoggedIn, login, logout } from '../services/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(isLoggedIn())

  const signIn = async (email, password) => {
    const user = await login(email, password)
    setAuthed(true)
    return user
  }
  const signOut = () => {
    logout()
    setAuthed(false)
  }

  return (
    <AuthContext.Provider value={{ authed, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function ProtectedRoute({ children }) {
  const { authed } = useAuth()
  if (!authed) return null
  return children
}