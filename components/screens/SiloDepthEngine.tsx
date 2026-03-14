'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Plus,
  Link2,
  Target,
  BarChart3,
  FileText,
  Settings2,
  X,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import {
  depthEngineService,
  pagesService,
  type SiloDepthScore,
  type SubtopicMap,
  type SubtopicItem,
  type GapReport,
  type GapItem,
  type TopicBoundary,
  type LinkRelationship,
  type CoverageStatus,
  type Page,
} from '@/lib/services/api';
import { toast } from 'sonner';

interface Props {
  siloId: string;
  siloName: string;
  onBack: () => void;
}

type TabKey = 'overview' | 'coverage' | 'gaps' | 'pages' | 'links' | 'boundary';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
  { key: 'coverage', label: 'Coverage Map', icon: <Target className="h-4 w-4" /> },
  { key: 'gaps', label: 'Content Gaps', icon: <FileText className="h-4 w-4" /> },
  { key: 'pages', label: 'Pages', icon: <FileText className="h-4 w-4" /> },
  { key: 'links', label: 'Link Relationships', icon: <Link2 className="h-4 w-4" /> },
  { key: 'boundary', label: 'Topic Boundary', icon: <Settings2 className="h-4 w-4" /> },
];

function getScoreColor(score: number): string {
  if (score >= 80) return '#27AE60';
  if (score >= 60) return '#D4A017';
  if (score >= 40) return '#F5A623';
  return '#DC2626';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500/10 text-green-600';
  if (score >= 60) return 'bg-yellow-500/10 text-yellow-600';
  if (score >= 40) return 'bg-orange-500/10 text-orange-600';
  return 'bg-red-500/10 text-red-600';
}

const COVERAGE_BADGE: Record<CoverageStatus, { bg: string; label: string }> = {
  covered: { bg: 'bg-green-500/10 text-green-600', label: 'Covered' },
  thin: { bg: 'bg-yellow-500/10 text-yellow-600', label: 'Thin' },
  missing: { bg: 'bg-red-500/10 text-red-600', label: 'Missing' },
  stale: { bg: 'bg-orange-500/10 text-orange-600', label: 'Stale' },
};

const SUBTOPIC_TYPE_LABELS: Record<string, string> = {
  core: 'Core',
  supporting: 'Supporting',
  adjacent: 'Adjacent',
  edge_case: 'Edge Case',
  comparative: 'Comparative',
  evidence: 'Evidence',
};

// --- Score Card ---
function ScoreCard({ value, label, subtitle }: { value: number; label: string; subtitle?: string }) {
  return (
    <Card className="p-4 flex flex-col items-center text-center">
      <span className="text-3xl font-bold tabular-nums" style={{ color: getScoreColor(value) }}>
        {typeof value === 'number' && !isNaN(value) ? Math.round(value) : '—'}
      </span>
      <span className="text-sm font-medium mt-1">{label}</span>
      {subtitle && <span className="text-xs text-muted-foreground mt-0.5">{subtitle}</span>}
    </Card>
  );
}

// --- Mistake Flag Banner ---
function MistakeFlagBanner({ flags }: { flags: string[] }) {
  if (flags.length === 0) return null;
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3 mb-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm">
          <span className="font-medium text-amber-800 dark:text-amber-300">Depth issues detected:</span>
          <ul className="mt-1 space-y-0.5">
            {flags.map((f, i) => (
              <li key={i} className="text-amber-700 dark:text-amber-400">{f}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- Tag Input ---
function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          className="text-sm"
        />
        <Button size="sm" variant="outline" onClick={add} disabled={!input.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}

// --- Gap Section ---
function GapSection({
  title,
  items,
  siteId,
  siloId,
  onAdded,
}: {
  title: string;
  items: GapItem[];
  siteId: number | string;
  siloId: string;
  onAdded: () => void;
}) {
  const [addingId, setAddingId] = useState<number | null>(null);

  if (items.length === 0) return null;

  const handleAdd = async (item: GapItem) => {
    setAddingId(item.id);
    try {
      await depthEngineService.addSubtopicToPlan(siteId, siloId, item.id, item.content_type);
      toast.success(`Added "${item.subtopic_label}" to content plan`);
      onAdded();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to add to plan');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{title} ({items.length})</h4>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-2 font-medium">Subtopic</th>
              <th className="text-left p-2 font-medium">Type</th>
              <th className="text-center p-2 font-medium">Priority</th>
              <th className="text-right p-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="p-2">{item.subtopic_label}</td>
                <td className="p-2 text-muted-foreground">{SUBTOPIC_TYPE_LABELS[item.subtopic_type] || item.subtopic_type}</td>
                <td className="p-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getScoreBg(item.priority_score)}`}>
                    {item.priority_score}
                  </span>
                </td>
                <td className="p-2 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={addingId === item.id}
                    onClick={() => handleAdd(item)}
                  >
                    {addingId === item.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <><Plus className="h-3 w-3 mr-1" /> Add to Plan</>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// === MAIN COMPONENT ===

export default function SiloDepthEngine({ siloId, siloName, onBack }: Props) {
  const { selectedSite } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Data states
  const [scores, setScores] = useState<SiloDepthScore | null>(null);
  const [subtopicMap, setSubtopicMap] = useState<SubtopicMap | null>(null);
  const [gapReport, setGapReport] = useState<GapReport | null>(null);
  const [boundary, setBoundary] = useState<TopicBoundary | null>(null);
  const [links, setLinks] = useState<LinkRelationship[]>([]);
  const [pages, setPages] = useState<Page[]>([]);

  // Loading/error
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isAssessingLinks, setIsAssessingLinks] = useState(false);
  const [isSavingBoundary, setIsSavingBoundary] = useState(false);

  // Boundary form
  const [boundaryForm, setBoundaryForm] = useState<{
    core_topic: string;
    adjacent_topics: string[];
    out_of_scope_topics: string[];
    entity_type_override: string;
  }>({ core_topic: '', adjacent_topics: [], out_of_scope_topics: [], entity_type_override: '' });

  const siteId = selectedSite?.id;

  const loadData = useCallback(async () => {
    if (!siteId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [scoresData, mapData, gapData, boundaryData, linksData, pagesData] = await Promise.allSettled([
        depthEngineService.getDepthScores(siteId, siloId),
        depthEngineService.getSubtopicMap(siteId, siloId),
        depthEngineService.getGapReport(siteId, siloId),
        depthEngineService.getTopicBoundary(siteId, siloId),
        depthEngineService.getLinkRelationships(siteId, siloId),
        pagesService.list(siteId),
      ]);

      if (scoresData.status === 'fulfilled') setScores(scoresData.value);
      if (mapData.status === 'fulfilled') setSubtopicMap(mapData.value);
      if (gapData.status === 'fulfilled') setGapReport(gapData.value);
      if (boundaryData.status === 'fulfilled') {
        setBoundary(boundaryData.value);
        setBoundaryForm({
          core_topic: boundaryData.value.core_topic || '',
          adjacent_topics: boundaryData.value.adjacent_topics || [],
          out_of_scope_topics: boundaryData.value.out_of_scope_topics || [],
          entity_type_override: boundaryData.value.entity_type_override || '',
        });
      }
      if (linksData.status === 'fulfilled') setLinks(linksData.value);
      if (pagesData.status === 'fulfilled') setPages(pagesData.value);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load depth data');
    } finally {
      setIsLoading(false);
    }
  }, [siteId, siloId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunScan = async () => {
    if (!siteId) return;
    setIsScanning(true);
    try {
      await depthEngineService.generateSubtopicMap(siteId, siloId);
      await depthEngineService.refreshDepthScores(siteId, siloId);
      toast.success('Depth scan complete');
      await loadData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAssessLinks = async () => {
    if (!siteId) return;
    setIsAssessingLinks(true);
    try {
      const result = await depthEngineService.assessLinkRelationships(siteId, siloId);
      setLinks(result);
      toast.success('Link assessment complete');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Assessment failed');
    } finally {
      setIsAssessingLinks(false);
    }
  };

  const handleSaveBoundary = async () => {
    if (!siteId) return;
    setIsSavingBoundary(true);
    try {
      const result = await depthEngineService.saveTopicBoundary(siteId, siloId, {
        core_topic: boundaryForm.core_topic,
        adjacent_topics: boundaryForm.adjacent_topics,
        out_of_scope_topics: boundaryForm.out_of_scope_topics,
        entity_type_override: boundaryForm.entity_type_override || null,
      });
      setBoundary(result);
      toast.success('Topic boundary saved');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save boundary');
    } finally {
      setIsSavingBoundary(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Loading depth analysis for {siloName}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-4" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4" onClick={loadData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h2 className="text-lg font-semibold">Depth Analysis: {siloName}</h2>
        </div>
        <Button
          size="sm"
          onClick={handleRunScan}
          disabled={isScanning}
        >
          {isScanning ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Scanning...</>
          ) : (
            <><RefreshCw className="h-4 w-4 mr-1" /> Run Scan</>
          )}
        </Button>
      </div>

      {/* Mistake flag banner */}
      {scores && <MistakeFlagBanner flags={scores.depth_mistake_flags} />}

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab scores={scores} gapReport={gapReport} />
      )}
      {activeTab === 'coverage' && (
        <CoverageTab subtopicMap={subtopicMap} />
      )}
      {activeTab === 'gaps' && siteId && (
        <GapsTab gapReport={gapReport} siteId={siteId} siloId={siloId} onRefresh={loadData} />
      )}
      {activeTab === 'pages' && (
        <PagesTab pages={pages} />
      )}
      {activeTab === 'links' && (
        <LinksTab
          links={links}
          isAssessing={isAssessingLinks}
          onAssess={handleAssessLinks}
        />
      )}
      {activeTab === 'boundary' && (
        <BoundaryTab
          form={boundaryForm}
          onChange={setBoundaryForm}
          onSave={handleSaveBoundary}
          isSaving={isSavingBoundary}
        />
      )}
    </div>
  );
}

// === TAB COMPONENTS ===

function OverviewTab({ scores, gapReport }: { scores: SiloDepthScore | null; gapReport: GapReport | null }) {
  if (!scores) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No depth scores yet. Click &quot;Run Scan&quot; to generate.
      </div>
    );
  }

  const criticalGaps = gapReport?.critical_gaps.slice(0, 4) || [];

  return (
    <div className="space-y-6">
      {/* Score cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard value={scores.semantic_density_score} label="Semantic Density" subtitle="Content richness" />
        <ScoreCard value={scores.topical_closure_score} label="Topical Closure" subtitle="Topic completeness" />
        <ScoreCard value={scores.coverage_breadth_pct} label="Coverage Breadth" subtitle="% subtopics covered" />
        <ScoreCard value={scores.freshness_score} label="Freshness" subtitle="Content recency" />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3 text-center">
          <div className="text-lg font-bold tabular-nums">{scores.missing_subtopic_count}</div>
          <div className="text-xs text-muted-foreground">Missing Subtopics</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-lg font-bold tabular-nums">{scores.thin_page_count}</div>
          <div className="text-xs text-muted-foreground">Thin Pages</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-lg font-bold tabular-nums">{scores.stale_page_count}</div>
          <div className="text-xs text-muted-foreground">Stale Pages</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-lg font-bold tabular-nums">{scores.disconnected_page_count}</div>
          <div className="text-xs text-muted-foreground">Disconnected</div>
        </Card>
        <Card className="p-3 text-center">
          <div className={`text-lg font-bold ${scores.scope_creep_flag ? 'text-amber-600' : 'text-green-600'}`}>
            {scores.scope_creep_flag ? 'Yes' : 'No'}
          </div>
          <div className="text-xs text-muted-foreground">Scope Creep</div>
        </Card>
      </div>

      {/* Top critical gaps */}
      {criticalGaps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Top Critical Gaps</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2 font-medium">Subtopic</th>
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-center p-2 font-medium">Priority</th>
                  <th className="text-left p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {criticalGaps.map((g) => (
                  <tr key={g.id} className="border-b last:border-0">
                    <td className="p-2 font-medium">{g.subtopic_label}</td>
                    <td className="p-2 text-muted-foreground">{SUBTOPIC_TYPE_LABELS[g.subtopic_type] || g.subtopic_type}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getScoreBg(g.priority_score)}`}>
                        {g.priority_score}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${COVERAGE_BADGE[g.coverage_status].bg}`}>
                        {COVERAGE_BADGE[g.coverage_status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {gapReport && (
        <div className="text-xs text-muted-foreground">
          Total gaps: {gapReport.total_gap_count} | Estimated closure gap: {gapReport.estimated_closure_gap}
        </div>
      )}
    </div>
  );
}

function CoverageTab({ subtopicMap }: { subtopicMap: SubtopicMap | null }) {
  if (!subtopicMap || subtopicMap.subtopics.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No subtopic map generated yet. Click &quot;Run Scan&quot; to generate.
      </div>
    );
  }

  const groups = subtopicMap.grouped;
  const typeOrder: (keyof typeof groups)[] = ['core', 'supporting', 'adjacent', 'edge_case', 'comparative', 'evidence'];

  return (
    <div className="space-y-6">
      {typeOrder.map((type) => {
        const items = groups[type];
        if (!items || items.length === 0) return null;
        return (
          <div key={type}>
            <h3 className="text-sm font-semibold mb-2">
              {SUBTOPIC_TYPE_LABELS[type]} ({items.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item: SubtopicItem) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{item.subtopic_label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.subtopic_slug}</div>
                    </div>
                    <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${COVERAGE_BADGE[item.coverage_status].bg}`}>
                      {COVERAGE_BADGE[item.coverage_status].label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>Priority: {item.priority_score}</span>
                    {item.mapped_page_id && <span>Page #{item.mapped_page_id}</span>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GapsTab({
  gapReport,
  siteId,
  siloId,
  onRefresh,
}: {
  gapReport: GapReport | null;
  siteId: number | string;
  siloId: string;
  onRefresh: () => void;
}) {
  if (!gapReport) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No gap report available. Click &quot;Run Scan&quot; to generate.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GapSection
        title="Critical Gaps (priority >= 80, missing)"
        items={gapReport.critical_gaps}
        siteId={siteId}
        siloId={siloId}
        onAdded={onRefresh}
      />
      <GapSection
        title="Thin Content (priority >= 70)"
        items={gapReport.thin_pages}
        siteId={siteId}
        siloId={siloId}
        onAdded={onRefresh}
      />
      <GapSection
        title="Stale Content (priority >= 60)"
        items={gapReport.stale_pages}
        siteId={siteId}
        siloId={siloId}
        onAdded={onRefresh}
      />
      <GapSection
        title="Standard Gaps (priority 50-79)"
        items={gapReport.standard_gaps}
        siteId={siteId}
        siloId={siloId}
        onAdded={onRefresh}
      />
      <div className="text-xs text-muted-foreground">
        Total gaps: {gapReport.total_gap_count} | Estimated closure: {gapReport.estimated_closure_gap}
      </div>
    </div>
  );
}

function PagesTab({ pages }: { pages: Page[] }) {
  if (pages.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No pages found in this silo.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-2 font-medium">Page</th>
            <th className="text-left p-2 font-medium">Status</th>
            <th className="text-center p-2 font-medium">SEO Score</th>
            <th className="text-center p-2 font-medium">Issues</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.id} className="border-b last:border-0">
              <td className="p-2">
                <div className="font-medium truncate max-w-xs">{page.title || page.url}</div>
                <div className="text-xs text-muted-foreground truncate max-w-xs">{page.url}</div>
              </td>
              <td className="p-2 text-muted-foreground">{page.status}</td>
              <td className="p-2 text-center">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getScoreBg(page.seo_score)}`}>
                  {page.seo_score}
                </span>
              </td>
              <td className="p-2 text-center tabular-nums">{page.issue_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LinksTab({
  links,
  isAssessing,
  onAssess,
}: {
  links: LinkRelationship[];
  isAssessing: boolean;
  onAssess: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={onAssess} disabled={isAssessing}>
          {isAssessing ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Assessing...</>
          ) : (
            <><RefreshCw className="h-4 w-4 mr-1" /> Run Assessment</>
          )}
        </Button>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No link relationships found. Click &quot;Run Assessment&quot; to analyze.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium">Source</th>
                <th className="text-left p-2 font-medium">Target</th>
                <th className="text-left p-2 font-medium">Type</th>
                <th className="text-left p-2 font-medium">Anchor</th>
                <th className="text-center p-2 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-b last:border-0">
                  <td className="p-2 tabular-nums">Page #{link.source_page_id}</td>
                  <td className="p-2 tabular-nums">Page #{link.target_page_id}</td>
                  <td className="p-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600">
                      {link.relationship_type}
                    </span>
                  </td>
                  <td className="p-2 text-muted-foreground truncate max-w-[200px]">{link.anchor_text}</td>
                  <td className="p-2 text-center tabular-nums">
                    {Math.round(link.relationship_confidence * 100)}%
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

function BoundaryTab({
  form,
  onChange,
  onSave,
  isSaving,
}: {
  form: {
    core_topic: string;
    adjacent_topics: string[];
    out_of_scope_topics: string[];
    entity_type_override: string;
  };
  onChange: (f: typeof form) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <label className="text-sm font-medium mb-1 block">Core Topic</label>
        <Input
          value={form.core_topic}
          onChange={(e) => onChange({ ...form, core_topic: e.target.value })}
          placeholder="e.g. Custom Cheerleading Uniforms"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Adjacent Topics</label>
        <TagInput
          value={form.adjacent_topics}
          onChange={(v) => onChange({ ...form, adjacent_topics: v })}
          placeholder="Add an adjacent topic..."
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Out of Scope Topics</label>
        <TagInput
          value={form.out_of_scope_topics}
          onChange={(v) => onChange({ ...form, out_of_scope_topics: v })}
          placeholder="Add an out-of-scope topic..."
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Entity Type Override</label>
        <select
          value={form.entity_type_override}
          onChange={(e) => onChange({ ...form, entity_type_override: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Auto-detect</option>
          <option value="brand">Brand</option>
          <option value="brand_line">Brand Line</option>
          <option value="product_category">Product Category</option>
          <option value="service_type">Service Type</option>
          <option value="location">Location</option>
        </select>
      </div>

      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving...</>
        ) : (
          'Save Boundary'
        )}
      </Button>
    </div>
  );
}
