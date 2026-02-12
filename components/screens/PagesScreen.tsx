'use client'

import { useState } from 'react'
import { Star, ExternalLink, Check, Search, Filter, Sparkles, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react'

import { Page as ApiPage, AnalysisResult, SyncTriggerResponse } from '@/lib/services/api'
import AnalysisResults from './AnalysisResults'

interface Page extends ApiPage {}

interface Props {
  pages: Page[]
  isLoading: boolean
  onMarkMoneyPage: (pageId: number, isMoney: boolean) => void
  onAnalyze: () => Promise<AnalysisResult>
  analysisResults: AnalysisResult | null
  isAnalyzing: boolean
  onTriggerSync?: () => Promise<SyncTriggerResponse>
  lastSyncedAt?: string | null
  siteName?: string
}

export default function PagesScreen({ 
  pages, 
  isLoading, 
  onMarkMoneyPage, 
  onAnalyze, 
  analysisResults, 
  isAnalyzing,
  onTriggerSync,
  lastSyncedAt,
  siteName
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'money' | 'supporting'>('all')
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setShowAnalysis(true)
    await onAnalyze()
  }

  const handleTriggerSync = async () => {
    if (!onTriggerSync) return
    setIsSyncing(true)
    setSyncMessage(null)
    try {
      const result = await onTriggerSync()
      setSyncMessage(result.instructions)
    } catch (err) {
      setSyncMessage('Failed to request sync. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          page.url.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (filter === 'money') return matchesSearch && page.is_money_page
    if (filter === 'supporting') return matchesSearch && !page.is_money_page
    return matchesSearch
  })

  const moneyPageCount = pages.filter(p => p.is_money_page).length

  if (isLoading) {
    return (
      <div className="card p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-400">Loading pages...</p>
      </div>
    )
  }

  // Show analysis results view
  if (showAnalysis) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => setShowAnalysis(false)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pages
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Site Analysis</h2>
            <p className="text-slate-400 text-sm mt-1">
              {analysisResults ? `Analyzed ${analysisResults.page_count} pages` : 'Analyzing your site...'}
            </p>
          </div>
          {analysisResults && (
            <button
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
            </button>
          )}
        </div>

        <AnalysisResults 
          results={analysisResults}
          isLoading={isAnalyzing}
          onAnalyze={onAnalyze}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Your Pages</h2>
            <p className="text-slate-400 text-sm mt-1">
              {pages.length} pages synced • {moneyPageCount} marked as money pages
            </p>
          </div>
          {moneyPageCount > 0 && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Site'}
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 mb-6">
          <p className="text-indigo-300 text-sm">
            <strong>💡 Tip:</strong> Click the star icon to mark your most important pages (homepage, service pages, product pages). 
            Siloq will build your content strategy around these pages.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All ({pages.length})
            </button>
            <button
              onClick={() => setFilter('money')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'money' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-4 h-4 inline mr-1" />
              Money Pages ({moneyPageCount})
            </button>
            <button
              onClick={() => setFilter('supporting')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'supporting' 
                  ? 'bg-slate-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Supporting ({pages.length - moneyPageCount})
            </button>
          </div>
        </div>

        {/* Pages List */}
        <div className="space-y-2">
          {filteredPages.length === 0 && !searchQuery && pages.length === 0 ? (
            /* No pages synced - show sync card */
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Pages Synced Yet</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                {siteName ? `Connect your WordPress site "${siteName}" to sync your pages.` : 'Connect your WordPress site to sync your pages.'}
              </p>
              
              {/* Sync Instructions Card */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-lg mx-auto text-left">
                <h4 className="font-medium text-white mb-3">How to sync your pages:</h4>
                <ol className="space-y-3 text-sm text-slate-400">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
                    <span>Install the <strong className="text-white">Siloq WordPress Plugin</strong> on your site</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">2</span>
                    <span>Go to <strong className="text-white">Settings → Siloq</strong> in WordPress admin</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">3</span>
                    <span>Enter your <strong className="text-white">API Key</strong> and click <strong className="text-white">"Sync Now"</strong></span>
                  </li>
                </ol>
                
                {syncMessage && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm text-amber-300">{syncMessage}</p>
                  </div>
                )}
                
                <div className="mt-6 flex gap-3">
                  {onTriggerSync && (
                    <button
                      onClick={handleTriggerSync}
                      disabled={isSyncing}
                      className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Requesting...' : 'Request Sync'}
                    </button>
                  )}
                  <a 
                    href="https://github.com/Siloq-app/siloq-wordpress/releases/latest/download/siloq-connector.zip" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-center"
                  >
                    Download Plugin
                  </a>
                </div>
              </div>
              
              {lastSyncedAt && (
                <p className="text-xs text-slate-500 mt-4">
                  Last sync: {new Date(lastSyncedAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No pages match your search
            </div>
          ) : (
            filteredPages.map((page) => (
              <div
                key={page.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  page.is_money_page 
                    ? 'bg-amber-500/5 border-amber-500/30' 
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                {/* Money Page Toggle */}
                <button
                  onClick={() => onMarkMoneyPage(page.id, !page.is_money_page)}
                  className={`p-2 rounded-lg transition-colors ${
                    page.is_money_page
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-700 text-slate-400 hover:text-amber-400 hover:bg-slate-600'
                  }`}
                  title={page.is_money_page ? 'Remove from money pages' : 'Mark as money page'}
                >
                  <Star className={`w-5 h-5 ${page.is_money_page ? 'fill-current' : ''}`} />
                </button>

                {/* Page Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{page.title || 'Untitled'}</h3>
                  <p className="text-sm text-slate-400 truncate">{page.url}</p>
                </div>

                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  page.is_money_page
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {page.is_money_page ? 'Money Page' : 'Supporting'}
                </div>

                {/* External Link */}
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                  title="Open page"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Next Steps Card */}
      {moneyPageCount > 0 && !showAnalysis && (
        <div className="card p-6 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border-emerald-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-400">Ready to Analyze</h3>
              <p className="text-sm text-slate-400">
                You've marked {moneyPageCount} money page{moneyPageCount > 1 ? 's' : ''}. 
                Siloq can now analyze your site for cannibalization and content opportunities.
              </p>
            </div>
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Site'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
