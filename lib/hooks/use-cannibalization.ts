'use client'

import { useState, useEffect, useCallback } from 'react'
import { dashboardService, CannibalizationIssue } from '@/lib/services/api'

export interface UseCannibalizationResult {
  issues: CannibalizationIssue[]
  total: number
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useCannibalization(siteId?: number | string): UseCannibalizationResult {
  const [issues, setIssues] = useState<CannibalizationIssue[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadIssues = useCallback(async () => {
    if (!siteId) {
      setIssues([])
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await dashboardService.getCannibalizationIssues(siteId)
      setIssues(data.issues || [])
      setTotal(data.total || 0)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load cannibalization issues'
      setError(message)
      setIssues([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    loadIssues()
  }, [loadIssues])

  return {
    issues,
    total,
    isLoading,
    error,
    refresh: loadIssues,
  }
}
