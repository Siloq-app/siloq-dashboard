'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  const loadSiteData = useCallback(async (site: Site) => {
    const loadSiteOverview = async () => {
      try {
        const overview = await sitesService.getOverview(site.id);
        setSiteOverview(overview);
      } catch (e: unknown) {
        console.error('Site overview error:', e);
        setSiteOverview(null);
      }
    };

    const loadPages = async () => {
      try {
        const pagesList = await pagesService.list(site.id);
        setPages(pagesList);
      } catch (e: unknown) {
        console.error('Pages load error:', e);
        setPages([]);
      }
    };

    const loadCannibalizationIssues = async () => {
      try {
        const response = await cannibalizationService.fetchIssues(site.id);
        const mapped = mapCannibalizationIssues(response);
        setCannibalizationIssues(mapped);
      } catch (e: unknown) {
        console.error('Cannibalization issues load error:', e);
        setCannibalizationIssues([]);
      }
    };

    const loadSilos = async () => {
      try {
        const response = await silosService.fetchSilos(site.id);
        const mapped = mapSilos(response);
        setSilos(mapped);
      } catch (e: unknown) {
        console.error('Silos load error:', e);
        setSilos([]);
      }
    };

    const loadRecommendations = async () => {
      try {
        const response = await recommendationsService.fetchRecommendations(site.id);
        const mapped = mapRecommendationsToPendingChanges(response);
        setPendingChanges(mapped);
      } catch (e: unknown) {
        console.error('Recommendations load error:', e);
        setPendingChanges([]);
      }
    };

    const loadLinkOpportunities = async () => {
      try {
        const mapped = mapLinkOpportunities();
        setLinkOpportunities(mapped);
      } catch (e: unknown) {
        console.error('Link opportunities load error:', e);
        setLinkOpportunities([]);
      }
    };

    await Promise.all([
      loadSiteOverview(),
      loadPages(),
      loadCannibalizationIssues(),
      loadSilos(),
      loadRecommendations(),
      loadLinkOpportunities(),
    ]);
  }, []);

  const loadSites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sitesList = await sitesService.list();
      setSites(sitesList);

      if (sitesList.length > 0 && !selectedSite) {
        const first = sitesList[0];
        setSelectedSite(first);
        await loadSiteData(first);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load sites');
      setSites([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSite, loadSiteData]);

  const selectSite = useCallback(async (site: Site) => {
    setSelectedSite(site);
    await loadSiteData(site);
  }, [loadSiteData]);

  const refresh = useCallback(async () => {
    if (selectedSite) {
      await loadSiteData(selectedSite);
    }
  }, [selectedSite, loadSiteData]);

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
