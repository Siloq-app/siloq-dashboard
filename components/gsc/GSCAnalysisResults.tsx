'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { gscService, GSCAnalysisResult, GSCAnalysisIssue } from '@/lib/services/api'
import { AlertTriangle, Loader2, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  siteId: number | string
  isConnected: boolean
}

export default function GSCAnalysisResults({ siteId, isConnected }: Props) {
  const [results, setResults] = useState<GSCAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null)

  const runAnalysis = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await gscService.analyze(siteId)
      setResults(data)
    } catch (err: any) {
      console.error('GSC analysis failed:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return null
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          GSC Cannibalization Analysis
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={runAnalysis}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              {results ? 'Re-analyze' : 'Run Analysis'}
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            {error}
          </div>
        )}

        {!results && !loading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">Click "Run Analysis" to detect cannibalization issues</p>
            <p className="text-xs">Uses your GSC data from the last 90 days</p>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{results.queries_analyzed.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Queries Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.issues_found}</div>
                <div className="text-xs text-muted-foreground">Issues Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {results.issues.filter(i => i.severity === 'HIGH').length}
                </div>
                <div className="text-xs text-muted-foreground">High Priority</div>
              </div>
            </div>

            {/* Issues List */}
            {results.issues.length === 0 ? (
              <div className="text-center py-6 text-green-600">
                ✓ No cannibalization issues detected!
              </div>
            ) : (
              <div className="space-y-2">
                {results.issues.map((issue, idx) => (
                  <IssueCard
                    key={idx}
                    issue={issue}
                    isExpanded={expandedIssue === idx}
                    onToggle={() => setExpandedIssue(expandedIssue === idx ? null : idx)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function IssueCard({ 
  issue, 
  isExpanded, 
  onToggle 
}: { 
  issue: GSCAnalysisIssue
  isExpanded: boolean
  onToggle: () => void
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200'
      case 'MEDIUM': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200'
      case 'LOW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200'
    }
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Badge className={getSeverityColor(issue.severity)}>
            {issue.severity}
          </Badge>
          <div className="truncate">
            <span className="font-medium">"{issue.query}"</span>
            <span className="text-muted-foreground ml-2 text-sm">
              {issue.impression_split}
            </span>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t bg-muted/30 space-y-3">
          <div>
            <div className="text-sm font-medium mb-1">Issue</div>
            <p className="text-sm text-muted-foreground">{issue.explanation}</p>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Recommendation</div>
            <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
          </div>

          {issue.competing_pages && issue.competing_pages.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Competing Pages</div>
              <div className="space-y-1">
                {issue.competing_pages.map((page, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm p-2 bg-background rounded">
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate flex items-center gap-1"
                    >
                      {page.url.replace(/^https?:\/\/[^/]+/, '')}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                    <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                      <span>{page.clicks} clicks</span>
                      <Badge variant="outline" className="text-xs">{page.share}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {issue.suggested_winner && (
            <div className="text-sm">
              <span className="font-medium">Suggested Winner: </span>
              <a
                href={issue.suggested_winner}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {issue.suggested_winner.replace(/^https?:\/\/[^/]+/, '')}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
