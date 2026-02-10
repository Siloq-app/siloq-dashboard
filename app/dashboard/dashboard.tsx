'use client';

import { useState } from 'react';
import GovernanceDashboard from '@/components/screens/GovernanceDashboard';
import SiloPlanner from '@/components/screens/SiloPlanner';
import ApprovalQueue from '@/components/screens/ApprovalQueue';
import SitesScreen from '@/components/screens/SitesScreen';
import ContentHub from '@/components/screens/ContentHub';
import Settings from '@/components/screens/Settings';
import GenerateModal from '@/components/modals/GenerateModal';
import ApprovalModal from '@/components/modals/ApprovalModal';
import { useDashboardData } from '@/lib/hooks/use-dashboard-data';
import { TabType, AutomationMode } from './types';
import { cannibalizationIssues, silos, pendingChanges, linkOpportunities } from './data';
import InternalLinks from '@/components/screens/InternalLinks';

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

  const { siteOverview, selectedSite } = useDashboardData();

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
        return (
          <ContentHub onGenerateClick={() => setShowGenerateModal(true)} />
        );
      case 'links':
        return <InternalLinks opportunities={linkOpportunities} />;
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
    </div>
  );
}

export type { TabType, AutomationMode } from './types';
