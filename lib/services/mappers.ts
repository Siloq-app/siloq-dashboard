import type {
  CannibalizationIssueResponse,
  SiloResponse,
  RecommendationResponse,
} from './api';
import type {
  CannibalizationIssue,
  Silo,
  PendingChange,
  LinkOpportunity,
} from '@/app/dashboard/types';

/**
 * Map API cannibalization issues to dashboard format
 */
export function mapCannibalizationIssues(
  response: CannibalizationIssueResponse
): CannibalizationIssue[] {
  return response.issues.map((issue) => {
    // Calculate split clicks from competing pages
    const totalClicks = issue.competing_pages.reduce(
      (sum, page) => sum + (page.clicks || 0),
      0
    );
    const splitClicks =
      totalClicks > 0
        ? issue.competing_pages
            .map((page) => {
              const percentage = ((page.clicks || 0) / totalClicks) * 100;
              return `${Math.round(percentage)}%`;
            })
            .join(' / ')
        : 'N/A';

    return {
      id: issue.id,
      keyword: issue.keyword,
      pages: issue.competing_pages.map((p) => p.url),
      severity: (issue.severity || 'low').toLowerCase() as any,
      impressions: issue.total_impressions,
      splitClicks,
      recommendation: issue.recommendation,
    };
  });
}

/**
 * Map API silos to dashboard format
 */
export function mapSilos(response: SiloResponse[]): Silo[] {
  if (!Array.isArray(response)) return [];
  return response.map((silo) => ({
    id: silo.id || 0,
    name: silo.name || 'Untitled Silo',
    targetPage: {
      id: silo.target_page?.id,
      title: silo.target_page?.title || 'Untitled',
      url: silo.target_page?.url || '',
      status: 'published',
      entities: silo.target_page?.entities || [],
      pageType: (silo.target_page?.page_type_classification || 'money') as import('@/app/dashboard/types').PageClassificationType,
      pageTypeOverride: silo.target_page?.page_type_override || false,
    },
    supportingPages: (silo.supporting_pages || []).map((page) => ({
      title: page.title || '',
      url: page.url || '',
      status: (page.status as 'published' | 'draft' | 'suggested') || 'published',
      linked: page.has_link_to_target ?? false,
      entities: page.entities || [],
    })),
  }));
}

/**
 * Map API recommendations to dashboard pending changes
 */
export function mapRecommendationsToPendingChanges(
  response: RecommendationResponse
): PendingChange[] {
  return response.recommendations.map((rec) => ({
    id: rec.id,
    type: rec.type,
    description: rec.description,
    risk: rec.risk_level,
    impact: rec.impact,
    doctrine: rec.doctrine,
  }));
}

/**
 * Placeholder for link opportunities - API endpoint not yet available
 * Returns empty array until endpoint is implemented
 */
export function mapLinkOpportunities(): LinkOpportunity[] {
  // TODO: Implement when API endpoint is available
  return [];
}
