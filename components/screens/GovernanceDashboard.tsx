'use client'

import { AlertTriangle, TrendingUp, GitBranch, ChevronRight, Zap, ArrowRight, TrendingDown, Activity } from 'lucide-react'
import { CannibalizationIssue, Silo, PendingChange } from '../Dashboard'
import HealthScore from '../ui/HealthScore'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'

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
      <div className="grid grid-cols-[300px_1fr] gap-6 mb-8">
        <HealthScore score={healthScore} change={8} />

        {/* Quick Stats Grid - Using Analytics card style */}
        <div className="grid grid-cols-3 gap-4">
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
            <div key={i} className="bg-slate-900/40 rounded-lg p-4 border border-slate-700/30 hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{stat.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  stat.trend === 'up' 
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' 
                    : 'border-red-500/30 text-red-400 bg-red-500/10'
                }`}>
                  {stat.trend === 'up' ? '↗' : '↘'} {stat.change}
                </span>
              </div>
              <div className={`text-2xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-slate-300 flex items-center gap-1 mb-1">
                {stat.trend === 'up' ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
                {stat.description}
              </div>
              <div className="text-xs text-slate-500">{stat.subtext}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Siloq Remediation Banner */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-xl p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <div className="text-base font-semibold mb-1">Siloq has analyzed your site</div>
            <div className="text-sm text-slate-400">
              Found {cannibalizationIssues.length} cannibalization issues. Generated {pendingChanges.length} recommended actions 
              ({safeCount} safe, {destructiveCount} destructive).
            </div>
          </div>
        </div>
        <button className="btn-primary" onClick={onViewApprovals}>
          Review Plan <ArrowRight size={14} />
        </button>
      </div>

      {/* Cannibalization Alerts */}
      <Card className="p-7 mb-8">
        <CardHeader className="flex flex-row items-center justify-between p-0 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Cannibalization Detected</CardTitle>
              <p className="text-sm text-slate-400">Pages competing for the same keywords</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="space-y-3">
            {cannibalizationIssues.map((issue) => (
              <Card
                key={issue.id}
                className="p-5 hover:border-slate-600 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`severity-${issue.severity}`}>
                        {issue.severity}
                      </span>
                      <span className="font-mono text-base font-semibold text-slate-100">
                        "{issue.keyword}"
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mb-2">
                      <span className="text-red-400 font-semibold">{issue.pages.length} pages</span> competing • {issue.impressions.toLocaleString()} monthly impressions • Split: {issue.splitClicks}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {issue.pages.map((page, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 bg-indigo-500/10 rounded-md text-indigo-300 font-mono">
                          {page}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-emerald-400 flex items-center gap-1.5">
                      <Zap size={14} />
                      Siloq recommendation: {issue.recommendation}
                    </div>
                  </div>
                  <button className="btn-primary ml-4 whitespace-nowrap" onClick={onShowApprovalModal}>
                    View Fix <ArrowRight size={14} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Silo Overview */}
      <Card className="p-7">
        <CardHeader className="flex flex-row items-center justify-between p-0 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/10 rounded-lg flex items-center justify-center">
              <GitBranch size={18} className="text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Reverse Silo Architecture</CardTitle>
              <p className="text-sm text-slate-400">Target Pages (Kings) and Supporting Pages (Soldiers)</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-2 gap-4">
            {silos.map((silo) => (
              <Card
                key={silo.id}
                onClick={() => onViewSilo(silo)}
                className="p-5 hover:border-slate-600 transition-colors cursor-pointer relative"
              >
                <div className="mb-4">
                  <h3 className="text-base font-semibold mb-1">{silo.name}</h3>
                  <span className="text-xs text-slate-400">1 Target • {silo.supportingPages.length} Supporting</span>
                </div>

                {/* Mini silo visualization */}
                <div className="relative pl-8">
                  <div className="absolute left-6 top-10 bottom-5 w-0.5 bg-gradient-to-b from-indigo-500 to-transparent" />

                  {/* Target Page */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-md flex items-center justify-center text-[10px]">
                      👑
                    </div>
                    <span className="text-sm text-slate-200">{silo.targetPage.title}</span>
                  </div>

                  {/* Supporting Pages preview */}
                  {silo.supportingPages.slice(0, 3).map((page, i) => (
                    <div key={i} className="flex items-center gap-2.5 mb-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${
                        page.status === 'published' ? 'bg-emerald-500/20' : 'bg-slate-700/50'
                      }`}>
                        ⚔️
                      </div>
                      <span className="text-xs text-slate-400">{page.title}</span>
                    </div>
                  ))}
                  {silo.supportingPages.length > 3 && (
                    <span className="text-[11px] text-slate-500 ml-7">+{silo.supportingPages.length - 3} more</span>
                  )}
                </div>

                <ChevronRight size={18} className="absolute top-5 right-5 text-slate-500" />
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
