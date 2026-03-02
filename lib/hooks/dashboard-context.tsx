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
import { ApplicationError, ErrorType } from '@/lib/utils/error-handling';

// Constants
const CACHE_TTL_MS = 45_000; // 45 seconds

// Types
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface LoadingState {
  main: boolean;
  cannibalization: boolean;
  silos: boolean;
  recommendations: boolean;
  linkOpportunities: boolean;
}

interface DashboardState {
  sites: Site[];
  selectedSite: Site | null;
  siteOverview: SiteOverview | null;
  pages: Page[];
  cannibalizationIssues: CannibalizationIssue[];
  silos: Silo[];
  pendingChanges: PendingChange[];
  linkOpportunities: LinkOpportunity[];
  error: string | null;
  loading: LoadingState;
}

interface DashboardActions {
  loadSites: () => Promise<void>;
  selectSite: (site: Site) => Promise<void>;
  refresh: () => Promise<void>;
  loadCannibalization: () => Promise<void>;
  loadSilos: () => Promise<void>;
  loadRecommendations: () => Promise<void>;
  loadLinkOpportunities: () => Promise<void>;
}

export type DashboardData = DashboardState & DashboardActions;

const DashboardContext = createContext<DashboardData | null>(null);

// Custom hook for cache management
const useCache = () => {
  const cacheRef = useRef<Map<string, CacheEntry<unknown>>>(new Map());

  const getCached = useCallback(<T,>(key: string): T | null => {
    const entry = cacheRef.current.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.data as T;
    }
    return null;
  }, []);

  const setCache = useCallback(<T,>(key: string, data: T) => {
    cacheRef.current.set(key, { data, timestamp: Date.now() });
  }, []);

  const clearSiteCache = useCallback((siteId: number) => {
    const prefix = `site:${siteId}:`;
    for (const key of cacheRef.current.keys()) {
      if (key.startsWith(prefix)) {
        cacheRef.current.delete(key);
      }
    }
  }, []);

  return { getCached, setCache, clearSiteCache };
};

// Custom hook for request management
const useRequestManager = () => {
  const abortRef = useRef<AbortController | null>(null);

  const cancelCurrentRequest = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const createNewController = useCallback(() => {
    cancelCurrentRequest();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller;
  }, [cancelCurrentRequest]);

  return { createNewController, cancelCurrentRequest };
};

// Custom hook for loading state management
const useLoadingState = (): [LoadingState, (key: keyof LoadingState, value: boolean) => void] => {
  const [loading, setLoading] = useState<LoadingState>({
    main: false,
    cannibalization: false,
    silos: false,
    recommendations: false,
    linkOpportunities: false,
  });

  const updateLoading = useCallback((key: keyof LoadingState, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  return [loading, updateLoading];
};

// Main provider component
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { getCached, setCache, clearSiteCache } = useCache();
  const { createNewController } = useRequestManager();
  const [loading, updateLoading] = useLoadingState();

  // State
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [siteOverview, setSiteOverview] = useState<SiteOverview | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [cannibalizationIssues, setCannibalizationIssues] = useState<CannibalizationIssue[]>([]);
  const [silos, setSilos] = useState<Silo[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [linkOpportunities, setLinkOpportunities] = useState<LinkOpportunity[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load critical site data (overview + pages)
  const loadCriticalSiteData = useCallback(async (site: Site, signal?: AbortSignal) => {
    const overviewKey = `site:${site.id}:overview`;
    const pagesKey = `site:${site.id}:pages`;

    // Try cache first
    const cachedOverview = getCached<SiteOverview>(overviewKey);
    const cachedPages = getCached<Page[]>(pagesKey);

    if (cachedOverview && cachedPages) {
      setSiteOverview(cachedOverview);
      setPages(cachedPages);
      return;
    }

    try {
      // Load overview
      try {
        const overview = await sitesService.getOverview(site.id);
        if (signal?.aborted) return;
        setCache(overviewKey, overview);
        setSiteOverview(overview);
      } catch (e: unknown) {
        if (signal?.aborted) return;
        if (e instanceof Error && e.name === 'AbortError') {
          console.log('Overview fetch was aborted');
          return;
        }
        console.error('Site overview error:', e);
        setSiteOverview(null);
      }

      // Load pages
      try {
        const pagesData = await pagesService.list(site.id);
        if (signal?.aborted) return;
        setCache(pagesKey, pagesData);
        setPages(pagesData);
      } catch (e: unknown) {
        if (signal?.aborted) return;
        if (e instanceof Error && e.name === 'AbortError') {
          console.log('Pages fetch was aborted');
          return;
        }
        console.error('Pages load error:', e);
        setPages([]);
      }
    } catch (err) {
      console.error('Error loading critical site data:', err);
      setError('Failed to load site data');
    }
  }, [getCached, setCache]);

  // Load all sites
  const loadSites = useCallback(async () => {
    updateLoading('main', true);
    setError(null);
    
    try {
      const sitesData = await sitesService.list();
      setSites(sitesData);
      
      // Restore selected site from localStorage
      const savedSiteId = localStorage.getItem('siloq-selected-site-id');
      if (savedSiteId) {
        const savedSite = sitesData.find((s: Site) => s.id === Number(savedSiteId));
        if (savedSite) {
          await selectSite(savedSite);
        }
      }
    } catch (err) {
      console.error('Error loading sites:', err);
      setError('Failed to load sites');
    } finally {
      updateLoading('main', false);
    }
  }, [updateLoading]);

  // Select a site
  const selectSite = useCallback(async (site: Site) => {
    const controller = createNewController();
    
    setSelectedSite(site);
    localStorage.setItem('siloq-selected-site-id', String(site.id));

    // Reset dependent data
    setCannibalizationIssues([]);
    setSilos([]);
    setPendingChanges([]);
    setLinkOpportunities([]);

    try {
      await loadCriticalSiteData(site, controller.signal);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Site selection request was aborted');
        return;
      }
      throw error;
    }
  }, [createNewController, loadCriticalSiteData]);

  // Lazy loaders for deferred data
  const loadCannibalization = useCallback(async () => {
    if (!selectedSite || cannibalizationIssues.length > 0) return;
    
    updateLoading('cannibalization', true);
    const cacheKey = `site:${selectedSite.id}:cannibalization`;
    
    try {
      const cached = getCached<any>(cacheKey);
      if (cached) {
        setCannibalizationIssues(mapCannibalizationIssues(cached.issues || cached));
        return;
      }

      const data = await cannibalizationService.fetchIssues(selectedSite.id);
      setCache(cacheKey, data.issues || []);
      setCannibalizationIssues(mapCannibalizationIssues(data.issues || []));
    } catch (err) {
      console.error('Error loading cannibalization issues:', err);
    } finally {
      updateLoading('cannibalization', false);
    }
  }, [selectedSite, cannibalizationIssues.length, updateLoading, getCached, setCache]);

  const loadSilos = useCallback(async () => {
    if (!selectedSite || silos.length > 0) return;
    
    updateLoading('silos', true);
    const cacheKey = `site:${selectedSite.id}:silos`;
    
    try {
      const cached = getCached<any[]>(cacheKey);
      if (cached) {
        setSilos(mapSilos(cached));
        return;
      }

      const data = await silosService.fetchSilos(selectedSite.id);
      setCache(cacheKey, data);
      setSilos(mapSilos(data));
    } catch (err) {
      console.error('Error loading silos:', err);
    } finally {
      updateLoading('silos', false);
    }
  }, [selectedSite, silos.length, updateLoading, getCached, setCache]);

  const loadRecommendations = useCallback(async () => {
    if (!selectedSite || pendingChanges.length > 0) return;
    
    updateLoading('recommendations', true);
    const cacheKey = `site:${selectedSite.id}:recommendations`;
    
    try {
      const cached = getCached<any>(cacheKey);
      if (cached) {
        setPendingChanges(mapRecommendationsToPendingChanges(cached.recommendations || cached));
        return;
      }

      const data = await recommendationsService.fetchRecommendations(selectedSite.id);
      setCache(cacheKey, data.recommendations || []);
      setPendingChanges(mapRecommendationsToPendingChanges(data.recommendations || []));
    } catch (err) {
      console.error('Error loading recommendations:', err);
    } finally {
      updateLoading('recommendations', false);
    }
  }, [selectedSite, pendingChanges.length, updateLoading, getCached, setCache]);

  const loadLinkOpportunities = useCallback(async () => {
    // Link opportunities not implemented yet
    console.log('Link opportunities not implemented');
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    if (!selectedSite) return;
    
    clearSiteCache(selectedSite.id);
    setSiteOverview(null);
    setPages([]);
    setCannibalizationIssues([]);
    setSilos([]);
    setPendingChanges([]);
    setLinkOpportunities([]);
    
    await loadCriticalSiteData(selectedSite);
  }, [selectedSite, clearSiteCache, loadCriticalSiteData]);

  // Initialize
  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const contextValue: DashboardData = {
    // State
    sites,
    selectedSite,
    siteOverview,
    pages,
    cannibalizationIssues,
    silos,
    pendingChanges,
    linkOpportunities,
    error,
    loading: {
      main: loading.main,
      cannibalization: loading.cannibalization,
      silos: loading.silos,
      recommendations: loading.recommendations,
      linkOpportunities: loading.linkOpportunities,
    },
    // Actions
    loadSites,
    selectSite,
    refresh,
    loadCannibalization,
    loadSilos,
    loadRecommendations,
    loadLinkOpportunities,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

// Hook for using the dashboard context
export function useDashboardContext(): DashboardData {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}
