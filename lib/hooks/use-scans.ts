'use client'

import { useState, useEffect, useCallback } from 'react'
import { scansService, Scan, ScanReport, CreateScanInput } from '@/lib/services/api'

export interface ScansState {
  scans: Scan[]
  currentScan: Scan | null
  currentReport: ScanReport | null
  isLoading: boolean
  isCreating: boolean
  error: string | null
}

export function useScans() {
  const [scans, setScans] = useState<Scan[]>([])
  const [currentScan, setCurrentScan] = useState<Scan | null>(null)
  const [currentReport, setCurrentReport] = useState<ScanReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadScans = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const scansList = await scansService.list()
      setScans(scansList)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load scans')
      setScans([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadScan = useCallback(async (id: number | string) => {
    setIsLoading(true)
    setError(null)
    try {
      const scan = await scansService.getById(id)
      setCurrentScan(scan)
      return scan
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load scan')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadScanReport = useCallback(async (id: number | string) => {
    setIsLoading(true)
    setError(null)
    try {
      const report = await scansService.getReport(id)
      setCurrentReport(report)
      return report
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load scan report')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createScan = useCallback(async (input: CreateScanInput) => {
    setIsCreating(true)
    setError(null)
    try {
      const scan = await scansService.create(input)
      setScans(prev => [scan, ...prev])
      setCurrentScan(scan)
      return scan
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create scan')
      return null
    } finally {
      setIsCreating(false)
    }
  }, [])

  const pollScanStatus = useCallback(async (id: number | string, interval = 3000) => {
    const poll = async () => {
      const scan = await loadScan(id)
      if (scan && (scan.status === 'pending' || scan.status === 'running')) {
        setTimeout(poll, interval)
      } else if (scan && scan.status === 'completed') {
        await loadScanReport(id)
      }
      return scan
    }
    return poll()
  }, [loadScan, loadScanReport])

  const refresh = useCallback(async () => {
    await loadScans()
    if (currentScan) {
      await loadScan(currentScan.id)
    }
  }, [loadScans, currentScan, loadScan])

  useEffect(() => {
    loadScans()
  }, [loadScans])

  return {
    scans,
    currentScan,
    currentReport,
    isLoading,
    isCreating,
    error,
    loadScans,
    loadScan,
    loadScanReport,
    createScan,
    pollScanStatus,
    refresh,
  }
}
