'use client'

import { useState, useEffect, useCallback } from 'react'
import { dashboardService, PendingAction } from '@/lib/services/api'

export interface UsePendingActionsResult {
  pendingActions: PendingAction[]
  total: number
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  approveAction: (actionId: number | string) => Promise<void>
  denyAction: (actionId: number | string) => Promise<void>
  rollbackAction: (actionId: number | string) => Promise<void>
}

export function usePendingActions(siteId?: number | string): UsePendingActionsResult {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPendingActions = useCallback(async () => {
    if (!siteId) {
      setPendingActions([])
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await dashboardService.getPendingApprovals(siteId)
      setPendingActions(data.pending_approvals || [])
      setTotal(data.total || 0)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load pending actions'
      setError(message)
      setPendingActions([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [siteId])

  const approveAction = useCallback(async (actionId: number | string) => {
    if (!siteId) return
    
    try {
      await dashboardService.approveAction(siteId, actionId)
      await loadPendingActions() // Refresh list after approval
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to approve action'
      setError(message)
      throw e
    }
  }, [siteId, loadPendingActions])

  const denyAction = useCallback(async (actionId: number | string) => {
    if (!siteId) return
    
    try {
      await dashboardService.denyAction(siteId, actionId)
      await loadPendingActions() // Refresh list after denial
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to deny action'
      setError(message)
      throw e
    }
  }, [siteId, loadPendingActions])

  const rollbackAction = useCallback(async (actionId: number | string) => {
    if (!siteId) return
    
    try {
      await dashboardService.rollbackAction(siteId, actionId)
      await loadPendingActions() // Refresh list after rollback
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to rollback action'
      setError(message)
      throw e
    }
  }, [siteId, loadPendingActions])

  useEffect(() => {
    loadPendingActions()
  }, [loadPendingActions])

  return {
    pendingActions,
    total,
    isLoading,
    error,
    refresh: loadPendingActions,
    approveAction,
    denyAction,
    rollbackAction,
  }
}
