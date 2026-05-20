'use client';

import React, { useState, Suspense, useEffect, lazy, useRef } from 'react';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import { checkBackendHealth } from '@/lib/backend';
import { fetchWithAuth } from '@/lib/auth';
import { TabType, AutomationMode } from './types';
import { ScreenSkeleton, DashboardSkeleton } from '@/components/ui/dashboard-skeleton';

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
const GettingStartedCard = lazy(() => import('@/components/onboarding/GettingStartedCard'));
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
  const [backendHealth, setBackendHealth] = useState<
    'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  >('unknown');
  const backendHealthRef = useRef(backendHealth);

  // Check backend health periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await checkBackendHealth();
        const newHealth = health.isHealthy
          ? health.latency && health.latency > 2000
            ? 'degraded'
            : 'healthy'
          : 'unhealthy';
        setBackendHealth(newHealth);
        backendHealthRef.current = newHealth;
      } catch {
        setBackendHealth('unhealthy');
        backendHealthRef.current = 'unhealthy';
      }
    };

    // Initial check
    checkHealth();

    // Check every 2 minutes
    const interval = setInterval(checkHealth, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user tier from /auth/me/
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      console.log('[Dashboard] No token found, using default tier');
      return;
    }

    const fetchUserTier = async (retryCount = 0) => {
      try {
        console.log(`[Dashboard] Fetching user tier (attempt ${retryCount + 1})`);

        // Skip fetch if backend is known to be unhealthy and we have cached data
        if (backendHealthRef.current === 'unhealthy' && retryCount === 0) {
          const cachedData = localStorage.getItem('cached_user_data');
          const timestamp = localStorage.getItem('user_data_timestamp');

          if (cachedData && timestamp) {
            const cacheAge = Date.now() - parseInt(timestamp);
            const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

            if (cacheAge < CACHE_DURATION) {
              console.log('[Dashboard] Backend unhealthy, using cached user data');
              try {
                const userData = JSON.parse(cachedData);

                if (userData.subscription_tier) {
                  setUserTier(userData.subscription_tier);
                }
                if (userData.is_superuser || userData.is_staff) {
                  setUserTier('empire');
                }
                return; // Don't retry if backend is unhealthy and we have valid cache
              } catch (parseErr) {
                console.error('[Dashboard] Failed to parse cached data:', parseErr);
              }
            }
          }
        }

        // Create timeout using AbortController for better browser compatibility
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const res = await fetchWithAuth('/api/auth/me/', {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.status === 401 || res.status === 403) {
          console.log('[Dashboard] Token invalid/expired, clearing and using default tier');
          localStorage.removeItem('token');
          setUserTier('free_trial');
          return;
        }

        if (!res.ok) {
          // Handle specific error responses from our API route gracefully
          if (res.status === 502) {
            console.log('[Dashboard] Backend service unavailable (502) - handling gracefully');
            // Don't throw, just handle gracefully and use fallback
            setUserTier('free_trial'); // Set default tier
            return;
          }
          if (res.status === 503) {
            console.log('[Dashboard] Backend service unavailable (503) - handling gracefully');
            // Don't throw, just handle gracefully and use fallback
            setUserTier('free_trial'); // Set default tier
            return;
          }
          if (res.status === 504) {
            console.log('[Dashboard] Backend timeout (504) - handling gracefully');
            // Don't throw, just handle gracefully and use fallback
            setUserTier('free_trial'); // Set default tier
            return;
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log('[Dashboard] User data retrieved successfully:', data);

        // Update backend health based on successful request
        if (backendHealthRef.current === 'unhealthy' || backendHealthRef.current === 'unknown') {
          setBackendHealth('healthy');
          backendHealthRef.current = 'healthy';
        }

        // Cache the user data for fallback when backend is down
        if (typeof window !== 'undefined' && data?.user) {
          localStorage.setItem('cached_user_data', JSON.stringify(data.user));
          localStorage.setItem('user_data_timestamp', Date.now().toString());
        }

        if (data?.user?.subscription_tier) {
          setUserTier(data.user.subscription_tier);
        }
        // Superusers/staff get empire access regardless
        if (data?.user?.is_superuser || data?.user?.is_staff) {
          setUserTier('empire');
        }
      } catch (err: any) {
        console.error(`[Dashboard] Failed to fetch user tier (attempt ${retryCount + 1}):`, err);

        // Update backend health based on error
        if (backendHealthRef.current === 'healthy' || backendHealthRef.current === 'unknown') {
          setBackendHealth('unhealthy');
          backendHealthRef.current = 'unhealthy';
        }

        // Try to use cached data if backend is down
        if (typeof window !== 'undefined' && retryCount === 0) {
          const cachedData = localStorage.getItem('cached_user_data');
          const timestamp = localStorage.getItem('user_data_timestamp');

          if (cachedData && timestamp) {
            const cacheAge = Date.now() - parseInt(timestamp);
            const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

            if (cacheAge < CACHE_DURATION) {
              console.log('[Dashboard] Using cached user data due to backend failure');
              try {
                const userData = JSON.parse(cachedData);

                if (userData.subscription_tier) {
                  setUserTier(userData.subscription_tier);
                }
                if (userData.is_superuser || userData.is_staff) {
                  setUserTier('empire');
                }
                return; // Don't retry if we have valid cached data
              } catch (parseErr) {
                console.error('[Dashboard] Failed to parse cached data:', parseErr);
                // Continue with retry logic if cache parsing fails
              }
            }
          }
        }

        // Retry on network errors, timeouts, or 502s, but not on auth errors
        if (retryCount < 2) {
          const errorString = err instanceof Error ? err.message : String(err);

          if (
            errorString.includes('AbortError') ||
            errorString.includes('502') ||
            errorString.includes('503') ||
            errorString.includes('504') ||
            errorString.includes('Bad Gateway') ||
            errorString.includes('Service Unavailable') ||
            errorString.includes('Gateway Timeout') ||
            errorString.includes('fetch') ||
            errorString.includes('timeout') ||
            errorString.includes('network') ||
            errorString.includes('ECONNREFUSED') ||
            errorString.includes('ENOTFOUND')
          ) {
            console.log(
              `[Dashboard] Retrying user tier fetch (${retryCount + 1}/3) - Error: ${errorString}`
            );
            setTimeout(() => fetchUserTier(retryCount + 1), 1000 * (retryCount + 1)); // Exponential backoff
            return;
          }
        }

        // Set default tier on final failure
        console.log('[Dashboard] Using default tier after all retries exhausted');
        setUserTier('free_trial');
      }
    };

    fetchUserTier();
  }, []);

  const {
    siteOverview,
    selectedSite,
    cannibalizationIssues,
    silos,
    pendingChanges,
    linkOpportunities,
    loading,
    loadSites,
    loadCannibalization,
    loadSilos,
    loadRecommendations,
    loadLinkOpportunities,
  } = useDashboardContext();

  // Deferred data loading based on active tab
  useEffect(() => {
    const tabsNeedingCannibalization: TabType[] = ['dashboard', 'overview', 'conflicts'];
    const tabsNeedingSilos: TabType[] = ['dashboard', 'overview', 'conflicts', 'silos'];
    const tabsNeedingRecommendations: TabType[] = [
      'dashboard',
      'overview',
      'conflicts',
      'approvals',
    ];
    const tabsNeedingLinks: TabType[] = ['links'];

    if (selectedSite) {
      if (tabsNeedingCannibalization.includes(activeTab)) loadCannibalization();
      if (tabsNeedingSilos.includes(activeTab)) loadSilos();
      if (tabsNeedingRecommendations.includes(activeTab)) loadRecommendations();
      if (tabsNeedingLinks.includes(activeTab)) loadLinkOpportunities();
    }
  }, [
    activeTab,
    selectedSite,
    loadCannibalization,
    loadSilos,
    loadRecommendations,
    loadLinkOpportunities,
  ]);

  const healthScore =
    (siteOverview?.health_score ?? selectedSite?.page_count)
      ? Math.round((1 - (siteOverview?.total_issues ?? 0) / (selectedSite?.page_count || 1)) * 100)
      : 72;

  const renderScreen = () => {
    // Show loading skeleton
    if (loading.main && !selectedSite) {
      return <DashboardSkeleton />;
    }

    // Show empty state if no site selected — except Sites tab where users add their first site
    if (!selectedSite && activeTab !== 'sites') {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="mb-2 text-lg font-medium">No site selected</p>
            <p className="text-sm text-muted-foreground">
              Select a site from the header to view dashboard data, or go to Sites to add one
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
      case 'overview':
      case 'conflicts': {
        if (!selectedSite) return null;
        return (
          <>
            {activeTab === 'dashboard' && selectedSite && (
              <Suspense fallback={null}>
                <GettingStartedCard
                  siteId={selectedSite.id}
                  onNavigate={(tab, subtab) => {
                    if (subtab) sessionStorage.setItem('siloq_settings_subtab', subtab);
                    onTabChange?.(tab as TabType);
                  }}
                />
              </Suspense>
            )}
            <GovernanceDashboard
              healthScore={healthScore}
              cannibalizationIssues={cannibalizationIssues}
              silos={silos}
              pendingChanges={pendingChanges}
              onViewSilo={() => onTabChange?.('silos')}
              onViewApprovals={() => onTabChange?.('approvals')}
              onShowApprovalModal={() => setShowApprovalModal(true)}
            />
          </>
        );
      }
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
        return <ApprovalQueue pendingChanges={pendingChanges} siteId={selectedSite?.id || 0} />;
      case 'sites':
        return (
          <SitesScreen
            onSiteCreated={() => {
              // Stay on Sites after creation — SitesScreen reloads the list and shows success toast.
              // Reload the dashboard context so the new site gets picked up.
              loadSites();
            }}
          />
        );
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
            _onAnalyze={(pageIds) => {
              setSelectedPageIds(pageIds);
              setShowCannibalizationModal(true);
            }}
            onNavigateToSettings={() => {
              sessionStorage.setItem('siloq_settings_subtab', 'business-profile');
              onTabChange?.('settings');
            }}
          />
        );
      case 'search-console':
        return <SearchConsole selectedSite={selectedSite} />;
      case 'settings':
        return (
          <Settings
            onNavigateToSites={() => onTabChange?.('sites')}
            currentTier={userTier as any}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1">
      <Suspense fallback={<ScreenSkeleton />}>{renderScreen()}</Suspense>

      {showGenerateModal && (
        <Suspense fallback={null}>
          <GenerateModal silos={silos} onClose={() => setShowGenerateModal(false)} />
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
