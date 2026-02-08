export type TabType = 'dashboard' | 'overview' | 'silos' | 'approvals' | 'content' | 'links' | 'settings' | 'sites'
export type AutomationMode = 'manual' | 'semi' | 'full'

export interface CannibalizationIssue {
  id: number
  keyword: string
  pages: string[]
  severity: 'high' | 'medium' | 'low'
  impressions: number
  splitClicks: string
  recommendation: string
}

export interface SupportingPage {
  title: string
  url: string
  status: 'published' | 'draft' | 'suggested'
  linked: boolean
  entities: string[]
}

export interface Silo {
  id: number
  name: string
  targetPage: {
    title: string
    url: string
    status: string
    entities: string[]
  }
  supportingPages: SupportingPage[]
}

export interface PendingChange {
  id: number
  type: string
  description: string
  risk: 'safe' | 'destructive'
  impact: string
  doctrine?: string
}
