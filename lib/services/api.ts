import { fetchWithAuth } from '@/lib/auth-headers'

export interface Site {
  id: number
  name: string
  url: string
  is_active: boolean
  page_count: number
  api_key_count: number
  last_synced_at: string | null
  created_at: string
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
    const res = await fetchWithAuth('/api/v1/sites')
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load sites')
    return Array.isArray(data) ? data : data.results || []
  }

  async getById(id: number | string): Promise<Site> {
    const res = await fetchWithAuth(`/api/v1/sites/${id}`)
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
    const res = await fetchWithAuth('/api/v1/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to create site')
    return data
  }
}

class PagesService {
  async list(siteId?: number | string): Promise<Page[]> {
    const url = siteId ? `/api/v1/pages?site_id=${siteId}` : '/api/v1/pages'
    const res = await fetchWithAuth(url)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load pages')
    return Array.isArray(data) ? data : data.results || []
  }

  async getById(id: number | string): Promise<PageDetail> {
    const res = await fetchWithAuth(`/api/v1/pages/${id}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load page')
    return data
  }

  async getSeoData(id: number | string): Promise<PageDetail['seo_data']> {
    const res = await fetchWithAuth(`/api/v1/pages/${id}/seo`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load SEO data')
    return data
  }
}

class ApiKeysService {
  async list(siteId?: number | string): Promise<ApiKey[]> {
    const url = siteId ? `/api/v1/api-keys?site_id=${siteId}` : '/api/v1/api-keys'
    const res = await fetchWithAuth(url)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load API keys')
    return Array.isArray(data) ? data : data.results || []
  }

  async create(key: { name: string; site_id: number }): Promise<{ key: ApiKey; full_key: string }> {
    const res = await fetchWithAuth('/api/v1/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(key),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to create API key')
    return data.key ? { key: data.key, full_key: data.key.key } : data
  }

  async revoke(id: number | string): Promise<void> {
    const res = await fetchWithAuth(`/api/v1/api-keys/${id}`, {
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
    const res = await fetchWithAuth('/api/v1/scans')
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load scans')
    return Array.isArray(data) ? data : data.results || []
  }

  async getById(id: number | string): Promise<Scan> {
    const res = await fetchWithAuth(`/api/v1/scans/${id}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load scan')
    return data
  }

  async create(scan: CreateScanInput): Promise<Scan> {
    const res = await fetchWithAuth('/api/v1/scans', {
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

export const sitesService = new SitesService()
export const pagesService = new PagesService()
export const apiKeysService = new ApiKeysService()
export const scansService = new ScansService()
