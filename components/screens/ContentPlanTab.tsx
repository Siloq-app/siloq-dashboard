'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  AlertCircle,
  Plus,
  RefreshCw,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  PlayCircle,
  BarChart3,
  FlaskConical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchWithAuth } from '@/lib/auth-headers';
import { useToast } from '@/components/ui/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'gaps' | 'pipeline' | 'all';
type GapScore = 'high' | 'medium' | 'low';
type Priority = 'critical' | 'high' | 'medium' | 'low';
type PipelineStatus = 'pending' | 'approved' | 'in_progress' | 'completed';

interface TopicSuggestion {
  id: string;
  title: string;
  estimated_word_count: number;
  target_keyword: string;
}

interface ContentGap {
  page_id: number;
  page_title: string;
  page_url: string;
  supporting_count: number;
  recommended_supporting_count: number;
  gap_score: GapScore;
  priority: Priority;
  seo_score: number | null;
  word_count: number | null;
  topic_suggestions: TopicSuggestion[];
}

interface PipelineItem {
  id: number;
  topic: string;
  page_title: string;
  priority: Priority;
  estimated_word_count: number;
  assigned_date: string | null;
  status: PipelineStatus;
}

interface ContentPlanPage {
  page_id: number;
  page_title: string;
  page_url: string;
  supporting_count: number;
  recommended_supporting_count: number;
  gap_score: GapScore;
  priority: Priority;
  seo_score: number | null;
  word_count: number | null;
}

interface ContentPlanResponse {
  content_plan: ContentGap[];
  tab_badge_count: number;
  total_money_pages: number;
  pages_with_gaps: number;
}

interface PipelineResponse {
  content_plan: PipelineItem[];
}

interface AllPagesResponse {
  content_plan: ContentPlanPage[];
}

export interface ContentPlanTabProps {
  siteId?: number | string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_GAPS: ContentGap[] = [
  {
    page_id: 1,
    page_title: 'Best HVAC Services in Dallas',
    page_url: '/best-hvac-services-dallas',
    supporting_count: 0,
    recommended_supporting_count: 3,
    gap_score: 'high',
    priority: 'critical',
    seo_score: 42,
    word_count: 1200,
    topic_suggestions: [
      { id: 's1', title: 'How Often Should You Service Your AC in Dallas?', estimated_word_count: 800, target_keyword: 'AC service Dallas' },
      { id: 's2', title: 'Signs Your HVAC System Needs Replacement', estimated_word_count: 1000, target_keyword: 'HVAC replacement signs' },
      { id: 's3', title: 'Dallas HVAC Cost Guide: What to Expect', estimated_word_count: 1200, target_keyword: 'HVAC cost Dallas' },
    ],
  },
  {
    page_id: 2,
    page_title: 'Emergency Plumbing Services',
    page_url: '/emergency-plumbing-services',
    supporting_count: 1,
    recommended_supporting_count: 3,
    gap_score: 'high',
    priority: 'high',
    seo_score: 67,
    word_count: 2100,
    topic_suggestions: [
      { id: 's4', title: 'What Counts as a Plumbing Emergency?', estimated_word_count: 700, target_keyword: 'plumbing emergency' },
      { id: 's5', title: 'How to Shut Off Your Water in an Emergency', estimated_word_count: 600, target_keyword: 'shut off water emergency' },
      { id: 's6', title: 'Emergency Plumber Costs: What You Should Know', estimated_word_count: 900, target_keyword: 'emergency plumber cost' },
    ],
  },
  {
    page_id: 3,
    page_title: 'Roof Replacement Guide',
    page_url: '/roof-replacement-guide',
    supporting_count: 1,
    recommended_supporting_count: 4,
    gap_score: 'medium',
    priority: 'medium',
    seo_score: 78,
    word_count: 3400,
    topic_suggestions: [
      { id: 's7', title: 'Asphalt vs Metal Roofing: Pros and Cons', estimated_word_count: 1100, target_keyword: 'asphalt vs metal roof' },
      { id: 's8', title: 'How Long Does Roof Replacement Take?', estimated_word_count: 700, target_keyword: 'roof replacement time' },
      { id: 's9', title: 'Roof Replacement Financing Options', estimated_word_count: 800, target_keyword: 'roof replacement financing' },
    ],
  },
];

const MOCK_PIPELINE: PipelineItem[] = [
  { id: 1, topic: 'How Often Should You Service Your AC in Dallas?', page_title: 'Best HVAC Services in Dallas', priority: 'critical', estimated_word_count: 800, assigned_date: '2026-03-05', status: 'pending' },
  { id: 2, topic: 'What Counts as a Plumbing Emergency?', page_title: 'Emergency Plumbing Services', priority: 'high', estimated_word_count: 700, assigned_date: '2026-03-06', status: 'approved' },
  { id: 3, topic: 'Asphalt vs Metal Roofing: Pros and Cons', page_title: 'Roof Replacement Guide', priority: 'medium', estimated_word_count: 1100, assigned_date: '2026-03-03', status: 'in_progress' },
  { id: 4, topic: 'Roof Replacement Cost: What to Budget', page_title: 'Roof Replacement Guide', priority: 'high', estimated_word_count: 900, assigned_date: '2026-02-20', status: 'completed' },
];

const MOCK_ALL_PAGES: ContentPlanPage[] = [
  { page_id: 1, page_title: 'Best HVAC Services in Dallas', page_url: '/best-hvac-services-dallas', supporting_count: 0, recommended_supporting_count: 3, gap_score: 'high', priority: 'critical', seo_score: 42, word_count: 1200 },
  { page_id: 2, page_title: 'Emergency Plumbing Services', page_url: '/emergency-plumbing-services', supporting_count: 1, recommended_supporting_count: 3, gap_score: 'high', priority: 'high', seo_score: 67, word_count: 2100 },
  { page_id: 3, page_title: 'Roof Replacement Guide', page_url: '/roof-replacement-guide', supporting_count: 1, recommended_supporting_count: 4, gap_score: 'medium', priority: 'medium', seo_score: 78, word_count: 3400 },
  { page_id: 4, page_title: 'Water Heater Installation', page_url: '/water-heater-installation', supporting_count: 3, recommended_supporting_count: 3, gap_score: 'low', priority: 'low', seo_score: 85, word_count: 2800 },
  { page_id: 5, page_title: 'Air Duct Cleaning Services', page_url: '/air-duct-cleaning', supporting_count: 2, recommended_supporting_count: 3, gap_score: 'medium', priority: 'medium', seo_score: 71, word_count: 1900 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gapScoreBadge(score: GapScore) {
  const styles: Record<GapScore, string> = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[score]}`}>
      {score.charAt(0).toUpperCase() + score.slice(1)} Gap
    </span>
  );
}

function priorityBadge(priority: Priority) {
  const styles: Record<Priority, string> = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-slate-400 text-white',
  };
  return (
    <Badge className={`text-xs ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

function seoScoreColor(score: number | null): string {
  if (score === null) return 'text-slate-400';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DemoDataBanner() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 mb-4">
      <FlaskConical className="size-4 shrink-0" />
      <span>Demo data — connect your site to see real content gaps.</span>
    </div>
  );
}

interface GapCardProps {
  gap: ContentGap;
  onAddToPipeline: (pageId: number, topic: TopicSuggestion) => Promise<void>;
  addingTopicId: string | null;
}

function GapCard({ gap, onAddToPipeline, addingTopicId }: GapCardProps) {
  return (
    <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold text-slate-800 leading-snug">
              {gap.page_title}
            </CardTitle>
            <p className="text-xs text-slate-400 truncate mt-0.5">{gap.page_url}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {priorityBadge(gap.priority)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Supporting article count + gap score */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            <span className="font-medium text-slate-700">{gap.supporting_count}</span>
            {' '}of{' '}
            <span className="font-medium text-slate-700">{gap.recommended_supporting_count}</span>
            {' '}supporting articles
          </span>
          {gapScoreBadge(gap.gap_score)}
        </div>

        {/* Topic suggestions */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Topic suggestions</p>
          {gap.topic_suggestions.map((topic) => (
            <div key={topic.id} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-md border border-slate-100">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700 leading-snug">{topic.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">~{topic.estimated_word_count.toLocaleString()} words</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 h-6 text-xs px-2"
                disabled={addingTopicId === topic.id}
                onClick={() => onAddToPipeline(gap.page_id, topic)}
              >
                {addingTopicId === topic.id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <>
                    <Plus className="size-3 mr-1" />
                    Add
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Footer: SEO score + word count */}
        <div className="flex items-center gap-4 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <BarChart3 className="size-3 text-slate-400" />
            <span className={`text-xs font-medium ${seoScoreColor(gap.seo_score)}`}>
              {gap.seo_score !== null ? `${gap.seo_score} SEO` : 'Not scored'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="size-3 text-slate-400" />
            <span className="text-xs text-slate-500">
              {gap.word_count !== null ? `${gap.word_count.toLocaleString()} words` : '—'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PipelineColumnProps {
  title: string;
  status: PipelineStatus;
  items: PipelineItem[];
  icon: React.ReactNode;
  headerClass: string;
}

function PipelineColumn({ title, items, icon, headerClass }: PipelineColumnProps) {
  return (
    <div className="flex flex-col min-w-0">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-lg border border-b-0 ${headerClass}`}>
        {icon}
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto text-xs font-medium opacity-70">{items.length}</span>
      </div>
      <div className="border border-t-0 rounded-b-lg bg-slate-50 min-h-[200px] p-2 space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center pt-6">No items</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-md p-3 shadow-sm">
              <p className="text-xs font-medium text-slate-700 leading-snug">{item.topic}</p>
              <p className="text-xs text-slate-400 mt-1 truncate">{item.page_title}</p>
              <div className="flex items-center gap-2 mt-2">
                {priorityBadge(item.priority)}
                <span className="text-xs text-slate-400">~{item.estimated_word_count.toLocaleString()} words</span>
                {item.assigned_date && (
                  <span className="text-xs text-slate-400 ml-auto">{formatDate(item.assigned_date)}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContentPlanTab({ siteId }: ContentPlanTabProps) {
  const [view, setView] = useState<ViewMode>('gaps');
  const [gapsData, setGapsData] = useState<ContentGap[]>([]);
  const [pipelineData, setPipelineData] = useState<PipelineItem[]>([]);
  const [allPagesData, setAllPagesData] = useState<ContentPlanPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [stats, setStats] = useState({ total_money_pages: 0, pages_with_gaps: 0, tab_badge_count: 0 });
  const [addingTopicId, setAddingTopicId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async (currentView: ViewMode) => {
    if (!siteId) return;
    setLoading(true);
    setIsDemo(false);

    try {
      if (currentView === 'gaps') {
        const res = await fetchWithAuth(`/api/v1/sites/${siteId}/content-plan/`);
        if (res.status === 404) throw new Error('404');
        if (!res.ok) throw new Error(`${res.status}`);
        const data: ContentPlanResponse = await res.json();
        setGapsData(data.content_plan || []);
        setStats({
          total_money_pages: data.total_money_pages || 0,
          pages_with_gaps: data.pages_with_gaps || 0,
          tab_badge_count: data.tab_badge_count || 0,
        });
      } else if (currentView === 'pipeline') {
        const res = await fetchWithAuth(`/api/v1/sites/${siteId}/content-plan/?view=pipeline`);
        if (res.status === 404) throw new Error('404');
        if (!res.ok) throw new Error(`${res.status}`);
        const data: PipelineResponse = await res.json();
        setPipelineData(data.content_plan || []);
      } else {
        const res = await fetchWithAuth(`/api/v1/sites/${siteId}/content-plan/?view=all`);
        if (res.status === 404) throw new Error('404');
        if (!res.ok) throw new Error(`${res.status}`);
        const data: AllPagesResponse = await res.json();
        setAllPagesData(data.content_plan || []);
      }
    } catch {
      // Fallback to mock data
      setIsDemo(true);
      if (currentView === 'gaps') {
        setGapsData(MOCK_GAPS);
        setStats({ total_money_pages: 5, pages_with_gaps: 3, tab_badge_count: 3 });
      } else if (currentView === 'pipeline') {
        setPipelineData(MOCK_PIPELINE);
      } else {
        setAllPagesData(MOCK_ALL_PAGES);
      }
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchData(view);
  }, [fetchData, view]);

  const handleAddToPipeline = useCallback(async (pageId: number, topic: TopicSuggestion) => {
    setAddingTopicId(topic.id);
    try {
      const res = await fetchWithAuth(`/api/v1/sites/${siteId}/pages/${pageId}/add-to-pipeline/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_title: topic.title, estimated_word_count: topic.estimated_word_count }),
      });
      if (res.ok) {
        toast({ title: 'Added to pipeline', description: `"${topic.title}" added.` });
      } else if (res.status === 404) {
        toast({ title: 'Added (demo)', description: 'Pipeline endpoint not yet active.', variant: 'default' });
      } else {
        throw new Error(`${res.status}`);
      }
    } catch {
      toast({ title: 'Added (demo)', description: `"${topic.title}" would be added to your pipeline.`, variant: 'default' });
    } finally {
      setAddingTopicId(null);
    }
  }, [siteId, toast]);

  // Pipeline columns
  const pipelineColumns: { title: string; status: PipelineStatus; icon: React.ReactNode; headerClass: string }[] = [
    {
      title: 'Pending',
      status: 'pending',
      icon: <Clock className="size-4 text-slate-500" />,
      headerClass: 'bg-slate-100 border-slate-200 text-slate-700',
    },
    {
      title: 'Approved',
      status: 'approved',
      icon: <CheckCircle2 className="size-4 text-blue-500" />,
      headerClass: 'bg-blue-50 border-blue-200 text-blue-700',
    },
    {
      title: 'In Progress',
      status: 'in_progress',
      icon: <PlayCircle className="size-4 text-yellow-500" />,
      headerClass: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    },
    {
      title: 'Completed',
      status: 'completed',
      icon: <CheckCircle2 className="size-4 text-green-500" />,
      headerClass: 'bg-green-50 border-green-200 text-green-700',
    },
  ];

  const noSite = !siteId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="size-5 text-indigo-500" />
            Content Plan
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Identify content gaps and manage your content creation pipeline.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(view)}
          disabled={loading || noSite}
        >
          <RefreshCw className={`size-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* No site selected */}
      {noSite && (
        <Card className="border border-slate-200">
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="size-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No site selected</p>
            <p className="text-xs text-slate-400">Select a site to view content planning data.</p>
          </CardContent>
        </Card>
      )}

      {!noSite && (
        <>
          {/* Stats row */}
          {view === 'gaps' && !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="py-4 px-4">
                  <p className="text-xs text-slate-500">Money Pages</p>
                  <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats.total_money_pages}</p>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="py-4 px-4">
                  <p className="text-xs text-slate-500">Pages with Gaps</p>
                  <p className="text-2xl font-bold text-red-600 mt-0.5">{stats.pages_with_gaps}</p>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
                <CardContent className="py-4 px-4">
                  <p className="text-xs text-slate-500">Topics Needed</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-0.5">{stats.tab_badge_count}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Demo banner */}
          {isDemo && <DemoDataBanner />}

          {/* View toggle pills */}
          <div className="flex gap-2">
            {(['gaps', 'pipeline', 'all'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  view === v
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {v === 'gaps' ? 'Gaps' : v === 'pipeline' ? 'Pipeline' : 'All Pages'}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          )}

          {/* ── Gaps View ─────────────────────────────────────────────── */}
          {!loading && view === 'gaps' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {gapsData.length === 0 ? (
                <div className="col-span-full">
                  <Card className="border border-slate-200">
                    <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
                      <CheckCircle2 className="size-8 text-green-400" />
                      <p className="text-sm font-medium text-slate-600">No content gaps found</p>
                      <p className="text-xs text-slate-400">All your money pages have sufficient supporting content.</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                gapsData.map((gap) => (
                  <GapCard
                    key={gap.page_id}
                    gap={gap}
                    onAddToPipeline={handleAddToPipeline}
                    addingTopicId={addingTopicId}
                  />
                ))
              )}
            </div>
          )}

          {/* ── Pipeline View ──────────────────────────────────────────── */}
          {!loading && view === 'pipeline' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {pipelineColumns.map((col) => (
                <PipelineColumn
                  key={col.status}
                  title={col.title}
                  status={col.status}
                  items={pipelineData.filter((i) => i.status === col.status)}
                  icon={col.icon}
                  headerClass={col.headerClass}
                />
              ))}
            </div>
          )}

          {/* ── All Pages View ─────────────────────────────────────────── */}
          {!loading && view === 'all' && (
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Page</th>
                        <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden sm:table-cell">Support</th>
                        <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Gap</th>
                        <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">Priority</th>
                        <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">SEO Score</th>
                        <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">Words</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPagesData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-400 text-xs">No pages found.</td>
                        </tr>
                      ) : (
                        allPagesData.map((page) => (
                          <tr key={page.page_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-800 text-xs leading-snug">{page.page_title}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[180px]">{page.page_url}</p>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className="text-xs text-slate-600">
                                {page.supporting_count}/{page.recommended_supporting_count}
                              </span>
                            </td>
                            <td className="px-4 py-3">{gapScoreBadge(page.gap_score)}</td>
                            <td className="px-4 py-3 hidden md:table-cell">{priorityBadge(page.priority)}</td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <span className={`text-xs font-medium ${seoScoreColor(page.seo_score)}`}>
                                {page.seo_score !== null ? page.seo_score : '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <span className="text-xs text-slate-500">
                                {page.word_count !== null ? page.word_count.toLocaleString() : '—'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
