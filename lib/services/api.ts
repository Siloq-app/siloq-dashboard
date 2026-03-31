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
  onboarding_complete?: boolean;
  business_type?: string;
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

  async fetchPendingActions(siteId: number | string): Promise<AgentPendingActionsResponse> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/pending-actions/?status=pending&page_size=50`);
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || data.message || 'Failed to load pending actions');
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

// --- Agent Pending Actions ---

export interface AgentPendingAction {
  id: number;
  action_type: string;
  description: string;
  risk: string;
  impact: string;
  doctrine: string;
  status: string;
  created_at: string;
}

export interface AgentPendingActionsResponse {
  total: number;
  page: number;
  page_size: number;
  results: AgentPendingAction[];
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

// ── Supporting Pages Intelligence Types ──────────────────────────────────────

export interface SupportingPageDraft {
  topic_title: string;
  page_type: 'sub_page' | 'blog_post';
  target_keyword: string;
  hub_page_id: number;
}

export interface CreateDraftResponse {
  wp_post_id: number;
  edit_url: string;
  status: string;
}

export interface SiloMapNeededPage {
  topic: string;
  keyword: string;
  type: 'sub_page' | 'blog_post';
}

export interface SiloMapExistingPage {
  id: number;
  title: string;
  url: string;
}

export interface SiloMapHub {
  id: number;
  title: string;
  url: string;
  seo_score: number;
}

export interface SiloMapEntry {
  hub: SiloMapHub;
  existing_supporting: SiloMapExistingPage[];
  needed_supporting: SiloMapNeededPage[];
  linking_back: number;
  total_supporting: number;
}

export interface ContentPlanGap {
  hub_page_id: number;
  hub_title: string;
  hub_url: string;
  supporting_count: number;
  needed_topics: Array<{
    topic: string;
    keyword: string;
    type: 'sub_page' | 'blog_post';
  }>;
}

export interface ContentPlanPipelineItem {
  id: number;
  title: string;
  page_type: 'sub_page' | 'blog_post';
  target_keyword: string;
  hub_page_id: number;
  hub_title: string;
  wp_post_id: number | null;
  edit_url: string | null;
  status: 'draft' | 'published';
  created_at: string;
}

export interface ContentJob {
  id: number;
  blog_title: string;
  primary_keyword: string;
  tier: 1 | 2 | 3;
  search_volume: number;
  status: 'pending_approval' | 'approved' | 'writing' | 'draft_ready' | 'published';
  angle: string;
  internal_links: string[];
  blog_content: string | null;
  meta_description: string | null;
  word_count: number | null;
  created_at: string;
  updated_at: string;
}

class ContentPlanService {
  async getSiloMap(siteId: string | number): Promise<SiloMapEntry[]> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/silo-map/`);
    if (!res.ok) throw new Error('Failed to load silo map');
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  }

  async getGaps(siteId: string | number): Promise<ContentPlanGap[]> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/content-gaps/`);
    if (!res.ok) throw new Error('Failed to load content gaps');
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  }

  async getPipeline(siteId: string | number): Promise<ContentPlanPipelineItem[]> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/content-pipeline/`);
    if (!res.ok) throw new Error('Failed to load pipeline');
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  }

  async createDraft(siteId: string | number, data: SupportingPageDraft): Promise<CreateDraftResponse> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/pages/create-draft/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || json.detail || 'Failed to create draft');
    return json;
  }

  // ── DataForSEO Content Engine ──────────────────────────────────────────────

  async listContentJobs(siteId: string | number): Promise<ContentJob[]> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/content/jobs/`);
    if (!res.ok) throw new Error('Failed to load content jobs');
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  }

  async keywordDiscovery(siteId: string | number): Promise<void> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/content/keyword-discovery/`, {
      method: 'POST',
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || json.detail || 'Keyword discovery failed');
    }
  }

  async generateTopics(siteId: string | number, blogCount = 10): Promise<{ count: number }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/content/generate-topics/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blog_count: blogCount }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || json.detail || 'Failed to generate topics');
    return json;
  }

  async updateContentJob(siteId: string | number, jobId: number, data: Partial<ContentJob>): Promise<ContentJob> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/content/jobs/${jobId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || json.detail || 'Failed to update content job');
    return json;
  }

  async writeContentJob(siteId: string | number, jobId: number): Promise<void> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/content/jobs/${jobId}/write/`, {
      method: 'POST',
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || json.detail || 'Failed to start writing');
    }
  }

  async publishContentJob(siteId: string | number, jobId: number): Promise<void> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/content/jobs/${jobId}/publish/`, {
      method: 'POST',
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || json.detail || 'Failed to publish');
    }
  }

  async deleteContentJob(siteId: string | number, jobId: number): Promise<void> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/content/jobs/${jobId}/`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || json.detail || 'Failed to delete content job');
    }
  }
}

export const contentPlanService = new ContentPlanService();

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

// ── Intelligence types ────────────────────────────────────────────────────────

export interface IntelligenceHubPage {
  id: number;
  title: string;
  url: string;
  spoke_count: number;
  gaps: number;
}

export interface IntelligenceSpokePage {
  id: number;
  title: string;
  url: string;
  parent_hub: string;
  is_connected: boolean;
}

export interface IntelligenceOrphanPage {
  id: number;
  title: string;
  url: string;
  recommendation: string;
}

export interface IntelligenceContentGap {
  hub_title: string;
  missing_topics: string[];
}

export interface IntelligenceCannibalizationRisk {
  pages: string[];
  keyword: string;
  severity: 'high' | 'medium' | 'low';
}

export interface IntelligenceResult {
  business_type: string;
  hub_pages: IntelligenceHubPage[];
  spoke_pages: IntelligenceSpokePage[];
  orphan_pages: IntelligenceOrphanPage[];
  content_gaps: IntelligenceContentGap[];
  cannibalization_risks: IntelligenceCannibalizationRisk[];
  generated_at?: string;
}

class IntelligenceService {
  async get(siteId: number): Promise<IntelligenceResult | null> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/intelligence/`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch intelligence');
    return res.json();
  }

  async generate(siteId: number): Promise<IntelligenceResult> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/intelligence/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to generate intelligence');
    return res.json();
  }
}

export const intelligenceService = new IntelligenceService();

// ── Goals types ───────────────────────────────────────────────────────────────

export interface GoalPriorityLocation {
  city: string;
  state: string;
  rank: number;
}

export type PrimaryGoal =
  | 'local_leads'
  | 'ecommerce_sales'
  | 'topic_authority'
  | 'multi_location'
  | 'geo_citations'
  | 'organic_growth';

export interface SiteGoals {
  primary_goal: PrimaryGoal | '';
  priority_services: string[];
  priority_locations: GoalPriorityLocation[];
  geo_priority_pages: number[];
}

// ── Goals service ─────────────────────────────────────────────────────────────

class GoalsService {
  async get(siteId: number): Promise<SiteGoals | null> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/goals/`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch goals');
    return res.json();
  }

  async save(siteId: number, data: SiteGoals): Promise<SiteGoals> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/goals/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || json.detail || 'Failed to save goals');
    return json;
  }
}

export const goalsService = new GoalsService();
export interface TopicBoundary {
  id: number;
  silo_id: number;
  core_topic: string;
  adjacent_topics: string[];
  out_of_scope_topics: string[];
  entity_type_override: string | null;
  defined_at: string;
  updated_at: string;
}

export type SubtopicType = 'core' | 'supporting' | 'adjacent' | 'edge_case' | 'comparative' | 'evidence';
export type CoverageStatus = 'covered' | 'thin' | 'missing' | 'stale';

export interface SubtopicItem {
  id: number;
  subtopic_label: string;
  subtopic_slug: string;
  subtopic_type: SubtopicType;
  coverage_status: CoverageStatus;
  mapped_page_id: number | null;
  priority_score: number;
  last_assessed: string | null;
}

export interface SiloDepthScore {
  semantic_density_score: number;
  topical_closure_score: number;
  coverage_breadth_pct: number;
  coverage_depth_pct: number;
  thin_page_count: number;
  missing_subtopic_count: number;
  stale_page_count: number;
  scope_creep_flag: boolean;
  disconnected_page_count: number;
  freshness_score: number;
  depth_mistake_flags: string[];
  scored_at: string;
}

export interface GapItem {
  id: number;
  subtopic_label: string;
  subtopic_type: SubtopicType;
  priority_score: number;
  coverage_status: CoverageStatus;
  content_type: 'architecture' | 'evidence';
  brief_prompt: string;
}

export interface GapReport {
  critical_gaps: GapItem[];
  thin_pages: GapItem[];
  stale_pages: GapItem[];
  standard_gaps: GapItem[];
  total_gap_count: number;
  estimated_closure_gap: string;
}

export interface SubtopicMap {
  subtopics: SubtopicItem[];
  grouped: {
    core: SubtopicItem[];
    supporting: SubtopicItem[];
    adjacent: SubtopicItem[];
    edge_case: SubtopicItem[];
    comparative: SubtopicItem[];
    evidence: SubtopicItem[];
  };
}

export interface LinkRelationship {
  id: number;
  source_page_id: number;
  target_page_id: number;
  relationship_type: string;
  anchor_text: string;
  relationship_confidence: number;
  assessed_at: string | null;
}

class DepthEngineService {
  private base(siteId: number | string, siloId: number | string) {
    return `/api/v1/sites/${siteId}/silos/${siloId}`;
  }

  async getTopicBoundary(siteId: number | string, siloId: number | string): Promise<TopicBoundary> {
    const res = await fetchWithAuth(`${this.base(siteId, siloId)}/topic-boundary/`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load topic boundary');
    return data;
  }

  async saveTopicBoundary(
    siteId: number | string,
    siloId: number | string,
    payload: Partial<Pick<TopicBoundary, 'core_topic' | 'adjacent_topics' | 'out_of_scope_topics' | 'entity_type_override'>>
  ): Promise<TopicBoundary> {
    const res = await fetchWithAuth(`${this.base(siteId, siloId)}/topic-boundary/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to save topic boundary');
    return data;
  }

  async generateSubtopicMap(siteId: number | string, siloId: number | string): Promise<SubtopicMap> {
    const res = await fetchWithAuth(`${this.base(siteId, siloId)}/generate-subtopic-map/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to generate subtopic map');
    return data;
  }

  async getSubtopicMap(siteId: number | string, siloId: number | string): Promise<SubtopicMap> {
    const res = await fetchWithAuth(`${this.base(siteId, siloId)}/subtopic-map/`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load subtopic map');
    return data;
  }

  async getDepthScores(siteId: number | string, siloId: number | string): Promise<SiloDepthScore> {
    const res = await fetchWithAuth(`${this.base(siteId, siloId)}/depth-scores/`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load depth scores');
    return data;
  }

  async refreshDepthScores(siteId: number | string, siloId: number | string): Promise<SiloDepthScore> {
    const res = await fetchWithAuth(`${this.base(siteId, siloId)}/depth-scores/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to refresh depth scores');
    return data;
  }

  async getGapReport(siteId: number | string, siloId: number | string): Promise<GapReport> {
    const res = await fetchWithAuth(`${this.base(siteId, siloId)}/gap-report/`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load gap report');
    return data;
  }

  async addSubtopicToPlan(
    siteId: number | string,
    siloId: number | string,
    subtopicId: number,
    contentType: 'architecture' | 'evidence'
  ): Promise<void> {
    const res = await fetchWithAuth(`${this.base(siteId, siloId)}/subtopics/${subtopicId}/add-to-plan/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: contentType }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || data.detail || 'Failed to add subtopic to plan');
    }
  }

  async getLinkRelationships(siteId: number | string, siloId: number | string): Promise<LinkRelationship[]> {
    const res = await fetchWithAuth(`${this.base(siteId, siloId)}/link-relationships/`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load link relationships');
    return Array.isArray(data) ? data : data.results || [];
  }

  async assessLinkRelationships(siteId: number | string, siloId: number | string): Promise<LinkRelationship[]> {
    const res = await fetchWithAuth(`${this.base(siteId, siloId)}/link-relationships/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to assess link relationships');
    return Array.isArray(data) ? data : data.results || [];
  }
}

export const depthEngineService = new DepthEngineService();

// ── Author E-E-A-T Types ─────────────────────────────────────────────────────

export interface Credential {
  type: 'certification' | 'license' | 'experience' | 'award';
  name: string;
  issuer?: string;
  issuer_url?: string;
  year?: string;
}

export interface AuthorProfile {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  job_title: string;
  credentials: Credential[];
  short_bio: string;
  long_bio: string;
  linkedin_url: string;
  twitter_url: string;
  author_page_url: string;
  headshot_url: string;
  wp_user_id: number | null;
  wp_username: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAuthorData {
  first_name: string;
  last_name: string;
  job_title?: string;
  headshot_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  wp_user_id?: number | null;
  is_primary?: boolean;
  credentials?: Credential[];
  short_bio?: string;
  long_bio?: string;
}

class AuthorService {
  async listAuthors(siteId: number | string): Promise<AuthorProfile[]> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/authors/`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to load authors');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  }

  async createAuthor(siteId: number | string, data: CreateAuthorData): Promise<AuthorProfile> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/authors/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || json.error || 'Failed to create author');
    return json;
  }

  async updateAuthor(siteId: number | string, authorId: number, data: Partial<AuthorProfile>): Promise<AuthorProfile> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/authors/${authorId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || json.error || 'Failed to update author');
    return json;
  }

  async deleteAuthor(siteId: number | string, authorId: number): Promise<void> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/authors/${authorId}/`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to delete author');
    }
  }

  async generateTeamPage(siteId: number | string, authorId: number): Promise<{ wp_page_id: number; edit_url: string }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/authors/${authorId}/generate-team-page/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || json.error || 'Failed to generate team page');
    return json;
  }
}

export const authorService = new AuthorService();
