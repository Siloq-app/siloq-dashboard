'use client';

import { useState } from 'react';
import GovernanceDashboard from '@/components/screens/GovernanceDashboard';
import SiloPlanner from '@/components/screens/SiloPlanner';
import ApprovalQueue from '@/components/screens/ApprovalQueue';
import SitesScreen from '@/components/screens/SitesScreen';
import ContentHub from '@/components/screens/ContentHub';
import Settings from '@/components/screens/Settings';
import PagesScreen from '@/components/screens/PagesScreen';
import GenerateModal from '@/components/modals/GenerateModal';
import ApprovalModal from '@/components/modals/ApprovalModal';
import CannibalizationModal from '@/components/modals/CannibalizationModal';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import { TabType, AutomationMode } from './types';
import InternalLinks from '@/components/screens/InternalLinks';
import SearchConsole from '@/components/screens/SearchConsole';

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

  const {
    siteOverview,
    selectedSite,
    cannibalizationIssues,
    silos,
    pendingChanges,
    linkOpportunities,
    isLoading,
  } = useDashboardContext();

  const healthScore =
    (siteOverview?.health_score ?? selectedSite?.page_count)
      ? Math.round(
          (1 -
            (siteOverview?.total_issues ?? 0) /
              (selectedSite?.page_count || 1)) *
            100
        )
      : 72;
  const totalIssues = siteOverview?.total_issues ?? 0;
  const totalPages = siteOverview?.total_pages ?? selectedSite?.page_count ?? 0;

  const renderScreen = () => {
    // Show loading state
    if (isLoading && !selectedSite) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      );
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
        return <Settings onNavigateToSites={() => onTabChange?.('sites')} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 p-4">
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

      {showCannibalizationModal && (
        <CannibalizationModal
          pageIds={selectedPageIds}
          onClose={() => setShowCannibalizationModal(false)}
        />
      )}
    </div>
  );
}

export type { TabType, AutomationMode } from './types';
