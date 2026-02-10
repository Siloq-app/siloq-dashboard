'use client'

import { useState } from 'react'
import { 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Link2,
  Merge,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Star
} from 'lucide-react'
import { AnalysisResult, CannibalizationIssue, ContentRecommendation } from '@/lib/services/api'

interface Props {
  results: AnalysisResult | null
  isLoading: boolean
  onAnalyze: () => void
}

function HealthScoreCircle({ score, delta }: { score: number; delta: number }) {
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (score / 100) * circumference
  
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-red-400'
  }
  
  const getStrokeColor = (score: number) => {
    if (score >= 75) return 'stroke-emerald-400'
    if (score >= 50) return 'stroke-amber-400'
    return 'stroke-red-400'
  }

  return (
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-slate-700"
        />
        <circle
          cx="64"
          cy="64"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={getStrokeColor(score)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
        {delta !== 0 && (
          <span className={`text-xs flex items-center gap-1 ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {delta > 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[severity]}`}>
      {severity.toUpperCase()}
    </span>
  )
}

function CannibalizationCard({ issue }: { issue: CannibalizationIssue }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <SeverityBadge severity={issue.severity} />
            <span className="text-sm text-slate-400">
              {issue.competing_pages.length} pages competing
            </span>
          </div>
          <h4 className="font-medium text-white">
            <span className="font-mono bg-slate-700 px-2 py-0.5 rounded text-sm">
              {issue.keyword}
            </span>
          </h4>
          {issue.suggested_king && (
            <p className="text-sm text-slate-400 mt-2">
              Suggested winner: <span className="text-indigo-400">{issue.suggested_king.title}</span>
            </p>
          )}
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-slate-400 hover:text-white"
        >
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
      
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-sm text-slate-400 mb-3">Competing pages:</p>
          <div className="space-y-2">
            {issue.competing_pages.map((page) => (
              <div key={page.id} className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">•</span>
                <a 
                  href={page.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white truncate flex-1"
                >
                  {page.title}
                </a>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex gap-2">
            <button className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors">
              Fix Issue
            </button>
            <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
              Ignore
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RecommendationCard({ rec }: { rec: ContentRecommendation }) {
  const icons = {
    supporting_content: <Sparkles className="w-5 h-5 text-emerald-400" />,
    consolidation: <Merge className="w-5 h-5 text-amber-400" />,
    differentiation: <FileText className="w-5 h-5 text-blue-400" />,
  }
  
  const actionLabels = {
    generate: 'Generate Content',
    review: 'Review & Merge',
    edit: 'Edit Content',
  }
  
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-700/50 rounded-lg">
          {icons[rec.type]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-white">{rec.title}</h4>
            <span className={`px-2 py-0.5 rounded text-xs ${
              rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
              rec.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-700 text-slate-400'
            }`}>
              {rec.priority}
            </span>
          </div>
          <p className="text-sm text-slate-400">{rec.description}</p>
          
          {rec.target_page_url && (
            <a 
              href={rec.target_page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-flex items-center gap-1"
            >
              View page <ExternalLink className="w-3 h-3" />
            </a>
          )}
          
          <div className="mt-3">
            <button className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors">
              {actionLabels[rec.action]}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AnalysisResults({ results, isLoading, onAnalyze }: Props) {
  if (isLoading) {
    return (
      <div className="card p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-400">Analyzing your site...</p>
        <p className="text-slate-500 text-sm mt-2">Detecting cannibalization and generating recommendations</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
          Click the button above to analyze your site for cannibalization issues 
          and get personalized content recommendations.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Health Score Overview */}
      <div className="card p-6">
        <div className="flex items-center gap-8">
          <HealthScoreCircle score={results.health_score} delta={results.health_score_delta} />
          
          <div className="flex-1 grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{results.page_count}</div>
              <div className="text-sm text-slate-400">Pages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{results.money_page_count}</div>
              <div className="text-sm text-slate-400">Money Pages</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${results.cannibalization_count > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {results.cannibalization_count}
              </div>
              <div className="text-sm text-slate-400">Issues Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-400">{results.recommendation_count}</div>
              <div className="text-sm text-slate-400">Recommendations</div>
            </div>
          </div>
        </div>
        
        {/* Health Breakdown */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <h4 className="text-sm font-medium text-slate-400 mb-3">Score Breakdown</h4>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Base</span>
              <span className="text-slate-300">+{results.health_breakdown.base_score}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Cannibalization</span>
              <span className={results.health_breakdown.cannibalization_penalty < 0 ? 'text-red-400' : 'text-slate-300'}>
                {results.health_breakdown.cannibalization_penalty}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">SEO Data</span>
              <span className={results.health_breakdown.seo_data_penalty < 0 ? 'text-amber-400' : 'text-slate-300'}>
                {results.health_breakdown.seo_data_penalty}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Money Pages</span>
              <span className={results.health_breakdown.money_page_bonus > 0 ? 'text-emerald-400' : 'text-slate-300'}>
                +{results.health_breakdown.money_page_bonus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cannibalization Issues */}
      {results.cannibalization_count > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold">Cannibalization Issues</h3>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
              {results.cannibalization_count} found
            </span>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            These pages are competing for the same keywords, diluting your search authority.
          </p>
          <div className="space-y-3">
            {results.cannibalization_issues.map((issue, index) => (
              <CannibalizationCard key={index} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* No Issues */}
      {results.cannibalization_count === 0 && (
        <div className="card p-6 bg-emerald-500/5 border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-400">No Cannibalization Detected</h3>
              <p className="text-sm text-slate-400">
                Your pages have good keyword separation. Keep it up!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {results.recommendations.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold">Recommendations</h3>
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium">
              {results.recommendations.length} actions
            </span>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            Take these actions to improve your content strategy and search performance.
          </p>
          <div className="space-y-3">
            {results.recommendations.map((rec, index) => (
              <RecommendationCard key={index} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Re-analyze Button */}
      <div className="flex justify-center">
        <button 
          onClick={onAnalyze}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
        >
          Re-analyze Site
        </button>
      </div>
    </div>
  )
}
