'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Dashboard, { TabType, AutomationMode } from './dashboard';
import Header from './header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { DashboardProvider } from '@/lib/hooks/dashboard-context';

// Map removed tabs to their new homes
const TAB_REDIRECTS: Record<string, string> = {
  'overview': 'dashboard',
  'silos': 'dashboard',
  'keyword-registry': 'conflicts',
  'silo-health': 'dashboard',
  'content-hub': 'pages',
  'content-upload': 'pages',
  'content': 'pages',
  'internal-links': 'pages',
  'all-sites': 'sites',
  'performance': 'search-console',
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(
    tabFromUrl || 'dashboard'
  );
  const [automationMode, setAutomationMode] =
    useState<AutomationMode>('manual');
  const router = useRouter();

  useEffect(() => {
    if (!tabFromUrl) {
      router.replace('/dashboard?tab=dashboard');
    } else if (TAB_REDIRECTS[tabFromUrl]) {
      router.replace(`/dashboard?tab=${TAB_REDIRECTS[tabFromUrl]}`);
    } else if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  return (
    <>
      <Header
        automationMode={automationMode}
        onAutomationChange={setAutomationMode}
        activeTab={activeTab}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Dashboard
          activeTab={activeTab}
          onTabChange={(tab: TabType) => { setActiveTab(tab); router.push(`/dashboard?tab=${tab}`); }}
          automationMode={automationMode}
          onAutomationChange={setAutomationMode}
        />
      </div>
    </>
  );
}

function SidebarWithSearch() {
  return <AppSidebar />;
}

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <SidebarProvider>
        <Suspense fallback={null}>
          <SidebarWithSearch />
        </Suspense>
        <SidebarInset>
          <Suspense
            fallback={
              <div className="flex h-16 items-center px-4">Loading...</div>
            }
          >
            <DashboardContent />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </DashboardProvider>
  );
}
