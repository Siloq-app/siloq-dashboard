'use client';

import { useState } from 'react';
import {
  Plus,
  Eye,
  Link2,
  ArrowUp,
  Crown,
  FileText,
  ChevronRight,
  GitBranch,
} from 'lucide-react';
import { Silo } from '@/app/dashboard/types';
import { cn } from '@/lib/utils';
import { SiloTreeView } from '@/components/modals/SiloTreeView';

interface Props {
  silos: Silo[];
  selectedSilo: Silo | null;
  onGenerateClick: () => void;
}

export default function SiloPlanner({
  silos,
  selectedSilo,
  onGenerateClick,
}: Props) {
  const [isTreeViewOpen, setIsTreeViewOpen] = useState(false);
  const displaySilos = selectedSilo ? [selectedSilo] : silos;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {selectedSilo ? selectedSilo.name : 'All Silos'}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {displaySilos.length} silo{displaySilos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTreeViewOpen(true)}
            className="focus-visible:ring-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          >
            <GitBranch size={16} />
            View Architecture
          </button>
          <button
            onClick={onGenerateClick}
            className="focus-visible:ring-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          >
            Generate Page
            <Plus size={16} />
          </button>
        </div>
      </div>

      {displaySilos.map((silo) => (
        <div key={silo.id} className="space-y-4">
          {/* Target Page (King) */}
          <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-900/30 dark:from-amber-950/20 dark:to-orange-950/20">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />

            <div className="relative p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                  <Crown size={18} className="text-white" />
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <Crown size={10} />
                      King
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {silo.targetPage.title}
                  </h3>
                  <p className="truncate font-mono text-xs text-slate-700 dark:text-slate-500">
                    {silo.targetPage.url}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {silo.targetPage.entities.map((e, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white/70 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="focus-visible:ring-ring ml-auto flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
                  View
                  <Eye size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Supporting Pages (Soldiers) */}
          <div className="relative pl-4">
            <div className="absolute bottom-8 left-0 top-0 w-px bg-gradient-to-b from-indigo-300 via-indigo-200 to-transparent dark:from-indigo-800 dark:via-indigo-900" />

            <div className="mb-3 ml-2 flex items-center gap-2">
              <ArrowUp size={14} className="text-indigo-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                Supporting Pages
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {silo.supportingPages.length} linking up
              </span>
            </div>

            <div className="space-y-3">
              {silo.supportingPages.map((page, i) => (
                <div
                  key={i}
                  className="bg-card text-card-foreground group relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow transition-all hover:border-indigo-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-indigo-800"
                >
                  <div
                    className={cn(
                      'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
                      page.status === 'published'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : page.status === 'suggested'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    <FileText size={12} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {page.title}
                      </h4>
                      <span
                        className={cn(
                          'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
                          page.status === 'published'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : page.status === 'suggested'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        )}
                      >
                        {page.status}
                      </span>
                    </div>
                    <p className="truncate font-mono text-xs text-slate-700 dark:text-slate-500">
                      {page.url}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {page.entities.slice(0, 3).map((e, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        >
                          {e}
                        </span>
                      ))}
                      {page.entities.length > 3 && (
                        <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-500">
                          +{page.entities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-auto flex flex-shrink-0 items-center gap-2">
                    {page.linked ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Link2 size={14} className="mr-1" />
                        Linked
                      </span>
                    ) : (
                      <button className="focus-visible:ring-ring flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
                        Link
                        <Link2 size={16} />
                      </button>
                    )}
                    <ChevronRight
                      size={14}
                      className="text-slate-300 dark:text-slate-600"
                    />
                  </div>
                </div>
              ))}

              {/* Add Supporting Page CTA */}
              <button
                onClick={onGenerateClick}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-indigo-200 p-4 text-indigo-600 transition-all hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-indigo-900/50 dark:text-indigo-400 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
              >
                <Plus size={14} />
                <span className="text-sm font-medium">Add Supporting Page</span>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Silo Architecture Tree View Modal */}
      <SiloTreeView
        silo={selectedSilo || displaySilos[0]}
        isOpen={isTreeViewOpen}
        onClose={() => setIsTreeViewOpen(false)}
      />
    </div>
  );
}
