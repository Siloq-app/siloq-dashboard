'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { PendingChange } from '@/app/dashboard/types';
import { cn } from '@/lib/utils';

interface Props {
  pendingChanges: PendingChange[];
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

export default function ApprovalQueue({ pendingChanges }: Props) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const safeChanges = pendingChanges.filter((c) => c.risk === 'safe');
  const destructiveChanges = pendingChanges.filter(
    (c) => c.risk === 'destructive'
  );

  const displayedChanges = pendingChanges.slice(0, visibleCount);
  const hasMore = visibleCount < pendingChanges.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) =>
      Math.min(prev + ITEMS_PER_PAGE, pendingChanges.length)
    );
  };

  const handleApproveAll = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmApprove = () => {
    setShowConfirmDialog(false);
  };

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
          <button className="focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
            <Check size={14} /> Approve All Safe ({safeChanges.length})
          </button>
          <button
            onClick={handleApproveAll}
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
              {pendingChanges.length}
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
                Destructive Changes
              </div>
            </div>
            <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {destructiveChanges.length}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {pendingChanges.length === 0 && (
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
        {displayedChanges.map((change, index) => (
          <div
            key={change.id}
            className={cn(
              'bg-card text-card-foreground relative overflow-hidden rounded-xl border p-5 shadow',
              change.risk === 'destructive' &&
                'border-red-200 dark:border-red-900/30'
            )}
          >
            {change.risk === 'destructive' && (
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-400 to-orange-400" />
            )}
            {change.risk === 'safe' && (
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />
            )}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="flex-1">
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                      change.risk === 'safe'
                        ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400'
                    )}
                  >
                    {change.risk === 'safe' ? (
                      <Shield size={10} />
                    ) : (
                      <AlertTriangle size={10} />
                    )}
                    {change.risk === 'safe' ? 'Safe' : 'Destructive'}
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

                <div className="mb-1 text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-medium text-slate-500 dark:text-slate-400">
                    DOCTRINE:
                  </span>{' '}
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {change.doctrine}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  <TrendingUp size={14} />
                  Expected impact: {change.impact}
                </div>

                {change.risk === 'destructive' && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                    <RotateCcw size={14} />
                    48-hour rollback available after execution
                  </div>
                )}
              </div>

              <div className="flex w-full gap-2 sm:ml-6 sm:w-auto">
                <button className="focus-visible:ring-ring inline-flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 sm:flex-initial dark:border-red-900/30 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/20">
                  Deny
                </button>
                <button className="focus-visible:ring-ring inline-flex h-9 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 sm:flex-initial [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
                  <Check size={14} /> Approve
                </button>
              </div>
            </div>
          </div>
        ))}
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
              ({displayedChanges.length} of {pendingChanges.length})
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
              This will approve all {pendingChanges.length} pending changes
              including {destructiveChanges.length} destructive changes. This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="focus-visible:ring-ring inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
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
