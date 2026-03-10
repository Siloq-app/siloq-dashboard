'use client';

/**
 * GeoVisibilityCard
 * Drop this at the TOP of SiteIntelligencePanel.tsx, above the existing cards.
 *
 * Props come from the site goals data already loaded in the parent panel.
 * Pass geoPageIds + allPages (already fetched for other tabs) — no extra API call needed.
 */

import Link from 'next/link';

interface SitePage {
  id: number;
  title: string;
  url: string;
}

interface GeoVisibilityCardProps {
  siteId: number | string;
  geoPageIds: number[];
  allPages: SitePage[];
  goalsLoading?: boolean;
}

export function GeoVisibilityCard({
  siteId,
  geoPageIds,
  allPages,
  goalsLoading = false,
}: GeoVisibilityCardProps) {
  const priorityPages = geoPageIds
    .map((id) => allPages.find((p) => p.id === id))
    .filter(Boolean) as SitePage[];

  const hasPages = priorityPages.length > 0;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-900">AI Visibility Priority</h3>
            <p className="text-xs text-indigo-600 mt-0.5">
              Pages Siloq is optimizing for AI citation
            </p>
          </div>
        </div>
        <Link
          href={`/sites/${siteId}/settings?tab=goals`}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
        >
          Edit
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Content */}
      {goalsLoading ? (
        <div className="flex items-center gap-2 py-2">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-indigo-500">Loading…</span>
        </div>
      ) : hasPages ? (
        <div className="space-y-2">
          {priorityPages.map((page, idx) => (
            <div
              key={page.id}
              className="flex items-center gap-3 bg-white/70 rounded-xl px-3 py-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {page.title || 'Untitled'}
                </div>
                <div className="text-xs text-gray-400 truncate">{page.url}</div>
              </div>
              {/* Future: show live GEO score badge here when plugin data is available */}
              <div className="flex-shrink-0">
                <span className="inline-flex items-center gap-1 text-xs text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  Priority
                </span>
              </div>
            </div>
          ))}

          <p className="text-xs text-indigo-500 mt-3 px-1">
            Siloq is analyzing these pages for FAQ structure, entity signals, and schema markup that improve AI citations.
          </p>
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-4">
          <div className="text-3xl mb-2">🤖</div>
          <p className="text-sm font-medium text-indigo-800 mb-1">
            Tell Siloq which pages matter most
          </p>
          <p className="text-xs text-indigo-500 mb-4 max-w-xs mx-auto">
            Choose up to 3 pages you want ChatGPT, Gemini, and Perplexity to cite when people ask about your business.
          </p>
          <Link
            href={`/sites/${siteId}/settings?tab=goals`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Set AI Priority Pages
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
