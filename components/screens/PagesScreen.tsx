'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Filter,
  Star,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { fetchWithAuth } from '@/lib/auth-headers';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { NoSiteSelected } from '@/components/ui/no-site-selected';
import { useToast } from '@/components/ui/use-toast';
import { analysisService, PageAnalysis, Recommendation } from '@/lib/services/api';
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
  onAnalyze?: (pageIds: number[]) => void;
  siteId?: number | string;
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
      if (score < 60) return 0;    // red — highest priority
      if (score < 80) return 0;    // yellow — also highest priority
      return 2;                    // green — last
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
          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-semibold uppercase px-2 py-0.5 rounded border ${priorityBadgeClass(
                rec.priority
              )}`}
            >
              {rec.priority}
            </span>
            {rec.field && (
              <span className="text-xs text-slate-400 font-mono">{rec.field}</span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-800 mb-1">{rec.issue}</p>
          <p className="text-sm text-slate-600">{rec.recommendation}</p>

          {(rec.before || rec.after) && (
            <Collapsible open={beforeAfterOpen} onOpenChange={setBeforeAfterOpen}>
              <CollapsibleTrigger asChild>
                <button className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium">
                  {beforeAfterOpen ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                  {beforeAfterOpen ? 'Hide' : 'Show'} before / after
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {rec.before && (
                    <div className="rounded bg-red-50 border border-red-100 p-3">
                      <p className="text-xs font-semibold text-red-600 mb-1 uppercase tracking-wide">
                        Before
                      </p>
                      <p className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-all">
                        {rec.before}
                      </p>
                    </div>
                  )}
                  {rec.after && (
                    <div className="rounded bg-green-50 border border-green-100 p-3">
                      <p className="text-xs font-semibold text-green-600 mb-1 uppercase tracking-wide">
                        After
                      </p>
                      <p className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-all">
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
        <div className="text-sm font-medium text-slate-600 w-20 shrink-0">
          {layerKey} Score
        </div>
        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
          {score !== null ? (
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
            />
          ) : (
            <div className="h-full bg-slate-200 rounded-full" style={{ width: '100%' }} />
          )}
        </div>
        <div className="text-sm font-bold text-slate-800 w-10 text-right shrink-0">
          {score !== null ? score : '—'}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-sm">
          No {layerKey} recommendations — great work!
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map(rec => (
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
  selectedRecs: Set<string>;
  onToggleRec: (id: string) => void;
  onDismiss: () => void;
  onApplySuccess: (analysis: PageAnalysis) => void;
}

function RecommendationPanel({
  analysis,
  siteId,
  selectedRecs,
  onToggleRec,
  onDismiss,
  onApplySuccess,
}: RecommendationPanelProps) {
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyResult, setApplyResult] = useState<{verified: string[], unverified: string[], failed: Array<{rec_id: string, error: string}>} | null>(null);

  const handleApply = async () => {
    if (selectedRecs.size === 0) return;
    setIsApplying(true);
    try {
      await analysisService.approveRecommendations(
        siteId,
        analysis.id,
        Array.from(selectedRecs)
      );
      const result = await analysisService.applyToWordPress(siteId, analysis.id);
      setApplied(true);
      setApplyResult({ verified: (result as any)?.verified || [], unverified: (result as any)?.unverified || [], failed: (result as any)?.failed || [] });
      toast({ title: 'Changes applied to WordPress!' });
      // Optimistically mark applied
      onApplySuccess({
        ...analysis,
        geo_recommendations: analysis.geo_recommendations.map(r =>
          selectedRecs.has(r.id) ? { ...r, status: 'applied' as const } : r
        ),
        seo_recommendations: analysis.seo_recommendations.map(r =>
          selectedRecs.has(r.id) ? { ...r, status: 'applied' as const } : r
        ),
        cro_recommendations: analysis.cro_recommendations.map(r =>
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
    <div className="border-t border-slate-200 bg-slate-50 rounded-b-lg p-4 space-y-4">
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
      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <div className="flex items-center gap-3">
          {applied ? (
            <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
              <Check size={16} />
              Changes applied to WordPress
            </div>
          ) : (
            <Button
              onClick={handleApply}
              disabled={selectedRecs.size === 0 || isApplying}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
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
                    <span className="ml-1.5 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
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

      {applyResult && (
        <div className="mt-3 space-y-1 text-sm">
          {applyResult.verified.length > 0 && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded px-3 py-2">
              ✅ {applyResult.verified.length} change{applyResult.verified.length !== 1 ? 's' : ''} verified live on WordPress
            </div>
          )}
          {applyResult.unverified.length > 0 && (
            <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 rounded px-3 py-2">
              ⏳ {applyResult.unverified.length} applied — not yet confirmed on live page
            </div>
          )}
          {applyResult.failed.length > 0 && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded px-3 py-2">
              ❌ {applyResult.failed.length} failed — check recommendations panel
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PagesScreen({ onAnalyze, siteId }: PagesScreenProps) {
  const { toast } = useToast();

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

  const itemsPerPage = 20;
  const loadedAnalysesRef = useRef(false);

  // ── Load pages ──
  const loadPages = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const url = siteId ? `/api/v1/pages/?site_id=${siteId}` : '/api/v1/pages/';
      const res = await fetchWithAuth(url);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.detail || 'Failed to load pages');

      const results: Page[] = Array.isArray(data) ? data : data.results || [];
      setPages(results);
      setTotalPages(Math.ceil(results.length / itemsPerPage) || 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load pages');
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadPages();
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
        setPageAnalyses(prev => ({ ...prev, ...results }));
      }
    };

    loadAnalyses();
  }, [siteId, pages]);

  // ── Analyze a single page ──
  const handleAnalyzePage = async (page: Page) => {
    if (!siteId || analyzingPages.has(page.url)) return;

    setAnalyzingPages(prev => new Set(prev).add(page.url));
    setExpandedAnalysis(null);
    setSelectedRecommendations(new Set());

    try {
      const analysis = await analysisService.analyzePageContent(siteId, page.url);
      setPageAnalyses(prev => ({ ...prev, [page.url]: analysis }));
      setExpandedAnalysis(page.url);
    } catch (e: unknown) {
      toast({
        title: 'Analysis failed',
        description: e instanceof Error ? e.message : 'Could not analyze page',
        variant: 'destructive',
      });
    } finally {
      setAnalyzingPages(prev => {
        const next = new Set(prev);
        next.delete(page.url);
        return next;
      });
    }
  };

  const handleToggleRec = (id: string) => {
    setSelectedRecommendations(prev => {
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
    setPageAnalyses(prev => ({ ...prev, [pageUrl]: updated }));
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
      setPages(prev =>
        prev.map(p => (p.id === pageId ? { ...p, is_money_page: data.is_money_page } : p))
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to toggle');
    } finally {
      setIsToggling(null);
    }
  };

  // ── Filter ──
  const filteredPages = pages.filter(page => {
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

  const moneyPageCount = pages.filter(p => p.is_money_page).length;
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
        <Button onClick={loadPages} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Pages</p>
                <p className="text-3xl font-bold text-slate-900">{pages.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
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
              <div className="p-2 bg-amber-100 rounded-lg">
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
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles size={20} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Search pages…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="publish">Published</option>
                <option value="draft">Draft</option>
                <option value="private">Private</option>
              </select>
              <select
                value={moneyPageFilter}
                onChange={e => setMoneyPageFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
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
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Needs attention
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> Needs work
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Optimized
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Not analyzed
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
              {paginatedPages.map(page => {
                const analysis = pageAnalyses[page.url];
                const dot = getHealthDot(analysis);
                const isAnalyzing = analyzingPages.has(page.url);
                const isExpanded = expandedAnalysis === page.url;

                return (
                  <div key={page.id} className="transition-colors">
                    {/* Page row */}
                    <div className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Health dot */}
                        <div className="flex items-center justify-center mt-1.5 shrink-0">
                          <div
                            className={`w-3 h-3 rounded-full ${dot.color} shrink-0`}
                            title={dot.label}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            {/* Title + URL */}
                            <div>
                              <h3 className="font-semibold text-slate-900 text-base">
                                {page.title || 'Untitled'}
                              </h3>
                              <a
                                href={page.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 mt-0.5 font-normal"
                              >
                                <span className="truncate max-w-xs">{page.url}</span>
                                <ExternalLink size={11} className="shrink-0" />
                              </a>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge
                                variant={page.status === 'publish' ? 'default' : 'secondary'}
                              >
                                {page.status}
                              </Badge>

                              {/* Money page star */}
                              <button
                                onClick={() => toggleMoneyPage(page.id)}
                                disabled={isToggling === page.id}
                                className={`p-1.5 rounded-md transition-colors ${
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
                                className="text-purple-700 border-purple-200 hover:bg-purple-50 hover:border-purple-300 disabled:opacity-70"
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
                                  onClick={() =>
                                    setExpandedAnalysis(isExpanded ? null : page.url)
                                  }
                                  className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                                  title={isExpanded ? 'Collapse' : 'View recommendations'}
                                >
                                  {isExpanded ? (
                                    <ChevronUp size={16} />
                                  ) : (
                                    <ChevronDown size={16} />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* GSC metrics row */}
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm font-medium text-slate-600">
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
                              <span className="text-purple-600">
                                Avg pos: {page.gsc_position}
                              </span>
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
                            <span className="text-slate-400 text-xs">
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
                        selectedRecs={selectedRecommendations}
                        onToggleRec={handleToggleRec}
                        onDismiss={handleDismissPanel}
                        onApplySuccess={updated => handleApplySuccess(page.url, updated)}
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
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
