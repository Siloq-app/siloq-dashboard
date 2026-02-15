'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  GitBranch,
  ChevronRight,
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
  BarChart3,
} from 'lucide-react';
import {
  CannibalizationIssue,
  CannibalizationPageDetail,
  Silo,
  PendingChange,
} from '@/app/dashboard/types';
import HealthScore from '../ui/HealthScore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';

/* ── severity helpers ── */
const severityColor: Record<string, string> = {
  critical: 'bg-red-600',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  info: 'bg-gray-400',
};

const severityBorderColor: Record<string, string> = {
  critical: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
  high: 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950',
  medium: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950',
  low: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950',
  info: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800',
};

const severityTextColor: Record<string, string> = {
  critical: 'text-red-900 dark:text-red-300',
  high: 'text-orange-900 dark:text-orange-300',
  medium: 'text-amber-900 dark:text-amber-300',
  low: 'text-blue-900 dark:text-blue-300',
  info: 'text-gray-900 dark:text-gray-300',
};

const severityIconColor: Record<string, string> = {
  critical: 'text-red-600 dark:text-red-400',
  high: 'text-orange-600 dark:text-orange-400',
  medium: 'text-amber-600 dark:text-amber-400',
  low: 'text-blue-600 dark:text-blue-400',
  info: 'text-gray-500 dark:text-gray-400',
};

/* ── page detail helpers ── */
function getPageDetail(
  issue: CannibalizationIssue,
  pageUrl: string
): CannibalizationPageDetail | undefined {
  return issue.competing_pages?.find((p) => p.url === pageUrl);
}

function PageTypeBadge({ type }: { type?: string }) {
  if (!type) return null;
  const colors: Record<string, string> = {
    Product: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    Category: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    Blog: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
    Service: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${colors[type] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
      {type}
    </span>
  );
}

function IndexBadge({ status }: { status?: string }) {
  if (!status) return null;
  const isIndexed = status === 'indexed';
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
        isIndexed
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
          : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
      }`}
    >
      {isIndexed ? 'Indexed' : 'Noindex'}
    </span>
  );
}

interface Props {
  healthScore: number;
  cannibalizationIssues: CannibalizationIssue[];
  silos: Silo[];
  pendingChanges: PendingChange[];
  onViewSilo: (silo: Silo) => void;
  onViewApprovals: () => void;
  onShowApprovalModal: () => void;
}

export default function GovernanceDashboard({
  healthScore,
  cannibalizationIssues,
  silos,
  pendingChanges,
  onViewSilo,
  onViewApprovals,
  onShowApprovalModal,
}: Props) {
  const safeCount = pendingChanges.filter((c) => c.risk === 'safe').length;
  const destructiveCount = pendingChanges.filter(
    (c) => c.risk === 'destructive'
  ).length;

  /* ── filter state ── */
  const [hideNoindex, setHideNoindex] = useState(true);
  const [hideResolved301, setHideResolved301] = useState(true);
  const [onlyWithImpressions, setOnlyWithImpressions] = useState(false);

  /* ── compute counts & filtered list ── */
  const { filtered, noindexCount, resolved301Count, noImpressionsCount } =
    useMemo(() => {
      let noindexCt = 0;
      let resolved301Ct = 0;
      let noImpressionsCt = 0;

      const result = cannibalizationIssues.filter((issue) => {
        const details = issue.competing_pages ?? [];

        const hasNoindex = details.some((p) => p.indexStatus === 'noindex');
        const has301 = details.some((p) => p.httpStatus === 301);
        const allZeroImpressions =
          details.length > 0 && details.every((p) => !p.impressions);

        if (hasNoindex) noindexCt++;
        if (has301) resolved301Ct++;
        if (allZeroImpressions) noImpressionsCt++;

        if (hideNoindex && hasNoindex) return false;
        if (hideResolved301 && has301) return false;
        if (onlyWithImpressions && allZeroImpressions) return false;
        return true;
      });

      return {
        filtered: result,
        noindexCount: noindexCt,
        resolved301Count: resolved301Ct,
        noImpressionsCount: noImpressionsCt,
      };
    }, [cannibalizationIssues, hideNoindex, hideResolved301, onlyWithImpressions]);

  return (
    <>
      {/* Health Score + Quick Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] lg:gap-6">
        <HealthScore score={healthScore} change={8} />

        {/* Quick Stats Grid - Responsive */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {[
            {
              title: 'Competing Pages',
              value: cannibalizationIssues.length,
              subtext: 'Found by Siloq',
              color: 'text-red-400',
            },
            {
              title: 'Service Categories',
              value: silos.length,
              subtext: `${silos.reduce((acc, s) => acc + s.supportingPages.length + 1, 0)} pages organized`,
              color: 'text-blue-400',
            },
            {
              title: 'Pending Actions',
              value: pendingChanges.length,
              subtext: 'Awaiting approval',
              color: 'text-amber-400',
            },
          ].map((stat, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </span>
                <div
                  className={`text-2xl font-semibold tabular-nums ${stat.color}`}
                >
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.subtext}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Siloq Remediation Banner */}
      <Card className="mb-4 p-3 sm:mb-6 sm:p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-start gap-3 sm:items-center">
            <div className="from-primary to-primary/70 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br sm:h-10 sm:w-10">
              <Zap size={18} className="text-white sm:size-20" />
            </div>
            <div className="min-w-0 space-y-1">
              <h3 className="text-foreground text-sm font-semibold">
                Siloq has analyzed your site
              </h3>
              <p className="text-xs font-medium text-gray-600 sm:text-sm dark:text-gray-400">
                Found {cannibalizationIssues.length} competing page issues.
                Generated {pendingChanges.length} recommended actions (
                {safeCount} safe, {destructiveCount} destructive).
              </p>
            </div>
          </div>
          <Button
            onClick={onViewApprovals}
            className="w-full shrink-0 bg-black text-white hover:bg-gray-800 sm:w-auto"
          >
            Review Plan <ArrowRight size={16} />
          </Button>
        </div>
      </Card>

      {/* ── Filter Toggles Bar ── */}
      <Card className="mb-4 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* Hide noindex */}
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={hideNoindex} onCheckedChange={setHideNoindex} />
            <span className="text-foreground font-medium">Hide noindex pages</span>
            {hideNoindex && noindexCount > 0 && (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {noindexCount} hidden
              </span>
            )}
          </label>

          {/* Hide resolved 301 */}
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={hideResolved301} onCheckedChange={setHideResolved301} />
            <span className="text-foreground font-medium">Hide resolved (301)</span>
            {hideResolved301 && resolved301Count > 0 && (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {resolved301Count} hidden
              </span>
            )}
          </label>

          {/* Only with impressions */}
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={onlyWithImpressions} onCheckedChange={setOnlyWithImpressions} />
            <span className="text-foreground font-medium">Only pages with impressions</span>
            {onlyWithImpressions && noImpressionsCount > 0 && (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {noImpressionsCount} hidden
              </span>
            )}
          </label>

          {/* Result count */}
          <span className="ml-auto text-xs font-medium text-gray-500 dark:text-gray-400">
            Showing {filtered.length} of {cannibalizationIssues.length} issues
          </span>
        </div>
      </Card>

      {/* Competing Page Alerts */}
      <div className="space-y-3">
        {filtered.map((issue) => (
          <Card key={issue.id} className="cursor-pointer p-4">
            {/* Top Alert Bar */}
            <div className={`mb-3 flex flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:items-center sm:gap-3 ${severityBorderColor[issue.severity] ?? severityBorderColor.info}`}>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <AlertTriangle className={`h-4 w-4 ${severityIconColor[issue.severity] ?? severityIconColor.info}`} />
                  <span className={`text-sm font-medium ${severityTextColor[issue.severity] ?? severityTextColor.info}`}>
                    Competing
                  </span>
                </div>
                <span className={`text-sm ${severityTextColor[issue.severity] ?? severityTextColor.info}`}>
                  {issue.pages.length} pages competing
                </span>
              </div>
              <Button
                onClick={onShowApprovalModal}
                className="flex w-full flex-shrink-0 items-center justify-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
              >
                Fix Issue
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Keyword Section */}
            <div className="space-y-2">
              {/* Keyword Badge + Title */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase text-white ${severityColor[issue.severity] ?? severityColor.info}`}
                >
                  {issue.severity}
                </span>
                <h3 className="font-small text-foreground font-mono font-bold">
                  &ldquo;{issue.keyword}&rdquo;
                </h3>
              </div>

              {/* Metrics Line */}
              <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
                <span className="font-medium text-red-600 dark:text-red-400">
                  {issue.pages.length} pages
                </span>
                <span>competing •</span>
                <span>
                  {issue.impressions.toLocaleString()} monthly impressions
                </span>
                <span>•</span>
                <span>Split: {issue.splitClicks}</span>
              </div>

              {/* URL Tags with enhanced detail */}
              <div className="space-y-1.5">
                {issue.pages.map((page, i) => {
                  const detail = getPageDetail(issue, page);
                  return (
                    <div
                      key={i}
                      className="bg-muted border-border flex flex-wrap items-center gap-2 rounded border px-2.5 py-1.5"
                    >
                      <span className="text-foreground font-mono text-xs">
                        {page}
                      </span>
                      <PageTypeBadge type={detail?.pageType} />
                      <IndexBadge status={detail?.indexStatus} />
                      {detail?.impressions != null && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                          <BarChart3 className="h-3 w-3" />
                          {detail.impressions.toLocaleString()} imp
                          {detail.clicks != null && (
                            <> · {detail.clicks.toLocaleString()} clicks</>
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Siloq Recommendation */}
              <div className="flex items-start gap-1.5 pt-1">
                <Zap className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                <p className="text-foreground text-sm">
                  <span className="font-medium">Siloq recommendation:</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {' '}
                    {issue.recommendation}
                  </span>
                </p>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && cannibalizationIssues.length > 0 && (
          <Card className="p-8 text-center">
            <EyeOff className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              All {cannibalizationIssues.length} issues are hidden by current filters.
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Adjust the toggles above to see more results.
            </p>
          </Card>
        )}
      </div>

      {/* Silo Overview */}
      <div className="my-6 space-y-3">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-card text-card-foreground inline-flex items-center gap-2 rounded-full border p-4 shadow">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-900 text-xs font-semibold text-white">
              ↩︎
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">
                Content Organization
              </p>
              <p className="text-xs text-slate-500">
                Your service pages and supporting content
              </p>
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {silos.map((silo) => (
            <article
              key={silo.id}
              onClick={() => onViewSilo(silo)}
              className="bg-card text-card-foreground group cursor-pointer rounded-xl border p-4 shadow transition"
            >
              {/* Card header */}
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {silo.name}
                  </h3>

                  {/* Counts */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                      1 Target
                    </span>
                    <span className="inline-flex items-center text-slate-300">
                      •
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      {silo.supportingPages.length} Supporting
                    </span>
                  </div>
                </div>

                {/* Action */}
                <button
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  aria-label={`Open ${silo.name}`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </header>

              {/* Divider */}
              <div className="mt-4 h-px w-full bg-slate-100"></div>

              {/* List with timeline connector */}
              <ul className="relative mt-4 space-y-2">
                {/* Vertical connector line - positioned through center of badges (px-2.5 = 10px + half of 24px badge = 22px) */}
                <div className="absolute bottom-0 left-[22px] top-0 w-px bg-slate-200"></div>

                {/* Target */}
                <li className="relative">
                  <div className="relative z-10 flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-slate-50">
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-900 text-[11px] font-semibold text-white ring-4 ring-white"
                      title="Target (Money Page)"
                    >
                      M
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {silo.targetPage.title}
                      </p>
                    </div>
                    <span className="ml-auto hidden rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
                      Target
                    </span>
                  </div>
                </li>

                {/* Supporting Pages */}
                {silo.supportingPages.map((page, i) => (
                  <li key={i} className="relative">
                    <div className="relative z-10 flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-slate-50">
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-semibold ring-4 ring-white ${
                          page.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                        title="Supporting Content"
                      >
                        S
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-700">
                          {page.title}
                        </p>
                      </div>
                      {i === 0 && (
                        <span className="ml-auto hidden rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100 sm:inline-flex">
                          Supporting
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
