import { fetchWithAuth } from '@/lib/auth-headers'

export interface Site {
  id: number
  name: string
  url: string
  is_active: boolean
  page_count: number
  api_key_count: number
  last_synced_at: string | null
  sync_requested_at: string | null
  created_at: string
  // Business profile fields
  business_type?: string | null
  primary_services?: string[]
  service_areas?: string[]
  onboarding_complete?: boolean
  needs_onboarding?: boolean
}

export interface SyncStatus {
  site_id: number
  site_name: string
  page_count: number
  last_synced_at: string | null
  sync_requested_at: string | null
  is_synced: boolean
}

export interface SyncTriggerResponse {
  message: string
  site_id: number
  site_name: string
  instructions: string
  sync_requested_at: string
}

export interface SiteOverview {
  site_id: number
  site_name: string
  health_score: number
  total_pages: number
  total_issues: number
  last_synced_at: string | null
}

export interface Page {
  id: number
  url: string
  title: string
  status: string
  published_at: string | null
  last_synced_at: string | null
  seo_score: number
  issue_count: number
  is_money_page: boolean
}

export interface PageDetail extends Page {
  site: {
    id: number
    name: string
    url: string
  }
  wp_post_id: number
  content: string
  seo_data: {
    id: number
    meta_title: string
    meta_description: string
    h1_count: number
    h1_text: string
    seo_score: number
    issues: Array<{
      type: string
      severity: 'high' | 'medium' | 'low'
      message: string
    }>
    scanned_at: string
  } | null
}

export interface ApiKey {
  id: number
  site: number
  name: string
  key_prefix: string
  is_active: boolean
  created_at: string
  last_used_at: string | null
  usage_count: number
}

export interface Scan {
  id: number
  url: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  scan_type: 'full' | 'quick' | 'seo' | 'technical'
  score: number
  pages_analyzed: number
  scan_duration_seconds: number
  results?: {
    technical_score: number
    content_score: number
    seo_score: number
    issues: Array<{
      type: string
      severity: 'high' | 'medium' | 'low'
      message: string
    }>
    recommendations: string[]
  }
  created_at: string
  completed_at: string | null
}

export interface ScanReport extends Scan {
  keyword_cannibalization?: {
    issues_found: number
    recommendations: string[]
  }
}

export type CreateScanInput = {
  url: string
  scan_type?: 'full' | 'quick' | 'seo' | 'technical'
}

class SitesService {
  async list(): Promise<Site[]> {
    const res = await fetchWithAuth('/api/v1/sites/')
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load sites')
    return Array.isArray(data) ? data : data.results || []
  }

  async getById(id: number | string): Promise<Site> {
    const res = await fetchWithAuth(`/api/v1/sites/${id}/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load site')
    return data
  }

  async getOverview(id: number | string): Promise<SiteOverview> {
    const res = await fetchWithAuth(`/api/v1/sites/${id}/overview`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load site overview')
    return data
  }

  async create(site: { name: string; url: string }): Promise<Site> {
    const res = await fetchWithAuth('/api/v1/sites/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to create site')
    return data
  }

  async getSyncStatus(id: number | string): Promise<SyncStatus> {
    const res = await fetchWithAuth(`/api/v1/sites/${id}/sync-status/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to get sync status')
    return data
  }

  async triggerSync(id: number | string): Promise<SyncTriggerResponse> {
    const res = await fetchWithAuth(`/api/v1/sites/${id}/trigger-sync/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (!res.ok) {
      console.error('Sync trigger failed:', res.status, data)
      throw new Error(data.message || data.detail || `Failed to trigger sync (${res.status})`)
    }
    return data
  }

  async getProfile(id: number | string): Promise<BusinessProfile> {
    const res = await fetchWithAuth(`/api/v1/sites/${id}/profile/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load business profile')
    return data
  }

  async updateProfile(id: number | string, profile: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const res = await fetchWithAuth(`/api/v1/sites/${id}/profile/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to update business profile')
    return data
  }

  async generateSilos(id: number | string): Promise<GeneratedSilos> {
    const res = await fetchWithAuth(`/api/v1/sites/${id}/generate-silos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to generate silo suggestions')
    return data
  }
}

class PagesService {
  async list(siteId?: number | string): Promise<Page[]> {
    const url = siteId ? `/api/v1/pages/?site_id=${siteId}` : '/api/v1/pages/'
    const res = await fetchWithAuth(url)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load pages')
    return Array.isArray(data) ? data : data.results || []
  }

  async getById(id: number | string): Promise<PageDetail> {
    const res = await fetchWithAuth(`/api/v1/pages/${id}/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load page')
    return data
  }

  async getSeoData(id: number | string): Promise<PageDetail['seo_data']> {
    const res = await fetchWithAuth(`/api/v1/pages/${id}/seo/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load SEO data')
    return data
  }

  async toggleMoneyPage(id: number | string, isMoneyPage: boolean): Promise<{ id: number; is_money_page: boolean }> {
    const res = await fetchWithAuth(`/api/v1/pages/${id}/toggle_money_page/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_money_page: isMoneyPage })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to update page')
    return data
  }
}

class ApiKeysService {
  async list(siteId?: number | string): Promise<ApiKey[]> {
    const url = siteId ? `/api/v1/api-keys/?site_id=${siteId}` : '/api/v1/api-keys/'
    const res = await fetchWithAuth(url)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load API keys')
    return Array.isArray(data) ? data : data.results || []
  }

  async create(key: { name: string; site_id: number }): Promise<{ key: ApiKey; full_key: string }> {
    const res = await fetchWithAuth('/api/v1/api-keys/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(key),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to create API key')
    return data.key ? { key: data.key, full_key: data.key.key } : data
  }

  async revoke(id: number | string): Promise<void> {
    const res = await fetchWithAuth(`/api/v1/api-keys/${id}/`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.message || data.detail || 'Failed to revoke API key')
    }
  }
}

class ScansService {
  async list(): Promise<Scan[]> {
    const res = await fetchWithAuth('/api/v1/scans/')
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load scans')
    return Array.isArray(data) ? data : data.results || []
  }

  async getById(id: number | string): Promise<Scan> {
    const res = await fetchWithAuth(`/api/v1/scans/${id}/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load scan')
    return data
  }

  async create(scan: CreateScanInput): Promise<Scan> {
    const res = await fetchWithAuth('/api/v1/scans/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scan),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to create scan')
    return data
  }

  async getReport(id: number | string): Promise<ScanReport> {
    const res = await fetchWithAuth(`/api/v1/scans/${id}/report`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load scan report')
    return data
  }
}

// ============================================================
// Dashboard Data Types (Silos, Cannibalization, Approvals)
// ============================================================

export interface SupportingPage {
  id: number
  url: string
  title: string
  status: string
  order: number
}

export interface TargetPage {
  id: number
  url: string
  title: string
  slug: string
  status: string
}

export interface TopicCluster {
  id: number
  name: string
  created_at: string
}

export interface ReverseSilo {
  id: number
  name: string
  target_page: TargetPage
  topic_cluster: TopicCluster | null
  supporting_pages: SupportingPage[]
  supporting_count: number
  linked_count: number
  created_at: string
}

export interface CompetingPage {
  id: number
  url: string
  title: string
  impression_share: number | null
}

export interface CannibalizationIssue {
  id: number
  keyword: string
  severity: 'high' | 'medium' | 'low'
  recommendation_type: 'consolidate' | 'differentiate' | 'redirect' | null
  total_impressions: number | null
  competing_pages: CompetingPage[]
  suggested_king: TargetPage | null
  created_at: string
  updated_at: string
}

export interface PendingAction {
  id: number
  action_type: string
  description: string
  risk: 'safe' | 'moderate' | 'high'
  status: 'pending' | 'approved' | 'denied' | 'executed' | 'rolled_back'
  impact: string
  doctrine: string
  is_destructive: boolean
  related_issue: CannibalizationIssue | null
  related_silo: number | null
  created_at: string
  rollback_expires_at: string | null
}

export interface HealthSummary {
  health_score: number
  health_score_delta: number
  cannibalization_count: number
  silo_count: number
  page_count: number
  missing_links_count: number
  last_scan_at: string | null
}

// ============================================================
// Dashboard Services
// ============================================================

export interface ContentRecommendation {
  type: 'supporting_content' | 'consolidation' | 'differentiation'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action: 'generate' | 'review' | 'edit'
  target_page_id?: number
  target_page_url?: string
  competing_pages?: Array<{ id: number; url: string; title: string }>
}

export interface AnalysisResult {
  site_id: number
  analyzed_at: string
  health_score: number
  health_score_delta: number
  health_breakdown: {
    base_score: number
    cannibalization_penalty: number
    seo_data_penalty: number
    money_page_bonus: number
  }
  cannibalization_issues: CannibalizationIssue[]
  cannibalization_count: number
  recommendations: ContentRecommendation[]
  recommendation_count: number
  page_count: number
  money_page_count: number
  silo_count: number
  missing_links_count: number
}

class DashboardService {
  async getHealthSummary(siteId: number | string): Promise<HealthSummary> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/health-summary/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load health summary')
    return data
  }

  async getSilos(siteId: number | string): Promise<{ silos: ReverseSilo[]; total: number }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/silos`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load silos')
    return data
  }

  async getCannibalizationIssues(siteId: number | string): Promise<{ issues: CannibalizationIssue[]; total: number }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/cannibalization-issues/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load cannibalization issues')
    return data
  }

  async getPendingApprovals(siteId: number | string): Promise<{ pending_approvals: PendingAction[]; total: number }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/pending-approvals/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load pending approvals')
    return data
  }

  async approveAction(siteId: number | string, actionId: number | string): Promise<{ message: string; action_id: number; status: string }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/approvals/${actionId}/approve/`, {
      method: 'POST',
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to approve action')
    return data
  }

  async denyAction(siteId: number | string, actionId: number | string): Promise<{ message: string; action_id: number; status: string }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/approvals/${actionId}/deny/`, {
      method: 'POST',
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to deny action')
    return data
  }

  async rollbackAction(siteId: number | string, actionId: number | string): Promise<{ message: string; action_id: number; status: string }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/approvals/${actionId}/rollback/`, {
      method: 'POST',
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to rollback action')
    return data
  }

  async analyzeSite(siteId: number | string): Promise<AnalysisResult> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/analyze/`, {
      method: 'POST',
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to analyze site')
    return data
  }

  async getRecommendations(siteId: number | string): Promise<{ recommendations: ContentRecommendation[]; total: number }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/recommendations/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load recommendations')
    return data
  }

  // Internal Links Analysis
  async getInternalLinks(siteId: number | string): Promise<InternalLinksAnalysis> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/internal-links/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load internal links analysis')
    return data
  }

  async getLinkStructure(siteId: number | string): Promise<LinkStructure> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/link-structure/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load link structure')
    return data
  }

  async getAnchorConflicts(siteId: number | string): Promise<{ conflicts: AnchorConflict[]; total: number }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/anchor-conflicts/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load anchor conflicts')
    return data
  }

  async getAnchorTextOverview(siteId: number | string): Promise<AnchorTextOverview> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/anchor-text-overview/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load anchor text overview')
    return data
  }

  async syncLinks(siteId: number | string): Promise<{ message: string; pages_processed: number; total_links_found: number }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/sync-links/`, {
      method: 'POST',
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to sync links')
    return data
  }

  async assignSilo(siteId: number | string, pageId: number, targetPageId: number | null): Promise<{ message: string; page_id: number; parent_silo_id: number | null }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/assign-silo/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_id: pageId, target_page_id: targetPageId })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to assign silo')
    return data
  }

  async setHomepage(siteId: number | string, pageId: number): Promise<{ message: string; page_id: number }> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/set-homepage/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_id: pageId })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to set homepage')
    return data
  }

  async getContentSuggestions(siteId: number | string): Promise<ContentSuggestionsResponse> {
    const res = await fetchWithAuth(`/api/v1/sites/${siteId}/content-suggestions/`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load content suggestions')
    return data
  }
}

// Internal Links Types
export interface SiloPage {
  id: number
  url: string
  title: string
  slug?: string
}

export interface SiloLink {
  source_id: number
  target_id: number
  anchor_text: string
}

export interface Silo {
  target: SiloPage
  supporting_pages: SiloPage[]
  supporting_count: number
  links: SiloLink[]
}

export interface LinkStructure {
  homepage: SiloPage | null
  silos: Silo[]
  total_target_pages: number
  total_supporting_pages: number
}

export interface AnchorConflict {
  anchor_text: string
  target_pages: {
    id: number
    url: string
    title: string
    is_money_page: boolean
  }[]
  occurrence_count: number
  severity: 'high' | 'medium' | 'low'
}

export interface LinkIssue {
  type: string
  page?: SiloPage
  target_page?: SiloPage
  supporting_page?: SiloPage
  missing_links_to?: SiloPage[]
  anchor_text?: string
  severity: 'high' | 'medium' | 'low'
  recommendation?: string
}

export interface HealthBreakdown {
  score: number
  issues: number
  weight: number
}

export interface InternalLinksAnalysis {
  health_score: number
  health_breakdown: {
    anchor_conflicts: HealthBreakdown
    homepage_protection: HealthBreakdown
    target_links: HealthBreakdown
    orphan_pages: HealthBreakdown
  }
  total_issues: number
  issues: {
    anchor_conflicts: AnchorConflict[]
    homepage_theft: LinkIssue[]
    missing_target_links: LinkIssue[]
    missing_sibling_links: LinkIssue[]
    orphan_pages: LinkIssue[]
    silo_size_issues: LinkIssue[]
  }
  structure: LinkStructure
  recommendations: {
    type: string
    priority: 'high' | 'medium' | 'low'
    message: string
  }[]
}

// Business Profile Types
export interface BusinessProfile {
  business_type: string | null
  primary_services: string[]
  service_areas: string[]
  target_audience: string
  business_description: string
  onboarding_complete: boolean
  business_type_choices?: { value: string; label: string }[]
}

export interface SiloSuggestion {
  service: string
  suggested_target_page: {
    title: string
    slug: string
    description: string
  }
  suggested_supporting_topics: string[]
}

export interface LocationSilo {
  area: string
  suggested_page: {
    title: string
    slug: string
  }
  can_create_per_service: boolean
}

export interface GeneratedSilos {
  service_silos: SiloSuggestion[]
  location_silos: LocationSilo[]
  total_suggested_pages: number
}

// Content Suggestions Types
export interface ContentSuggestion {
  title: string
  type: string
  priority: string | number
}

export interface TargetSuggestion {
  target_page: {
    id: number
    title: string
    url?: string
  }
  existing_supporting_count: number
  suggested_topics: ContentSuggestion[]
  gap_analysis: {
    missing_how_to?: boolean
    missing_comparison?: boolean
    missing_local?: boolean
    missing_educational?: boolean
  }
}

export interface ContentSuggestionsResponse {
  total_targets: number
  total_suggested_topics: number
  suggestions: TargetSuggestion[]
}

export const sitesService = new SitesService()
export const pagesService = new PagesService()
export const apiKeysService = new ApiKeysService()
export const scansService = new ScansService()
export const dashboardService = new DashboardService()
