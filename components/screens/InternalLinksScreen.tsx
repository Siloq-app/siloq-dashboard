'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Home, Target, FileText, AlertTriangle, Link2, RefreshCw, 
  ChevronDown, ChevronRight, ExternalLink, ArrowUp, ArrowLeftRight,
  CheckCircle, XCircle, Loader2
} from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { 
  dashboardService, 
  InternalLinksAnalysis, 
  LinkStructure, 
  Silo, 
  SiloPage,
  AnchorConflict 
} from '@/lib/services/api'

interface Props {
  siteId: number | string
}

export default function InternalLinksScreen({ siteId }: Props) {
  const [analysis, setAnalysis] = useState<InternalLinksAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSilos, setExpandedSilos] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState<'structure' | 'issues'>('structure')

  useEffect(() => {
    loadAnalysis()
  }, [siteId])

  const loadAnalysis = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await dashboardService.getInternalLinks(siteId)
      setAnalysis(data)
      // Auto-expand first silo
      if (data.structure.silos.length > 0) {
        setExpandedSilos(new Set([data.structure.silos[0].target.id]))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load internal links')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncLinks = async () => {
    setIsSyncing(true)
    try {
      await dashboardService.syncLinks(siteId)
      await loadAnalysis()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to sync links')
    } finally {
      setIsSyncing(false)
    }
  }

  const toggleSilo = (siloId: number) => {
    setExpandedSilos(prev => {
      const next = new Set(prev)
      if (next.has(siloId)) {
        next.delete(siloId)
      } else {
        next.add(siloId)
      }
      return next
    })
  }

  const totalIssues = analysis?.total_issues || 0
  const healthScore = analysis?.health_score || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-slate-400">Loading internal links analysis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadAnalysis}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Internal Links</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize your site architecture and link flow
          </p>
        </div>
        <Button 
          onClick={handleSyncLinks} 
          disabled={isSyncing}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Links'}
        </Button>
      </div>

      {/* Health Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 col-span-1">
          <div className="text-center">
            <div className={`text-4xl font-bold ${
              healthScore >= 80 ? 'text-green-500' : 
              healthScore >= 60 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {healthScore}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Link Health Score</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{analysis.structure.total_target_pages}</div>
              <div className="text-sm text-muted-foreground">Target Pages</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{analysis.structure.total_supporting_pages}</div>
              <div className="text-sm text-muted-foreground">Supporting Pages</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              totalIssues > 0 ? 'bg-red-500/10' : 'bg-green-500/10'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                totalIssues > 0 ? 'text-red-500' : 'text-green-500'
              }`} />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalIssues}</div>
              <div className="text-sm text-muted-foreground">Link Issues</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('structure')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'structure' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Silo Structure
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'issues' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Issues ({totalIssues})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'structure' ? (
        <SiloStructureView 
          structure={analysis.structure} 
          expandedSilos={expandedSilos}
          onToggleSilo={toggleSilo}
        />
      ) : (
        <IssuesView analysis={analysis} />
      )}
    </div>
  )
}

// Silo Structure Visualization
function SiloStructureView({ 
  structure, 
  expandedSilos, 
  onToggleSilo 
}: { 
  structure: LinkStructure
  expandedSilos: Set<number>
  onToggleSilo: (id: number) => void
}) {
  return (
    <div className="space-y-6">
      {/* Homepage */}
      {structure.homepage && (
        <div className="flex justify-center">
          <Card className="p-4 bg-slate-800 border-slate-600 inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
              <Home className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <div className="font-medium text-slate-100">{structure.homepage.title}</div>
              <div className="text-xs text-slate-400">Homepage</div>
            </div>
          </Card>
        </div>
      )}

      {/* Connection line from homepage */}
      {structure.homepage && structure.silos.length > 0 && (
        <div className="flex justify-center">
          <div className="w-px h-8 bg-slate-600" />
        </div>
      )}

      {/* Target Pages Row */}
      {structure.silos.length > 0 && (
        <div className="space-y-4">
          <div className="text-center text-sm text-muted-foreground font-medium">
            Target Pages (Money Pages)
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {structure.silos.map((silo) => (
              <SiloCard 
                key={silo.target.id} 
                silo={silo} 
                isExpanded={expandedSilos.has(silo.target.id)}
                onToggle={() => onToggleSilo(silo.target.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {structure.silos.length === 0 && (
        <Card className="p-8 text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Silos Set Up</h3>
          <p className="text-muted-foreground mb-4">
            Mark your money pages in the Pages tab to create your silo structure.
          </p>
        </Card>
      )}

      {/* Legend */}
      <Card className="p-4 mt-8">
        <div className="text-sm font-medium mb-3">Legend</div>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-700" />
            <span className="text-muted-foreground">Homepage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span className="text-muted-foreground">Target Page (Money Page)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-muted-foreground">Supporting Page</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUp className="w-4 h-4 text-emerald-500" />
            <span className="text-muted-foreground">Links UP to target</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-blue-400" />
            <span className="text-muted-foreground">Sibling interlinks</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Individual Silo Card
function SiloCard({ 
  silo, 
  isExpanded, 
  onToggle 
}: { 
  silo: Silo
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="w-full max-w-md">
      {/* Target Page */}
      <Card 
        className="p-4 bg-amber-500/10 border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-foreground truncate">{silo.target.title}</div>
              <div className="text-xs text-muted-foreground">
                {silo.supporting_count} supporting pages
              </div>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </Card>

      {/* Supporting Pages */}
      {isExpanded && silo.supporting_pages.length > 0 && (
        <div className="mt-2 ml-6 space-y-2">
          {/* Connection line */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-4 border-t border-dashed border-slate-600" />
            <ArrowUp className="w-3 h-3 text-emerald-500" />
            <span>Links up to target</span>
          </div>
          
          {/* Supporting page cards */}
          <div className="grid grid-cols-2 gap-2">
            {silo.supporting_pages.map((page, index) => (
              <Card 
                key={page.id} 
                className="p-3 bg-blue-500/10 border-blue-500/20"
              >
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{page.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{page.url}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Sibling interlink indicator */}
          {silo.supporting_pages.length > 1 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <ArrowLeftRight className="w-3 h-3 text-blue-400" />
              <span>Supporting pages interlink with each other</span>
            </div>
          )}
        </div>
      )}

      {/* Empty supporting pages */}
      {isExpanded && silo.supporting_pages.length === 0 && (
        <div className="mt-2 ml-6">
          <Card className="p-4 border-dashed text-center">
            <p className="text-sm text-muted-foreground">
              No supporting pages assigned yet
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}

// Issues View
function IssuesView({ analysis }: { analysis: InternalLinksAnalysis }) {
  const { issues } = analysis

  const allIssues = [
    ...issues.anchor_conflicts.map(i => ({ ...i, type: 'anchor_conflict' as const })),
    ...issues.homepage_theft.map(i => ({ ...i, type: 'homepage_theft' as const })),
    ...issues.missing_target_links.map(i => ({ ...i, type: 'missing_target_link' as const })),
    ...issues.missing_sibling_links.map(i => ({ ...i, type: 'missing_sibling_links' as const })),
    ...issues.orphan_pages.map(i => ({ ...i, type: 'orphan_page' as const })),
    ...issues.silo_size_issues.map(i => ({ ...i, type: 'silo_size' as const })),
  ]

  if (allIssues.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Link Issues Found</h3>
        <p className="text-muted-foreground">
          Your internal linking structure looks healthy!
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Anchor Conflicts */}
      {issues.anchor_conflicts.length > 0 && (
        <IssueSection 
          title="Anchor Text Conflicts" 
          description="Same anchor text linking to multiple pages"
          severity="high"
          count={issues.anchor_conflicts.length}
        >
          {issues.anchor_conflicts.map((conflict, i) => (
            <Card key={i} className="p-4 border-red-500/20 bg-red-500/5">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-2 min-w-0">
                  <div>
                    <span className="font-medium">"{conflict.anchor_text}"</span>
                    <span className="text-muted-foreground"> links to {conflict.target_pages.length} different pages</span>
                  </div>
                  <div className="space-y-1">
                    {conflict.target_pages.map((page, j) => (
                      <div key={j} className="text-sm flex items-center gap-2">
                        <span className="text-muted-foreground">→</span>
                        <span className="truncate">{page.title}</span>
                        {page.is_money_page && (
                          <span className="text-xs bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded">
                            Target
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </IssueSection>
      )}

      {/* Homepage Theft */}
      {issues.homepage_theft.length > 0 && (
        <IssueSection 
          title="Homepage Anchor Theft" 
          description="Target keywords linking to homepage instead of their target page"
          severity="high"
          count={issues.homepage_theft.length}
        >
          {issues.homepage_theft.map((issue: any, i) => (
            <Card key={i} className="p-4 border-red-500/20 bg-red-500/5">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">"{issue.anchor_text}"</span>
                    <span className="text-muted-foreground"> links to homepage but should link to target page</span>
                  </div>
                  {issue.should_link_to && (
                    <div className="text-sm text-muted-foreground">
                      Should link to: <span className="text-foreground">{issue.should_link_to.title}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </IssueSection>
      )}

      {/* Missing Target Links */}
      {issues.missing_target_links.length > 0 && (
        <IssueSection 
          title="Missing Links to Target" 
          description="Supporting pages that don't link to their target page"
          severity="high"
          count={issues.missing_target_links.length}
        >
          {issues.missing_target_links.map((issue: any, i) => (
            <Card key={i} className="p-4 border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">{issue.supporting_page?.title}</span>
                    <span className="text-muted-foreground"> doesn't link to its target page</span>
                  </div>
                  {issue.target_page && (
                    <div className="text-sm text-muted-foreground">
                      Should link to: <span className="text-foreground">{issue.target_page.title}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </IssueSection>
      )}

      {/* Orphan Pages */}
      {issues.orphan_pages.length > 0 && (
        <IssueSection 
          title="Orphan Pages" 
          description="Pages with no internal links pointing to them"
          severity="medium"
          count={issues.orphan_pages.length}
        >
          {issues.orphan_pages.map((issue: any, i) => (
            <Card key={i} className="p-4 border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-medium">{issue.page?.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {issue.recommendation || 'Add internal links pointing to this page'}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </IssueSection>
      )}
    </div>
  )
}

function IssueSection({ 
  title, 
  description, 
  severity, 
  count, 
  children 
}: { 
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  count: number
  children: React.ReactNode
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="space-y-3">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${
            severity === 'high' ? 'bg-red-500' : 
            severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
          }`} />
          <div className="text-left">
            <div className="font-medium">{title}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium px-2 py-1 rounded ${
            severity === 'high' ? 'bg-red-500/10 text-red-500' : 
            severity === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
          }`}>
            {count}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="space-y-2 pl-5">
          {children}
        </div>
      )}
    </div>
  )
}
