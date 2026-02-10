'use client';

import { useState } from 'react';
import {
  Crown,
  FileText,
  Link2,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Silo } from '@/app/dashboard/types';
import { cn } from '@/lib/utils';

interface SiloTreeViewProps {
  silo: Silo;
  isOpen: boolean;
  onClose: () => void;
}

interface TreeNodeProps {
  page: {
    title: string;
    url: string;
    status?: string;
    entities?: string[];
  };
  type: 'king' | 'soldier';
  isLinked?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  hasChildren?: boolean;
  level?: number;
}

function TreeNode({
  page,
  type,
  isLinked,
  isExpanded,
  onToggle,
  hasChildren,
  level = 0,
}: TreeNodeProps) {
  const isKing = type === 'king';

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 rounded-lg border-2 p-4 transition-all',
        isKing
          ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg dark:border-amber-700 dark:from-amber-950/30 dark:to-orange-950/20'
          : isLinked
            ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50',
        'hover:shadow-md'
      )}
      style={{ marginLeft: level * 40 }}
    >
      {/* Connector Line */}
      {level > 0 && (
        <div className="absolute -left-5 top-1/2 h-px w-5 bg-slate-300 dark:bg-slate-600" />
      )}

      {/* Icon */}
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
          isKing
            ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg'
            : isLinked
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        )}
      >
        {isKing ? (
          <Crown size={20} className="text-white" />
        ) : (
          <FileText size={18} />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4
            className={cn(
              'font-semibold',
              isKing
                ? 'text-lg text-slate-900 dark:text-slate-100'
                : 'text-sm text-slate-900 dark:text-slate-100'
            )}
          >
            {page.title}
          </h4>
          {isKing && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Crown size={10} />
              King
            </span>
          )}
          {isLinked && !isKing && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Link2 size={10} />
              Linked
            </span>
          )}
        </div>

        <p className="mt-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400">
          {page.url}
        </p>

        {page.entities && page.entities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {page.entities.slice(0, 4).map((entity, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              >
                {entity}
              </span>
            ))}
            {page.entities.length > 4 && (
              <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-500">
                +{page.entities.length - 4}
              </span>
            )}
          </div>
        )}

        {page.status && !isKing && (
          <span
            className={cn(
              'mt-2 inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium',
              page.status === 'published'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : page.status === 'suggested'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            )}
          >
            {page.status}
          </span>
        )}
      </div>

      {/* Expand/Collapse Toggle */}
      {hasChildren && (
        <button
          onClick={onToggle}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      )}

      {/* External Link */}
      <a
        href={page.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
      >
        <ExternalLink size={14} />
      </a>
    </div>
  );
}

export function SiloTreeView({ silo, isOpen, onClose }: SiloTreeViewProps) {
  const [zoom, setZoom] = useState(1);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(
    () => new Set(silo.supportingPages.map((_, i) => i))
  );

  const toggleNode = (index: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedNodes(newExpanded);
  };

  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 1.5));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.7));
  const resetZoom = () => setZoom(1);

  if (!isOpen) return null;

  const linkedCount = silo.supportingPages.filter((p) => p.linked).length;
  const publishedCount = silo.supportingPages.filter(
    (p) => p.status === 'published'
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <Crown size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {silo.name} Architecture
              </h2>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span>{silo.supportingPages.length} supporting pages</span>
                <span className="text-slate-300">|</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {linkedCount} linked
                </span>
                <span className="text-slate-300">|</span>
                <span>{publishedCount} published</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
              <button
                onClick={zoomOut}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                title="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="w-12 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                title="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={resetZoom}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                title="Reset zoom"
              >
                <Maximize2 size={16} />
              </button>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tree Content */}
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6 dark:bg-slate-900/50">
          <div
            className="mx-auto max-w-3xl space-y-4"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease',
            }}
          >
            {/* Root Node - Target Page */}
            <TreeNode page={silo.targetPage} type="king" />

            {/* Connection Line */}
            <div className="relative py-2">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-amber-300 via-indigo-300 to-indigo-300 dark:from-amber-700 dark:via-indigo-700 dark:to-indigo-700" />
              <div className="relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                {silo.supportingPages.length}
              </div>
            </div>

            {/* Supporting Pages */}
            <div className="space-y-3">
              {silo.supportingPages.map((page, index) => (
                <div key={index} className="relative">
                  {/* Horizontal connector */}
                  <div className="absolute -left-5 top-1/2 hidden h-px w-5 bg-slate-300 dark:bg-slate-600 md:block" />

                  <TreeNode
                    page={page}
                    type="soldier"
                    isLinked={page.linked}
                    isExpanded={expandedNodes.has(index)}
                    onToggle={() => toggleNode(index)}
                    hasChildren={false}
                    level={0}
                  />
                </div>
              ))}
            </div>

            {/* Empty State */}
            {silo.supportingPages.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <FileText size={20} className="text-slate-400" />
                </div>
                <h3 className="mt-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                  No supporting pages yet
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Add supporting pages to build your silo architecture.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Target Page
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Linked
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                Unlinked
              </span>
            </div>
          </div>

          <div className="text-slate-500 dark:text-slate-400">
            Architecture completeness:{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {silo.supportingPages.length > 0
                ? Math.round((linkedCount / silo.supportingPages.length) * 100)
                : 0}
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SiloTreeView;
