'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Home, Target, FileText, AlertTriangle, Link2, RefreshCw, 
  ChevronDown, ChevronRight, ExternalLink, ArrowUp, ArrowLeftRight,
  CheckCircle, XCircle, Loader2, Lightbulb, Sparkles, BookOpen,
  Scale, DollarSign, MapPin, HelpCircle, Plus
} from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { 
  dashboardService, 
  InternalLinksAnalysis, 
  LinkStructure, 
  Silo, 
  SiloPage,
  AnchorConflict,
  ContentSuggestionsResponse,
  TargetSuggestion,
  ContentSuggestion
} from '@/lib/services/api'

interface Props {
  siteId: number | string
}

export default function InternalLinksScreen({ siteId }: Props) {
  const [analysis, setAnalysis] = useState<InternalLinksAnalysis | null>(null)
  const [contentSuggestions, setContentSuggestions] = useState<ContentSuggestionsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSilos, setExpandedSilos] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState<'structure' | 'content' | 'issues'>('structure')

  useEffect(() => {
    loadAnalysis()
  }, [siteId])

  useEffect(() => {
    if (activeTab === 'content' && !contentSuggestions && !isLoadingContent) {
      loadContentSuggestions()
    }
  }, [activeTab])

  const loadContentSuggestions = async () => {
    setIsLoadingContent(true)
    try {
      const data = await dashboardService.getContentSuggestions(siteId)
      setContentSuggestions(data)
    } catch (e) {
      console.error('Failed to load content suggestions:', e)
    } finally {
      setIsLoadingContent(false)
    }
  }

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
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'content' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Content Ideas
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
      ) : activeTab === 'content' ? (
        <ContentIdeasView 
          suggestions={contentSuggestions}
          isLoading={isLoadingContent}
          onRefresh={loadContentSuggestions}
        />
      ) : (
        <IssuesView analysis={analysis} />
      )}
    </div>
  )
}

// Silo Structure Visualization with SVG Lines
function SiloStructureView({ 
  structure, 
  expandedSilos, 
  onToggleSilo 
}: { 
  structure: LinkStructure
  expandedSilos: Set<number>
  onToggleSilo: (id: number) => void
}) {
  const siloCount = structure.silos.length

  return (
    <div className="space-y-6">
      {/* Homepage */}
      {structure.homepage && (
        <div className="flex justify-center">
          <Card className="p-4 bg-slate-800 border-slate-600 inline-flex items-center gap-3 relative z-10">
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

      {/* SVG Connection Lines from Homepage to Targets */}
      {structure.homepage && siloCount > 0 && (
        <div className="relative flex justify-center">
          <svg 
            className="w-full h-16 overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Vertical line from homepage */}
            <line
              x1="50%"
              y1="0"
              x2="50%"
              y2="24"
              stroke="#475569"
              strokeWidth="2"
            />
            {/* Horizontal distribution line */}
            {siloCount > 1 && (
              <line
                x1={`${50 - (siloCount - 1) * 12}%`}
                y1="24"
                x2={`${50 + (siloCount - 1) * 12}%`}
                y2="24"
                stroke="#475569"
                strokeWidth="2"
              />
            )}
            {/* Vertical lines down to each silo */}
            {structure.silos.map((_, index) => {
              const xPercent = siloCount === 1 
                ? 50 
                : 50 + (index - (siloCount - 1) / 2) * 24
              return (
                <g key={index}>
                  <line
                    x1={`${xPercent}%`}
                    y1="24"
                    x2={`${xPercent}%`}
                    y2="64"
                    stroke="#475569"
                    strokeWidth="2"
                  />
                  {/* Arrow head */}
                  <polygon
                    points={`${xPercent - 0.5}%,56 ${xPercent}%,64 ${xPercent + 0.5}%,56`}
                    fill="#475569"
                    transform={`translate(0, 0)`}
                  />
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {/* Target Pages Row */}
      {siloCount > 0 && (
        <div className="space-y-4">
          <div className="text-center text-sm text-muted-foreground font-medium">
            Target Pages (Money Pages)
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
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
      {siloCount === 0 && (
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
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <line x1="12" y1="4" x2="12" y2="16" stroke="#475569" strokeWidth="2"/>
              <polygon points="8,14 12,20 16,14" fill="#475569"/>
            </svg>
            <span className="text-muted-foreground">Link direction</span>
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

// Individual Silo Card with Visual Link Lines
function SiloCard({ 
  silo, 
  isExpanded, 
  onToggle 
}: { 
  silo: Silo
  isExpanded: boolean
  onToggle: () => void
}) {
  const supportingCount = silo.supporting_pages.length

  return (
    <div className="w-full max-w-md">
      {/* Target Page */}
      <Card 
        className="p-4 bg-amber-500/10 border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-colors relative z-10"
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

      {/* Supporting Pages with Visual Lines */}
      {isExpanded && supportingCount > 0 && (
        <div className="relative">
          {/* SVG Connection Lines */}
          <svg 
            className="absolute left-6 top-0 w-full h-12 overflow-visible pointer-events-none"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Vertical line from target */}
            <line
              x1="20"
              y1="0"
              x2="20"
              y2="24"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            {/* Horizontal distribution for multiple supporting pages */}
            {supportingCount > 1 && (
              <line
                x1="20"
                y1="24"
                x2={20 + (supportingCount - 1) * 80}
                y2="24"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            )}
            {/* Vertical lines to each supporting page */}
            {silo.supporting_pages.map((_, index) => (
              <g key={index}>
                <line
                  x1={20 + index * 80}
                  y1="24"
                  x2={20 + index * 80}
                  y2="48"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
                {/* Upward arrow (link direction UP to target) */}
                <polygon
                  points={`${15 + index * 80},12 ${20 + index * 80},4 ${25 + index * 80},12`}
                  fill="#10b981"
                />
              </g>
            ))}
          </svg>
          
          {/* Connection indicator */}
          <div className="ml-6 pt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowUp className="w-3 h-3 text-emerald-500" />
            <span>Links up to target</span>
          </div>
          
          {/* Supporting page cards */}
          <div className="ml-6 mt-10 grid grid-cols-2 gap-3">
            {silo.supporting_pages.map((page, index) => (
              <Card 
                key={page.id} 
                className="p-3 bg-blue-500/10 border-blue-500/20 relative"
              >
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{page.title}</div>
                    <a 
                      href={page.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline truncate block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {page.slug || page.url}
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Sibling interlink indicator with visual */}
          {supportingCount > 1 && (
            <div className="ml-6 mt-3 p-2 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 text-xs">
                <svg className="w-16 h-4" viewBox="0 0 64 16">
                  {/* Horizontal bidirectional arrows */}
                  <line x1="8" y1="8" x2="56" y2="8" stroke="#60a5fa" strokeWidth="2"/>
                  <polygon points="4,8 12,4 12,12" fill="#60a5fa"/>
                  <polygon points="60,8 52,4 52,12" fill="#60a5fa"/>
                </svg>
                <span className="text-blue-400">Supporting pages interlink with siblings</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty supporting pages */}
      {isExpanded && supportingCount === 0 && (
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

// Content Ideas View
function ContentIdeasView({ 
  suggestions, 
  isLoading,
  onRefresh
}: { 
  suggestions: ContentSuggestionsResponse | null
  isLoading: boolean
  onRefresh: () => void
}) {
  const [expandedTarget, setExpandedTarget] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-slate-400">Generating content suggestions...</p>
        </div>
      </div>
    )
  }

  if (!suggestions) {
    return (
      <div className="text-center py-12">
        <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">No content suggestions yet</p>
        <Button onClick={onRefresh} variant="outline">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Ideas
        </Button>
      </div>
    )
  }

  if (suggestions.suggestions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Target Pages Found</h3>
        <p className="text-muted-foreground">
          Mark some pages as money pages first to get content suggestions.
        </p>
      </Card>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'how-to': return <BookOpen className="w-4 h-4" />
      case 'comparison': return <Scale className="w-4 h-4" />
      case 'commercial': return <DollarSign className="w-4 h-4" />
      case 'local': return <MapPin className="w-4 h-4" />
      case 'educational': return <HelpCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'how-to': return 'bg-blue-500/10 text-blue-500'
      case 'comparison': return 'bg-purple-500/10 text-purple-500'
      case 'commercial': return 'bg-green-500/10 text-green-500'
      case 'local': return 'bg-orange-500/10 text-orange-500'
      case 'educational': return 'bg-cyan-500/10 text-cyan-500'
      case 'tips': return 'bg-amber-500/10 text-amber-500'
      default: return 'bg-slate-500/10 text-slate-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{suggestions.total_targets}</div>
              <div className="text-sm text-muted-foreground">Target Pages</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{suggestions.total_suggested_topics}</div>
              <div className="text-sm text-muted-foreground">Content Ideas</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 col-span-2 md:col-span-1">
          <Button onClick={onRefresh} variant="outline" className="w-full h-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Ideas
          </Button>
        </Card>
      </div>

      {/* Suggestions by Target */}
      <div className="space-y-4">
        {suggestions.suggestions.map((targetSuggestion) => (
          <Card key={targetSuggestion.target_page.id} className="overflow-hidden">
            <button
              onClick={() => setExpandedTarget(
                expandedTarget === targetSuggestion.target_page.id 
                  ? null 
                  : targetSuggestion.target_page.id
              )}
              className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{targetSuggestion.target_page.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {targetSuggestion.existing_supporting_count} existing • {targetSuggestion.suggested_topics.length} suggestions
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <GapBadges gaps={targetSuggestion.gap_analysis} />
                  {expandedTarget === targetSuggestion.target_page.id ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </button>

            {expandedTarget === targetSuggestion.target_page.id && (
              <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                {targetSuggestion.suggested_topics.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    Good coverage! No gaps detected.
                  </div>
                ) : (
                  targetSuggestion.suggested_topics.map((topic, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${getTypeColor(topic.type)}`}>
                        {getTypeIcon(topic.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{topic.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(topic.type)}`}>
                            {topic.type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Priority: {topic.priority}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="shrink-0">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

// Gap Analysis Badges
function GapBadges({ gaps }: { gaps: { has_how_to: boolean; has_comparison: boolean; has_guide: boolean; has_faq: boolean } }) {
  const missing = []
  if (!gaps.has_how_to) missing.push('How-to')
  if (!gaps.has_comparison) missing.push('Comparison')
  if (!gaps.has_guide) missing.push('Guide')
  if (!gaps.has_faq) missing.push('FAQ')

  if (missing.length === 0) {
    return (
      <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded">
        ✓ Complete
      </span>
    )
  }

  return (
    <div className="flex gap-1">
      {missing.slice(0, 2).map((gap) => (
        <span key={gap} className="text-xs px-2 py-1 bg-amber-500/10 text-amber-500 rounded">
          Missing: {gap}
        </span>
      ))}
      {missing.length > 2 && (
        <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-500 rounded">
          +{missing.length - 2}
        </span>
      )}
    </div>
  )
}
