'use client';

import { X, Check } from 'lucide-react';

interface ApprovalIssue {
  keyword: string;
  pages: string[];
  impressions: number;
  recommendations: { action: string; url: string; detail?: string }[];
}

interface Props {
  onClose: () => void;
  issue?: ApprovalIssue | null;
}

export default function ApprovalModal({ onClose, issue }: Props) {
  if (!issue) {
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
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No issue data available.
          </div>
        </div>
      </div>
    );
  }

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
            {issue.pages.length} pages competing for &ldquo;{issue.keyword}&rdquo;
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Splitting {issue.impressions.toLocaleString()} monthly impressions across URLs
          </div>
        </div>

        {/* Recommended Fix */}
        {issue.recommendations.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Recommended Fix:
            </div>
            <div className="space-y-3 rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
              {issue.recommendations.map((rec, i) => (
                <div key={i} className="text-sm text-slate-800 dark:text-slate-200">
                  <span className="mr-2 text-emerald-600 dark:text-emerald-400">
                    {i + 1}.
                  </span>
                  {rec.action}{' '}
                  <code className="rounded bg-indigo-100 px-1.5 py-0.5 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    {rec.url}
                  </code>
                  {rec.detail && <span> {rec.detail}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expected Outcome */}
        <div className="mb-6 rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/20">
          <div className="mb-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            EXPECTED OUTCOME
          </div>
          <div className="text-sm text-slate-700 dark:text-slate-200">
            Consolidate ranking signals → single Target Page receives full{' '}
            {issue.impressions.toLocaleString()} impression authority
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
            <Check size={14} /> Approve All {issue.recommendations.length} Actions
          </button>
        </div>
      </div>
    </div>
  );
}
