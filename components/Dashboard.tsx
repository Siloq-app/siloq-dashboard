'use client'

import { useState } from 'react'
import GovernanceDashboard from './screens/GovernanceDashboard'
import SiloPlanner from './screens/SiloPlanner'
import ApprovalQueue from './screens/ApprovalQueue'
import SitesScreen from './screens/SitesScreen'
import ContentHub from './screens/ContentHub'
import Settings from './screens/Settings'
import GenerateModal from './modals/GenerateModal'
import ApprovalModal from './modals/ApprovalModal'
import { useDashboardData } from '@/lib/hooks/use-dashboard-data'
import { AutomationMode, TabType } from '@/app/dashboard/page'

export { type TabType, type AutomationMode }

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

// Sample data
export const cannibalizationIssues: CannibalizationIssue[] = [
  { 
    id: 1, 
    keyword: 'kitchen remodeling', 
    pages: ['/kitchen-remodel-cost', '/kitchen-renovation-guide', '/remodel-your-kitchen'], 
    severity: 'high', 
    impressions: 12400, 
    splitClicks: '34% / 41% / 25%', 
    recommendation: 'Consolidate into single Target Page' 
  },
  { 
    id: 2, 
    keyword: 'bathroom vanity ideas', 
    pages: ['/bathroom-vanity-styles', '/vanity-buying-guide'], 
    severity: 'medium', 
    impressions: 8200, 
    splitClicks: '52% / 48%', 
    recommendation: 'Differentiate entity targeting' 
  },
  { 
    id: 3, 
    keyword: 'hardwood floor installation', 
    pages: ['/hardwood-installation', '/flooring-installation-cost'], 
    severity: 'low', 
    impressions: 3100, 
    splitClicks: '78% / 22%', 
    recommendation: 'Add internal links to strengthen Target' 
  },
]

export const silos: Silo[] = [
  {
    id: 1,
    name: 'Kitchen Remodeling',
    targetPage: { 
      title: 'Complete Kitchen Remodeling Guide', 
      url: '/kitchen-remodel-guide', 
      status: 'published', 
      entities: ['kitchen remodel', 'renovation cost', 'kitchen design'] 
    },
    supportingPages: [
      { title: 'Kitchen Cabinet Styles 2024', url: '/kitchen-cabinets', status: 'published', linked: true, entities: ['cabinet styles', 'shaker cabinets'] },
      { title: 'Countertop Materials Compared', url: '/countertop-materials', status: 'published', linked: true, entities: ['granite', 'quartz', 'marble'] },
      { title: 'Kitchen Layout Ideas', url: '/kitchen-layouts', status: 'draft', linked: false, entities: ['galley kitchen', 'L-shaped'] },
    ]
  },
  {
    id: 2,
    name: 'Bathroom Renovation',
    targetPage: { 
      title: 'Bathroom Renovation Guide', 
      url: '/bathroom-renovation', 
      status: 'published', 
      entities: ['bathroom remodel', 'renovation cost'] 
    },
    supportingPages: [
      { title: 'Shower Tile Ideas', url: '/shower-tiles', status: 'published', linked: true, entities: ['tile patterns', 'mosaic tiles'] },
      { title: 'Vanity Buying Guide', url: '/vanity-guide', status: 'draft', linked: false, entities: ['vanity styles', 'storage'] },
    ]
  },
]

export const pendingChanges: PendingChange[] = [
  { id: 1, type: '301_redirect', description: 'Redirect /old-kitchen-page to /kitchen-remodel-guide', risk: 'safe', impact: 'Consolidates link equity' },
  { id: 2, type: 'internal_link', description: 'Add links from 3 supporting pages to Target', risk: 'safe', impact: 'Strengthens entity relationships' },
  { id: 3, type: 'content_update', description: 'Update /bathroom-vanity with new 2024 trends', risk: 'safe', impact: 'Refreshes entity coverage' },
  { id: 4, type: 'entity_assign', description: 'Assign entities [pendant lights, task lighting] to /kitchen-lighting', risk: 'safe', impact: 'Improves semantic targeting', doctrine: 'ENTITY_001' },
  { id: 5, type: 'content_merge', description: 'Merge /remodel-your-kitchen into /kitchen-remodel-guide', risk: 'destructive', impact: 'Eliminates cannibalization, consolidates 4,100 impressions', doctrine: 'CANN_RESTORE_002' },
]

interface DashboardProps {
  activeTab?: TabType
  onTabChange?: (tab: TabType) => void
  automationMode?: AutomationMode
  onAutomationChange?: (mode: AutomationMode) => void
}

export default function Dashboard({ 
  activeTab = 'dashboard',
  onTabChange,
  automationMode = 'manual',
  onAutomationChange
}: DashboardProps) {
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  const { sites, selectedSite, siteOverview, pages, isLoading, error, refresh } = useDashboardData()

  const healthScore = siteOverview?.health_score ?? selectedSite?.page_count ? Math.round((1 - (siteOverview?.total_issues ?? 0) / (selectedSite?.page_count || 1)) * 100) : 72
  const totalIssues = siteOverview?.total_issues ?? 0
  const totalPages = siteOverview?.total_pages ?? selectedSite?.page_count ?? 0

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <GovernanceDashboard
            healthScore={healthScore}
            cannibalizationIssues={cannibalizationIssues}
            silos={silos}
            pendingChanges={pendingChanges}
            onViewSilo={() => onTabChange?.('silos')}
            onViewApprovals={() => onTabChange?.('approvals')}
            onShowApprovalModal={() => setShowApprovalModal(true)}
          />
        )
      case 'silos':
        return (
          <SiloPlanner
            silos={silos}
            selectedSilo={null}
            onGenerateClick={() => setShowGenerateModal(true)}
          />
        )
      case 'approvals':
        return (
          <ApprovalQueue
            pendingChanges={pendingChanges}
          />
        )
      case 'sites':
        return <SitesScreen />
      case 'content':
        return <ContentHub onGenerateClick={() => setShowGenerateModal(true)} />
      case 'links':
        return (
          <div className="text-slate-300">
            <h2 className="text-2xl font-bold mb-4">Internal Links</h2>
            <p>Internal linking visualization coming soon...</p>
          </div>
        )
      case 'settings':
        return <Settings onNavigateToSites={() => onTabChange?.('sites')} />
      default:
        return null
    }
  }

  return (
    <div className="flex-1 p-4 lg:p-8">
      {renderScreen()}

      {showGenerateModal && (
        <GenerateModal 
          silos={silos}
          onClose={() => setShowGenerateModal(false)} 
        />
      )}

      {showApprovalModal && (
        <ApprovalModal onClose={() => setShowApprovalModal(false)} />
      )}
    </div>
  )
}
