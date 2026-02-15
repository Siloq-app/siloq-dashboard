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
  | 'search-console';
export type AutomationMode = 'manual' | 'semi' | 'full';

export interface CannibalizationPageDetail {
  url: string;
  pageType?: 'Product' | 'Category' | 'Blog' | 'Service' | string;
  indexStatus?: 'indexed' | 'noindex';
  httpStatus?: number;
  impressions?: number;
  clicks?: number;
}

export interface CannibalizationIssue {
  id: number;
  keyword: string;
  pages: string[];
  competing_pages?: CannibalizationPageDetail[];
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  impressions: number;
  splitClicks: string;
  recommendation: string;
}

export interface SupportingPage {
  title: string;
  url: string;
  status: 'published' | 'draft' | 'suggested';
  linked: boolean;
  entities: string[];
}

export interface Silo {
  id: number;
  name: string;
  targetPage: {
    title: string;
    url: string;
    status: string;
    entities: string[];
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
