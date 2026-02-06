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
    <header className="px-8 py-3 border-b border-border bg-white flex items-center justify-between">
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="Siloq" className="h-12 w-auto" />
      </div>

      <div className="flex items-center gap-5">
        {/* Automation Mode Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2 hover:bg-muted/80 transition-colors"
          >
            <Shield size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Automation:</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase automation-${automationMode}`}>
              {automationMode === 'manual' ? 'Manual' : automationMode === 'semi' ? 'Semi-Auto' : 'Full-Auto'}
            </span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-border rounded-xl p-2 w-72 z-50 shadow-2xl">
              {automationModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => { onAutomationChange(mode.id); setShowDropdown(false) }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    automationMode === mode.id ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">{mode.label}</div>
                    <div className="text-xs text-muted-foreground">{mode.desc}</div>
                  </div>
                  {automationMode === mode.id && (
                    <Check size={16} className="text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Site Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">yoursite.com</span>
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2 hover:bg-red-50 hover:border-red-200 transition-colors text-muted-foreground hover:text-red-600"
        >
          <LogOut size={16} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </header>
  )
}
