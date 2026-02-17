'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Zap,
  ArrowRight,
  ExternalLink,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import {
  conflictsService,
  redirectsService,
  type ConflictResponse,
} from '@/lib/services/api';
import type { Conflict } from '@/app/dashboard/types';
import { toast } from 'sonner';

// Severity colors from UX guide
const SEVERITY_COLORS: Record<string, string> = {
  critical: '#DC2626',
  high: '#F5A623',
  medium: '#D4A017',
  low: '#27AE60',
  info: '#2E75B6',
};

const SEVERITY_EMOJI: Record<string, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
  info: '🔵',
};

const SEVERITY_HEADLINES: Record<string, (keyword: string, count: number) => string> = {
  critical: (kw, n) => `Active cannibalization confirmed — "${kw}"\n${n} pages are splitting clicks and rankings for this keyword.`,
  high: (kw, n) => `Strong keyword competition — "${kw}"\n${n} pages have significant overlap with measurable search visibility.`,
  medium: (kw, n) => `Moderate overlap detected — "${kw}"\n${n} pages share keyword signals. Monitor and consider differentiation.`,
  low: (kw, n) => `Minor similarity — "${kw}"\n${n} pages have some keyword overlap. Informational only.`,
  info: (kw, n) => `Cosmetic similarity — "${kw}"\n${n} pages share surface-level attributes but likely don't compete in search.`,
};

interface Props {
  healthScore: number;
  cannibalizationIssues: any[];
  silos: any[];
  pendingChanges: any[];
  onViewSilo: (silo: any) => void;
  onViewApprovals: () => void;
  onShowApprovalModal: () => void;
}

export default function GovernanceDashboard({
  healthScore,
  cannibalizationIssues: _legacyIssues,
  silos,
  pendingChanges,
  onViewSilo,
  onViewApprovals,
  onShowApprovalModal,
}: Props) {
  const { selectedSite } = useDashboardContext();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(true);

  // Filter states
  const [hideNoindex, setHideNoindex] = useState(true);
  const [hideResolved, setHideResolved] = useState(true);
  const [showOnlyWithImpressions, setShowOnlyWithImpressions] = useState(false);
  
  // Bug fix: Local dismissed list for live-detected conflicts
  const [dismissedKeywords, setDismissedKeywords] = useState<Set<string>>(new Set());

  // Redirect modal state
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [winnerUrl, setWinnerUrl] = useState('');
  const [selectedLosers, setSelectedLosers] = useState<Set<string>>(new Set());
  const [isCreatingRedirects, setIsCreatingRedirects] = useState(false);

  const loadConflicts = useCallback(async () => {
    if (!selectedSite) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await conflictsService.list(selectedSite.id);
      setConflicts(data as Conflict[]);
      setHasScanned(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load conflicts';
      if (msg.includes('not connected') || msg.includes('GSC')) {
        setError('gsc_not_connected');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  // Apply filters
  const noindexCount = conflicts.filter(c =>
    c.pages?.some(p => p.is_noindex)
  ).length;
  const resolvedCount = conflicts.filter(c => c.status === 'resolved').length;

  const filteredConflicts = conflicts.filter(c => {
    if (hideNoindex && c.pages?.every(p => p.is_noindex)) return false;
    if (hideResolved && c.status === 'resolved') return false;
    if (showOnlyWithImpressions && c.total_impressions <= 0) return false;
    if (c.status === 'dismissed') return false;
    // Bug fix: Filter out locally dismissed conflicts (by keyword)
    if (dismissedKeywords.has(c.keyword)) return false;
    return true;
  });

  const activeConflicts = filteredConflicts.filter(c => c.status === 'active');
  const allResolved = conflicts.length > 0 && conflicts.every(c => c.status === 'resolved' || c.status === 'dismissed');

  // Differentiation modal state
  const [differentiationModal, setDifferentiationModal] = useState<{
    open: boolean;
    conflict: Conflict | null;
    loading: boolean;
    recommendations: Array<{
      url: string;
      page_id: number | null;
      new_title: string;
      new_h1: string;
      new_meta_description: string;
      primary_keyword: string;
      internal_link_suggestion: string;
      reasoning: string;
      // For editing
      current_title?: string;
      current_meta?: string;
    }> | null;
    selectedPages: Set<string>;
  }>({
    open: false,
    conflict: null,
    loading: false,
    recommendations: null,
    selectedPages: new Set(),
  });

  const handleDifferentiate = async (conflict: Conflict) => {
    setDifferentiationModal({
      open: true,
      conflict,
      loading: true,
      recommendations: null,
      selectedPages: new Set(),
    });

    try {
      const result = await conflictsService.differentiate(selectedSite!.id, {
        pages: conflict.pages?.map(p => ({
          url: p.url,
          title: p.title,
          page_type: p.page_type,
        })) || [],
        keyword: conflict.keyword,
        conflict_type: conflict.conflict_type,
      });

      // Enrich with current values for comparison
      const enriched = result.recommendations.map(rec => ({
        ...rec,
        current_title: conflict.pages?.find(p => p.url === rec.url)?.title || '',
        current_meta: '',
      }));

      setDifferentiationModal(prev => ({
        ...prev,
        loading: false,
        recommendations: enriched,
        selectedPages: new Set(enriched.map(r => r.url)),
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate recommendations');
      setDifferentiationModal(prev => ({ ...prev, open: false, loading: false }));
    }
  };

  const handleApplyDifferentiation = async () => {
    const { recommendations, selectedPages } = differentiationModal;
    if (!recommendations || !selectedSite) return;

    const changes = recommendations
      .filter(rec => selectedPages.has(rec.url))
      .map(rec => ({
        page_id: rec.page_id,
        url: rec.url,
        new_title: rec.new_title,
        new_meta_description: rec.new_meta_description,
        new_h1: rec.new_h1,
      }));

    if (changes.length === 0) {
      toast.error('No pages selected');
      return;
    }

    setDifferentiationModal(prev => ({ ...prev, loading: true }));

    try {
      const result = await conflictsService.applyDifferentiation(selectedSite.id, changes);
      
      if (result.successful > 0) {
        toast.success(`Successfully updated ${result.successful} page(s)`);
      }
      if (result.failed > 0) {
        toast.warning(`Failed to update ${result.failed} page(s)`);
      }

      // Close modal and refresh conflicts
      setDifferentiationModal({
        open: false,
        conflict: null,
        loading: false,
        recommendations: null,
        selectedPages: new Set(),
      });
      loadConflicts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply changes');
      setDifferentiationModal(prev => ({ ...prev, loading: false }));
    }
  };

  const togglePageSelection = (url: string) => {
    setDifferentiationModal(prev => {
      const newSelected = new Set(prev.selectedPages);
      if (newSelected.has(url)) {
        newSelected.delete(url);
      } else {
        newSelected.add(url);
      }
      return { ...prev, selectedPages: newSelected };
    });
  };

  const updateRecommendation = (url: string, field: 'new_title' | 'new_meta_description', value: string) => {
    setDifferentiationModal(prev => {
      if (!prev.recommendations) return prev;
      const updated = prev.recommendations.map(rec =>
        rec.url === url ? { ...rec, [field]: value } : rec
      );
      return { ...prev, recommendations: updated };
    });
  };

  const handleRedirect = (conflict: Conflict) => {
    // Set up modal state
    setSelectedConflict(conflict);
    
    // Auto-select winner (highest impressions page)
    const pages = conflict.pages || [];
    const winnerPage = pages.reduce((best, current) => 
      (current.impressions || 0) > (best.impressions || 0) ? current : best
    , pages[0]);
    
    setWinnerUrl(winnerPage?.url || '');
    
    // Pre-select all losing pages
    const losingUrls = pages
      .filter(p => p.url !== winnerPage?.url)
      .map(p => p.url);
    setSelectedLosers(new Set(losingUrls));
    
    setRedirectModalOpen(true);
  };

  const handleCreateRedirects = async () => {
    if (!selectedSite || !selectedConflict || selectedLosers.size === 0) {
      toast.error('Please select at least one page to redirect');
      return;
    }

    setIsCreatingRedirects(true);

    try {
      const redirectPromises = Array.from(selectedLosers).map(loserUrl =>
        redirectsService.create(selectedSite.id, {
          from_url: loserUrl,
          to_url: winnerUrl,
          reason: 'Cannibalization resolution',
          conflict_keyword: selectedConflict.keyword,
        })
      );

      await Promise.all(redirectPromises);

      toast.success(
        `Successfully created ${selectedLosers.size} redirect${selectedLosers.size > 1 ? 's' : ''} and pushed to WordPress`,
        { duration: 5000 }
      );

      // Remove the conflict from the displayed list
      setConflicts(prev => prev.filter(c => c.keyword !== selectedConflict.keyword));
      
      setRedirectModalOpen(false);
      setSelectedConflict(null);
      setWinnerUrl('');
      setSelectedLosers(new Set());
    } catch (error: any) {
      toast.error(error.message || 'Failed to create redirects', { duration: 5000 });
    } finally {
      setIsCreatingRedirects(false);
    }
  };

  const handleDismiss = (conflict: Conflict) => {
    // Add keyword to dismissed list so it disappears from current session
    setDismissedKeywords(prev => new Set(prev).add(conflict.keyword));
    toast.success(`Dismissed conflict for "${conflict.keyword}"`);
  };

  // No site selected
  if (!selectedSite) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Select a site to view governance data and conflict detection.</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Analyzing your site structure...</p>
      </div>
    );
  }

  // GSC not connected error
  if (error === 'gsc_not_connected') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-muted-foreground mb-4">
          Google Search Console is not connected. Connect GSC to enable impression-weighted scoring and conflict detection.
        </p>
        <Button variant="outline">Connect GSC →</Button>
      </div>
    );
  }

  // Generic error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-4" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4" onClick={loadConflicts}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Filter toggles */}
        <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filters:</span>
        </div>

        <FilterToggle
          label="Hide noindex pages"
          checked={hideNoindex}
          onChange={setHideNoindex}
          badge={hideNoindex && noindexCount > 0 ? `${noindexCount} noindex pages hidden` : undefined}
        />
        <FilterToggle
          label="Hide resolved redirects"
          checked={hideResolved}
          onChange={setHideResolved}
          badge={hideResolved && resolvedCount > 0 ? `${resolvedCount} redirected pages hidden` : undefined}
        />
        <FilterToggle
          label="Show only pages with impressions"
          checked={showOnlyWithImpressions}
          onChange={setShowOnlyWithImpressions}
        />

        <Button variant="ghost" size="sm" onClick={loadConflicts}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Empty states */}
      {!hasScanned ? (
        <EmptyState
          icon="⏳"
          title="Scan in progress..."
          message="Siloq is analyzing your site for competing pages. This typically takes 2-5 minutes depending on site size."
        />
      ) : allResolved ? (
        <EmptyState
          icon="✅"
          title="All conflicts resolved!"
          message="You've addressed every competing page issue. Siloq will alert you if new conflicts appear."
        />
      ) : filteredConflicts.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="No competing pages detected."
          message="Your site structure looks clean! Siloq will continue monitoring for new conflicts."
        />
      ) : (
        /* Conflict cards */
        <div className="space-y-4">
          {filteredConflicts.map((conflict) => (
            <ConflictCard
              key={conflict.id}
              conflict={conflict}
              onDifferentiate={handleDifferentiate}
              onRedirect={handleRedirect}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}

      {/* Redirect Resolution Modal */}
      <Sheet open={redirectModalOpen} onOpenChange={setRedirectModalOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Redirect Loser → Winner</SheetTitle>
            <SheetDescription>
              Create 301 redirects from losing pages to the winning page. This will be pushed to WordPress automatically.
            </SheetDescription>
          </SheetHeader>

          {selectedConflict && (
            <div className="space-y-6 mt-6">
              {/* Competing Pages */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Competing Pages</Label>
                <div className="space-y-3">
                  {selectedConflict.pages?.map((page, i) => {
                    const isWinner = page.url === winnerUrl;
                    const isSelected = selectedLosers.has(page.url);

                    return (
                      <div
                        key={i}
                        className={`rounded-lg border p-4 ${
                          isWinner
                            ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950'
                            : 'border-border bg-muted/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Winner/Loser selection */}
                          <div className="flex flex-col items-center gap-2 pt-1">
                            <input
                              type="radio"
                              name="winner"
                              checked={isWinner}
                              onChange={() => {
                                setWinnerUrl(page.url);
                                // Remove from losers if it was selected
                                setSelectedLosers(prev => {
                                  const next = new Set(prev);
                                  next.delete(page.url);
                                  return next;
                                });
                              }}
                              className="w-4 h-4 cursor-pointer"
                            />
                            {!isWinner && (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  setSelectedLosers(prev => {
                                    const next = new Set(prev);
                                    if (checked) {
                                      next.add(page.url);
                                    } else {
                                      next.delete(page.url);
                                    }
                                    return next;
                                  });
                                }}
                              />
                            )}
                          </div>

                          {/* Page info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {isWinner && (
                                <span className="shrink-0 rounded bg-green-600 px-2 py-0.5 text-xs font-bold text-white uppercase">
                                  Winner
                                </span>
                              )}
                              <span className="font-mono text-sm truncate" title={page.url}>
                                {page.url}
                              </span>
                            </div>
                            {page.title && (
                              <p className="text-xs text-muted-foreground mb-2 truncate">{page.title}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {page.impressions != null && (
                                <span className="font-medium">{page.impressions.toLocaleString()} impressions</span>
                              )}
                              {page.clicks != null && (
                                <span>{page.clicks.toLocaleString()} clicks</span>
                              )}
                              {page.position != null && (
                                <span>Pos #{page.position.toFixed(1)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Redirect Target URL */}
              <div>
                <Label htmlFor="redirect-target" className="text-sm font-semibold mb-2 block">
                  Redirect Target URL
                </Label>
                <Input
                  id="redirect-target"
                  value={winnerUrl}
                  onChange={(e) => setWinnerUrl(e.target.value)}
                  placeholder="/winning-page-url/"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  All selected losing pages will redirect to this URL
                </p>
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Creating {selectedLosers.size} redirect{selectedLosers.size !== 1 ? 's' : ''}
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      {selectedLosers.size > 0 ? (
                        <>All selected pages will be set to 301 redirect to the winner. This will be pushed to WordPress.</>
                      ) : (
                        <>Select at least one losing page to redirect.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCreateRedirects}
                  disabled={selectedLosers.size === 0 || !winnerUrl || isCreatingRedirects}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isCreatingRedirects ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>Create {selectedLosers.size} Redirect{selectedLosers.size !== 1 ? 's' : ''}</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRedirectModalOpen(false)}
                  disabled={isCreatingRedirects}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilterToggle({
  label,
  checked,
  onChange,
  badge,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  badge?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        checked
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-border bg-background text-muted-foreground'
      }`}
    >
      {checked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {label}
      {badge && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}

function EmptyState({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
    </div>
  );
}

function ConflictCard({
  conflict,
  onDifferentiate,
  onRedirect,
  onDismiss,
}: {
  conflict: Conflict;
  onDifferentiate: (conflict: Conflict) => void;
  onRedirect: (conflict: Conflict) => void;
  onDismiss: (conflict: Conflict) => void;
}) {
  const severity = conflict.severity || 'medium';
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.medium;
  const emoji = SEVERITY_EMOJI[severity] || '🟡';
  const headlineFn = SEVERITY_HEADLINES[severity] || SEVERITY_HEADLINES.medium;
  const [headline, subline] = headlineFn(conflict.keyword, conflict.pages?.length || 0).split('\n');

  return (
    <Card className="overflow-hidden">
      {/* Severity bar */}
      <div className="h-1" style={{ backgroundColor: color }} />

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase text-white"
                style={{ backgroundColor: color }}
              >
                {severity}
              </span>
              {conflict.conflict_type && (
                <span className="text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">
                  {conflict.conflict_type}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold">
              {emoji} {headline}
            </p>
            {subline && (
              <p className="text-xs text-muted-foreground">{subline}</p>
            )}
          </div>
        </div>

        {/* Pages with GSC metrics */}
        <div className="space-y-2">
          {conflict.pages?.map((page, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 text-sm ${
                page.url === conflict.winner_url
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                  : 'border-border bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {page.url === conflict.winner_url && (
                    <span className="shrink-0 rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                      Winner
                    </span>
                  )}
                  <span className="font-mono text-xs truncate" title={page.url}>
                    {page.url}
                  </span>
                </div>
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {page.title && (
                <p className="text-xs text-muted-foreground mb-1 truncate">{page.title}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {page.impressions != null && (
                  <span>{page.impressions.toLocaleString()} impressions</span>
                )}
                {page.clicks != null && (
                  <span>{page.clicks.toLocaleString()} clicks</span>
                )}
                {page.position != null && (
                  <span>Position #{page.position.toFixed(1)}</span>
                )}
                {page.is_noindex && (
                  <span className="text-amber-600 font-medium">noindex</span>
                )}
                {page.has_redirect && (
                  <span className="text-blue-600 font-medium">
                    {page.redirect_type || '301'} → {page.redirect_target || 'redirected'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recommendation */}
        {conflict.recommendation && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-medium">Recommendation: </span>
              <span className="text-muted-foreground">{conflict.recommendation}</span>
              {conflict.recommendation_reasoning && (
                <p className="text-xs text-muted-foreground mt-1">{conflict.recommendation_reasoning}</p>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {conflict.status === 'active' && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => onRedirect(conflict)}
            >
              Redirect Loser → Winner
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDifferentiate(conflict)}
            >
              Differentiate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => onDismiss(conflict)}
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
