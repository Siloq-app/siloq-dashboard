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
 * Map API recommendations to dashboard pending changes.
 * Filters out non-actionable / informational items so only real
 * proposed changes appear in the Approval Queue.
 */
export function mapRecommendationsToPendingChanges(
  response: RecommendationResponse
): PendingChange[] {
  const NON_ACTIONABLE_PATTERNS = [
    /no action needed/i,
    /no changes? (required|needed|necessary)/i,
    /this is correct/i,
    /correctly configured/i,
    /already optimized/i,
    /no conflict/i,
  ];

  return response.recommendations
    .filter((rec) => {
      // Skip purely informational items
      if (rec.status === 'applied' || rec.status === 'rejected') return false;

      // Check description for non-actionable language
      const text = `${rec.description} ${rec.impact || ''}`;
      if (NON_ACTIONABLE_PATTERNS.some((p) => p.test(text))) return false;

      return true;
    })
    .map((rec) => ({
      id: rec.id,
      type: rec.type,
      description: rec.description,
      risk: mapRiskLevel(rec.type, rec.risk_level),
      impact: rec.impact,
      doctrine: rec.doctrine,
    }));
}

function mapRiskLevel(
  type: string,
  apiRisk: 'safe' | 'destructive'
): PendingChange['risk'] {
  // Derive a more specific risk label from the change type
  switch (type) {
    case 'redirect':
    case 'canonical_fix':
      return 'redirect';
    case 'content_refresh':
    case 'content_rewrite':
      return apiRisk === 'destructive' ? 'destructive' : 'content_change';
    case 'meta_update':
    case 'title_update':
    case 'meta_description':
      return 'meta_update';
    default:
      return apiRisk === 'destructive' ? 'destructive' : 'safe';
  }
}

/**
 * Placeholder for link opportunities - API endpoint not yet available
 * Returns empty array until endpoint is implemented
 */
export function mapLinkOpportunities(): LinkOpportunity[] {
  // TODO: Implement when API endpoint is available
  return [];
}
