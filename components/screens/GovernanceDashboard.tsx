'use client'

import { AlertTriangle, TrendingUp, GitBranch, ChevronRight, Zap, ArrowRight, TrendingDown, Activity } from 'lucide-react'
import { CannibalizationIssue, Silo, PendingChange } from '../Dashboard'
import HealthScore from '../ui/HealthScore'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
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
            <Card key={i} className="p-4 hover:border-primary/20 transition-colors bg-[#F0F1F3] border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{stat.title}</span>
                <Badge variant={stat.trend === 'up' ? 'default' : 'destructive'} className="text-xs px-2 py-0.5">
                  {stat.trend === 'up' ? '↗' : '↘'} {stat.change}
                </Badge>
              </div>
              <div className={`text-2xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-foreground flex items-center gap-1 mb-1">
                {stat.trend === 'up' ? <TrendingUp size={14} className="text-primary" /> : <TrendingDown size={14} className="text-red-500" />}
                {stat.description}
              </div>
              <div className="text-xs text-muted-foreground">{stat.subtext}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Siloq Remediation Banner */}
      <Card className="p-5 mb-6 border-border bg-[#F0F1F3]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h3 className="leading-none font-semibold text-foreground">Siloq has analyzed your site</h3>
              <p className="text-muted-foreground text-xs">
                Found {cannibalizationIssues.length} cannibalization issues. Generated {pendingChanges.length} recommended actions 
                ({safeCount} safe, {destructiveCount} destructive).
              </p>
            </div>
          </div>
          <Button onClick={onViewApprovals}>
            Review Plan <ArrowRight size={14} />
          </Button>
        </div>
      </Card>

      {/* Cannibalization Alerts */}
      <Card className="p-7 mb-8 bg-[#F0F1F3] border-border">
        <CardHeader className="flex flex-row items-center justify-between p-0 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-card-foreground">Cannibalization Detected</CardTitle>
              <p className="text-sm text-muted-foreground">Pages competing for the same keywords</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="space-y-3">
            {cannibalizationIssues.map((issue) => (
              <Card
                key={issue.id}
                className="p-5 hover:border-primary/20 transition-colors cursor-pointer bg-[#F0F1F3] border-border"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'default' : 'secondary'}>
                        {issue.severity}
                      </Badge>
                      <span className="font-mono text-base font-semibold text-card-foreground">
                        "{issue.keyword}"
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <span className="text-red-500 font-semibold">{issue.pages.length} pages</span> competing • {issue.impressions.toLocaleString()} monthly impressions • Split: {issue.splitClicks}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {issue.pages.map((page, i) => (
                        <Badge key={i} variant="outline" className="text-xs px-2.5 py-1 bg-muted rounded text-muted-foreground font-mono border-border">
                          {page}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm text-primary flex items-center gap-1.5">
                      <Zap size={14} />
                      Siloq recommendation: {issue.recommendation}
                    </div>
                  </div>
                  <Button className="ml-4 whitespace-nowrap" variant="outline" onClick={onShowApprovalModal}>
                    View Fix <ArrowRight size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Silo Overview */}
      <Card className="p-7 bg-[#F0F1F3] border-border">
        <CardHeader className="flex flex-row items-center justify-between p-0 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <GitBranch size={18} className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-card-foreground">Reverse Silo Architecture</CardTitle>
              <p className="text-sm text-muted-foreground">Target Pages (Kings) and Supporting Pages (Soldiers)</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-2 gap-4">
            {silos.map((silo) => (
              <Card
                key={silo.id}
                onClick={() => onViewSilo(silo)}
                className="p-5 hover:border-primary/20 transition-colors cursor-pointer relative bg-[#F0F1F3] border-border"
              >
                <div className="mb-4">
                  <h3 className="text-base font-semibold mb-1 text-card-foreground">{silo.name}</h3>
                  <span className="text-xs text-muted-foreground">1 Target • {silo.supportingPages.length} Supporting</span>
                </div>

                {/* Mini silo visualization */}
                <div className="relative pl-8">
                  <div className="absolute left-6 top-10 bottom-5 w-0.5 bg-gradient-to-b from-primary to-transparent" />

                  {/* Target Page */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/70 rounded-md flex items-center justify-center text-[10px] text-white font-bold">
                      K
                    </div>
                    <span className="text-sm text-card-foreground">{silo.targetPage.title}</span>
                  </div>

                  {/* Supporting Pages preview */}
                  {silo.supportingPages.slice(0, 3).map((page, i) => (
                    <div key={i} className="flex items-center gap-2.5 mb-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${
                        page.status === 'published' ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'
                      }`}>
                        S
                      </div>
                      <span className="text-xs text-muted-foreground">{page.title}</span>
                    </div>
                  ))}
                  {silo.supportingPages.length > 3 && (
                    <span className="text-[11px] text-muted-foreground ml-7">+{silo.supportingPages.length - 3} more</span>
                  )}
                </div>

                <ChevronRight size={18} className="absolute top-5 right-5 text-muted-foreground" />
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
