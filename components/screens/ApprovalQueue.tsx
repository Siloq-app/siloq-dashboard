'use client'

import { Check, RotateCcw, TrendingUp, Loader2 } from 'lucide-react'
import { PendingChange } from '@/app/dashboard/Dashboard'
import { useState } from 'react'

interface Props {
  pendingChanges: PendingChange[]
  onApprove?: (id: number) => Promise<void>
  onDeny?: (id: number) => Promise<void>
  onApproveAll?: () => Promise<void>
  onApproveAllSafe?: () => Promise<void>
}

export default function ApprovalQueue({ 
  pendingChanges, 
  onApprove, 
  onDeny, 
  onApproveAll, 
  onApproveAllSafe 
}: Props) {
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [bulkLoading, setBulkLoading] = useState<'all' | 'safe' | null>(null)
  
  const safeChanges = pendingChanges.filter(c => c.risk === 'safe')
  const destructiveChanges = pendingChanges.filter(c => c.risk === 'destructive')

  const handleApprove = async (id: number) => {
    if (!onApprove) return
    setLoadingId(id)
    try {
      await onApprove(id)
    } finally {
      setLoadingId(null)
    }
  }

  const handleDeny = async (id: number) => {
    if (!onDeny) return
    setLoadingId(id)
    try {
      await onDeny(id)
    } finally {
      setLoadingId(null)
    }
  }

  const handleApproveAll = async () => {
    if (!onApproveAll) return
    setBulkLoading('all')
    try {
      await onApproveAll()
    } finally {
      setBulkLoading(null)
    }
  }

  const handleApproveAllSafe = async () => {
    if (!onApproveAllSafe) return
    setBulkLoading('safe')
    try {
      await onApproveAllSafe()
    } finally {
      setBulkLoading(null)
    }
  }

  return (
    <div className="card p-7">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Approval Queue</h2>
          <p className="text-sm text-slate-400">
            Siloq-generated remediation plan — review and approve
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            className="btn-secondary disabled:opacity-50"
            onClick={handleApproveAllSafe}
            disabled={bulkLoading !== null || safeChanges.length === 0}
          >
            {bulkLoading === 'safe' ? (
              <><Loader2 size={14} className="animate-spin" /> Approving...</>
            ) : (
              <>Approve All Safe ({safeChanges.length})</>
            )}
          </button>
          <button 
            className="btn-primary disabled:opacity-50"
            onClick={handleApproveAll}
            disabled={bulkLoading !== null || pendingChanges.length === 0}
          >
            {bulkLoading === 'all' ? (
              <><Loader2 size={14} className="animate-spin" /> Approving...</>
            ) : (
              <><Check size={14} /> Approve All</>
            )}
          </button>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/40 rounded-lg p-4 border border-slate-700/30">
          <div className="text-xs text-slate-400 mb-1">Total Pending</div>
          <div className="text-2xl font-semibold">{pendingChanges.length}</div>
        </div>
        <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/20">
          <div className="text-xs text-emerald-400 mb-1">Safe Changes</div>
          <div className="text-2xl font-semibold text-emerald-400">{safeChanges.length}</div>
        </div>
        <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/20">
          <div className="text-xs text-red-400 mb-1">Destructive Changes</div>
          <div className="text-2xl font-semibold text-red-400">{destructiveChanges.length}</div>
        </div>
      </div>

      {/* Change Cards */}
      <div className="space-y-4">
        {pendingChanges.map((change) => (
          <div
            key={change.id}
            className="bg-slate-900/60 rounded-xl p-6 border border-slate-700/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={change.risk === 'safe' ? 'risk-safe' : 'risk-destructive'}>
                    {change.risk === 'safe' ? '✓ Safe' : '⚠ Destructive'}
                  </span>
                  <span className="text-xs text-slate-500 uppercase">
                    {change.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-base font-medium mb-2 text-slate-100">
                  {change.description}
                </div>

                <div className="text-sm text-slate-400 mb-2">
                  <span className="text-slate-500">DOCTRINE:</span> {change.doctrine}
                </div>

                <div className="text-sm text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp size={14} />
                  Expected impact: {change.impact}
                </div>

                {change.risk === 'destructive' && (
                  <div className="mt-3 p-3 bg-red-500/10 rounded-lg text-xs text-red-300 flex items-center gap-2">
                    <RotateCcw size={14} />
                    48-hour rollback available after execution
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-6">
                <button 
                  className="btn-deny disabled:opacity-50"
                  onClick={() => handleDeny(change.id)}
                  disabled={loadingId === change.id}
                >
                  {loadingId === change.id ? <Loader2 size={14} className="animate-spin" /> : 'Deny'}
                </button>
                <button 
                  className="btn-approve disabled:opacity-50"
                  onClick={() => handleApprove(change.id)}
                  disabled={loadingId === change.id}
                >
                  {loadingId === change.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <><Check size={14} /> Approve</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
