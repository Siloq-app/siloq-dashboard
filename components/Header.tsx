'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ChevronDown, Check, LogOut, Menu } from 'lucide-react'
import { AutomationMode } from './Dashboard'

interface HeaderProps {
  automationMode: AutomationMode
  onAutomationChange: (mode: AutomationMode) => void
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

const automationModes = [
  { id: 'manual' as const, label: 'Manual', desc: 'All changes require approval' },
  { id: 'semi' as const, label: 'Semi-Auto', desc: 'Safe changes auto-execute' },
  { id: 'full' as const, label: 'Full-Auto', desc: '48-hour rollback window' },
]

export default function Header({ automationMode, onAutomationChange, onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    const token = localStorage.getItem('token')
    
    // Call server to invalidate token
    if (token) {
      try {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      } catch (err) {
        console.error('Server logout error:', err)
      }
    }
    
    // Clear client-side storage
    localStorage.removeItem('token')
    sessionStorage.clear()
    
    // Force navigation to login
    window.location.href = '/auth/login'
  }

  return (
    <header className="px-8 py-3 border-b border-slate-700/50 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="Siloq" className="h-12 w-auto" />
      </div>

      <div className="flex items-center gap-5">
        {/* Automation Mode Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2 hover:border-slate-600 transition-colors"
          >
            <Shield size={14} className="text-slate-400" />
            <span className="text-sm text-slate-300">Automation:</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase automation-${automationMode}`}>
              {automationMode === 'manual' ? 'Manual' : automationMode === 'semi' ? 'Semi-Auto' : 'Full-Auto'}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 bg-slate-800/95 border border-slate-700/50 rounded-xl p-2 w-72 z-50 shadow-2xl">
              {automationModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => { onAutomationChange(mode.id); setShowDropdown(false) }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    automationMode === mode.id ? 'bg-indigo-500/10' : 'hover:bg-slate-700/50'
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium">{mode.label}</div>
                    <div className="text-xs text-slate-500">{mode.desc}</div>
                  </div>
                  {automationMode === mode.id && (
                    <Check size={16} className="text-indigo-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Site Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">yoursite.com</span>
          <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50" />
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2 hover:border-red-500/50 hover:bg-red-500/10 transition-colors text-slate-400 hover:text-red-400"
        >
          <LogOut size={16} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </header>
  )
}
