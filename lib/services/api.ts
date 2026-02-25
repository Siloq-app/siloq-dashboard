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

  async approveAction(siteId: number | string, actionId: number | string): Promise<any> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/approvals/${actionId}/approve/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || data.message || 'Failed to approve action');
    return data;
  }

  async denyAction(siteId: number | string, actionId: number | string, reason?: string): Promise<any> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/approvals/${actionId}/deny/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || 'User denied' }),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || data.message || 'Failed to deny action');
    return data;
  }
}

class PagesService {
  async list(siteId?: number | string): Promise<Page[]> {
    if (!siteId) return [];
    const url = `/api/v1/pages/?site_id=${siteId}`;
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
    page_type_classification?: string;
    page_type_override?: boolean;
  };
  supporting_pages: Array<{
    id: number;
    url: string;
    title: string;
    status: string;
    has_link_to_target: boolean;
    entities?: string[];
    page_type_classification?: string;
    page_type_override?: boolean;
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

// --- New v2 Anti-Cannibalization Services ---

export interface ConflictResponse {
  id: number;
  keyword: string;
  conflict_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  pages: Array<{
    url: string;
    title?: string;
    impressions?: number;
    clicks?: number;
    position?: number;
    is_noindex?: boolean;
    has_redirect?: boolean;
    redirect_type?: string;
    redirect_target?: string;
  }>;
  recommendation: string;
  recommendation_reasoning?: string;
  winner_url?: string;
  status: 'active' | 'resolved' | 'dismissed';
  total_impressions: number;
  total_clicks: number;
  created_at: string;
}

export interface KeywordResponse {
  id: number;
  keyword: string;
  page_url: string;
  page_type: string;
  silo_name?: string;
  status: string;
  impressions?: number;
  clicks?: number;
  position?: number;
}

export interface SiloHealthResponse {
  id: number;
  name: string;
  health_score: number;
  conflict_count: number;
  page_count: number;
  keyword_count: number;
}

class ConflictsService {
  async list(siteId: number | string): Promise<ConflictResponse[]> {
    // Use live detection endpoint (analyzes pages in real-time) instead of stored conflicts
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/cannibalization-issues/`);
    const responseData = await res.json();
    if (!res.ok)
      throw new Error(responseData.message || responseData.detail || 'Failed to load conflicts');
    
    // Map cannibalization-issues response format to ConflictResponse format
    const issues = responseData.issues || [];
    return issues.map((issue: any, idx: number) => ({
      id: issue.id || idx + 1,
      keyword: issue.keyword || '',
      conflict_type: issue.type || 'unknown',
      severity: (issue.severity || 'low').toLowerCase(),
      pages: (issue.competing_pages || []).map((p: any) => ({
        url: p.url || '',
        title: p.title || '',
        impressions: p.impressions || 0,
        clicks: p.clicks || 0,
        position: p.position || null,
        is_noindex: p.is_noindex || false,
        has_redirect: false,
      })),
      recommendation: issue.recommendation || '',
      recommendation_reasoning: issue.explanation || '',
      winner_url: issue.suggested_king?.url || '',
      status: 'active' as const,
      total_impressions: issue.total_impressions || 0,
      total_clicks: 0,
      created_at: new Date().toISOString(),
    }));
  }

  async resolve(conflictId: number | string): Promise<void> {
    const res = await fetchWithAuth(`/api/v1/conflicts/${conflictId}/resolve/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || data.detail || 'Failed to resolve conflict');
    }
  }

  async dismiss(conflictId: number | string): Promise<void> {
    const res = await fetchWithAuth(`/api/v1/conflicts/${conflictId}/dismiss/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || data.detail || 'Failed to dismiss conflict');
    }
  }

  async acknowledge(conflictId: number | string): Promise<void> {
    const res = await fetchWithAuth(`/api/v1/conflicts/${conflictId}/acknowledge/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.detail || 'Failed to acknowledge conflict');
    }
  }

  async setPrimary(conflictId: number | string, winnerUrl: string): Promise<void> {
    const res = await fetchWithAuth(`/api/v1/conflicts/${conflictId}/set-primary/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_url: winnerUrl }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.detail || 'Failed to set primary page');
    }
  }

  async resolveWithRedirect(conflictId: number | string, resolutionType = 'redirect'): Promise<void> {
    const res = await fetchWithAuth(`/api/v1/conflicts/${conflictId}/resolve/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution_type: resolutionType }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.detail || 'Failed to resolve conflict');
    }
  }

  async differentiate(siteId: number | string, payload: {
    pages: Array<{ url: string; title?: string; page_type?: string }>;
    keyword: string;
    conflict_type?: string;
  }): Promise<{
    site_id: number;
    keyword: string;
    recommendations: Array<{
      url: string;
      page_id: number | null;
      new_title: string;
      new_h1: string;
      new_meta_description: string;
      primary_keyword: string;
      internal_link_suggestion: string;
      reasoning: string;
    }>;
  }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/conflicts/differentiate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to generate differentiation');
    }
    return data.data;
  }

  async applyDifferentiation(siteId: number | string, changes: Array<{
    page_id: number | null;
    url: string;
    new_title: string;
    new_meta_description: string;
    new_h1: string;
  }>): Promise<{
    site_id: number;
    total_changes: number;
    successful: number;
    failed: number;
    results: Array<{
      url: string;
      success: boolean;
      error?: string;
      updated_fields?: {
        title: string;
        meta_description: string;
        h1: string;
      };
    }>;
  }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/conflicts/apply-differentiation/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to apply changes');
    }
    return data.data;
  }
}

class KeywordsService {
  async list(siteId: number | string): Promise<KeywordResponse[]> {
    const res = await fetchWithAuth(`/api/v1/keywords/?site_id=${siteId}`);
    const responseData = await res.json();
    if (!res.ok)
      throw new Error(responseData.message || responseData.detail || 'Failed to load keywords');
    // API returns {data: [...], meta: {...}} format
    return Array.isArray(responseData) ? responseData : responseData.data || responseData.results || [];
  }
}

class HealthScoresService {
  async get(siteId: number | string): Promise<SiloHealthResponse[]> {
    const res = await fetchWithAuth(`/api/v1/health/scores/?site_id=${siteId}`);
    const responseData = await res.json();
    if (!res.ok)
      throw new Error(responseData.message || responseData.detail || 'Failed to load health scores');
    // API returns {data: [...], meta: {...}} format
    return Array.isArray(responseData) ? responseData : responseData.data || responseData.results || [];
  }
}

class SilosV2Service {
  async list(siteId: number | string): Promise<SiloHealthResponse[]> {
    const res = await fetchWithAuth(`/api/v1/silos/?site_id=${siteId}`);
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || 'Failed to load silos');
    return Array.isArray(data) ? data : data.results || [];
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

class RedirectsService {
  async create(siteId: number | string, redirect: {
    from_url: string;
    to_url: string;
    reason?: string;
    conflict_keyword?: string;
  }): Promise<any> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/redirects/create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(redirect),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create redirect');
    return data;
  }

  async list(siteId: number | string): Promise<any[]> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/redirects/`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load redirects');
    return data.redirects || [];
  }
}

// --- Three-Layer Content Analysis Types ---

export interface Recommendation {
  id: string;
  layer: 'GEO' | 'SEO' | 'CRO';
  priority: 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
  before: string;
  after: string;
  field: string;
  status: 'pending' | 'approved' | 'applied';
}

export interface PageAnalysis {
  id: number;
  page_url: string;
  geo_score: number | null;
  seo_score: number | null;
  cro_score: number | null;
  overall_score: number | null;
  geo_recommendations: Recommendation[];
  seo_recommendations: Recommendation[];
  cro_recommendations: Recommendation[];
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
  created_at: string;
}

class AnalysisService {
  async analyzePageContent(siteId: number | string, pageUrl: string): Promise<PageAnalysis> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/pages/analyze/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_url: pageUrl }),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.detail || data.error || 'Failed to analyze page');
    return data;
  }

  async getPageAnalysis(siteId: number | string, pageUrl: string): Promise<PageAnalysis | null> {
    const res = await fetchWithAuth(
      `/api/v1/sites/${siteId}/pages/analysis/?page_url=${encodeURIComponent(pageUrl)}`
    );
    if (res.status === 404) return null;
    const data = await res.json();
    if (!res.ok) return null;
    // API may return list or single object
    if (Array.isArray(data)) return data.length > 0 ? data[0] : null;
    if (data.results) return data.results.length > 0 ? data.results[0] : null;
    return data.id ? data : null;
  }

  async approveRecommendations(
    siteId: number | string,
    analysisId: number,
    recommendationIds: string[]
  ): Promise<void> {
    const res = await fetchWithAuth(
      `/api/v1/sites/${siteId}/pages/analysis/${analysisId}/approve/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation_ids: recommendationIds }),
      }
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || data.detail || data.error || 'Failed to approve recommendations');
    }
  }

  async applyToWordPress(siteId: number | string, analysisId: number): Promise<{
    applied: string[];
    failed: Array<{rec_id: string; error: string}>;
    verified: string[];
    unverified: string[];
    verification_details: Record<string, {found: boolean; field: string}>;
    analysis_id: number;
  }> {
    const res = await fetchWithAuth(
      `/api/v1/sites/${siteId}/pages/analysis/${analysisId}/apply/`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.detail || data.error || 'Failed to apply to WordPress');
    }
    return data;
  }
}


export interface GbpReview {
  text: string;
  author: string;
  rating: number;
  date: string;
}

export interface EntityProfile {
  id: number;
  business_name: string;
  description: string;
  phone: string;
  email: string;
  founding_year: number | null;
  founder_name: string;
  num_employees: string;
  price_range: string;
  languages: string[];
  payment_methods: string[];
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  service_cities: string[];
  service_zips: string[];
  service_radius_miles: number | null;
  hours: Record<string, string>;
  categories: string[];
  social_profiles: {
    facebook: string;
    instagram: string;
    linkedin: string;
    twitter: string;
    youtube: string;
    tiktok: string;
  };
  gbp_url: string;
  google_place_id: string;
  gbp_star_rating: number | null;
  gbp_review_count: number | null;
  gbp_reviews: GbpReview[];
  gbp_last_synced: string | null;
  updated_at: string;
}

class EntityProfileService {
  /** Normalize raw API response → full EntityProfile with safe defaults */
  private normalize(data: any): EntityProfile {
    return {
      id:               data.id                                      ?? 0,
      // Core identity — API returns "name" but component expects "business_name"
      business_name:    data.business_name  ?? data.name             ?? '',
      description:      data.description                             ?? '',
      phone:            data.phone                                   ?? '',
      email:            data.email                                   ?? '',
      founder_name:     data.founder_name                            ?? '',
      founding_year:    data.founding_year                           ?? null,
      price_range:      data.price_range                             ?? '',
      num_employees:    data.num_employees                           ?? '',
      languages:        Array.isArray(data.languages)     ? data.languages     : [],
      payment_methods:  Array.isArray(data.payment_methods) ? data.payment_methods : [],
      categories:       Array.isArray(data.categories)    ? data.categories    : [],
      hours:            data.hours                                   ?? {},
      updated_at:       data.updated_at                              ?? '',

      // Address — API returns combined "address" string
      street_address:   data.street_address ?? data.address          ?? '',
      city:             data.city                                    ?? '',
      state:            data.state                                   ?? '',
      zip_code:         data.zip_code                                ?? '',
      country:          data.country                                 ?? '',

      // Service area
      service_cities:       Array.isArray(data.service_cities)  ? data.service_cities  : [],
      service_zips:         Array.isArray(data.service_zips)    ? data.service_zips    : [],

      service_radius_miles: data.service_radius_miles                ?? null,

      // Social — API may not return this at all
      social_profiles: {
        facebook:  data.social_profiles?.facebook  ?? '',
        instagram: data.social_profiles?.instagram ?? '',
        linkedin:  data.social_profiles?.linkedin  ?? '',
        twitter:   data.social_profiles?.twitter   ?? '',
        youtube:   data.social_profiles?.youtube   ?? '',
        tiktok:    data.social_profiles?.tiktok    ?? '',
      },

      // GBP — API uses different field names
      gbp_url:          data.gbp_url                                 ?? '',
      google_place_id:  data.place_id       ?? data.google_place_id  ?? '',
      gbp_last_synced:  data.gbp_last_synced ?? data.last_synced_at  ?? null,
      gbp_star_rating:  data.gbp_star_rating ?? data.rating           ?? null,
      gbp_review_count: data.gbp_review_count ?? data.review_count    ?? null,

      gbp_reviews:      Array.isArray(data.gbp_reviews)
                          ? data.gbp_reviews
                          : Array.isArray(data.reviews) ? data.reviews : [],
    };
  }

  async get(siteId: number | string): Promise<EntityProfile> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/entity-profile/`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load entity profile');
    return this.normalize(data);
  }

  async update(siteId: number | string, updates: Partial<EntityProfile>): Promise<EntityProfile> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/entity-profile/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update entity profile');
    return this.normalize(data);
  }

  async syncGbp(siteId: number | string, placeIdOrUrl: string, phone?: string): Promise<EntityProfile> {
    const isUrl = placeIdOrUrl.startsWith('http');
    const isPhone = /^\+?[\d\s\-().]{7,}$/.test(placeIdOrUrl);
    let body: Record<string, string> = {};
    if (isUrl) body.gbp_url = placeIdOrUrl;
    else if (isPhone) body.phone = placeIdOrUrl;
    else body.place_id = placeIdOrUrl;
    if (phone) body.phone = phone;

    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/entity-profile/sync-gbp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sync from Google');
    return this.normalize(data.synced ?? data);
  }
}
export const entityProfileService = new EntityProfileService();

export const sitesService = new SitesService();
export const pagesService = new PagesService();
export const apiKeysService = new ApiKeysService();
export const scansService = new ScansService();
export const cannibalizationService = new CannibalizationService();
export const silosService = new SilosService();
export const recommendationsService = new RecommendationsService();
export const gscService = new GscService();
export const conflictsService = new ConflictsService();
export const keywordsService = new KeywordsService();
export const healthScoresService = new HealthScoresService();
export const silosV2Service = new SilosV2Service();
export const redirectsService = new RedirectsService();
export const analysisService = new AnalysisService();
