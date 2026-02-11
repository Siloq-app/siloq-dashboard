'use client';

import { useState, useMemo } from 'react';
import {
  Link2,
  ExternalLink,
  Zap,
  ArrowRight,
  CheckCircle2,
  Target,
  FileText,
  Network,
} from 'lucide-react';
import { LinkOpportunity } from '@/app/dashboard/types';
import { cn } from '@/lib/utils';

interface InternalLinksProps {
  opportunities: LinkOpportunity[];
}

export default function InternalLinks({ opportunities }: InternalLinksProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [insertedIds, setInsertedIds] = useState<Set<number>>(new Set());
  const [insertingId, setInsertingId] = useState<number | null>(null);

  const filteredOpportunities = useMemo(() => {
    if (filter === 'all') return opportunities;
    return opportunities.filter((opp) => opp.priority === filter);
  }, [opportunities, filter]);

  const stats = useMemo(() => {
    return {
      total: opportunities.length,
      high: opportunities.filter((o) => o.priority === 'high').length,
      medium: opportunities.filter((o) => o.priority === 'medium').length,
      low: opportunities.filter((o) => o.priority === 'low').length,
      inserted: insertedIds.size,
    };
  }, [opportunities, insertedIds]);

  const handleInsert = async (opportunity: LinkOpportunity) => {
    setInsertingId(opportunity.id);

    // Simulate API call to insert link
    await new Promise((resolve) => setTimeout(resolve, 800));

    setInsertedIds((prev) => new Set([...prev, opportunity.id]));
    setInsertingId(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Internal Links
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Discover and insert link opportunities to strengthen your silos
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
            <Network size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {stats.total}
            </span>
            <span className="text-xs text-slate-500">opportunities</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/20">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {stats.inserted}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400">inserted</span>
          </div>
        </div>
      </div>

      {/* Priority Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'All', value: stats.total, active: filter === 'all', onClick: () => setFilter('all') },
          { label: 'High', value: stats.high, active: filter === 'high', onClick: () => setFilter('high'), color: 'rose' },
          { label: 'Medium', value: stats.medium, active: filter === 'medium', onClick: () => setFilter('medium'), color: 'amber' },
          { label: 'Low', value: stats.low, active: filter === 'low', onClick: () => setFilter('low'), color: 'slate' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={cn(
              'flex flex-col items-center justify-center rounded-xl border p-3 transition-all',
              item.active
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
            )}
          >
            <span className={cn('text-2xl font-bold', item.active ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-100')}>
              {item.value}
            </span>
            <span className={cn('text-xs', item.active ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400')}>
              {item.label} Priority
            </span>
          </button>
        ))}
      </div>

      {/* Opportunities List */}
      <div className="space-y-3">
        {filteredOpportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-12 dark:border-slate-700 dark:bg-slate-800/50">
            <Network size={48} className="text-slate-300 dark:text-slate-600" />
            <h3 className="mt-4 text-sm font-medium text-slate-900 dark:text-slate-100">
              No link opportunities found
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try adjusting your filter or check back later
            </p>
          </div>
        ) : (
          filteredOpportunities.map((opportunity) => {
            const isInserted = insertedIds.has(opportunity.id);
            const isInserting = insertingId === opportunity.id;

            return (
              <div
                key={opportunity.id}
                className={cn(
                  'group relative rounded-xl border bg-white p-5 transition-all dark:bg-slate-800/50',
                  isInserted
                    ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/10'
                    : 'border-slate-200 hover:border-indigo-200 hover:shadow-sm dark:border-slate-700 dark:hover:border-indigo-800'
                )}
              >
                {/* Header with Priority & Silo */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      getPriorityColor(opportunity.priority)
                    )}
                  >
                    {opportunity.priority.charAt(0).toUpperCase() + opportunity.priority.slice(1)} Priority
                  </span>
                  {opportunity.siloContext && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400">
                      <Target size={10} />
                      {opportunity.siloContext}
                    </span>
                  )}
                  {isInserted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <CheckCircle2 size={10} />
                      Inserted
                    </span>
                  )}
                </div>

                {/* Link Flow Visualization */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  {/* Source Page */}
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      <FileText size={18} className="text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {opportunity.sourcePage.title}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {opportunity.sourcePage.url}
                      </p>
                    </div>
                  </div>

                  {/* Arrow & Anchor Text */}
                  <div className="flex items-center gap-2 sm:flex-col sm:items-center">
                    <ArrowRight size={16} className="rotate-90 text-slate-300 dark:text-slate-600 sm:rotate-0" />
                    <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 dark:bg-indigo-950/30">
                      <Link2 size={12} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400">
                        {opportunity.anchorText}
                      </span>
                    </div>
                  </div>

                  {/* Target Page */}
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Target size={18} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {opportunity.targetPage.title}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {opportunity.targetPage.url}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Context Quote */}
                <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
                  <p className="text-sm italic text-slate-600 dark:text-slate-400">
                    &ldquo;{opportunity.context}&rdquo;
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Estimated impact:
                    </span>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {opportunity.estimatedImpact}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={opportunity.sourcePage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                    >
                      <ExternalLink size={14} />
                    </a>

                    {!isInserted && (
                      <button
                        onClick={() => handleInsert(opportunity)}
                        disabled={isInserting}
                        className={cn(
                          'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors',
                          isInserting
                            ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700'
                        )}
                      >
                        {isInserting ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Inserting...
                          </>
                        ) : (
                          <>
                            <Zap size={14} />
                            Insert Link
                          </>
                        )}
                      </button>
                    )}

                    {isInserted && (
                      <button
                        disabled
                        className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-100 px-4 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      >
                        <CheckCircle2 size={14} />
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
