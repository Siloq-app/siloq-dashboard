'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  sitesService,
  pagesService,
  Site,
  SiteOverview,
  Page,
} from '@/lib/services/api';

export interface DashboardData {
  sites: Site[];
  selectedSite: Site | null;
  siteOverview: SiteOverview | null;
  pages: Page[];
  isLoading: boolean;
  error: string | null;
}

export function useDashboardData() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [siteOverview, setSiteOverview] = useState<SiteOverview | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
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

  const selectSite = useCallback(
    async (site: Site) => {
      setSelectedSite(site);
      await Promise.all([loadSiteOverview(site.id), loadPages(site.id)]);
    },
    [loadSiteOverview, loadPages]
  );

  const refresh = useCallback(async () => {
    await loadSites();
    if (selectedSite) {
      await Promise.all([
        loadSiteOverview(selectedSite.id),
        loadPages(selectedSite.id),
      ]);
    }
  }, [loadSites, selectedSite, loadSiteOverview, loadPages]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  useEffect(() => {
    if (selectedSite) {
      loadSiteOverview(selectedSite.id);
      loadPages(selectedSite.id);
    }
  }, [selectedSite, loadSiteOverview, loadPages]);

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
  };
}
