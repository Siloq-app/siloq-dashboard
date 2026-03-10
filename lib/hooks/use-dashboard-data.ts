'use client';

import { useState, useEffect, useCallback } from 'react';
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
}

export function useDashboardData() {
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

  const loadSites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sitesList = await sitesService.list();
      setSites(sitesList);

      if (sitesList.length > 0 && !selectedSite) {
        setSelectedSite(sitesList[0]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load sites');
      setSites([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSite]);

  const loadSiteOverview = useCallback(async (siteId: number | string) => {
    try {
      const overview = await sitesService.getOverview(siteId);
      setSiteOverview(overview);
      return overview;
    } catch (e: unknown) {
      console.error('Site overview error:', e);
      setSiteOverview(null);
      return null;
    }
  }, []);

  const loadPages = useCallback(async (siteId?: number | string) => {
    if (!siteId) {
      setPages([]);
      return;
    }
    try {
      const pagesList = await pagesService.list(siteId);
      setPages(pagesList);
    } catch (e: unknown) {
      console.error('Pages load error:', e);
      setPages([]);
    }
  }, []);

  const loadCannibalizationIssues = useCallback(async (siteId: number | string) => {
    try {
      const response = await cannibalizationService.fetchIssues(siteId);
      const mapped = mapCannibalizationIssues(response);
      setCannibalizationIssues(mapped);
    } catch (e: unknown) {
      console.error('Cannibalization issues load error:', e);
      setCannibalizationIssues([]);
    }
  }, []);

  const loadSilos = useCallback(async (siteId: number | string) => {
    try {
      const response = await silosService.fetchSilos(siteId);
      const mapped = mapSilos(response);
      setSilos(mapped);
    } catch (e: unknown) {
      console.error('Silos load error:', e);
      setSilos([]);
    }
  }, []);

  const loadRecommendations = useCallback(async (siteId: number | string) => {
    try {
      const response = await recommendationsService.fetchRecommendations(siteId);
      const mapped = mapRecommendationsToPendingChanges(response);
      setPendingChanges(mapped);
    } catch (e: unknown) {
      console.error('Recommendations load error:', e);
      setPendingChanges([]);
    }
  }, []);

  const loadLinkOpportunities = useCallback(async () => {
    try {
      // TODO: Implement when API endpoint is available
      const mapped = mapLinkOpportunities();
      setLinkOpportunities(mapped);
    } catch (e: unknown) {
      console.error('Link opportunities load error:', e);
      setLinkOpportunities([]);
    }
  }, []);

  const selectSite = useCallback(
    async (site: Site) => {
      setSelectedSite(site);
      await Promise.all([
        loadSiteOverview(site.id),
        loadPages(site.id),
        loadCannibalizationIssues(site.id),
        loadSilos(site.id),
        loadRecommendations(site.id),
        loadLinkOpportunities(),
      ]);
    },
    [
      loadSiteOverview,
      loadPages,
      loadCannibalizationIssues,
      loadSilos,
      loadRecommendations,
      loadLinkOpportunities,
    ]
  );

  const refresh = useCallback(async () => {
    await loadSites();
    if (selectedSite) {
      await Promise.all([
        loadSiteOverview(selectedSite.id),
        loadPages(selectedSite.id),
        loadCannibalizationIssues(selectedSite.id),
        loadSilos(selectedSite.id),
        loadRecommendations(selectedSite.id),
        loadLinkOpportunities(),
      ]);
    }
  }, [
    loadSites,
    selectedSite,
    loadSiteOverview,
    loadPages,
    loadCannibalizationIssues,
    loadSilos,
    loadRecommendations,
    loadLinkOpportunities,
  ]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  useEffect(() => {
    if (selectedSite) {
      loadSiteOverview(selectedSite.id);
      loadPages(selectedSite.id);
      loadCannibalizationIssues(selectedSite.id);
      loadSilos(selectedSite.id);
      loadRecommendations(selectedSite.id);
      loadLinkOpportunities();
    }
  }, [
    selectedSite,
    loadSiteOverview,
    loadPages,
    loadCannibalizationIssues,
    loadSilos,
    loadRecommendations,
    loadLinkOpportunities,
  ]);

  return {
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
  };
}
