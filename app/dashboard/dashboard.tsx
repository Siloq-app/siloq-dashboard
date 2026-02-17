'use client';

import React, { useState, Suspense, useEffect, lazy } from 'react';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import { fetchWithAuth } from '@/lib/auth-headers';
import { TabType, AutomationMode } from './types';
import { ScreenSkeleton, DashboardSkeleton, TableSkeleton } from '@/components/ui/dashboard-skeleton';

// Lazy-loaded screen components for code splitting
const GovernanceDashboard = lazy(() => import('@/components/screens/GovernanceDashboard'));
const KeywordRegistry = lazy(() => import('@/components/screens/KeywordRegistry'));
const SiloHealth = lazy(() => import('@/components/screens/SiloHealth'));
const SiloPlanner = lazy(() => import('@/components/screens/SiloPlanner'));
const ApprovalQueue = lazy(() => import('@/components/screens/ApprovalQueue'));
const SitesScreen = lazy(() => import('@/components/screens/SitesScreen'));
const ContentHub = lazy(() => import('@/components/screens/ContentHub'));
const ContentUpload = lazy(() => import('@/components/screens/ContentUpload'));
const Settings = lazy(() => import('@/components/screens/Settings'));
const PagesScreen = lazy(() => import('@/components/screens/PagesScreen'));
const InternalLinks = lazy(() => import('@/components/screens/InternalLinks'));
const SearchConsole = lazy(() => import('@/components/screens/SearchConsole'));
const GenerateModal = lazy(() => import('@/components/modals/GenerateModal'));
const ApprovalModal = lazy(() => import('@/components/modals/ApprovalModal'));
const CannibalizationModal = lazy(() => import('@/components/modals/CannibalizationModal'));

interface DashboardProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  automationMode?: AutomationMode;
  onAutomationChange?: (mode: AutomationMode) => void;
}

export default function Dashboard({
  activeTab = 'dashboard',
  onTabChange,
  automationMode = 'manual',
  onAutomationChange,
}: DashboardProps) {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCannibalizationModal, setShowCannibalizationModal] = useState(false);
  const [selectedPageIds, setSelectedPageIds] = useState<number[]>([]);

  const [userTier, setUserTier] = useState<string>('free_trial');

  // Fetch user tier from /auth/me/
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    fetch('/api/v1/auth/me/', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject(`Auth/me failed: ${res.status}`))
      .then(data => {
        if (data?.user?.subscription_tier) {
          setUserTier(data.user.subscription_tier);
        }
        // Superusers/staff get empire access regardless
        if (data?.user?.is_superuser || data?.user?.is_staff) {
          setUserTier('empire');
        }
      })
      .catch((err) => { console.error('[Dashboard] Failed to fetch user tier:', err); });
  }, []);

  const {
    siteOverview,
    selectedSite,
    cannibalizationIssues,
    silos,
    pendingChanges,
    linkOpportunities,
    isLoading,
    loadCannibalization,
    loadSilos,
    loadRecommendations,
    loadLinkOpportunities,
    cannibalizationLoading,
    silosLoading,
    recommendationsLoading,
    linkOpportunitiesLoading,
  } = useDashboardContext();

  // Deferred data loading based on active tab
  useEffect(() => {
    const tabsNeedingCannibalization: TabType[] = ['dashboard', 'overview', 'conflicts'];
    const tabsNeedingSilos: TabType[] = ['dashboard', 'overview', 'conflicts', 'silos'];
    const tabsNeedingRecommendations: TabType[] = ['dashboard', 'overview', 'conflicts', 'approvals'];
    const tabsNeedingLinks: TabType[] = ['links'];

    if (selectedSite) {
      if (tabsNeedingCannibalization.includes(activeTab)) loadCannibalization();
      if (tabsNeedingSilos.includes(activeTab)) loadSilos();
      if (tabsNeedingRecommendations.includes(activeTab)) loadRecommendations();
      if (tabsNeedingLinks.includes(activeTab)) loadLinkOpportunities();
    }
  }, [activeTab, selectedSite, loadCannibalization, loadSilos, loadRecommendations, loadLinkOpportunities]);

  const healthScore =
    (siteOverview?.health_score ?? selectedSite?.page_count)
      ? Math.round(
          (1 -
            (siteOverview?.total_issues ?? 0) /
              (selectedSite?.page_count || 1)) *
            100
        )
      : 72;

  const renderScreen = () => {
    // Show loading skeleton
    if (isLoading && !selectedSite) {
      return <DashboardSkeleton />;
    }

    // Show empty state if no site selected
    if (!selectedSite) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">No site selected</p>
            <p className="text-sm text-muted-foreground">
              Select a site from the header to view dashboard data
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
      case 'overview':
      case 'conflicts':
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
        );
      case 'keyword-registry':
        return <KeywordRegistry />;
      case 'silo-health':
        return <SiloHealth />;
      case 'silos':
        return (
          <SiloPlanner
            silos={silos}
            selectedSilo={null}
            onGenerateClick={() => setShowGenerateModal(true)}
          />
        );
      case 'approvals':
        return <ApprovalQueue pendingChanges={pendingChanges} />;
      case 'sites':
        return <SitesScreen />;
      case 'content':
        return <ContentHub />;
      case 'content-upload':
        return <ContentUpload />;
      case 'links':
        return <InternalLinks opportunities={linkOpportunities} />;
      case 'pages':
        return (
          <PagesScreen
            siteId={selectedSite?.id}
            onAnalyze={(pageIds) => {
              setSelectedPageIds(pageIds);
              setShowCannibalizationModal(true);
            }}
          />
        );
      case 'search-console':
        return <SearchConsole selectedSite={selectedSite} />;
      case 'settings':
        return <Settings onNavigateToSites={() => onTabChange?.('sites')} currentTier={userTier as any} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 p-4">
      <Suspense fallback={<ScreenSkeleton />}>
        {renderScreen()}
      </Suspense>

      {showGenerateModal && (
        <Suspense fallback={null}>
          <GenerateModal
            silos={silos}
            onClose={() => setShowGenerateModal(false)}
          />
        </Suspense>
      )}

      {showApprovalModal && (
        <Suspense fallback={null}>
          <ApprovalModal onClose={() => setShowApprovalModal(false)} />
        </Suspense>
      )}

      {showCannibalizationModal && (
        <Suspense fallback={null}>
          <CannibalizationModal
            pageIds={selectedPageIds}
            onClose={() => setShowCannibalizationModal(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

export type { TabType, AutomationMode } from './types';
