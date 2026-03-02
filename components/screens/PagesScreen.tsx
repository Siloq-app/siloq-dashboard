'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Star,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BarChart3,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Eye,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { fetchWithAuth } from '@/lib/auth';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { NoSiteSelected } from '@/components/ui/no-site-selected';
import { useToast } from '@/components/ui/use-toast';
import {
  analysisService,
  entityProfileService,
  PageAnalysis,
  Recommendation,
} from '@/lib/services/api';
import { FileText } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Page {
  id: number;
  url: string;
  title: string;
  status: 'publish' | 'draft' | 'private' | string;
  published_at: string | null;
  last_synced_at: string | null;
  is_money_page: boolean;
  is_noindex: boolean;
  page_type_classification: string;
  page_type_override: boolean;
  seo_score: number | null;
  issue_count: number;
  gsc_clicks: number;
  gsc_impressions: number;
  gsc_position: number | null;
}

interface PagesScreenProps {
  _onAnalyze?: (pageIds: number[]) => void;
  siteId?: number | string;
  onNavigateToSettings?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHealthDot(analysis: PageAnalysis | undefined): {
  color: string;
  label: string;
  score: number | null;
} {
  if (!analysis || analysis.overall_score === null) {
    return { color: 'bg-slate-300', label: 'Not analyzed', score: null };
  }
  const s = analysis.overall_score;
  if (s >= 80) return { color: 'bg-green-500', label: `${s} — Well optimized`, score: s };
  if (s >= 60) return { color: 'bg-yellow-400', label: `${s} — Needs some work`, score: s };
  return { color: 'bg-red-500', label: `${s} — Needs attention`, score: s };
}

function scoreColor(score: number | null): string {
  if (score === null) return 'bg-slate-200';
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-400';
  return 'bg-red-500';
}

function priorityBadgeClass(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-700 border-blue-200';
  }
}

// Sort pages: red/yellow first (analyzed, score < 80), then unanalyzed by impressions,
// then green by impressions descending.
function sortPages(pages: Page[], analyses: Record<string, PageAnalysis>): Page[] {
  const sorted = [...pages];
  sorted.sort((a, b) => {
    const aA = analyses[a.url];
    const bA = analyses[b.url];
    const aScore = aA?.overall_score ?? null;
    const bScore = bA?.overall_score ?? null;

    const tier = (score: number | null) => {
      if (score === null) return 1; // unanalyzed
      if (score < 60) return 0; // red — highest priority
      if (score < 80) return 0; // yellow — also highest priority
      return 2; // green — last
    };

    const aTier = tier(aScore);
    const bTier = tier(bScore);
    if (aTier !== bTier) return aTier - bTier;

    // Within same tier, sort by impressions descending
    return (b.gsc_impressions || 0) - (a.gsc_impressions || 0);
  });
  return sorted;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface RecommendationItemProps {
  rec: Recommendation;
  selected: boolean;
  onToggle: (id: string) => void;
}

function RecommendationItem({ rec, selected, onToggle }: RecommendationItemProps) {
  const [beforeAfterOpen, setBeforeAfterOpen] = useState(false);

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        selected ? 'border-purple-300 bg-purple-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(rec.id)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded border px-2 py-0.5 text-xs font-semibold uppercase ${priorityBadgeClass(
                rec.priority
              )}`}
            >
              {rec.priority}
            </span>
            {rec.field && <span className="font-mono text-xs text-slate-400">{rec.field}</span>}
          </div>
          <p className="mb-1 text-sm font-medium text-slate-800">{rec.issue}</p>
          <p className="text-sm text-slate-600">{rec.recommendation}</p>

          {(rec.before || rec.after) && (
            <Collapsible open={beforeAfterOpen} onOpenChange={setBeforeAfterOpen}>
              <CollapsibleTrigger asChild>
                <button className="mt-2 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
                  {beforeAfterOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {beforeAfterOpen ? 'Hide' : 'Show'} before / after
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {rec.before && (
                    <div className="rounded border border-red-100 bg-red-50 p-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-600">
                        Before
                      </p>
                      <p className="whitespace-pre-wrap break-all font-mono text-xs text-slate-700">
                        {rec.before}
                      </p>
                    </div>
                  )}
                  {rec.after && (
                    <div className="rounded border border-green-100 bg-green-50 p-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-600">
                        After
                      </p>
                      <p className="whitespace-pre-wrap break-all font-mono text-xs text-slate-700">
                        {rec.after}
                      </p>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}

interface LayerTabContentProps {
  layerKey: 'GEO' | 'SEO' | 'CRO';
  score: number | null;
  recommendations: Recommendation[];
  selectedRecs: Set<string>;
  onToggleRec: (id: string) => void;
}

function LayerTabContent({
  layerKey,
  score,
  recommendations,
  selectedRecs,
  onToggleRec,
}: LayerTabContentProps) {
  const barColor = scoreColor(score);

  return (
    <div className="space-y-4">
      {/* Score bar */}
      <div className="flex items-center gap-3">
        <div className="w-20 shrink-0 text-sm font-medium text-slate-600">{layerKey} Score</div>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
          {score !== null ? (
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
            />
          ) : (
            <div className="h-full rounded-full bg-slate-200" style={{ width: '100%' }} />
          )}
        </div>
        <div className="w-10 shrink-0 text-right text-sm font-bold text-slate-800">
          {score !== null ? score : '—'}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length === 0 ? (
        <div className="py-6 text-center text-sm text-slate-400">
          No {layerKey} recommendations — great work!
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <RecommendationItem
              key={rec.id}
              rec={rec}
              selected={selectedRecs.has(rec.id)}
              onToggle={onToggleRec}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface RecommendationPanelProps {
  analysis: PageAnalysis;
  siteId: number | string;
  page: Page;
  selectedRecs: Set<string>;
  onToggleRec: (id: string) => void;
  onDismiss: () => void;
  onApplySuccess: (analysis: PageAnalysis) => void;
  onManualAction: (page: Page) => void;
  getWordPressEditUrl: (url: string) => string;
}

function RecommendationPanel({
  analysis,
  siteId,
  page,
  selectedRecs,
  onToggleRec,
  onDismiss,
  onApplySuccess,
  onManualAction,
  getWordPressEditUrl,
}: RecommendationPanelProps) {
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyResult, setApplyResult] = useState<{
    verified: string[];
    unverified: string[];
    failed: Array<{ rec_id: string; error: string }>;
  } | null>(null);

  const handleApply = async () => {
    if (selectedRecs.size === 0) return;
    setIsApplying(true);
    try {
      await analysisService.approveRecommendations(siteId, analysis.id, Array.from(selectedRecs));
      const result = await analysisService.applyToWordPress(siteId, analysis.id);
      setApplied(true);
      const verified = (result as any)?.verified || [];
      const unverified = (result as any)?.unverified || [];
      const failed = (result as any)?.failed || [];
      const appliedCount = verified.length + unverified.length;
      const failedCount = failed.length;
      setApplyResult({ verified, unverified, failed });

      if (failedCount === 0) {
        toast({
          title: `✅ ${appliedCount} change${appliedCount !== 1 ? 's' : ''} applied to WordPress`,
        });
      } else if (appliedCount > 0) {
        toast({
          title: `⚠️ ${appliedCount} applied, ${failedCount} needed attention`,
          variant: 'default',
        });
      } else {
        toast({
          title: `❌ Changes could not be applied — check recommendations`,
          variant: 'destructive',
        });
      }
      // Optimistically mark applied
      onApplySuccess({
        ...analysis,
        geo_recommendations: analysis.geo_recommendations.map((r) =>
          selectedRecs.has(r.id) ? { ...r, status: 'applied' as const } : r
        ),
        seo_recommendations: analysis.seo_recommendations.map((r) =>
          selectedRecs.has(r.id) ? { ...r, status: 'applied' as const } : r
        ),
        cro_recommendations: analysis.cro_recommendations.map((r) =>
          selectedRecs.has(r.id) ? { ...r, status: 'applied' as const } : r
        ),
      });
    } catch (e: unknown) {
      toast({
        title: 'Failed to apply changes',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const allRecs = [
    ...analysis.geo_recommendations,
    ...analysis.seo_recommendations,
    ...analysis.cro_recommendations,
  ];

  return (
    <div className="space-y-4 rounded-b-lg border-t border-slate-200 bg-slate-50 p-4">
      <Tabs defaultValue="GEO">
        <TabsList className="mb-4">
          <TabsTrigger value="GEO">GEO</TabsTrigger>
          <TabsTrigger value="SEO">SEO</TabsTrigger>
          <TabsTrigger value="CRO">CRO</TabsTrigger>
        </TabsList>

        <TabsContent value="GEO">
          <LayerTabContent
            layerKey="GEO"
            score={analysis.geo_score}
            recommendations={analysis.geo_recommendations}
            selectedRecs={selectedRecs}
            onToggleRec={onToggleRec}
          />
        </TabsContent>
        <TabsContent value="SEO">
          <LayerTabContent
            layerKey="SEO"
            score={analysis.seo_score}
            recommendations={analysis.seo_recommendations}
            selectedRecs={selectedRecs}
            onToggleRec={onToggleRec}
          />
        </TabsContent>
        <TabsContent value="CRO">
          <LayerTabContent
            layerKey="CRO"
            score={analysis.cro_score}
            recommendations={analysis.cro_recommendations}
            selectedRecs={selectedRecs}
            onToggleRec={onToggleRec}
          />
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
        <div className="flex items-center gap-3">
          {applied ? (
            <div className="flex flex-col gap-1">
              {(() => {
                const appliedCount =
                  (applyResult?.verified?.length ?? 0) + (applyResult?.unverified?.length ?? 0);
                const failedCount = applyResult?.failed?.length ?? 0;
                const manualCount =
                  applyResult?.failed?.filter((f) => f.error === 'requires_manual_action').length ??
                  0;
                const trueFailCount = failedCount - manualCount;
                return (
                  <>
                    {appliedCount > 0 && (
                      <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                        <Check size={16} />
                        {appliedCount} change{appliedCount !== 1 ? 's' : ''} applied to WordPress
                        {applyResult?.unverified?.length ? (
                          <span className="text-xs font-normal text-yellow-600">
                            (⏳ pending verification)
                          </span>
                        ) : null}
                      </div>
                    )}
                    {manualCount > 0 && (
                      <div className="text-xs font-medium text-amber-600">
                        ⚠️ {manualCount} recommendation{manualCount !== 1 ? 's' : ''} require manual action — 
                        <button
                          onClick={() => onManualAction(page)}
                          className="ml-1 underline hover:text-amber-700"
                        >
                          view details
                        </button>
                        {' '}or{' '}
                        <a
                          href={getWordPressEditUrl(page.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 underline hover:text-amber-700 flex items-center gap-1 inline-flex"
                        >
                          edit in WordPress
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                    {trueFailCount > 0 &&
                      (() => {
                        const trueFailures =
                          applyResult?.failed?.filter(
                            (f) => f.error !== 'requires_manual_action'
                          ) ?? [];
                        const firstError = trueFailures[0]?.error ?? '';
                        const friendlyError =
                          firstError.includes('schema') || firstError.includes('No schema')
                            ? 'schema not generated — re-run Analyze first'
                            : firstError.includes('404') || firstError.includes('not found')
                              ? 'page not found in WordPress — try re-syncing'
                              : firstError.includes('401') || firstError.includes('403')
                                ? 'plugin auth failed — check API key'
                                : 'check plugin connection';
                        return (
                          <div className="text-xs font-medium text-red-600">
                            ❌ {trueFailCount} failed — {friendlyError}
                          </div>
                        );
                      })()}
                    {appliedCount === 0 && failedCount > 0 && manualCount === failedCount && (
                      <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                        ⚠️ These recommendations require manual action in WordPress
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <Button
              onClick={handleApply}
              disabled={selectedRecs.size === 0 || isApplying}
              className="bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              size="sm"
            >
              {isApplying ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Applying…
                </>
              ) : (
                <>
                  <Sparkles size={14} className="mr-2" />
                  Apply Selected to WordPress
                  {selectedRecs.size > 0 && (
                    <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white">
                      {selectedRecs.size}
                    </span>
                  )}
                </>
              )}
            </Button>
          )}
          {!applied && (
            <span className="text-xs text-slate-400">
              {selectedRecs.size === 0
                ? 'Select recommendations to enable'
                : `${selectedRecs.size} of ${allRecs.length} selected`}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          <X size={14} className="mr-1" />
          Dismiss
        </Button>
      </div>

      {/* Status now shown inline in the actions bar above */}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PagesScreen({
  _onAnalyze,
  siteId,
  onNavigateToSettings,
}: PagesScreenProps) {
  const { toast } = useToast();
  const [showProfileWarning, setShowProfileWarning] = useState(false);

  // Pages data
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moneyPageFilter, setMoneyPageFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isToggling, setIsToggling] = useState<number | null>(null);

  // Analysis state
  const [analyzingPages, setAnalyzingPages] = useState<Set<string>>(new Set());
  const [pageAnalyses, setPageAnalyses] = useState<Record<string, PageAnalysis>>({});
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<string>>(new Set());
  
  // Manual action modal state
  const [showManualActionModal, setShowManualActionModal] = useState(false);
  const [currentPageForManualAction, setCurrentPageForManualAction] = useState<Page | null>(null);

  const itemsPerPage = 20;
  const loadedAnalysesRef = useRef(false);

  // ── Utility Functions ────────────────────────────────────────────────────────────
  
  // Generate WordPress edit URL from page URL
  const getWordPressEditUrl = (pageUrl: string): string => {
    try {
      const url = new URL(pageUrl);
      // Extract path and convert to WordPress admin URL format
      const path = url.pathname.replace(/\/$/, ''); // Remove trailing slash
      // For WordPress, the edit URL typically follows this pattern:
      // https://domain.com/wp-admin/post.php?post=123&action=edit
      // Since we don't have the post ID, we'll search for the page in WordPress admin
      return `${url.origin}/wp-admin/edit.php?s=${encodeURIComponent(path)}&post_type=page`;
    } catch {
      // Fallback: search the page URL in WordPress admin
      return `${pageUrl.split('/')[0]}//${pageUrl.split('/')[2]}/wp-admin/edit.php?s=${encodeURIComponent(pageUrl)}&post_type=page`;
    }
  };

  // Handle manual action recommendations
  const handleManualAction = (page: Page) => {
    setCurrentPageForManualAction(page);
    setShowManualActionModal(true);
  };

  // Copy HTML to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: '✅ Copied to clipboard',
        description: 'HTML code copied successfully',
      });
    } catch {
      toast({
        title: '❌ Failed to copy',
        description: 'Please copy manually',
        variant: 'destructive',
      });
    }
  };

  // ── Load pages ──
  const loadPages = useCallback(
    async (signal?: AbortSignal) => {
      // Never fetch without a valid siteId — would return all user pages mixed together
      if (!siteId) {
        setPages([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        const url = `/api/v1/pages/?site_id=${siteId}`;
        const res = await fetchWithAuth(url, signal ? { signal } : undefined);
        if (signal?.aborted) return;
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load pages');

        const results: Page[] = Array.isArray(data) ? data : data.results || [];
        setPages(results);
        setTotalPages(Math.ceil(results.length / itemsPerPage) || 1);
      } catch (e: unknown) {
        if (signal?.aborted) return; // Ignore cancellations from site switching
        // Handle AbortError specifically
        if (e instanceof Error && e.name === 'AbortError') {
          console.log('Pages load was aborted');
          return;
        }
        setError(e instanceof Error ? e.message : 'Failed to load pages');
        setPages([]);
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [siteId]
  );

  // ── Reset stale state immediately when site changes ──
  useEffect(() => {
    setPages([]);
    setCurrentPage(1);
    setError('');
  }, [siteId]);

  useEffect(() => {
    const controller = new AbortController();
    loadPages(controller.signal);
    // Cancel in-flight request if siteId changes before response arrives
    return () => controller.abort();
  }, [loadPages]);

  // ── Load existing analyses on mount (once pages are loaded) ──
  useEffect(() => {
    if (!siteId || pages.length === 0 || loadedAnalysesRef.current) return;
    loadedAnalysesRef.current = true;

    const loadAnalyses = async () => {
      const results: Record<string, PageAnalysis> = {};
      // Load in parallel, but limit concurrency to avoid flooding
      const chunks: Page[][] = [];
      for (let i = 0; i < pages.length; i += 5) {
        chunks.push(pages.slice(i, i + 5));
      }
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (page) => {
            try {
              const analysis = await analysisService.getPageAnalysis(siteId, page.url);
              if (analysis) results[page.url] = analysis;
            } catch {
              // Silently ignore — page simply has no analysis yet
            }
          })
        );
      }
      if (Object.keys(results).length > 0) {
        setPageAnalyses((prev) => ({ ...prev, ...results }));
      }
    };

    loadAnalyses();
  }, [siteId, pages]);

  // ── Analyze a single page ──
  const handleAnalyzePage = async (page: Page) => {
    if (!siteId || analyzingPages.has(page.url)) return;

    // Check business profile completeness — show non-blocking warning if empty
    entityProfileService
      .get(siteId)
      .then((profile) => {
        if (!profile?.business_name) setShowProfileWarning(true);
      })
      .catch(() => {});

    setAnalyzingPages((prev) => new Set(prev).add(page.url));
    setExpandedAnalysis(null);
    setSelectedRecommendations(new Set());

    try {
      const analysis = await analysisService.analyzePageContent(siteId, page.url);
      setPageAnalyses((prev) => ({ ...prev, [page.url]: analysis }));
      setExpandedAnalysis(page.url);
    } catch (e: unknown) {
      toast({
        title: 'Analysis failed',
        description: e instanceof Error ? e.message : 'Could not analyze page',
        variant: 'destructive',
      });
    } finally {
      setAnalyzingPages((prev) => {
        const next = new Set(prev);
        next.delete(page.url);
        return next;
      });
    }
  };

  const handleToggleRec = (id: string) => {
    setSelectedRecommendations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDismissPanel = () => {
    setExpandedAnalysis(null);
    setSelectedRecommendations(new Set());
  };

  const handleApplySuccess = (pageUrl: string, updated: PageAnalysis) => {
    setPageAnalyses((prev) => ({ ...prev, [pageUrl]: updated }));
    setSelectedRecommendations(new Set());
  };

  // ── Toggle money page ──
  const toggleMoneyPage = async (pageId: number) => {
    setIsToggling(pageId);
    try {
      const res = await fetchWithAuth(`/api/v1/pages/${pageId}/toggle_money_page/`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`Failed to toggle money page status (${res.status})`);
      const data = await res.json();
      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, is_money_page: data.is_money_page } : p))
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to toggle');
    } finally {
      setIsToggling(null);
    }
  };

  // ── Filter ──
  const filteredPages = pages.filter((page) => {
    const matchesSearch =
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    const matchesMoneyPage =
      moneyPageFilter === 'all'
        ? true
        : moneyPageFilter === 'money'
          ? page.is_money_page
          : !page.is_money_page;
    return matchesSearch && matchesStatus && matchesMoneyPage;
  });

  // Sort: red/yellow first, then unanalyzed, then green — all by impressions desc
  const sortedPages = sortPages(filteredPages, pageAnalyses);

  // Paginate
  const paginatedPages = sortedPages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const moneyPageCount = pages.filter((p) => p.is_money_page).length;
  const analyzedCount = Object.keys(pageAnalyses).length;

  // ── Guards ──
  if (!siteId) {
    return (
      <NoSiteSelected message="Select a site from the sidebar to view and manage its pages." />
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading pages…" />;
  }

  if (error && pages.length === 0) {
    return <ErrorState message={error} onRetry={loadPages} />;
  }

  if (pages.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-7 w-7" />}
        title="No pages synced yet"
        description="Install the Siloq WordPress plugin and sync your pages to get started with content governance."
        actionLabel="Refresh"
        onAction={loadPages}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pages</h1>
          <p className="text-sm text-slate-500">
            Analyze content health and apply Three-Layer optimizations to your WordPress pages
          </p>
        </div>
        <Button onClick={() => loadPages()} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Business Profile Warning */}
      {showProfileWarning && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <span className="text-base">⚠️</span>
          <span className="flex-1">
            <strong>Business Profile incomplete</strong> — schema generation accuracy is reduced.{' '}
            <button
              className="font-medium underline hover:text-yellow-900"
              onClick={() => onNavigateToSettings?.()}
            >
              Set it up in 2 min →
            </button>
          </span>
          <button
            className="text-yellow-500 transition-colors hover:text-yellow-700"
            onClick={() => setShowProfileWarning(false)}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Pages</p>
                <p className="text-3xl font-bold text-slate-900">{pages.length}</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2">
                <BarChart3 size={20} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Money Pages</p>
                <p className="text-3xl font-bold text-slate-900">{moneyPageCount}</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-2">
                <Star size={20} className="text-amber-600" fill="currentColor" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Analyzed</p>
                <p className="text-3xl font-bold text-slate-900">{analyzedCount}</p>
              </div>
              <div className="rounded-lg bg-purple-100 p-2">
                <Sparkles size={20} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Search pages…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="publish">Published</option>
                <option value="draft">Draft</option>
                <option value="private">Private</option>
              </select>
              <select
                value={moneyPageFilter}
                onChange={(e) => setMoneyPageFilter(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Pages</option>
                <option value="money">Money Pages Only</option>
                <option value="regular">Regular Pages Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Pages List */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">All Pages</CardTitle>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" /> Needs
                attention
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" /> Needs work
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" /> Optimized
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300" /> Not analyzed
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedPages.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No pages match your current filters.
            </div>
          ) : (
            <div className="divide-y">
              {paginatedPages.map((page) => {
                const analysis = pageAnalyses[page.url];
                const dot = getHealthDot(analysis);
                const isAnalyzing = analyzingPages.has(page.url);
                const isExpanded = expandedAnalysis === page.url;

                return (
                  <div key={page.id} className="transition-colors">
                    {/* Page row */}
                    <div className="p-4 transition-colors hover:bg-slate-50">
                      <div className="flex items-start gap-4">
                        {/* Health dot */}
                        <div className="mt-1.5 flex shrink-0 items-center justify-center">
                          <div
                            className={`h-3 w-3 rounded-full ${dot.color} shrink-0`}
                            title={dot.label}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            {/* Title + URL */}
                            <div>
                              <h3 className="text-base font-semibold text-slate-900">
                                {page.title || 'Untitled'}
                              </h3>
                              <a
                                href={page.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-0.5 flex items-center gap-1 text-sm font-normal text-slate-500 hover:text-indigo-600"
                              >
                                <span className="max-w-xs truncate">{page.url}</span>
                                <ExternalLink size={11} className="shrink-0" />
                              </a>
                            </div>

                            {/* Actions */}
                            <div className="flex shrink-0 items-center gap-2">
                              <Badge variant={page.status === 'publish' ? 'default' : 'secondary'}>
                                {page.status}
                              </Badge>

                              {/* Money page star */}
                              <button
                                onClick={() => toggleMoneyPage(page.id)}
                                disabled={isToggling === page.id}
                                className={`rounded-md p-1.5 transition-colors ${
                                  page.is_money_page
                                    ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title={
                                  page.is_money_page
                                    ? 'Remove money page status'
                                    : 'Mark as money page'
                                }
                              >
                                <Star
                                  size={16}
                                  fill={page.is_money_page ? 'currentColor' : 'none'}
                                  className={isToggling === page.id ? 'animate-pulse' : ''}
                                />
                              </button>

                              {/* Analyze button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAnalyzePage(page)}
                                disabled={isAnalyzing}
                                className="border-purple-200 text-purple-700 hover:border-purple-300 hover:bg-purple-50 disabled:opacity-70"
                              >
                                {isAnalyzing ? (
                                  <>
                                    <Loader2 size={13} className="mr-1.5 animate-spin" />
                                    Analyzing…
                                  </>
                                ) : analysis ? (
                                  <>
                                    <RefreshCw size={13} className="mr-1.5" />
                                    Re-analyze
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={13} className="mr-1.5" />
                                    Analyze
                                  </>
                                )}
                              </Button>

                              {/* Expand/collapse toggle (only when analysis exists) */}
                              {analysis && (
                                <button
                                  onClick={() => setExpandedAnalysis(isExpanded ? null : page.url)}
                                  className="rounded-md bg-slate-100 p-1.5 text-slate-500 transition-colors hover:bg-slate-200"
                                  title={isExpanded ? 'Collapse' : 'View recommendations'}
                                >
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* GSC metrics row */}
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
                            {page.gsc_impressions > 0 && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <BarChart3 size={13} />
                                {page.gsc_impressions.toLocaleString()} impressions
                              </span>
                            )}
                            {page.gsc_clicks > 0 && (
                              <span className="text-green-600">
                                {page.gsc_clicks.toLocaleString()} clicks
                              </span>
                            )}
                            {page.gsc_position !== null && page.gsc_position > 0 && (
                              <span className="text-purple-600">Avg pos: {page.gsc_position}</span>
                            )}
                            {dot.score !== null && (
                              <span className="text-slate-500">
                                Content score:{' '}
                                <span
                                  className={
                                    dot.score >= 80
                                      ? 'text-green-600'
                                      : dot.score >= 60
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                  }
                                >
                                  {dot.score}
                                </span>
                              </span>
                            )}
                            {page.issue_count > 0 && (
                              <span className="flex items-center gap-1 text-red-600">
                                <AlertCircle size={13} />
                                {page.issue_count} issues
                              </span>
                            )}
                            <span className="text-xs text-slate-400">
                              Synced:{' '}
                              {page.last_synced_at
                                ? new Date(page.last_synced_at).toLocaleDateString()
                                : 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Panel (inline, expands below row) */}
                    {isExpanded && analysis && (
                      <RecommendationPanel
                        analysis={analysis}
                        siteId={siteId}
                        page={page}
                        selectedRecs={selectedRecommendations}
                        onToggleRec={handleToggleRec}
                        onDismiss={handleDismissPanel}
                        onApplySuccess={(updated) => handleApplySuccess(page.url, updated)}
                        onManualAction={handleManualAction}
                        getWordPressEditUrl={getWordPressEditUrl}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Manual Action Modal */}
      <Sheet open={showManualActionModal} onOpenChange={setShowManualActionModal}>
        <SheetContent className="w-full max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-600" />
              Manual Action Required
            </SheetTitle>
          </SheetHeader>
          
          {currentPageForManualAction && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Page Information</h3>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="font-medium">{currentPageForManualAction.title || 'Untitled'}</p>
                  <a
                    href={currentPageForManualAction.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    {currentPageForManualAction.url}
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Recommended Actions</h3>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <p className="text-sm text-amber-800 mb-4">
                    The following recommendations require manual implementation in WordPress:
                  </p>
                  
                  {/* Get manual action recommendations */}
                  {(() => {
                    const analysis = pageAnalyses[currentPageForManualAction.url];
                    if (!analysis) return <p>No analysis data available</p>;
                    
                    const allRecs = [
                      ...analysis.geo_recommendations,
                      ...analysis.seo_recommendations,
                      ...analysis.cro_recommendations
                    ];
                    
                    const manualRecs = allRecs.filter(rec => 
                      selectedRecommendations.has(rec.id)
                    );
                    
                    return manualRecs.length > 0 ? (
                      <div className="space-y-3">
                        {manualRecs.map((rec) => (
                          <div key={rec.id} className="bg-white p-3 rounded border border-amber-200">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">{rec.recommendation}</p>
                                <p className="text-xs text-slate-600 mt-1">{rec.issue}</p>
                                {rec.after && (
                                  <div className="mt-2">
                                    <div className="bg-slate-100 p-2 rounded text-xs font-mono text-slate-700 mb-2">
                                      {rec.after.length > 200 
                                        ? rec.after.substring(0, 200) + '...'
                                        : rec.after
                                      }
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(rec.after)}
                                      className="text-xs"
                                    >
                                      <Copy size={12} className="mr-1" />
                                      Copy HTML
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No manual action recommendations found</p>
                    );
                  })()}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowManualActionModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    window.open(getWordPressEditUrl(currentPageForManualAction.url), '_blank');
                  }}
                  className="flex-1"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Open WordPress Editor
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
