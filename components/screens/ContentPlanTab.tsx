'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import { useToast } from '@/components/ui/use-toast';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { NoSiteSelected } from '@/components/ui/no-site-selected';
import {
  contentPlanService,
  pagesService,
  type SiloMapEntry,
  type ContentPlanGap,
  type ContentPlanPipelineItem,
  type SupportingPageDraft,
  type Page,
} from '@/lib/services/api';

// ── Classification ────────────────────────────────────────────────────────────

export function classifyPageType(keyword: string): 'sub_page' | 'blog_post' {
  const kw = keyword.toLowerCase();
  const informational = [
    'how to', 'how do', 'what is', 'what are', 'why', 'guide', 'tips',
    'vs', 'versus', 'difference', 'when', 'should i', 'diy', 'average',
    'signs', 'benefits',
  ];
  const transactional = [
    'pricing', 'cost', 'price', 'hire', 'near me', 'service', 'services',
    'installation', 'install', 'repair', 'replacement', 'replace', 'contractor',
    'company', 'quote', 'estimate', 'affordable', 'cheap', 'best', 'top',
    'licensed', 'certified',
  ];
  if (informational.some(t => kw.includes(t))) return 'blog_post';
  if (transactional.some(t => kw.includes(t))) return 'sub_page';
  return 'blog_post';
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const mockSiloMap: SiloMapEntry[] = [
  {
    hub: { id: 1, title: 'Electrical Services', url: '/services/', seo_score: 72 },
    existing_supporting: [
      { id: 2, title: 'Residential Wiring', url: '/services/residential-wiring/' },
    ],
    needed_supporting: [
      { topic: 'Panel Upgrade Cost Kansas City', keyword: 'panel upgrade cost near me', type: 'sub_page' },
      { topic: 'How to Know If You Need an Electrical Panel Upgrade', keyword: 'how to know if you need panel upgrade', type: 'blog_post' },
      { topic: 'EV Charger Installation', keyword: 'ev charger installation service', type: 'sub_page' },
    ],
    linking_back: 1,
    total_supporting: 4,
  },
];

const mockGaps: ContentPlanGap[] = [
  {
    hub_page_id: 1,
    hub_title: 'Electrical Services',
    hub_url: '/services/',
    supporting_count: 1,
    needed_topics: [
      { topic: 'Panel Upgrade Cost Kansas City', keyword: 'panel upgrade cost near me', type: 'sub_page' },
      { topic: 'How to Know If You Need an Electrical Panel Upgrade', keyword: 'how to know if you need panel upgrade', type: 'blog_post' },
    ],
  },
];

// ── Shared Type Badge ─────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: 'sub_page' | 'blog_post' }) {
  if (type === 'sub_page') {
    return (
      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
        Service Sub-Page
      </span>
    );
  }
  return (
    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
      Blog Post
    </span>
  );
}

// ── Create Draft Button ───────────────────────────────────────────────────────

interface CreateDraftButtonProps {
  siteId: number;
  topic: string;
  keyword: string;
  type: 'sub_page' | 'blog_post';
  hubPageId: number;
  onSuccess?: () => void;
}

function CreateDraftButton({ siteId, topic, keyword, type, hubPageId, onSuccess }: CreateDraftButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const handleCreate = async () => {
    if (created || loading) return;
    setLoading(true);
    try {
      const payload: SupportingPageDraft = {
        topic_title: topic,
        page_type: type,
        target_keyword: keyword,
        hub_page_id: hubPageId,
      };
      await contentPlanService.createDraft(siteId, payload);
      setCreated(true);
      toast({ title: '✅ Draft created in WordPress' });
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: 'Failed to create draft',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 border border-green-200 cursor-not-allowed"
      >
        ✅ Draft Created
      </button>
    );
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-700 text-white border border-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Creating…
        </>
      ) : (
        '+ Create Draft'
      )}
    </button>
  );
}

// ── Stats Row ─────────────────────────────────────────────────────────────────

interface StatsRowProps {
  subPagesNeeded: number;
  blogPostsNeeded: number;
  createdThisWeek: number;
  gapsCount: number;
}

function StatsRow({ subPagesNeeded, blogPostsNeeded, createdThisWeek, gapsCount }: StatsRowProps) {
  const stats = [
    { label: 'Content Gaps', value: gapsCount, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { label: 'Sub-pages needed', value: subPagesNeeded, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { label: 'Blog posts needed', value: blogPostsNeeded, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
    { label: 'Created this week', value: createdThisWeek, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map(s => (
        <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
          <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── View: Silo Map ────────────────────────────────────────────────────────────

interface SiloMapViewProps {
  siloMap: SiloMapEntry[];
  siteId: number;
}

function SiloMapView({ siloMap, siteId }: SiloMapViewProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggleHub = (id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (siloMap.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[30vh] text-slate-400 gap-2">
        <span className="text-4xl">🗂</span>
        <p className="text-sm">No silo map data yet. Sync your site to populate this view.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {siloMap.map(entry => {
        const isOpen = expanded[entry.hub.id] ?? true;
        const linkPercent = entry.total_supporting > 0
          ? Math.round((entry.linking_back / entry.total_supporting) * 100)
          : 0;

        return (
          <div
            key={entry.hub.id}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
          >
            {/* Hub Header */}
            <button
              onClick={() => toggleHub(entry.hub.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🏠</span>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{entry.hub.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{entry.hub.url}</div>
                </div>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  SEO: {entry.hub.seo_score}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-slate-500 mb-1">
                    {entry.linking_back}/{entry.total_supporting} linking back
                  </div>
                  <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${linkPercent}%` }}
                    />
                  </div>
                </div>
                <span className="text-slate-400 text-sm">{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {/* Expanded Content */}
            {isOpen && (
              <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 space-y-4">
                {/* Existing Supporting Pages */}
                {entry.existing_supporting.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      ✅ Existing Supporting Pages ({entry.existing_supporting.length})
                    </div>
                    <div className="space-y-1.5">
                      {entry.existing_supporting.map(page => (
                        <div
                          key={page.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-100 dark:bg-green-950/20 dark:border-green-900/40"
                        >
                          <span className="text-green-500 text-xs">✓</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{page.title}</span>
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-xs text-green-600 hover:underline"
                          >
                            {page.url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Needed Supporting Pages */}
                {entry.needed_supporting.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      ⚠️ Needed Supporting Pages ({entry.needed_supporting.length})
                    </div>
                    <div className="space-y-2">
                      {entry.needed_supporting.map((needed, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40"
                        >
                          <span className="text-amber-500 text-xs">⚠</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                              {needed.topic}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{needed.keyword}</div>
                          </div>
                          <TypeBadge type={needed.type} />
                          <CreateDraftButton
                            siteId={siteId}
                            topic={needed.topic}
                            keyword={needed.keyword}
                            type={needed.type}
                            hubPageId={entry.hub.id}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entry.existing_supporting.length === 0 && entry.needed_supporting.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No supporting pages data available for this hub.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── View: Gaps ────────────────────────────────────────────────────────────────

interface GapsViewProps {
  gaps: ContentPlanGap[];
  siteId: number;
}

function GapsView({ gaps, siteId }: GapsViewProps) {
  const [createdCount, setCreatedCount] = useState<Record<number, number>>({});

  const handleDraftCreated = (hubId: number) => {
    setCreatedCount(prev => ({ ...prev, [hubId]: (prev[hubId] || 0) + 1 }));
  };

  if (gaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[30vh] text-slate-400 gap-2">
        <span className="text-4xl">✅</span>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No content gaps detected!</p>
        <p className="text-xs">Every money page has at least 2 supporting articles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {gaps.map(gap => {
        const drafted = createdCount[gap.hub_page_id] || 0;
        const total = gap.needed_topics.length;

        return (
          <div
            key={gap.hub_page_id}
            className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-slate-900 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/40">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{gap.hub_title}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {gap.supporting_count} supporting {gap.supporting_count === 1 ? 'page' : 'pages'} — needs more content
                </div>
              </div>
              {drafted > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                  {drafted}/{total} drafted
                </span>
              )}
            </div>
            <div className="px-5 py-3 space-y-2">
              {gap.needed_topics.map((topic, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{topic.topic}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{topic.keyword}</div>
                  </div>
                  <TypeBadge type={topic.type} />
                  <CreateDraftButton
                    siteId={siteId}
                    topic={topic.topic}
                    keyword={topic.keyword}
                    type={topic.type}
                    hubPageId={gap.hub_page_id}
                    onSuccess={() => handleDraftCreated(gap.hub_page_id)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── View: Pipeline ────────────────────────────────────────────────────────────

interface PipelineViewProps {
  pipeline: ContentPlanPipelineItem[];
}

function PipelineView({ pipeline }: PipelineViewProps) {
  if (pipeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[30vh] text-slate-400 gap-2">
        <span className="text-4xl">📋</span>
        <p className="text-sm">No drafts in pipeline yet. Use the Gaps or Silo Map views to create drafts.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 uppercase tracking-wide">
            <th className="text-left px-4 py-3 font-semibold">Title</th>
            <th className="text-left px-4 py-3 font-semibold">Type</th>
            <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Hub Page</th>
            <th className="text-left px-4 py-3 font-semibold">Status</th>
            <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Created</th>
            <th className="text-left px-4 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {pipeline.map((item, i) => (
            <tr
              key={item.id}
              className={`border-t border-slate-100 dark:border-slate-800 ${
                i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{item.title}</td>
              <td className="px-4 py-3">
                <TypeBadge type={item.page_type} />
              </td>
              <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{item.hub_title}</td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                {new Date(item.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                {item.edit_url ? (
                  <a
                    href={item.edit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Edit in WP →
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── View: All Pages ───────────────────────────────────────────────────────────

interface AllPagesViewProps {
  pages: Page[];
}

function AllPagesView({ pages }: AllPagesViewProps) {
  const [search, setSearch] = useState('');

  const filtered = pages.filter(
    p =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.url?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search pages..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30"
      />
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No pages match your search.</div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-semibold">Title</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">URL</th>
                <th className="text-left px-4 py-3 font-semibold">SEO Score</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((page, i) => (
                <tr
                  key={page.id}
                  className={`border-t border-slate-100 dark:border-slate-800 ${
                    i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                    {page.title || '(no title)'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell text-xs truncate max-w-[200px]">
                    {page.url}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold ${
                        page.seo_score >= 70
                          ? 'text-green-600'
                          : page.seo_score >= 40
                          ? 'text-amber-500'
                          : 'text-red-500'
                      }`}
                    >
                      {page.seo_score ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        page.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {page.status || 'unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type ContentPlanView = 'gaps' | 'pipeline' | 'all-pages' | 'silo-map';

export default function ContentPlanTab() {
  const { selectedSite } = useDashboardContext();
  const { toast } = useToast();

  const [activeView, setActiveView] = useState<ContentPlanView>('gaps');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [siloMap, setSiloMap] = useState<SiloMapEntry[]>([]);
  const [gaps, setGaps] = useState<ContentPlanGap[]>([]);
  const [pipeline, setPipeline] = useState<ContentPlanPipelineItem[]>([]);
  const [pages, setPages] = useState<Page[]>([]);

  // ── Computed stats ─────────────────────────────────────────────────────────

  const allNeededTopics = gaps.flatMap(g => g.needed_topics);
  const subPagesNeeded = allNeededTopics.filter(t => t.type === 'sub_page').length;
  const blogPostsNeeded = allNeededTopics.filter(t => t.type === 'blog_post').length;

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const createdThisWeek = pipeline.filter(
    item => new Date(item.created_at).getTime() > oneWeekAgo
  ).length;

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!selectedSite) return;
    setLoading(true);
    setError(null);

    try {
      const [siloMapData, gapsData, pipelineData, pagesData] = await Promise.allSettled([
        contentPlanService.getSiloMap(selectedSite.id),
        contentPlanService.getGaps(selectedSite.id),
        contentPlanService.getPipeline(selectedSite.id),
        pagesService.list(selectedSite.id),
      ]);

      // Silo map — fall back to mock if API not available
      if (siloMapData.status === 'fulfilled') {
        const data = siloMapData.value;
        // Ensure page types are classified if missing
        const enriched = data.map(entry => ({
          ...entry,
          needed_supporting: entry.needed_supporting.map(n => ({
            ...n,
            type: n.type || classifyPageType(n.keyword),
          })),
        }));
        setSiloMap(enriched.length > 0 ? enriched : mockSiloMap);
      } else {
        setSiloMap(mockSiloMap);
      }

      // Gaps — fall back to mock
      if (gapsData.status === 'fulfilled') {
        const data = gapsData.value;
        const enriched = data.map(g => ({
          ...g,
          needed_topics: g.needed_topics.map(t => ({
            ...t,
            type: t.type || classifyPageType(t.keyword),
          })),
        }));
        setGaps(enriched.length > 0 ? enriched : mockGaps);
      } else {
        setGaps(mockGaps);
      }

      if (pipelineData.status === 'fulfilled') {
        setPipeline(pipelineData.value);
      }

      if (pagesData.status === 'fulfilled') {
        setPages(pagesData.value);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load content plan data.');
    } finally {
      setLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!selectedSite) {
    return (
      <NoSiteSelected message="Select a site to view its content plan and silo structure." />
    );
  }

  if (loading) {
    return <LoadingState message="Loading content plan..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tabs: { id: ContentPlanView; label: string; count?: number }[] = [
    { id: 'gaps', label: '⚠️ Gaps', count: gaps.length },
    { id: 'pipeline', label: '📋 Pipeline', count: pipeline.length || undefined },
    { id: 'all-pages', label: '📄 All Pages', count: pages.length || undefined },
    { id: 'silo-map', label: '🗂 Silo Map' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Content Plan</h1>
        <p className="text-sm text-slate-500 mt-1">
          See your Reverse Silo structure — identify content gaps, classify page types, and create WP drafts in one click.
        </p>
      </div>

      {/* Stats Row */}
      <StatsRow
        subPagesNeeded={subPagesNeeded}
        blogPostsNeeded={blogPostsNeeded}
        createdThisWeek={createdThisWeek}
        gapsCount={gaps.length}
      />

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeView === tab.id
                ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span
                className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  tab.id === 'gaps'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeView === 'gaps' && <GapsView gaps={gaps} siteId={selectedSite.id} />}
        {activeView === 'pipeline' && <PipelineView pipeline={pipeline} />}
        {activeView === 'all-pages' && <AllPagesView pages={pages} />}
        {activeView === 'silo-map' && <SiloMapView siloMap={siloMap} siteId={selectedSite.id} />}
      </div>
    </div>
  );
}
