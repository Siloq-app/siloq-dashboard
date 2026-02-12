'use client'

import { useState, useEffect, useCallback } from 'react'
import { sitesService, pagesService, Site, SiteOverview, Page } from '@/lib/services/api'

export interface DashboardData {
  sites: Site[]
  selectedSite: Site | null
  siteOverview: SiteOverview | null
  pages: Page[]
  isLoading: boolean
  error: string | null
}

// Persist selected site ID across hook instances
const SELECTED_SITE_KEY = 'siloq_selected_site_id'
const SITE_CHANGE_EVENT = 'siloq_site_changed'

function getPersistedSiteId(): number | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(SELECTED_SITE_KEY)
  return stored ? parseInt(stored, 10) : null
}

function persistSiteId(siteId: number | null) {
  if (typeof window === 'undefined') return
  if (siteId) {
    localStorage.setItem(SELECTED_SITE_KEY, String(siteId))
    // Dispatch custom event for same-tab hook instances
    window.dispatchEvent(new CustomEvent(SITE_CHANGE_EVENT, { detail: siteId }))
  } else {
    localStorage.removeItem(SELECTED_SITE_KEY)
  }
}

export function useDashboardData() {
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [siteOverview, setSiteOverview] = useState<SiteOverview | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSites = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const sitesList = await sitesService.list()
      setSites(sitesList)
      
      // Try to restore previously selected site, or use first site
      const persistedId = getPersistedSiteId()
      const restoredSite = persistedId ? sitesList.find(s => s.id === persistedId) : null
      
      if (sitesList.length > 0 && !selectedSite) {
        const siteToSelect = restoredSite || sitesList[0]
        setSelectedSite(siteToSelect)
        persistSiteId(siteToSelect.id)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load sites')
      setSites([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedSite])

  const loadSiteOverview = useCallback(async (siteId: number | string) => {
    try {
      const overview = await sitesService.getOverview(siteId)
      setSiteOverview(overview)
      return overview
    } catch (e: unknown) {
      console.error('Site overview error:', e)
      setSiteOverview(null)
      return null
    }
  }, [])

  const loadPages = useCallback(async (siteId?: number | string) => {
    if (!siteId) {
      setPages([])
      return
    }
    try {
      const pagesList = await pagesService.list(siteId)
      setPages(pagesList)
    } catch (e: unknown) {
      console.error('Pages load error:', e)
      setPages([])
    }
  }, [])

  const selectSite = useCallback(async (site: Site) => {
    setSelectedSite(site)
    persistSiteId(site.id)
    // Clear existing data while loading new site
    setPages([])
    setSiteOverview(null)
    await Promise.all([
      loadSiteOverview(site.id),
      loadPages(site.id),
    ])
  }, [loadSiteOverview, loadPages])

  const refresh = useCallback(async () => {
    await loadSites()
    if (selectedSite) {
      await Promise.all([
        loadSiteOverview(selectedSite.id),
        loadPages(selectedSite.id),
      ])
    }
  }, [loadSites, selectedSite, loadSiteOverview, loadPages])

  useEffect(() => {
    loadSites()
  }, [loadSites])

  // Sync selected site across multiple hook instances
  useEffect(() => {
    // Handle storage events (other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SELECTED_SITE_KEY && e.newValue) {
        const newSiteId = parseInt(e.newValue, 10)
        const newSite = sites.find(s => s.id === newSiteId)
        if (newSite && newSite.id !== selectedSite?.id) {
          setSelectedSite(newSite)
          loadSiteOverview(newSite.id)
          loadPages(newSite.id)
        }
      }
    }
    
    // Handle custom events (same tab, different hook instances)
    const handleSiteChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>
      const newSiteId = customEvent.detail
      const newSite = sites.find(s => s.id === newSiteId)
      if (newSite && newSite.id !== selectedSite?.id) {
        setSelectedSite(newSite)
        setPages([])
        setSiteOverview(null)
        loadSiteOverview(newSite.id)
        loadPages(newSite.id)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener(SITE_CHANGE_EVENT, handleSiteChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(SITE_CHANGE_EVENT, handleSiteChange)
    }
  }, [sites, selectedSite, loadSiteOverview, loadPages])

  useEffect(() => {
    if (selectedSite) {
      loadSiteOverview(selectedSite.id)
      loadPages(selectedSite.id)
    }
  }, [selectedSite, loadSiteOverview, loadPages])

  return {
    sites,
    selectedSite,
    siteOverview,
    pages,
    isLoading,
    error,
    loadSites,
    selectSite,
    refresh,
  }
}
