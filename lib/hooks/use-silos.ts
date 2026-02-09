'use client'

import { useState, useEffect, useCallback } from 'react'
import { dashboardService, ReverseSilo } from '@/lib/services/api'

export interface UseSilosResult {
  silos: ReverseSilo[]
  total: number
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useSilos(siteId?: number | string): UseSilosResult {
  const [silos, setSilos] = useState<ReverseSilo[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSilos = useCallback(async () => {
    if (!siteId) {
      setSilos([])
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await dashboardService.getSilos(siteId)
      setSilos(data.silos || [])
      setTotal(data.total || 0)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load silos'
      setError(message)
      setSilos([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    loadSilos()
  }, [loadSilos])

  return {
    silos,
    total,
    isLoading,
    error,
    refresh: loadSilos,
  }
}
