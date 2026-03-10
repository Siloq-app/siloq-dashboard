'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Zap,
  FileText,
  TrendingUp,
  Heart,
  ArrowRight,
  RefreshCw,
  Loader2,
  BookOpen,
  Link2,
  BarChart2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TabType } from '@/app/dashboard/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface FixNowItem {
  id: number | string;
  title: string;
  severity: Severity;
  description: string;
  cta_label: string;
  navigate_to: TabType;
  category: 'conflict' | 'score' | 'gap';
}

interface InProgressItem {
  id: number | string;
  title: string;
  status: 'generating' | 'review' | 'pushing' | 'scheduled';
  progress: number; // 0–100
  description: string;
}

interface DoneItem {
  id: number | string;
  title: string;
  completed_at: string;
  impact: string;
  category: 'conflict' | 'content' | 'optimization';
}

interface DashboardStats {
  active_conflicts: number;
  content_generated: number;
  pages_optimized: number;
  health_score: number;
}

interface DashboardData {
  fix_now: FixNowItem[];
  in_progress: InProgressItem[];
  done_this_month: DoneItem[];
  stats: DashboardStats;
}

// ─── Mock data (used when API 404s or is unavailable) ────────────────────────

const MOCK_DATA: DashboardData = {
  stats: {
    active_conflicts: 7,
    content_generated: 12,
    pages_optimized: 24,
    health_score: 68,
  },
  fix_now: [
    {
      id: 1,
      title: 'Keyword cannibalization: "seo audit"',
      severity: 'critical',
      description: '3 pages are splitting clicks for this high-value keyword, costing you an estimated 40% of potential traffic.',
      cta_label: 'Resolve Conflict',
      navigate_to: 'conflicts',
      category: 'conflict',
    },
    {
      id: 2,
      title: 'Low analysis score: /services/local-seo',
      severity: 'high',
      description: 'Page scored 34/100 on content depth analysis. Missing topical coverage and internal linking.',
      cta_label: 'View Page',
      navigate_to: 'pages',
      category: 'score',
    },
    {
      id: 3,
      title: 'Content gap: "plumber near me"',
      severity: 'high',
      description: 'Money page has only 1 supporting article. Needs 2+ to build topical authority in this silo.',
      cta_label: 'Generate Content',
      navigate_to: 'content',
      category: 'gap',
    },
    {
      id: 4,
      title: 'Keyword cannibalization: "emergency plumber"',
      severity: 'medium',
      description: '2 pages are competing for this keyword. Moderate traffic impact detected.',
      cta_label: 'Resolve Conflict',
      navigate_to: 'conflicts',
      category: 'conflict',
    },
  ],
  in_progress: [
    {
      id: 1,
      title: '"Best HVAC Services" — Supporting Article',
      status: 'generating',
      progress: 65,
      description: 'AI content generation in progress for the HVAC silo.',
    },
    {
      id: 2,
      title: 'Redirect: /old-services → /services',
      status: 'pushing',
      progress: 90,
      description: 'WordPress push in progress — applying redirect via plugin.',
    },
    {
      id: 3,
      title: '"Roof Replacement Cost" — Blog Post',
      status: 'review',
      progress: 100,
      description: 'Content ready. Awaiting your approval before publishing.',
    },
  ],
  done_this_month: [
    {
      id: 1,
      title: 'Resolved: "roof repair" cannibalization',
      completed_at: '2026-03-01',
      impact: '+18% CTR on target page',
      category: 'conflict',
    },
    {
      id: 2,
      title: '"Water Heater Installation" — Published',
      completed_at: '2026-03-02',
      impact: 'New supporting article live in HVAC silo',
      category: 'content',
    },
    {
      id: 3,
      title: 'Meta optimized: /services/ac-repair',
      completed_at: '2026-02-28',
      impact: 'Title tag and description updated for target keyword',
      category: 'optimization',
    },
    {
      id: 4,
      title: 'Internal links: 8 new links added',
      completed_at: '2026-02-27',
      impact: 'Improved crawl depth across Plumbing silo',
      category: 'optimization',
    },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-200' },
  high:     { label: 'High',     className: 'bg-orange-100 text-orange-700 border-orange-200' },
  medium:   { label: 'Medium',   className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low:      { label: 'Low',      className: 'bg-green-100 text-green-700 border-green-200' },
};

const STATUS_CONFIG: Record<InProgressItem['status'], { label: string; className: string }> = {
  generating: { label: 'Generating',  className: 'bg-blue-100 text-blue-700 border-blue-200' },
  review:     { label: 'Needs Review', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  pushing:    { label: 'Pushing',     className: 'bg-purple-100 text-purple-700 border-purple-200' },
  scheduled:  { label: 'Scheduled',  className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const CATEGORY_ICON: Record<FixNowItem['category'], React.ReactNode> = {
  conflict: <AlertTriangle className="w-4 h-4" />,
  score:    <BarChart2 className="w-4 h-4" />,
  gap:      <BookOpen className="w-4 h-4" />,
};

const DONE_ICON: Record<DoneItem['category'], React.ReactNode> = {
  conflict:     <AlertTriangle className="w-4 h-4 text-green-600" />,
  content:      <FileText className="w-4 h-4 text-green-600" />,
  optimization: <Link2 className="w-4 h-4 text-green-600" />,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMonthLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-5 py-4 flex-1 min-w-0 hover:border-slate-300 transition-colors">
      <div className="p-2 rounded-lg bg-slate-50 text-slate-600 shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-900 leading-none">{value}</div>
        <div className="text-xs text-slate-500 mt-1 truncate">{label}</div>
        {sub && <div className="text-xs text-slate-400 truncate">{sub}</div>}
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color =
    pct === 100 ? 'bg-green-500' :
    pct >= 60   ? 'bg-blue-500'  :
                  'bg-amber-400';
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function EmptyColumn({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-3 rounded-full bg-slate-100 text-slate-400 mb-3">{icon}</div>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface DashboardHomeProps {
  siteId: number | null;
  onNavigate: (tab: TabType) => void;
}

export default function DashboardHome({ siteId, onNavigate }: DashboardHomeProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${apiBase}/api/v1/sites/${siteId}/dashboard/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setUsingMock(false);
    } catch {
      setData(MOCK_DATA);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (siteId) load();
    else {
      setData(MOCK_DATA);
      setUsingMock(true);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, fix_now, in_progress, done_this_month } = data;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">{getMonthLabel()}</p>
        </div>
        <div className="flex items-center gap-2">
          {usingMock && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
              Demo data
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="flex gap-3 flex-wrap">
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Active Conflicts"
          value={stats.active_conflicts}
        />
        <StatCard
          icon={<FileText className="w-4 h-4" />}
          label="Content Generated"
          value={stats.content_generated}
          sub="this month"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Pages Optimized"
          value={stats.pages_optimized}
          sub="this month"
        />
        <StatCard
          icon={<Heart className="w-4 h-4" />}
          label="Health Score"
          value={`${stats.health_score}%`}
          sub={stats.health_score >= 80 ? '🟢 Strong' : stats.health_score >= 60 ? '🟡 Fair' : '🔴 Needs work'}
        />
      </div>

      {/* ── 3-Column Layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* ── Column 1: Fix Now ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-sm text-slate-800">Fix Now</h2>
            <span className="ml-auto text-xs font-medium bg-red-100 text-red-600 rounded-full px-2 py-0.5">
              {fix_now.length}
            </span>
          </div>

          {fix_now.length === 0 ? (
            <EmptyColumn
              icon={<CheckCircle2 className="w-5 h-5" />}
              message="Nothing urgent right now. Nice work! 🎉"
            />
          ) : (
            fix_now.map((item) => (
              <Card
                key={item.id}
                className="border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all rounded-xl overflow-hidden group"
                style={{ borderLeft: `3px solid ${item.severity === 'critical' ? '#DC2626' : item.severity === 'high' ? '#F97316' : '#EAB308'}` }}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 mt-0.5 shrink-0">{CATEGORY_ICON[item.category]}</span>
                    <p className="text-sm font-medium text-slate-800 leading-snug">{item.title}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${SEVERITY_CONFIG[item.severity].className}`}
                  >
                    {SEVERITY_CONFIG[item.severity].label}
                  </Badge>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5 text-xs group-hover:bg-slate-50 transition-colors"
                    onClick={() => onNavigate(item.navigate_to)}
                  >
                    {item.cta_label}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* ── Column 2: In Progress ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-sm text-slate-800">In Progress</h2>
            <span className="ml-auto text-xs font-medium bg-blue-100 text-blue-600 rounded-full px-2 py-0.5">
              {in_progress.length}
            </span>
          </div>

          {in_progress.length === 0 ? (
            <EmptyColumn
              icon={<Zap className="w-5 h-5" />}
              message="No active jobs. Generate content or approve changes to get started."
            />
          ) : (
            in_progress.map((item) => (
              <Card
                key={item.id}
                className="border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all rounded-xl overflow-hidden"
                style={{ borderLeft: '3px solid #3B82F6' }}
              >
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-medium text-slate-800 leading-snug">{item.title}</p>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${STATUS_CONFIG[item.status].className}`}
                    >
                      {STATUS_CONFIG[item.status].label}
                    </Badge>
                    <span className="text-xs text-slate-400 font-medium">{item.progress}%</span>
                  </div>
                  <ProgressBar value={item.progress} />
                  <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  {item.status === 'review' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1.5 text-xs"
                      onClick={() => onNavigate('approvals')}
                    >
                      Review & Approve
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* ── Column 3: Done This Month ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h2 className="font-semibold text-sm text-slate-800">Done This Month</h2>
            <span className="ml-auto text-xs font-medium bg-green-100 text-green-600 rounded-full px-2 py-0.5">
              {done_this_month.length}
            </span>
          </div>

          {done_this_month.length === 0 ? (
            <EmptyColumn
              icon={<TrendingUp className="w-5 h-5" />}
              message="Completed tasks will appear here once you start fixing issues."
            />
          ) : (
            done_this_month.map((item) => (
              <Card
                key={item.id}
                className="border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all rounded-xl overflow-hidden"
                style={{ borderLeft: '3px solid #22C55E' }}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">{DONE_ICON[item.category]}</span>
                    <p className="text-sm font-medium text-slate-800 leading-snug">{item.title}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{formatDate(item.completed_at)}</span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Done
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 leading-relaxed">
                    📈 {item.impact}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
