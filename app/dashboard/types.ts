export type TabType =
  | 'dashboard'
  | 'overview'
  | 'silos'
  | 'approvals'
  | 'content'
  | 'links'
  | 'pages'
  | 'settings'
  | 'sites'
  | 'search-console'
  | 'conflicts'
  | 'keyword-registry'
  | 'silo-health'
  | 'content-upload';
export type AutomationMode = 'manual' | 'semi' | 'full';

export interface ConflictPage {
  url: string;
  title?: string;
  impressions?: number;
  clicks?: number;
  position?: number;
  is_noindex?: boolean;
  has_redirect?: boolean;
  redirect_type?: string;
  redirect_target?: string;
}

export interface CannibalizationIssue {
  id: number;
  keyword: string;
  pages: string[];
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  impressions: number;
  splitClicks: string;
  recommendation: string;
}

export interface Conflict {
  id: number;
  keyword: string;
  conflict_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  pages: ConflictPage[];
  recommendation: string;
  recommendation_reasoning?: string;
  winner_url?: string;
  status: 'active' | 'resolved' | 'dismissed';
  total_impressions: number;
  total_clicks: number;
  created_at: string;
}

export interface KeywordAssignment {
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

export interface SiloHealthData {
  id: number;
  name: string;
  health_score: number;
  conflict_count: number;
  page_count: number;
  keyword_count: number;
}

export interface SupportingPage {
  title: string;
  url: string;
  status: 'published' | 'draft' | 'suggested';
  linked: boolean;
  entities: string[];
}

export type PageClassificationType = 'money' | 'supporting' | 'utility' | 'conversion' | 'archive' | 'product';

export interface Silo {
  id: number;
  name: string;
  targetPage: {
    id?: number;
    title: string;
    url: string;
    status: string;
    entities: string[];
    pageType?: PageClassificationType;
    pageTypeOverride?: boolean;
  };
  supportingPages: SupportingPage[];
}

export interface PendingChange {
  id: number;
  type: string;
  description: string;
  risk: 'safe' | 'destructive';
  impact: string;
  doctrine?: string;
}

export interface LinkOpportunity {
  id: number;
  sourcePage: {
    title: string;
    url: string;
  };
  targetPage: {
    title: string;
    url: string;
  };
  anchorText: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
  siloContext?: string;
}
