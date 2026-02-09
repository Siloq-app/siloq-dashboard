'use client'

import { useState, useEffect, useCallback } from 'react'
import { dashboardService, HealthSummary } from '@/lib/services/api'

export interface UseHealthSummaryResult {
  healthSummary: HealthSummary | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useHealthSummary(siteId?: number | string): UseHealthSummaryResult {
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHealthSummary = useCallback(async () => {
    if (!siteId) {
      setHealthSummary(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await dashboardService.getHealthSummary(siteId)
      setHealthSummary(data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load health summary'
      setError(message)
      setHealthSummary(null)
    } finally {
      setIsLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    loadHealthSummary()
  }, [loadHealthSummary])

  return {
    healthSummary,
    isLoading,
    error,
    refresh: loadHealthSummary,
  }
}
