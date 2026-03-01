'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  sitesService,
  pagesService,
  cannibalizationService,
  silosService,
  recommendationsService,
  Site,
  SiteOverview,
  Page,
} from '@/lib/services/api';
import {
  mapCannibalizationIssues,
  mapSilos,
  mapRecommendationsToPendingChanges,
  mapLinkOpportunities,
} from '@/lib/services/mappers';
import type {
  CannibalizationIssue,
  Silo,
  PendingChange,
  LinkOpportunity,
} from '@/app/dashboard/types';

const CACHE_TTL_MS = 45_000; // 45 seconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface DashboardData {
  sites: Site[];
  selectedSite: Site | null;
  siteOverview: SiteOverview | null;
  pages: Page[];
  cannibalizationIssues: CannibalizationIssue[];
  silos: Silo[];
  pendingChanges: PendingChange[];
  linkOpportunities: LinkOpportunity[];
  isLoading: boolean;
  error: string | null;
  loadSites: () => Promise<void>;
  selectSite: (site: Site) => Promise<void>;
  refresh: () => Promise<void>;
  // Lazy loaders for deferred data
  loadCannibalization: () => Promise<void>;
  loadSilos: () => Promise<void>;
  loadRecommendations: () => Promise<void>;
  loadLinkOpportunities: () => Promise<void>;
  cannibalizationLoading: boolean;
  silosLoading: boolean;
  recommendationsLoading: boolean;
  linkOpportunitiesLoading: boolean;
}

const DashboardContext = createContext<DashboardData | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [siteOverview, setSiteOverview] = useState<SiteOverview | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [cannibalizationIssues, setCannibalizationIssues] = useState<CannibalizationIssue[]>([]);
  const [silos, setSilos] = useState<Silo[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [linkOpportunities, setLinkOpportunities] = useState<LinkOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-section loading states
  const [cannibalizationLoading, setCannibalizationLoading] = useState(false);
  const [silosLoading, setSilosLoading] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [linkOpportunitiesLoading, setLinkOpportunitiesLoading] = useState(false);

  // Cache map: key -> { data, timestamp }
  const cacheRef = useRef<Map<string, CacheEntry<unknown>>>(new Map());
  // AbortController for in-flight requests (debounce site switching)
  const abortRef = useRef<AbortController | null>(null);

  function getCached<T>(key: string): T | null {
    const entry = cacheRef.current.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.data as T;
    }
    return null;
  }

  function setCache<T>(key: string, data: T) {
    cacheRef.current.set(key, { data, timestamp: Date.now() });
  }

  function clearSiteCache(siteId: number) {
    const prefix = `site:${siteId}:`;
    for (const key of cacheRef.current.keys()) {
      if (key.startsWith(prefix)) {
        cacheRef.current.delete(key);
      }
    }
  }

  // Load only critical data on site select: overview + pages
  const loadCriticalSiteData = useCallback(async (site: Site, signal?: AbortSignal) => {
    const overviewKey = `site:${site.id}:overview`;
    const pagesKey = `site:${site.id}:pages`;

    const cachedOverview = getCached<SiteOverview>(overviewKey);
    const cachedPages = getCached<Page[]>(pagesKey);

    const tasks: Promise<void>[] = [];

    if (cachedOverview) {
      setSiteOverview(cachedOverview);
    } else {
      tasks.push(
        (async () => {
          try {
            const overview = await sitesService.getOverview(site.id);
            if (signal?.aborted) return;
            setCache(overviewKey, overview);
            setSiteOverview(overview);
          } catch (e: unknown) {
            if (signal?.aborted) return;
            // Handle AbortError specifically
            if (e instanceof Error && e.name === 'AbortError') {
              console.log('Overview fetch was aborted');
              return;
            }
            console.error('Site overview error:', e);
            setSiteOverview(null);
          }
        })()
      );
    }

    if (cachedPages) {
      setPages(cachedPages);
    } else {
      tasks.push(
        (async () => {
          try {
            const pagesList = await pagesService.list(site.id);
            if (signal?.aborted) return;
            setCache(pagesKey, pagesList);
            setPages(pagesList);
          } catch (e: unknown) {
            if (signal?.aborted) return;
            // Handle AbortError specifically
            if (e instanceof Error && e.name === 'AbortError') {
              console.log('Pages fetch was aborted');
              return;
            }
            console.error('Pages load error:', e);
            setPages([]);
          }
        })()
      );
    }

    await Promise.all(tasks);
  }, []);

  // Lazy loaders for deferred data — called by individual screens
  const loadCannibalization = useCallback(async () => {
    if (!selectedSite) return;
    const key = `site:${selectedSite.id}:cannibalization`;
    const cached = getCached<CannibalizationIssue[]>(key);
    if (cached) {
      setCannibalizationIssues(cached);
      return;
    }
    setCannibalizationLoading(true);
    try {
      const response = await cannibalizationService.fetchIssues(selectedSite.id);
      const mapped = mapCannibalizationIssues(response);
      setCache(key, mapped);
      setCannibalizationIssues(mapped);
    } catch (e: unknown) {
      console.error('Cannibalization issues load error:', e);
      setCannibalizationIssues([]);
    } finally {
      setCannibalizationLoading(false);
    }
  }, [selectedSite]);

  const loadSilosData = useCallback(async () => {
    if (!selectedSite) return;
    const key = `site:${selectedSite.id}:silos`;
    const cached = getCached<Silo[]>(key);
    if (cached) {
      setSilos(cached);
      return;
    }
    setSilosLoading(true);
    try {
      const response = await silosService.fetchSilos(selectedSite.id);
      const mapped = mapSilos(response);
      setCache(key, mapped);
      setSilos(mapped);
    } catch (e: unknown) {
      console.error('Silos load error:', e);
      setSilos([]);
    } finally {
      setSilosLoading(false);
    }
  }, [selectedSite]);

  const loadRecommendations = useCallback(async () => {
    if (!selectedSite) return;
    const key = `site:${selectedSite.id}:recommendations`;
    const cached = getCached<PendingChange[]>(key);
    if (cached) {
      setPendingChanges(cached);
      return;
    }
    setRecommendationsLoading(true);
    try {
      const response = await recommendationsService.fetchRecommendations(selectedSite.id);
      const mapped = mapRecommendationsToPendingChanges(response);
      setCache(key, mapped);
      setPendingChanges(mapped);
    } catch (e: unknown) {
      console.error('Recommendations load error:', e);
      setPendingChanges([]);
    } finally {
      setRecommendationsLoading(false);
    }
  }, [selectedSite]);

  const loadLinkOpportunitiesData = useCallback(async () => {
    if (!selectedSite) return;
    const key = `site:${selectedSite.id}:links`;
    const cached = getCached<LinkOpportunity[]>(key);
    if (cached) {
      setLinkOpportunities(cached);
      return;
    }
    setLinkOpportunitiesLoading(true);
    try {
      const mapped = mapLinkOpportunities();
      setCache(key, mapped);
      setLinkOpportunities(mapped);
    } catch (e: unknown) {
      console.error('Link opportunities load error:', e);
      setLinkOpportunities([]);
    } finally {
      setLinkOpportunitiesLoading(false);
    }
  }, [selectedSite]);

  const loadSites = useCallback(async () => {
    console.log('[DashboardContext] Starting to load sites...');
    setIsLoading(true);
    setError(null);
    try {
      const sitesList = await sitesService.list();
      console.log('[DashboardContext] Successfully loaded sites:', sitesList.length);
      setSites(sitesList);

      if (sitesList.length > 0 && !selectedSite) {
        const savedSiteId = localStorage.getItem('siloq-selected-site-id');
        const restored = savedSiteId ? sitesList.find((s) => String(s.id) === savedSiteId) : null;
        const picked = restored || sitesList[0];
        setSelectedSite(picked);
        await loadCriticalSiteData(picked);
      } else if (sitesList.length === 0) {
        // This should not happen with our fallback logic, but handle it just in case
        console.log('[DashboardContext] No sites available, stopping loading');
        setIsLoading(false);
      } else {
        // Sites loaded successfully and we already have a selected site
        setIsLoading(false);
      }
    } catch (e: unknown) {
      console.error('[DashboardContext] Failed to load sites:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to load sites';

      // Enhanced error filtering for backend/network issues
      const isBackendError =
        errorMessage.includes('502') ||
        errorMessage.includes('503') ||
        errorMessage.includes('504') ||
        errorMessage.includes('Bad Gateway') ||
        errorMessage.includes('Service Unavailable') ||
        errorMessage.includes('Gateway Timeout') ||
        errorMessage.includes('Network error') ||
        errorMessage.includes('TIMEOUT_ERROR') ||
        errorMessage.includes('CONNECTION_REFUSED') ||
        errorMessage.includes('HOST_NOT_FOUND') ||
        errorMessage.includes('NETWORK_ERROR') ||
        errorMessage.includes('Backend server is not running') ||
        errorMessage.includes('Unable to connect to the backend') ||
        errorMessage.includes('Failed to fetch');

      if (!isBackendError) {
        console.log('[DashboardContext] Showing error to user:', errorMessage);
        setError(errorMessage);
      } else {
        console.log('[DashboardContext] Backend unavailable, handling gracefully');
        setError(null); // Clear error for backend issues

        // Set up a retry mechanism for backend connectivity
        const retryDelay = Math.min(30000, 5000 * Math.pow(2, 3)); // Max 30 seconds
        console.log(`[DashboardContext] Scheduling retry in ${retryDelay / 1000} seconds`);

        setTimeout(() => {
          if (!sites.length) {
            // Only retry if we still have no sites
            console.log('[DashboardContext] Retrying site load...');
            loadSites();
          }
        }, retryDelay);
      }

      setSites([]);
      setIsLoading(false); // Ensure loading is stopped even on error
    }
  }, [selectedSite, loadCriticalSiteData, sites.length]);

  const selectSite = useCallback(
    async (site: Site) => {
      // Cancel any in-flight requests from previous site selection
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setSelectedSite(site);
      localStorage.setItem('siloq-selected-site-id', String(site.id));

      // Reset deferred data
      setCannibalizationIssues([]);
      setSilos([]);
      setPendingChanges([]);
      setLinkOpportunities([]);

      try {
        await loadCriticalSiteData(site, controller.signal);
      } catch (error: unknown) {
        // Handle AbortError specifically to prevent [object Event] errors
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Site selection request was aborted');
          return;
        }
        // Re-throw other errors
        throw error;
      }
    },
    [loadCriticalSiteData]
  );

  const refresh = useCallback(async () => {
    if (selectedSite) {
      // Clear cache for this site to force re-fetch
      clearSiteCache(selectedSite.id);
      setCannibalizationIssues([]);
      setSilos([]);
      setPendingChanges([]);
      setLinkOpportunities([]);
      await loadCriticalSiteData(selectedSite);
    }
  }, [selectedSite, loadCriticalSiteData]);

  useEffect(() => {
    loadSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        sites,
        selectedSite,
        siteOverview,
        pages,
        cannibalizationIssues,
        silos,
        pendingChanges,
        linkOpportunities,
        isLoading,
        error,
        loadSites,
        selectSite,
        refresh,
        loadCannibalization,
        loadSilos: loadSilosData,
        loadRecommendations,
        loadLinkOpportunities: loadLinkOpportunitiesData,
        cannibalizationLoading,
        silosLoading,
        recommendationsLoading,
        linkOpportunitiesLoading,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext(): DashboardData {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}
