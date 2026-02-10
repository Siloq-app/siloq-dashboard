'use client'

import { AlertTriangle, TrendingUp, GitBranch, ChevronRight, Zap, ArrowRight, TrendingDown, Activity } from 'lucide-react'
import { CannibalizationIssue, Silo, PendingChange } from '@/app/dashboard/Dashboard'
import HealthScore from '../ui/HealthScore'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'

interface Props {
  healthScore: number
  cannibalizationIssues: CannibalizationIssue[]
  silos: Silo[]
  pendingChanges: PendingChange[]
  onViewSilo: (silo: Silo) => void
  onViewApprovals: () => void
  onShowApprovalModal: () => void
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
  const safeCount = pendingChanges.filter(c => c.risk === 'safe').length
  const destructiveCount = pendingChanges.filter(c => c.risk === 'destructive').length

  return (
    <>
      {/* Health Score + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 mb-6">
        <HealthScore score={healthScore} change={8} />

        {/* Quick Stats Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {[
            { 
              title: 'Cannibalization Issues', 
              value: cannibalizationIssues.length, 
              change: '+12.5%', 
              trend: 'up',
              description: 'Issues increasing',
              subtext: 'Detected by Siloq',
              color: 'text-red-400'
            },
            { 
              title: 'Silos Mapped', 
              value: silos.length, 
              change: '+8%', 
              trend: 'up',
              description: 'Organization improving',
              subtext: `${silos.reduce((acc, s) => acc + s.supportingPages.length + 1, 0)} pages organized`,
              color: 'text-blue-400'
            },
            { 
              title: 'Pending Actions', 
              value: pendingChanges.length, 
              change: '-5%', 
              trend: 'down',
              description: 'Queue decreasing',
              subtext: 'Awaiting approval',
              color: 'text-amber-400'
            },
          ].map((stat, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.title}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold text-white rounded uppercase ${
                    stat.trend === 'up' ? 'bg-emerald-500' : 'bg-red-600'
                  }`}>
                    {stat.trend === 'up' ? '↗' : '↘'} {stat.change}
                  </span>
                </div>
                <div className={`text-2xl font-semibold tabular-nums ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-foreground flex items-center gap-1.5">
                  {stat.trend === 'up' ? <TrendingUp size={14} className="text-primary" /> : <TrendingDown size={14} className="text-red-500" />}
                  {stat.description}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.subtext}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Siloq Remediation Banner */}
      <Card className="p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-between">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center shrink-0">
              <Zap size={18} className="text-white sm:size-20" />
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Siloq has analyzed your site</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                Found {cannibalizationIssues.length} cannibalization issues. Generated {pendingChanges.length} recommended actions 
                ({safeCount} safe, {destructiveCount} destructive).
              </p>
            </div>
          </div>
          <Button onClick={onViewApprovals} size="sm" className="bg-black hover:bg-gray-800 text-white shrink-0 w-full sm:w-auto">
            Review Plan <ArrowRight size={14} />
          </Button>
        </div>
      </Card>

      {/* Cannibalization Alerts */}
      <div className="space-y-3">
        {cannibalizationIssues.map((issue) => (
          <Card
            key={issue.id}
            className="p-4 cursor-pointer"
          >
            {/* Top Alert Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2 bg-amber-50 border border-amber-200 rounded-lg mb-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Warning Icon + Label */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">Cannibalization</span>
                </div>
                
                {/* Competing Pages Info */}
                <span className="text-sm text-amber-700">{issue.pages.length} pages competing</span>
              </div>
              
              {/* Action Button */}
              <Button 
                size="sm" 
                onClick={onShowApprovalModal}
                className="flex items-center justify-center gap-1.5 w-full sm:w-auto flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
              >
                View Fix
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Keyword Section */}
            <div className="space-y-2">
              {/* Keyword Badge + Title */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold text-white rounded uppercase ${
                  issue.severity === 'high' ? 'bg-red-600' : issue.severity === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                }`}>
                  {issue.severity}
                </span>
                <h3 className="font-mono font-small font-bold text-foreground">"{issue.keyword}"</h3>
              </div>
              
              {/* Metrics Line */}
              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 font-medium flex-wrap">
                <span className="text-red-600 font-medium">{issue.pages.length} pages</span>
                <span>competing •</span>
                <span>{issue.impressions.toLocaleString()} monthly impressions</span>
                <span>•</span>
                <span>Split: {issue.splitClicks}</span>
              </div>
              
              {/* URL Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                {issue.pages.map((page, i) => (
                  <span key={i} className="px-2 py-1 text-xs font-mono text-foreground bg-muted rounded border border-border">
                    {page}
                  </span>
                ))}
              </div>
              
              {/* Siloq Recommendation */}
              <div className="flex items-start gap-1.5 pt-1">
                <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">
                  <span className="font-medium">Siloq recommendation:</span>
                  <span className="text-gray-600 dark:text-gray-400"> {issue.recommendation}</span>
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Silo Overview */}
      <div className="my-6 space-y-3">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-900 text-xs font-semibold text-white">
              ↩︎
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Content Strategy</p>
              <p className="text-xs text-slate-500">Your money pages and the content that supports them</p>
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {silos.map((silo) => (
            <article
              key={silo.id}
              onClick={() => onViewSilo(silo)}
              className="group rounded-2xl bg-white p-5 ring-1 ring-slate-200 transition cursor-pointer"
            >
              {/* Card header */}
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900">{silo.name}</h3>

                  {/* Counts */}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                      1 Target
                    </span>
                    <span className="inline-flex items-center text-slate-300">•</span>
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
              <ul className="mt-4 space-y-2 relative">
                {/* Vertical connector line - positioned through center of badges (px-2.5 = 10px + half of 24px badge = 22px) */}
                <div className="absolute left-[22px] top-0 bottom-0 w-px bg-slate-200"></div>
                
                {/* Target */}
                <li className="relative">
                  <div className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-slate-50 relative z-10">
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-900 text-[11px] font-semibold text-white ring-4 ring-white"
                      title="Money Page"
                    >
                      K
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{silo.targetPage.title}</p>
                    </div>
                    <span className="ml-auto hidden rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
                      Target
                    </span>
                  </div>
                </li>

                {/* Supporting Pages */}
                {silo.supportingPages.map((page, i) => (
                  <li key={i} className="relative">
                    <div className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-slate-50 relative z-10">
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
                        <p className="truncate text-sm text-slate-700">{page.title}</p>
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
  )
}
