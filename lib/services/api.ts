import { fetchWithAuth } from '@/lib/auth-headers';

export { fetchWithAuth };

export interface Site {
  id: number;
  name: string;
  url: string;
  is_active: boolean;
  page_count: number;
  api_key_count: number;
  last_synced_at: string | null;
  created_at: string;
  gsc_connected?: boolean;
}

export interface SiteOverview {
  site_id: number;
  site_name: string;
  health_score: number;
  total_pages: number;
  total_issues: number;
  last_synced_at: string | null;
}

export interface Page {
  id: number;
  url: string;
  title: string;
  status: string;
  published_at: string | null;
  last_synced_at: string | null;
  seo_score: number;
  issue_count: number;
}

export interface PageDetail extends Page {
  site: {
    id: number;
    name: string;
    url: string;
  };
  wp_post_id: number;
  content: string;
  seo_data: {
    id: number;
    meta_title: string;
    meta_description: string;
    h1_count: number;
    h1_text: string;
    seo_score: number;
    issues: Array<{
      type: string;
      severity: 'high' | 'medium' | 'low';
      message: string;
    }>;
    scanned_at: string;
  } | null;
}

export interface ApiKey {
  id: number;
  site: number;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  usage_count: number;
}

export interface Scan {
  id: number;
  url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  scan_type: 'full' | 'quick' | 'seo' | 'technical';
  score: number;
  pages_analyzed: number;
  scan_duration_seconds: number;
  results?: {
    technical_score: number;
    content_score: number;
    seo_score: number;
    issues: Array<{
      type: string;
      severity: 'high' | 'medium' | 'low';
      message: string;
    }>;
    recommendations: string[];
  };
  created_at: string;
  completed_at: string | null;
}

export interface ScanReport extends Scan {
  keyword_cannibalization?: {
    issues_found: number;
    recommendations: string[];
  };
}

export type CreateScanInput = {
  url: string;
  scan_type?: 'full' | 'quick' | 'seo' | 'technical';
};

class SitesService {
  async list(): Promise<Site[]> {
    const res = await fetchWithAuth('/api/v1/sites');
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || 'Failed to load sites');
    return Array.isArray(data) ? data : data.results || [];
  }

  async getById(id: number | string): Promise<Site> {
    const res = await fetchWithAuth(`/api/v1/sites/${id}`);
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || 'Failed to load site');
    return data;
  }

  async getOverview(id: number | string): Promise<SiteOverview> {
    const res = await fetchWithAuth(`/api/v1/sites/${id}/overview`);
    const data = await res.json();
    if (!res.ok)
      throw new Error(
        data.message || data.detail || 'Failed to load site overview'
      );
    return data;
  }

  async create(site: { name: string; url: string }): Promise<Site> {
    const res = await fetchWithAuth('/api/v1/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || 'Failed to create site');
    return data;
  }
}

class PagesService {
  async list(siteId?: number | string): Promise<Page[]> {
    const url = siteId ? `/api/v1/pages?site_id=${siteId}` : '/api/v1/pages';
    const res = await fetchWithAuth(url);
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || 'Failed to load pages');
    return Array.isArray(data) ? data : data.results || [];
  }

  async getById(id: number | string): Promise<PageDetail> {
    const res = await fetchWithAuth(`/api/v1/pages/${id}`);
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || 'Failed to load page');
    return data;
  }

  async getSeoData(id: number | string): Promise<PageDetail['seo_data']> {
    const res = await fetchWithAuth(`/api/v1/pages/${id}/seo`);
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || 'Failed to load SEO data');
    return data;
  }
}

class ApiKeysService {
  async list(siteId?: number | string): Promise<ApiKey[]> {
    const url = siteId
      ? `/api/v1/api-keys?site_id=${siteId}`
      : '/api/v1/api-keys';
    const res = await fetchWithAuth(url);
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || 'Failed to load API keys');
    return Array.isArray(data) ? data : data.results || [];
  }

  async create(key: {
    name: string;
    site_id: number;
  }): Promise<{ key: ApiKey; full_key: string }> {
    const res = await fetchWithAuth('/api/v1/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(key),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(
        data.message || data.detail || 'Failed to create API key'
      );
    return data.key ? { key: data.key, full_key: data.key.key } : data;
  }

  async revoke(id: number | string): Promise<void> {
    const res = await fetchWithAuth(`/api/v1/api-keys/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(
        data.message || data.detail || 'Failed to revoke API key'
      );
    }
  }
}

class ScansService {
  async list(): Promise<Scan[]> {
    const res = await fetchWithAuth('/api/v1/scans');
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || 'Failed to load scans');
    return Array.isArray(data) ? data : data.results || [];
  }

  async getById(id: number | string): Promise<Scan> {
    const res = await fetchWithAuth(`/api/v1/scans/${id}`);
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || 'Failed to load scan');
    return data;
  }

  async create(scan: CreateScanInput): Promise<Scan> {
    const res = await fetchWithAuth('/api/v1/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scan),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || 'Failed to create scan');
    return data;
  }

  async getReport(id: number | string): Promise<ScanReport> {
    const res = await fetchWithAuth(`/api/v1/scans/${id}/report`);
    const data = await res.json();
    if (!res.ok)
      throw new Error(
        data.message || data.detail || 'Failed to load scan report'
      );
    return data;
  }
}

// Cannibalization Issues
export interface CannibalizationIssueResponse {
  issues: Array<{
    id: number;
    type: string;
    keyword: string;
    severity: 'high' | 'medium' | 'low';
    total_impressions: number;
    validation_status: string;
    competing_pages: Array<{
      url: string;
      title?: string;
      impressions?: number;
      clicks?: number;
    }>;
    recommendation: string;
  }>;
  total: number;
  gsc_connected: boolean;
}

export interface SiloResponse {
  id: number;
  name: string;
  site: number;
  target_page?: {
    id: number;
    url: string;
    title: string;
    entities?: string[];
  };
  supporting_pages: Array<{
    id: number;
    url: string;
    title: string;
    status: string;
    has_link_to_target: boolean;
    entities?: string[];
  }>;
  created_at: string;
  updated_at: string;
}

export interface RecommendationResponse {
  recommendations: Array<{
    id: number;
    type: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'approved' | 'rejected' | 'applied';
    impact: string;
    risk_level: 'safe' | 'destructive';
    doctrine?: string;
    created_at: string;
  }>;
  total: number;
}

class CannibalizationService {
  async fetchIssues(siteId: number | string): Promise<CannibalizationIssueResponse> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/cannibalization-issues/`);
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || 'Failed to load cannibalization issues');
    return data;
  }
}

class SilosService {
  async fetchSilos(siteId: number | string): Promise<SiloResponse[]> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/silos/`);
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || 'Failed to load silos');
    return Array.isArray(data) ? data : data.silos || data.results || [];
  }
}

class RecommendationsService {
  async fetchRecommendations(siteId: number | string): Promise<RecommendationResponse> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/recommendations/`);
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || 'Failed to load recommendations');
    return data;
  }
}

// --- GSC Types & Service ---

export interface GscSite {
  siteUrl: string;
  permissionLevel: string;
}

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPageRow {
  page: string;
  clicks: number;
  impressions: number;
}

export interface GscData {
  queries: GscQueryRow[];
  pages: GscPageRow[];
  totals: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
}

class GscService {
  async getAuthUrl(siteId?: number): Promise<{ url: string }> {
    const params = siteId ? `?site_id=${siteId}` : '';
    const res = await fetchWithAuth(`/api/v1/gsc/auth-url/${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to get GSC auth URL');
    return { url: data.auth_url || data.url };
  }

  async getSites(): Promise<GscSite[]> {
    const res = await fetchWithAuth('/api/v1/gsc/sites/');
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load GSC sites');
    return data;
  }

  async connectSite(siteId: number | string, gscUrl: string): Promise<void> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/gsc/connect/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_url: gscUrl }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || data.detail || 'Failed to connect GSC property');
    }
  }

  async getData(siteId: number | string): Promise<GscData> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/gsc/data/`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load GSC data');
    return data;
  }

  async analyze(siteId: number | string): Promise<{ message: string }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/gsc/analyze/`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to run GSC analysis');
    return data;
  }
}

export const sitesService = new SitesService();
export const pagesService = new PagesService();
export const apiKeysService = new ApiKeysService();
export const scansService = new ScansService();
export const cannibalizationService = new CannibalizationService();
export const silosService = new SilosService();
export const recommendationsService = new RecommendationsService();
export const gscService = new GscService();
