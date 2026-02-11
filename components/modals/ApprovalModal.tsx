'use client';

import { X, Check } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function ApprovalModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[600px] rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Siloq Recommendation
          </h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Issue Summary */}
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/30 dark:bg-red-950/20">
          <div className="mb-2 text-xs font-semibold text-red-600 dark:text-red-400">
            CANNIBALIZATION DETECTED
          </div>
          <div className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            3 pages competing for "kitchen remodeling"
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Splitting 12,400 monthly impressions across URLs
          </div>
        </div>

        {/* Recommended Fix */}
        <div className="mb-6">
          <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Recommended Fix:
          </div>
          <div className="space-y-3 rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
            <div className="text-sm text-slate-800 dark:text-slate-200">
              <span className="mr-2 text-emerald-600 dark:text-emerald-400">
                1.
              </span>
              Designate{' '}
              <code className="rounded bg-indigo-100 px-1.5 py-0.5 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                /kitchen-remodel-guide
              </code>{' '}
              as Target Page
            </div>
            <div className="text-sm text-slate-800 dark:text-slate-200">
              <span className="mr-2 text-emerald-600 dark:text-emerald-400">
                2.
              </span>
              Redirect{' '}
              <code className="rounded bg-indigo-100 px-1.5 py-0.5 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                /remodel-your-kitchen
              </code>{' '}
              → Target (301)
            </div>
            <div className="text-sm text-slate-800 dark:text-slate-200">
              <span className="mr-2 text-emerald-600 dark:text-emerald-400">
                3.
              </span>
              Differentiate{' '}
              <code className="rounded bg-indigo-100 px-1.5 py-0.5 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                /kitchen-remodel-cost
              </code>{' '}
              to target "cost" entities only
            </div>
          </div>
        </div>

        {/* Expected Outcome */}
        <div className="mb-6 rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/20">
          <div className="mb-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            EXPECTED OUTCOME
          </div>
          <div className="text-sm text-slate-700 dark:text-slate-200">
            Consolidate ranking signals → single Target Page receives full
            12,400 impression authority
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="inline-flex h-10 w-[25%] items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 dark:border-red-900/30 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/20">
            Deny
          </button>
          <button className="inline-flex h-10 w-[25%] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            Modify
          </button>
          <button className="inline-flex h-10 w-[50%] items-center justify-center gap-0 rounded-lg bg-black px-4 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800 md:gap-2">
            <Check size={14} /> Approve All 3 Actions
          </button>
        </div>
      </div>
    </div>
  );
}
