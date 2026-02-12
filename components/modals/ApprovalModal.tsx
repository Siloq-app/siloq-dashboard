'use client'

import { useState } from 'react'
import { X, Check, AlertTriangle, Loader2 } from 'lucide-react'

interface CompetingPage {
  url: string
  title: string
}

interface CannibalizationIssue {
  keyword: string
  severity: 'high' | 'medium' | 'low'
  competingPages: CompetingPage[]
  recommendation?: string
}

interface Props {
  onClose: () => void
  issue?: CannibalizationIssue
  onMarkReviewed?: (keyword: string) => Promise<void>
}

export default function ApprovalModal({ onClose, issue, onMarkReviewed }: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handleMarkReviewed = async () => {
    if (!issue) return
    
    if (onMarkReviewed) {
      setIsLoading(true)
      try {
        await onMarkReviewed(issue.keyword)
        onClose()
      } catch (e) {
        console.error('Failed to mark as reviewed:', e)
      } finally {
        setIsLoading(false)
      }
    } else {
      // Default behavior: just close
      onClose()
    }
  }

  // If no issue provided, show placeholder
  if (!issue) {
    return (
      <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div 
          className="card w-[600px] p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Siloq Recommendation</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
              <X size={20} />
            </button>
          </div>
          <div className="text-center py-8 text-slate-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
            <p>Select a cannibalization issue to view recommendations.</p>
          </div>
          <button onClick={onClose} className="btn-secondary w-full mt-4">Close</button>
        </div>
      </div>
    )
  }

  const severityColors = {
    high: 'text-red-400',
    medium: 'text-amber-400',
    low: 'text-blue-400'
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="card w-[600px] p-8 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Siloq Recommendation</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Issue Summary */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 mb-6">
          <div className={`text-xs font-semibold mb-2 ${severityColors[issue.severity]}`}>
            {issue.severity.toUpperCase()} SEVERITY - CANNIBALIZATION DETECTED
          </div>
          <div className="text-lg font-semibold mb-1">
            {issue.competingPages.length} pages competing for "{issue.keyword}"
          </div>
          <div className="text-sm text-slate-400">
            These pages may be splitting ranking signals and search impressions
          </div>
        </div>

        {/* Competing Pages */}
        <div className="mb-6">
          <div className="text-sm font-semibold mb-3">Competing Pages:</div>
          <div className="bg-slate-900/60 rounded-lg p-4 space-y-2 max-h-[200px] overflow-y-auto">
            {issue.competingPages.map((page, index) => (
              <div key={index} className="text-sm flex items-start gap-2">
                <span className="text-amber-400 shrink-0">{index + 1}.</span>
                <div className="min-w-0">
                  <div className="text-slate-200 truncate">{page.title || 'Untitled'}</div>
                  <code className="text-xs text-slate-400 break-all">{page.url}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-emerald-500/10 rounded-lg p-4 mb-6">
          <div className="text-xs text-emerald-400 font-semibold mb-1">RECOMMENDATION</div>
          <div className="text-sm text-slate-200">
            {issue.recommendation || 'Review these pages and consider consolidating, differentiating, or designating a primary target page.'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={isLoading}>Close</button>
          <button 
            className="btn-approve flex-1 justify-center disabled:opacity-50"
            onClick={handleMarkReviewed}
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader2 size={14} className="mr-1 animate-spin" /> Saving...</>
            ) : (
              <><Check size={14} className="mr-1" /> Mark as Reviewed</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
