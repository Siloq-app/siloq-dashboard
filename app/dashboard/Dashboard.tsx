'use client'

import { useState, useMemo, useEffect } from 'react'
import GovernanceDashboard from '@/components/screens/GovernanceDashboard'
import SiloPlanner from '@/components/screens/SiloPlanner'
import ApprovalQueue from '@/components/screens/ApprovalQueue'
import SitesScreen from '@/components/screens/SitesScreen'
import ContentHub from '@/components/screens/ContentHub'
import Settings from '@/components/screens/Settings'
import PagesScreen from '@/components/screens/PagesScreen'
import InternalLinksScreen from '@/components/screens/InternalLinksScreen'
import GenerateModal from '@/components/modals/GenerateModal'
import ApprovalModal from '@/components/modals/ApprovalModal'
import OnboardingWizard from '@/components/OnboardingWizard'
import { useDashboardData } from '@/lib/hooks/use-dashboard-data'
import { pagesService, dashboardService, sitesService, gscService, AnalysisResult, SyncTriggerResponse, GSCStatus } from '@/lib/services/api'
import { useSilos } from '@/lib/hooks/use-silos'
import { useCannibalization } from '@/lib/hooks/use-cannibalization'
import { usePendingActions } from '@/lib/hooks/use-pending-actions'
import { useHealthSummary } from '@/lib/hooks/use-health-summary'
import { TabType, AutomationMode, CannibalizationIssue, Silo, PendingChange } from './types'
import { Loader2 } from 'lucide-react'

interface DashboardProps {
  activeTab?: TabType
  onTabChange?: (tab: TabType) => void
  automationMode?: AutomationMode
  onAutomationChange?: (mode: AutomationMode) => void
}

// Type for the modal's expected issue format
interface ModalCannibalizationIssue {
  keyword: string
  severity: 'high' | 'medium' | 'low'
  competingPages: { url: string; title: string }[]
  recommendation?: string
}

export default function Dashboard({ 
  activeTab = 'dashboard',
  onTabChange,
  automationMode = 'manual',
  onAutomationChange
}: DashboardProps) {
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<ModalCannibalizationIssue | null>(null)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [gscStatus, setGscStatus] = useState<GSCStatus | null>(null)

  // Fetch real data from backend (must be before useEffect that uses selectedSite)
  const { sites, selectedSite, siteOverview, pages, isLoading: isLoadingSites } = useDashboardData()

  // Fetch GSC status when site changes
  useEffect(() => {
    if (selectedSite?.id) {
      gscService.getStatus(selectedSite.id)
        .then(setGscStatus)
        .catch(() => setGscStatus({ connected: false, gsc_site_url: null, connected_at: null }))
    }
  }, [selectedSite?.id])
  const { silos: rawSilos, isLoading: isLoadingSilos } = useSilos(selectedSite?.id)
  const { issues: rawIssues, isLoading: isLoadingIssues } = useCannibalization(selectedSite?.id)
  const { pendingActions: rawPendingActions, isLoading: isLoadingActions, approveAction, denyAction } = usePendingActions(selectedSite?.id)
  const { healthSummary, isLoading: isLoadingHealth } = useHealthSummary(selectedSite?.id)

  // Transform API data to match component types
  const cannibalizationIssues: CannibalizationIssue[] = useMemo(() => {
    return rawIssues.map(issue => ({
      id: issue.id,
      keyword: issue.keyword,
      pages: issue.competing_pages.map(p => p.url),
      severity: issue.severity,
      impressions: issue.total_impressions || 0,
      splitClicks: issue.competing_pages
        .map(p => p.impression_share ? `${p.impression_share}%` : '?')
        .join(' / '),
      recommendation: issue.recommendation_type 
        ? `${issue.recommendation_type.charAt(0).toUpperCase()}${issue.recommendation_type.slice(1)} pages`
        : 'Review and decide'
    }))
  }, [rawIssues])

  // Handler to show approval modal with selected issue
  const handleShowApprovalModal = (issueId: number) => {
    const rawIssue = rawIssues.find(i => i.id === issueId)
    if (rawIssue) {
      setSelectedIssue({
        keyword: rawIssue.keyword,
        severity: rawIssue.severity,
        competingPages: rawIssue.competing_pages.map(p => ({
          url: p.url,
          title: p.title
        })),
        recommendation: rawIssue.recommendation_type
          ? `${rawIssue.recommendation_type.charAt(0).toUpperCase()}${rawIssue.recommendation_type.slice(1)} these pages to resolve the cannibalization issue.`
          : undefined
      })
      setShowApprovalModal(true)
    }
  }

  const silos: Silo[] = useMemo(() => {
    return rawSilos.map(silo => ({
      id: silo.id,
      name: silo.name,
      targetPage: {
        title: silo.target_page.title,
        url: silo.target_page.url,
        status: silo.target_page.status === 'publish' ? 'published' : silo.target_page.status,
        entities: silo.topic_cluster ? [silo.topic_cluster.name] : []
      },
      supportingPages: silo.supporting_pages.map(sp => ({
        title: sp.title,
        url: sp.url,
        status: sp.status === 'publish' ? 'published' : sp.status as 'published' | 'draft' | 'suggested',
        linked: true, // Assume linked if in the silo
        entities: []
      }))
    }))
  }, [rawSilos])

  const pendingChanges: PendingChange[] = useMemo(() => {
    return rawPendingActions.map(action => ({
      id: action.id,
      type: action.action_type,
      description: action.description,
      risk: action.risk === 'high' || action.is_destructive ? 'destructive' : 'safe',
      impact: action.impact,
      doctrine: action.doctrine || undefined
    }))
  }, [rawPendingActions])

  // Calculate health score from real data
  const healthScore = healthSummary?.health_score ?? siteOverview?.health_score ?? 0

  const isLoading = isLoadingSites || isLoadingSilos || isLoadingIssues || isLoadingActions || isLoadingHealth

  // Check if site needs onboarding
  const needsOnboarding = selectedSite && 
    (selectedSite.needs_onboarding || selectedSite.onboarding_complete === false) && 
    !onboardingDismissed

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    setOnboardingDismissed(true)
    // Reload to get updated site data
    window.location.reload()
  }

  // Handle onboarding skip
  const handleOnboardingSkip = () => {
    setShowOnboarding(false)
    setOnboardingDismissed(true)
  }

  // Analyze site function
  const handleAnalyzeSite = async (): Promise<AnalysisResult> => {
    if (!selectedSite) {
      throw new Error('No site selected')
    }
    setIsAnalyzing(true)
    try {
      const results = await dashboardService.analyzeSite(selectedSite.id)
      setAnalysisResults(results)
      return results
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Trigger sync function
  const handleTriggerSync = async (): Promise<SyncTriggerResponse> => {
    if (!selectedSite) {
      throw new Error('No site selected')
    }
    return await sitesService.triggerSync(selectedSite.id)
  }

  // Loading component
  const LoadingState = () => (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-slate-400">Loading dashboard data...</p>
      </div>
    </div>
  )

  // Empty state when no site is selected
  const NoSiteSelected = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No Site Selected</h3>
        <p className="text-slate-400 mb-4">Add a site to start analyzing your SEO architecture.</p>
        <button 
          onClick={() => onTabChange?.('sites')}
          className="px-4 py-2 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 transition-colors"
        >
          Go to Sites
        </button>
      </div>
    </div>
  )

  // Empty data state
  const EmptyDataState = ({ title, description }: { title: string; description: string }) => (
    <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-700 rounded-lg">
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold text-slate-300 mb-2">{title}</h3>
        <p className="text-slate-400">{description}</p>
      </div>
    </div>
  )

  const renderScreen = () => {
    // Show loading state while fetching initial data
    if (isLoadingSites && !selectedSite) {
      return <LoadingState />
    }

    // If no site is selected/exists, prompt to add one
    if (!selectedSite && activeTab !== 'sites' && activeTab !== 'settings') {
      return <NoSiteSelected />
    }

    // Show onboarding wizard if site needs setup
    if (showOnboarding && selectedSite) {
      return (
        <div className="py-8">
          <OnboardingWizard
            siteId={selectedSite.id}
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        </div>
      )
    }

    // Show onboarding prompt banner if site needs onboarding
    const OnboardingPrompt = needsOnboarding ? (
      <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-amber-500">Complete Your Business Profile</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tell Siloq about your business to get personalized content recommendations.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOnboardingDismissed(true)}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Later
            </button>
            <button
              onClick={() => setShowOnboarding(true)}
              className="px-4 py-1.5 text-sm bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 transition-colors"
            >
              Set Up Now
            </button>
          </div>
        </div>
      </div>
    ) : null

    switch (activeTab) {
      case 'dashboard':
      case 'overview':
        if (isLoading) return <LoadingState />
        return (
          <>
            {OnboardingPrompt}
            <GovernanceDashboard
              healthScore={healthScore}
              cannibalizationIssues={cannibalizationIssues}
              silos={silos}
              pendingChanges={pendingChanges}
              onViewSilo={() => onTabChange?.('silos')}
              onViewApprovals={() => onTabChange?.('approvals')}
              onShowApprovalModal={handleShowApprovalModal}
              siteId={selectedSite?.id}
              gscConnected={gscStatus?.connected || false}
            />
          </>
        )
      case 'pages':
        return (
          <PagesScreen
            pages={pages.map(p => ({ ...p, is_money_page: p.is_money_page || false }))}
            isLoading={isLoadingSites}
            onMarkMoneyPage={async (pageId, isMoney) => {
              try {
                await pagesService.toggleMoneyPage(pageId, isMoney)
                // Refresh pages after update
                window.location.reload()
              } catch (err) {
                console.error('Failed to update money page:', err)
              }
            }}
            onAnalyze={handleAnalyzeSite}
            analysisResults={analysisResults}
            isAnalyzing={isAnalyzing}
            onTriggerSync={handleTriggerSync}
            lastSyncedAt={selectedSite?.last_synced_at}
            siteName={selectedSite?.name}
          />
        )
      case 'silos':
        if (isLoadingSilos) return <LoadingState />
        if (silos.length === 0) {
          return (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-100">Content Strategy</h2>
              </div>
              <EmptyDataState 
                title="No Content Strategy Yet" 
                description="Mark your money pages first, then Siloq will build a content strategy around them."
              />
            </div>
          )
        }
        return (
          <SiloPlanner
            silos={silos}
            selectedSilo={null}
            onGenerateClick={() => setShowGenerateModal(true)}
          />
        )
      case 'approvals':
        if (isLoadingActions) return <LoadingState />
        if (pendingChanges.length === 0) {
          return (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-100">Approval Queue</h2>
              </div>
              <EmptyDataState 
                title="No Pending Approvals" 
                description="When Siloq detects issues or recommends changes, they'll appear here for your approval."
              />
            </div>
          )
        }
        return (
          <ApprovalQueue
            pendingChanges={pendingChanges}
            onApprove={async (id) => {
              await approveAction(id)
            }}
            onDeny={async (id) => {
              await denyAction(id)
            }}
            onApproveAll={async () => {
              for (const change of pendingChanges) {
                await approveAction(change.id)
              }
            }}
            onApproveAllSafe={async () => {
              for (const change of pendingChanges.filter(c => c.risk === 'safe')) {
                await approveAction(change.id)
              }
            }}
          />
        )
      case 'sites':
        return <SitesScreen />
      case 'content':
        return <ContentHub onGenerateClick={() => setShowGenerateModal(true)} />
      case 'links':
        if (!selectedSite) return <NoSiteSelected />
        return <InternalLinksScreen siteId={selectedSite.id} />
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
        <ApprovalModal 
          issue={selectedIssue || undefined}
          onClose={() => {
            setShowApprovalModal(false)
            setSelectedIssue(null)
          }} 
        />
      )}
    </div>
  )
}

export type { TabType, AutomationMode, CannibalizationIssue, Silo, PendingChange } from './types'
