// Core types for Siloq Dashboard

export type SiteStatus = 'connected' | 'disconnected' | 'syncing' | 'error'

export interface Site {
  id: string
  name: string
  url: string
  status: SiteStatus
  lastSyncAt?: string
  syncError?: string
  siloHealthScore: number // 0-100
  activeContentJobs: number
  pageCount: number
  apiKey?: string
}

export type ContentJobStatus = 
  | 'PREFLIGHT_APPROVED'
  | 'PROMPT_LOCKED'
  | 'GENERATING'
  | 'POSTCHECK_PASSED'
  | 'POSTCHECK_FAILED'
  | 'COMPLETE'
  | 'FAILED'

export interface ContentJob {
  id: string
  pageId: string
  pageTitle: string
  siteId: string
  status: ContentJobStatus
  createdAt: string
  updatedAt: string
  costEstimate?: number
  retries: number
  error?: string
  validationResults?: {
    preflight?: any
    postcheck?: any
  }
}

export type PageType = 'Homepage' | 'Target' | 'Supporting' | 'Legacy'

export type ComplianceStatus = 'compliant' | 'warning' | 'violation'

export interface Page {
  id: string
  siteId: string
  title: string
  url: string
  path: string
  pageType: PageType
  siloId?: string
  complianceStatus: ComplianceStatus
  lastModified: string
  entities: string[]
  inboundLinks: number
  outboundLinks: number
  cannibalizationIssues?: CannibalizationIssue[]
}

export interface CannibalizationIssue {
  keyword: string
  conflictingPages: string[]
  suggestedKing: string
}

export interface Entity {
  id: string
  name: string
  type: 'brand' | 'product' | 'service' | 'location'
  pages: string[]
  coverageScore: number
}

export interface ReverseSilo {
  id: string
  siteId: string
  targetPageId: string
  targetPageTitle: string
  primaryKeyword: string
  intent: 'commercial' | 'informational'
  entities: string[]
  supportingPages: SupportingPage[]
  status: 'draft' | 'finalized' | 'published'
  validationStatus: ValidationStatus
  createdAt: string
}

export interface SupportingPage {
  id: string
  title: string
  keyword: string
  pageId?: string // If page already exists
  order: number
}

export interface ValidationStatus {
  isValid: boolean
  rules: ValidationRule[]
  blockReason?: string
}

export interface ValidationRule {
  name: string
  passed: boolean
  message?: string
}

export interface SystemEvent {
  id: string
  timestamp: string
  eventType: string
  actor: string
  resourceType: string
  resourceId: string
  details: Record<string, any>
}

export interface BillingUsage {
  plan: 'Operator' | 'Architect' | 'Empire'
  sitesUsed: number
  sitesLimit: number
  tokensConsumed: number
  contentJobsThisMonth: number
  costBreakdown: {
    bySite: Record<string, number>
    byJobType: Record<string, number>
  }
}

export interface RestorationJob {
  id: string
  siteId: string
  siteName: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  startedAt?: string
  completedAt?: string
  progress: number // 0-100
  pagesToRestore: number
  pagesRestored: number
  error?: string
  estimatedCompletion?: string
}

export interface EntityCoverage {
  entity: Entity
  sites: string[]
  totalPages: number
  coveragePercentage: number
  gaps: string[] // Missing coverage areas
}
