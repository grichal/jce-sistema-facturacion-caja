'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Usuario, getUserByUsername, ensureDefaultAdmin, listUsers, createUser as createUserHelper, updateUserRole, deleteUser as deleteUserHelper, updateUser as updateUserHelper } from '../../lib/firebase/users'

interface AuthContextValue {
  user: Usuario | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<boolean>
  signOut: () => void
  createUser: (u: Omit<Usuario, 'id'>) => Promise<void>
  listUsers: () => Promise<Usuario[]>
  updateUserRole: (id: string, role: 'admin' | 'user') => Promise<void>
  updateUser: (id: string, updates: Partial<Omit<Usuario, 'id'>>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ensure default admin exists (demo/task)
    (async () => {
      try {
        await ensureDefaultAdmin()
      } catch (err) {
        console.error(err)
      }
      // try to restore session from localStorage
      const stored = typeof window !== 'undefined' ? localStorage.getItem('appUser') : null
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setUser(parsed)
        } catch (_) {
          localStorage.removeItem('appUser')
        }
      }
      setLoading(false)
    })()
  }, [])

  async function signIn(username: string, password: string) {
    const u = await getUserByUsername(username)
    if (!u) return false
    if (u.password !== password) return false
    setUser(u)
    if (typeof window !== 'undefined') localStorage.setItem('appUser', JSON.stringify(u))
    return true
  }

  function signOut() {
    setUser(null)
    if (typeof window !== 'undefined') localStorage.removeItem('appUser')
  }

  async function createUser(u: Omit<Usuario, 'id'>) {
    await createUserHelper(u)
  }

  async function listAllUsers() {
    return await listUsers()
  }

  async function changeUserRole(id: string, role: 'admin' | 'user') {
    await updateUserRole(id, role)
  }

  async function changeUser(id: string, updates: Partial<Omit<Usuario, 'id'>>) {
    await updateUserHelper(id, updates)
    // If the current authenticated user was updated, refresh the local copy and storage
    if (user && user.id === id) {
      const updated = { ...user, ...updates }
      setUser(updated)
      if (typeof window !== 'undefined') localStorage.setItem('appUser', JSON.stringify(updated))
    }
  }

  async function deleteUser(id: string) {
    await deleteUserHelper(id)
  }

  const value: AuthContextValue = {
    user,
    loading,
    signIn,
    signOut,
    createUser,
    listUsers: listAllUsers,
    updateUserRole: changeUserRole,
    updateUser: changeUser,
    deleteUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
