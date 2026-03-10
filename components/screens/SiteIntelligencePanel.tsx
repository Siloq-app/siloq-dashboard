'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  intelligenceService,
  goalsService,
  pagesService,
  type IntelligenceResult,
  type IntelligenceHubPage,
  type IntelligenceSpokePage,
  type IntelligenceOrphanPage,
  type IntelligenceCannibalizationRisk,
  type IntelligenceContentGap,
  type SiteGoals,
  type Page,
} from '@/lib/services/api';

// ── Props ─────────────────────────────────────────────────────────────────────

interface SiteIntelligencePanelProps {
  siteId: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const cls =
    severity === 'high'
      ? 'bg-red-100 text-red-700'
      : severity === 'medium'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-slate-100 text-slate-600';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {severity}
    </span>
  );
}

// ── Card Components ───────────────────────────────────────────────────────────

function HubPagesCard({ hubs }: { hubs: IntelligenceHubPage[] }) {
  return (
    <div className="rounded-xl border-2 border-green-200 dark:border-green-800 bg-white dark:bg-slate-900 p-5">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
        ✅ Hub Pages ({hubs.length})
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        Your money pages — each should have spoke pages nested under it
      </p>
      <div className="space-y-2">
        {hubs.map(hub => (
          <div
            key={hub.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {hub.title}
              </div>
              <div className="text-xs text-slate-400 truncate">{hub.url}</div>
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              <span className="text-xs text-slate-500">{hub.spoke_count} spokes</span>
              {hub.gaps > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                  ⚠️ {hub.gaps} gaps
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpokePagesCard({ spokes }: { spokes: IntelligenceSpokePage[] }) {
  // Group by parent hub
  const grouped: Record<string, IntelligenceSpokePage[]> = {};
  for (const spoke of spokes) {
    const key = spoke.parent_hub;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(spoke);
  }

  return (
    <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 p-5">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
        🔗 Supporting Pages ({spokes.length})
      </h3>
      <div className="space-y-3 mt-3">
        {Object.entries(grouped).map(([hubName, pages]) => (
          <div key={hubName}>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              {hubName}
            </div>
            <div className="space-y-1.5">
              {pages.map(spoke => (
                <div
                  key={spoke.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate flex-1">
                    {spoke.title}
                  </span>
                  {!spoke.is_connected && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium shrink-0">
                      orphaned
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrphanPagesCard({ orphans }: { orphans: IntelligenceOrphanPage[] }) {
  if (orphans.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 p-5">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
        ⚠️ Orphan Pages ({orphans.length})
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        These pages aren&apos;t connected to any silo — they&apos;re not passing authority
      </p>
      <div className="space-y-2">
        {orphans.map(orphan => (
          <div
            key={orphan.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {orphan.title}
              </div>
              <div className="text-xs text-slate-400 truncate">{orphan.url}</div>
              <div className="text-xs text-amber-600 mt-0.5">{orphan.recommendation}</div>
            </div>
            <button className="shrink-0 ml-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-700 text-white border border-slate-800 transition-colors">
              Assign to Silo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CannibalizationCard({ risks }: { risks: IntelligenceCannibalizationRisk[] }) {
  if (risks.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 p-5">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
        🚨 Cannibalization Risks ({risks.length})
      </h3>
      <div className="space-y-2 mt-3">
        {risks.map((risk, i) => (
          <div
            key={i}
            className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {risk.keyword}
              </span>
              <SeverityBadge severity={risk.severity} />
            </div>
            <div className="text-xs text-slate-500">
              Competing: {risk.pages.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentGapsSection({ gaps }: { gaps: IntelligenceContentGap[] }) {
  const hasGaps = gaps.some(g => g.missing_topics.length > 0);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
        📝 Content Gaps
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Topics your hub pages are missing — each gap is a new page opportunity
      </p>
      {!hasGaps ? (
        <div className="text-center py-4 text-green-600 text-sm font-medium">
          ✅ No gaps detected
        </div>
      ) : (
        <div className="space-y-4">
          {gaps
            .filter(g => g.missing_topics.length > 0)
            .map((gap, i) => (
              <div key={i}>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {gap.hub_title}
                </div>
                <div className="flex flex-wrap gap-2">
                  {gap.missing_topics.map((topic, j) => (
                    <div
                      key={j}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300"
                    >
                      {topic}
                      <button className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-1">
                        + Create Draft
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SiteIntelligencePanel({ siteId }: SiteIntelligencePanelProps) {
  const { toast } = useToast();
  const [intelligenceData, setIntelligenceData] = useState<IntelligenceResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  // GEO Visibility state
  const [siteGoals, setSiteGoals] = useState<SiteGoals | null>(null);
  const [pages, setPages] = useState<Page[]>([]);

  const loadCached = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, goals, sitePages] = await Promise.all([
        intelligenceService.get(siteId),
        goalsService.get(siteId).catch(() => null),
        pagesService.list(siteId).catch(() => [] as Page[]),
      ]);
      if (data) {
        setIntelligenceData(data);
        setLastGenerated(data.generated_at || null);
      }
      setSiteGoals(goals);
      setPages(sitePages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load intelligence data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadCached();
  }, [loadCached]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const data = await intelligenceService.generate(siteId);
      setIntelligenceData(data);
      setLastGenerated(data.generated_at || new Date().toISOString());
      toast({ title: '✅ Intelligence report generated' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate intelligence';
      setError(msg);
      toast({ title: 'Failed to generate', description: msg, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[30vh] text-slate-400 gap-2">
        <span className="inline-block w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        <p className="text-sm">Loading intelligence data...</p>
      </div>
    );
  }

  // ── GEO Visibility card ───────────────────────────────────────────────────

  const renderGeoVisibilityCard = () => {
    const hasGeoPages = siteGoals && siteGoals.geo_priority_pages && siteGoals.geo_priority_pages.length > 0;
    const geoPagesWithTitles = hasGeoPages
      ? siteGoals!.geo_priority_pages.map(id => pages.find(p => p.id === id)).filter((p): p is Page => p !== undefined)
      : [];

    return (
      <div className="rounded-xl border-2 border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
          🤖 GEO Visibility
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Pages you've selected to be cited by AI assistants like ChatGPT and Perplexity
        </p>

        {hasGeoPages ? (
          <div className="space-y-2 mb-4">
            {geoPagesWithTitles.length > 0 ? (
              geoPagesWithTitles.map(pg => (
                <div
                  key={pg.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40"
                >
                  <span className="text-violet-500 text-sm">🔗</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {pg.title || '(Untitled)'}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{pg.url}</div>
                  </div>
                </div>
              ))
            ) : (
              // IDs saved but pages not loaded yet / IDs no longer in list
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {siteGoals!.geo_priority_pages.length} page{siteGoals!.geo_priority_pages.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Set your GEO priority pages in Goals settings.
          </p>
        )}

        <button
          onClick={() => {
            // Navigate to Goals settings — set sessionStorage subtab key
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('siloq_settings_subtab', 'goals');
            }
            // Try to navigate via browser history (works if Settings mounts from same page)
            window.dispatchEvent(new CustomEvent('siloq:navigate', { detail: { tab: 'settings' } }));
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:bg-violet-900/30"
        >
          Go to Goals Settings →
        </button>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* GEO Visibility card — always visible at the top */}
      {renderGeoVisibilityCard()}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            🧠 Site Intelligence
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Powered by Claude AI — analyzes your full site architecture
          </p>
          {lastGenerated && (
            <p className="text-xs text-slate-400 mt-1">
              Last generated: {formatTimestamp(lastGenerated)}
            </p>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-slate-900 hover:bg-slate-700 text-white border border-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            'Generate SEO Plan'
          )}
        </button>
      </div>

      {/* Generating progress */}
      {isGenerating && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4 text-sm text-blue-700 dark:text-blue-300">
          Claude is analyzing your site architecture... (10-20 seconds)
        </div>
      )}

      {/* Error */}
      {error && !isGenerating && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!intelligenceData && !isGenerating && !error && (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-slate-400 gap-3">
          <span className="text-4xl">🧠</span>
          <p className="text-sm text-center max-w-md">
            No intelligence data yet. Click &quot;Generate SEO Plan&quot; to analyze your site with Claude AI.
          </p>
          <button
            onClick={handleGenerate}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-slate-900 hover:bg-slate-700 text-white border border-slate-800 transition-colors"
          >
            Generate SEO Plan
          </button>
        </div>
      )}

      {/* Results */}
      {intelligenceData && !isGenerating && (
        <>
          {/* 2x2 grid of cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HubPagesCard hubs={intelligenceData.hub_pages} />
            <SpokePagesCard spokes={intelligenceData.spoke_pages} />
            <OrphanPagesCard orphans={intelligenceData.orphan_pages} />
            <CannibalizationCard risks={intelligenceData.cannibalization_risks} />
          </div>

          {/* Content gaps — full width */}
          <ContentGapsSection gaps={intelligenceData.content_gaps} />
        </>
      )}
    </div>
  );
}
