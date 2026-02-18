'use client';

import { useState, useCallback } from 'react';
import {
  Check,
  RotateCcw,
  TrendingUp,
  Shield,
  AlertTriangle,
  FileEdit,
  Link2,
  Tag,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { PendingChange } from '@/app/dashboard/types';
import { cn } from '@/lib/utils';
import { sitesService } from '@/lib/services/api';
import { useToast } from '@/components/ui/use-toast';

interface Props {
  pendingChanges: PendingChange[];
  siteId: number | string;
}

const ITEMS_PER_PAGE = 3;

const getChangeIcon = (type: string) => {
  switch (type) {
    case 'internal_link':
      return <Link2 size={14} className="text-indigo-500" />;
    case 'meta_update':
      return <Tag size={14} className="text-amber-500" />;
    case 'content_refresh':
      return <FileEdit size={14} className="text-blue-500" />;
    case 'canonical_fix':
      return <Shield size={14} className="text-purple-500" />;
    default:
      return <Sparkles size={14} className="text-slate-400" />;
  }
};

const getChangeColor = (type: string) => {
  switch (type) {
    case 'internal_link':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800';
    case 'meta_update':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    case 'content_refresh':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'canonical_fix':
      return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  }
};

/** Risk badge config keyed by PendingChange['risk'] */
const RISK_BADGE: Record<
  string,
  { label: string; icon: typeof Shield; classes: string; barClasses: string }
> = {
  safe: {
    label: 'Safe',
    icon: Shield,
    classes:
      'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    barClasses: 'from-emerald-400 to-teal-400',
  },
  redirect: {
    label: 'Redirect',
    icon: Link2,
    classes:
      'border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    barClasses: 'from-orange-400 to-amber-400',
  },
  content_change: {
    label: 'Content Change',
    icon: FileEdit,
    classes:
      'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    barClasses: 'from-blue-400 to-indigo-400',
  },
  meta_update: {
    label: 'Meta Update',
    icon: Tag,
    classes:
      'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    barClasses: 'from-amber-400 to-yellow-400',
  },
  destructive: {
    label: 'Destructive',
    icon: AlertTriangle,
    classes:
      'border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400',
    barClasses: 'from-red-400 to-orange-400',
  },
};

function getRiskBadge(risk: string) {
  return RISK_BADGE[risk] || RISK_BADGE.safe;
}

export default function ApprovalQueue({ pendingChanges, siteId }: Props) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processedIds, setProcessedIds] = useState<Set<number>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Filter out already-processed items
  const activeChanges = pendingChanges.filter(
    (c) => !processedIds.has(c.id)
  );
  const safeChanges = activeChanges.filter(
    (c) => c.risk === 'safe' || c.risk === 'meta_update'
  );
  const destructiveChanges = activeChanges.filter(
    (c) => c.risk === 'destructive'
  );

  const displayedChanges = activeChanges.slice(0, visibleCount);
  const hasMore = visibleCount < activeChanges.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) =>
      Math.min(prev + ITEMS_PER_PAGE, activeChanges.length)
    );
  };

  const markProcessed = useCallback((id: number) => {
    setProcessedIds((prev) => new Set(prev).add(id));
  }, []);

  const setLoading = useCallback((id: number, loading: boolean) => {
    setLoadingIds((prev) => {
      const next = new Set(prev);
      loading ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const handleApprove = useCallback(
    async (change: PendingChange) => {
      setLoading(change.id, true);
      try {
        // Use the sites service approve endpoint
        await sitesService.approveAction(siteId, change.id);
        markProcessed(change.id);
        toast({
          title: 'Approved',
          description: `"${change.description.slice(0, 60)}…" has been approved.`,
        });
      } catch (err) {
        console.error('Approve failed:', err);
        toast({
          title: 'Approval failed',
          description:
            err instanceof Error ? err.message : 'Something went wrong.',
          variant: 'destructive',
        });
      } finally {
        setLoading(change.id, false);
      }
    },
    [siteId, markProcessed, setLoading, toast]
  );

  const handleDeny = useCallback(
    async (change: PendingChange) => {
      setLoading(change.id, true);
      try {
        // Use the sites service deny endpoint
        await sitesService.denyAction(siteId, change.id, 'User denied recommendation');
        markProcessed(change.id);
        toast({
          title: 'Denied',
          description: 'Recommendation dismissed.',
        });
      } catch (err) {
        // Even if API fails, remove locally (it's a deny/dismiss)
        console.error('Dismiss API error (removing locally):', err);
        markProcessed(change.id);
        toast({
          title: 'Denied',
          description: 'Recommendation dismissed locally.',
        });
      } finally {
        setLoading(change.id, false);
      }
    },
    [siteId, markProcessed, setLoading, toast]
  );

  const handleApproveAllSafe = useCallback(async () => {
    for (const change of safeChanges) {
      await handleApprove(change);
    }
  }, [safeChanges, handleApprove]);

  const handleApproveAll = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmApproveAll = useCallback(async () => {
    setShowConfirmDialog(false);
    for (const change of activeChanges) {
      await handleApprove(change);
    }
  }, [activeChanges, handleApprove]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Approval Queue
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Siloq-generated remediation plan — review and approve
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleApproveAllSafe}
            disabled={safeChanges.length === 0}
            className="focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          >
            <Check size={14} /> Approve All Safe ({safeChanges.length})
          </button>
          <button
            onClick={handleApproveAll}
            disabled={activeChanges.length === 0}
            className="focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          >
            <Check size={14} /> Approve All
          </button>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-card text-card-foreground relative overflow-hidden rounded-xl border p-4 shadow">
          <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-blue-400/10 blur-xl" />
          <div className="relative">
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Total Pending
              </div>
            </div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {activeChanges.length}
            </div>
          </div>
        </div>
        <div className="bg-card text-card-foreground relative overflow-hidden rounded-xl border border-emerald-200 p-4 shadow dark:border-emerald-900/30">
          <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-emerald-400/10 blur-xl" />
          <div className="relative">
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <div className="text-xs text-emerald-600 dark:text-emerald-400">
                Safe Changes
              </div>
            </div>
            <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
              {safeChanges.length}
            </div>
          </div>
        </div>
        <div className="bg-card text-card-foreground relative overflow-hidden rounded-xl border border-red-200 p-4 shadow dark:border-red-900/30">
          <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-red-400/10 blur-xl" />
          <div className="relative">
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <div className="text-xs text-red-600 dark:text-red-400">
                Needs Review
              </div>
            </div>
            <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {destructiveChanges.length}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {activeChanges.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-16 dark:border-slate-700 dark:bg-slate-800/50">
          <Check size={48} className="text-emerald-400 mb-4" />
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            No pending changes
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm text-center">
            All caught up! Siloq will generate new recommendations when conflicts or optimization opportunities are detected.
          </p>
        </div>
      )}

      {/* Change Cards */}
      <div className="space-y-4">
        {displayedChanges.map((change) => {
          const badge = getRiskBadge(change.risk);
          const BadgeIcon = badge.icon;
          const isLoading = loadingIds.has(change.id);

          return (
            <div
              key={change.id}
              className={cn(
                'bg-card text-card-foreground relative overflow-hidden rounded-xl border p-5 shadow transition-opacity',
                change.risk === 'destructive' &&
                  'border-red-200 dark:border-red-900/30',
                isLoading && 'opacity-60 pointer-events-none'
              )}
            >
              <div
                className={cn(
                  'absolute left-0 top-0 h-1 w-full bg-gradient-to-r',
                  badge.barClasses
                )}
              />
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                        badge.classes
                      )}
                    >
                      <BadgeIcon size={10} />
                      {badge.label}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                        getChangeColor(change.type)
                      )}
                    >
                      {getChangeIcon(change.type)}
                      {change.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mb-1 text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">
                    {change.description}
                  </div>

                  {change.doctrine && (
                    <div className="mb-1 text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium text-slate-500 dark:text-slate-400">
                        DOCTRINE:
                      </span>{' '}
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {change.doctrine}
                      </span>
                    </div>
                  )}

                  {change.impact && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      <TrendingUp size={14} />
                      Expected impact: {change.impact}
                    </div>
                  )}

                  {change.risk === 'destructive' && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                      <RotateCcw size={14} />
                      48-hour rollback available after execution
                    </div>
                  )}
                </div>

                <div className="flex w-full gap-2 sm:ml-6 sm:w-auto">
                  <button
                    onClick={() => handleDeny(change)}
                    disabled={isLoading}
                    className="focus-visible:ring-ring inline-flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 sm:flex-initial dark:border-red-900/30 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/20"
                  >
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      'Deny'
                    )}
                  </button>
                  <button
                    onClick={() => handleApprove(change)}
                    disabled={isLoading}
                    className="focus-visible:ring-ring inline-flex h-9 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 sm:flex-initial [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={14} /> Approve
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            className="focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          >
            Load More
            <span className="text-xs text-slate-400">
              ({displayedChanges.length} of {activeChanges.length})
            </span>
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card text-card-foreground mx-4 max-w-md rounded-xl border p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">Approve All Changes?</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              This will approve all {activeChanges.length} pending changes
              {destructiveChanges.length > 0 && (
                <>
                  {' '}
                  including {destructiveChanges.length} destructive change
                  {destructiveChanges.length !== 1 && 's'}
                </>
              )}
              . This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="focus-visible:ring-ring inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproveAll}
                className="focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              >
                <Check size={14} /> Confirm Approve All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
