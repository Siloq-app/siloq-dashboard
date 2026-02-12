'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '@/lib/auth-headers'

export interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  created_at: string
}

export interface UseUserResult {
  user: User | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  logout: () => void
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUser = useCallback(async () => {
    // Check if we have a token
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetchWithAuth('/api/v1/auth/me/')
      const data = await res.json()
      
      if (!res.ok) {
        // Token might be invalid/expired
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token')
          setUser(null)
        } else {
          throw new Error(data.message || data.detail || 'Failed to load user')
        }
        return
      }
      
      setUser(data.user || data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load user'
      setError(message)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
    // Redirect to login
    window.location.href = '/auth/login'
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  return {
    user,
    isLoading,
    error,
    refresh: loadUser,
    logout,
  }
}
