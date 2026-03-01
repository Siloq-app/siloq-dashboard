import { fetchWithAuth } from '@/lib/auth';
import { errorHandler, ApplicationError, ErrorType, ErrorSeverity } from '@/lib/utils/error-handling';

// Base API client with error handling
class BaseApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || this.getBaseUrl();
  }

  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return (
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_API_URL ||
        'http://localhost:8001'
      ).replace(/\/+$/, '');
    }
    return (
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_API_URL ||
      'http://localhost:8001'
    ).replace(/\/+$/, '');
  }

  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      let errorType = ErrorType.UNKNOWN;
      let userMessage = 'An error occurred';

      switch (response.status) {
        case 400:
          errorType = ErrorType.VALIDATION;
          userMessage = 'Invalid request data';
          break;
        case 401:
          errorType = ErrorType.AUTHENTICATION;
          userMessage = 'Please log in to continue';
          break;
        case 403:
          errorType = ErrorType.AUTHORIZATION;
          userMessage = 'You do not have permission to perform this action';
          break;
        case 404:
          errorType = ErrorType.NOT_FOUND;
          userMessage = 'The requested resource was not found';
          break;
        case 429:
          errorType = ErrorType.TIMEOUT;
          userMessage = 'Too many requests. Please try again later';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorType = ErrorType.SERVER_ERROR;
          userMessage = 'Server error. Please try again later';
          break;
      }

      throw new ApplicationError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        errorType,
        errorType === ErrorType.SERVER_ERROR ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
        {
          userMessage,
          context: {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            errorData,
          },
          retryable: [500, 502, 503, 504, 429].includes(response.status),
        }
      );
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        return {} as T;
      }
    }

    return response.text() as unknown as T;
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetchWithAuth(url, requestOptions);
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      // Handle network errors, timeouts, etc.
      throw errorHandler.handle(error, {
        endpoint,
        method: options.method || 'GET',
        url,
      });
    }
  }

  protected async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  protected async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Enhanced sites service
export class SitesService extends BaseApiClient {
  async getSites(): Promise<Site[]> {
    return this.get<Site[]>('/api/v1/sites/');
  }

  async getSite(id: number): Promise<Site> {
    return this.get<Site>(`/api/v1/sites/${id}/`);
  }

  async getOverview(siteId: number): Promise<SiteOverview> {
    return this.get<SiteOverview>(`/api/v1/sites/${siteId}/overview/`);
  }

  async createSite(data: Partial<Site>): Promise<Site> {
    return this.post<Site>('/api/v1/sites/', data);
  }

  async updateSite(id: number, data: Partial<Site>): Promise<Site> {
    return this.put<Site>(`/api/v1/sites/${id}/`, data);
  }

  async deleteSite(id: number): Promise<void> {
    return this.delete<void>(`/api/v1/sites/${id}/`);
  }
}

// Enhanced pages service
export class PagesService extends BaseApiClient {
  async getPages(siteId: number): Promise<Page[]> {
    return this.get<Page[]>(`/api/v1/sites/${siteId}/pages/`);
  }

  async getPage(id: number): Promise<PageDetail> {
    return this.get<PageDetail>(`/api/v1/pages/${id}/`);
  }

  async createPage(siteId: number, data: Partial<Page>): Promise<Page> {
    return this.post<Page>(`/api/v1/sites/${siteId}/pages/`, data);
  }

  async updatePage(id: number, data: Partial<Page>): Promise<Page> {
    return this.put<Page>(`/api/v1/pages/${id}/`, data);
  }

  async deletePage(id: number): Promise<void> {
    return this.delete<void>(`/api/v1/pages/${id}/`);
  }

  async analyzePages(siteId: number, pageIds: number[]): Promise<PageAnalysis[]> {
    return this.post<PageAnalysis[]>(`/api/v1/sites/${siteId}/pages/analyze/`, {
      page_ids: pageIds,
    });
  }

  async getPageAnalysis(siteId: number): Promise<PageAnalysis[]> {
    return this.get<PageAnalysis[]>(`/api/v1/sites/${siteId}/pages/analysis/`);
  }

  async applyAnalysis(siteId: number, analysisId: number): Promise<void> {
    return this.post<void>(
      `/api/v1/sites/${siteId}/pages/analysis/${analysisId}/apply/`
    );
  }

  async updateSEO(id: number, data: SEOData): Promise<Page> {
    return this.patch<Page>(`/api/v1/pages/${id}/seo/`, data);
  }
}

// Enhanced cannibalization service
export class CannibalizationService extends BaseApiClient {
  async getIssues(siteId: number): Promise<CannibalizationIssueRaw[]> {
    return this.get<CannibalizationIssueRaw[]>(`/api/v1/sites/${siteId}/cannibalization/`);
  }

  async resolveIssue(siteId: number, issueId: number): Promise<void> {
    return this.post<void>(`/api/v1/sites/${siteId}/cannibalization/${issueId}/resolve/`);
  }
}

// Enhanced silos service
export class SilosService extends BaseApiClient {
  async getSilos(siteId: number): Promise<SiloRaw[]> {
    return this.get<SiloRaw[]>(`/api/v1/sites/${siteId}/silos/`);
  }

  async createSilo(siteId: number, data: Partial<Silo>): Promise<Silo> {
    return this.post<Silo>(`/api/v1/sites/${siteId}/silos/`, data);
  }

  async updateSilo(siteId: number, siloId: number, data: Partial<Silo>): Promise<Silo> {
    return this.put<Silo>(`/api/v1/sites/${siteId}/silos/${siloId}/`, data);
  }

  async deleteSilo(siteId: number, siloId: number): Promise<void> {
    return this.delete<void>(`/api/v1/sites/${siteId}/silos/${siloId}/`);
  }
}

// Enhanced recommendations service
export class RecommendationsService extends BaseApiClient {
  async getRecommendations(siteId: number): Promise<RecommendationRaw[]> {
    return this.get<RecommendationRaw[]>(`/api/v1/sites/${siteId}/recommendations/`);
  }

  async getLinkOpportunities(siteId: number): Promise<LinkOpportunityRaw[]> {
    return this.get<LinkOpportunityRaw[]>(`/api/v1/sites/${siteId}/link-opportunities/`);
  }

  async acceptRecommendation(siteId: number, recommendationId: number): Promise<void> {
    return this.post<void>(
      `/api/v1/sites/${siteId}/recommendations/${recommendationId}/accept/`
    );
  }

  async rejectRecommendation(siteId: number, recommendationId: number): Promise<void> {
    return this.post<void>(
      `/api/v1/sites/${siteId}/recommendations/${recommendationId}/reject/`
    );
  }
}

// Service instances
export const sitesService = new SitesService();
export const pagesService = new PagesService();
export const cannibalizationService = new CannibalizationService();
export const silosService = new SilosService();
export const recommendationsService = new RecommendationsService();

// Export types (these should be imported from the existing types file)
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
  seo_data: SEOData;
}

export interface SEOData {
  id: number;
  meta_title: string;
  meta_description: string;
  h1_count: number;
  h1_text: string;
  h2_count: number;
  h2_texts: string[];
  word_count: number;
  internal_links: number;
  external_links: number;
  images: number;
  images_without_alt: number;
}

export interface PageAnalysis {
  id: number;
  page_id: number;
  analysis_type: string;
  results: Record<string, unknown>;
  created_at: string;
  applied: boolean;
}

export interface CannibalizationIssueRaw {
  id: number;
  page_id: number;
  conflicting_pages: number[];
  keyword: string;
  severity: string;
  description: string;
  created_at: string;
}

export interface SiloRaw {
  id: number;
  name: string;
  description: string;
  pages: number[];
  pillar_page_id: number | null;
  created_at: string;
}

export interface RecommendationRaw {
  id: number;
  type: string;
  title: string;
  description: string;
  priority: string;
  page_id: number | null;
  data: Record<string, unknown>;
  status: string;
  created_at: string;
}

export interface LinkOpportunityRaw {
  id: number;
  source_page_id: number;
  target_page_id: number;
  anchor_text: string;
  reason: string;
  strength: number;
  created_at: string;
}

export interface Silo {
  id: number;
  name: string;
  description: string;
  pages: number[];
  pillar_page_id: number | null;
  created_at: string;
}
