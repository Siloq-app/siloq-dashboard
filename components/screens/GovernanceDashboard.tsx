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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import {
  conflictsService,
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

  // Bug fix: These are live-detected conflicts (no DB ID), so buttons need to work differently
  const handleDifferentiate = (conflict: Conflict) => {
    toast.info(
      'To differentiate these pages, update their page types in the Pages tab so they serve different purposes.',
      { duration: 5000 }
    );
  };

  const handleRedirect = (conflict: Conflict) => {
    toast.info(
      'Redirect support coming soon. For now, set up a 301 redirect in your CMS from the losing URL to the winning URL.',
      { duration: 5000 }
    );
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
