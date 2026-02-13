'use client'

import { useState } from 'react'
import { X, Zap, Loader2 } from 'lucide-react'
import { CannibalizationIssue, Silo, PendingChange } from '@/app/dashboard/types'
import { dashboardService } from '@/lib/services/api'

interface Props {
  silos: Silo[]
  onClose: () => void
  onGenerate?: (siloId: number, contentType: string, entityCluster: string) => Promise<void>
  siteId?: number | string
}

export default function GenerateModal({ silos, onClose, onGenerate, siteId }: Props) {
  const [selectedSiloId, setSelectedSiloId] = useState<number>(silos[0]?.id || 0)
  const [contentType, setContentType] = useState('Supporting Article')
  const [entityCluster, setEntityCluster] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!entityCluster.trim()) {
      setError('Please enter a target entity cluster')
      return
    }
    
    setIsGenerating(true)
    setError(null)
    try {
      if (onGenerate) {
        await onGenerate(selectedSiloId, contentType, entityCluster)
      } else if (siteId) {
        // Find the target page for this silo
        const silo = silos.find(s => s.id === selectedSiloId)
        if (!silo) throw new Error('Please select a silo')
        
        // Map content type to API format
        const typeMap: Record<string, string> = {
          'Supporting Article': 'supporting_article',
          'FAQ Page': 'faq',
          'How-to Guide': 'how_to',
          'Comparison Page': 'comparison',
        }
        
        const result = await dashboardService.generateContent(siteId, {
          target_page_id: selectedSiloId, // silo id maps to target page id
          content_type: typeMap[contentType] || 'supporting_article',
          topic: entityCluster,
        })
        
        if (result.success) {
          // Show the generated content (could open in a new modal or copy to clipboard)
          const generated = result.generated
          alert(`✅ Content Generated!\n\nTitle: ${generated.title}\nWords: ${generated.word_count}\n\nThe content has been generated. Check your WordPress dashboard to import it.`)
        }
      } else {
        alert('Content generation requires a site to be selected.')
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate content')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="card w-[500px] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Generate Supporting Page</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="mb-5">
          <label className="text-sm text-slate-400 block mb-2">
            Target Silo (links UP to this Target Page)
          </label>
          <select 
            className="w-full p-3 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-200 text-sm"
            value={selectedSiloId}
            onChange={(e) => setSelectedSiloId(Number(e.target.value))}
          >
            {silos.map((silo) => (
              <option key={silo.id} value={silo.id}>
                👑 {silo.name} → {silo.targetPage.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-5">
          <label className="text-sm text-slate-400 block mb-2">Content Type</label>
          <select 
            className="w-full p-3 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-200 text-sm"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
          >
            <option>Supporting Article</option>
            <option>FAQ Page</option>
            <option>How-To Guide</option>
            <option>Comparison Article</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="text-sm text-slate-400 block mb-2">Target Entity Cluster</label>
          <input
            type="text"
            placeholder="e.g., kitchen lighting, under-cabinet lights, pendant lights"
            className={`w-full p-3 bg-slate-900/60 border rounded-lg text-slate-200 text-sm placeholder:text-slate-500 ${
              error ? 'border-red-500' : 'border-slate-700/50'
            }`}
            value={entityCluster}
            onChange={(e) => {
              setEntityCluster(e.target.value)
              setError(null)
            }}
          />
          {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
          <div className="text-[11px] text-slate-500 mt-1.5">
            Entity sources: NLP extraction • Google Knowledge Graph • GSC queries
          </div>
        </div>

        <div className="bg-indigo-500/10 rounded-lg p-4 mb-6">
          <div className="text-xs text-indigo-300 mb-2 font-semibold">✨ Siloq will automatically:</div>
          <div className="text-sm text-slate-400 space-y-1">
            <div>• Check for entity overlap with sibling pages</div>
            <div>• Include internal link to Target Page</div>
            <div>• Apply schema markup</div>
            <div>• Queue for your approval before publishing</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={isGenerating}>Cancel</button>
          <button 
            className="btn-primary flex-1 justify-center disabled:opacity-50"
            onClick={handleGenerate}
            disabled={isGenerating || silos.length === 0}
          >
            {isGenerating ? (
              <><Loader2 size={14} className="animate-spin" /> Generating...</>
            ) : (
              <><Zap size={14} /> Generate Content</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
