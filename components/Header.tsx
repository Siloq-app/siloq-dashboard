'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ChevronDown, Check, LogOut, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
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
    
    localStorage.removeItem('token')
    sessionStorage.clear()
    window.location.href = '/auth/login'
  }

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-16 flex h-16 shrink-0 items-center gap-2 border-b bg-white transition-[width,height] ease-linear px-4 lg:px-8">
      <div className="flex w-full items-center gap-1 lg:gap-2">
        {/* Sidebar Trigger - Styled like shadcn */}
        <button
          onClick={onToggleSidebar}
          className="-ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-slot="sidebar-trigger"
          data-sidebar="trigger"
        >
          <PanelLeft className="h-4 w-4" />
          <span className="sr-only">Toggle Sidebar</span>
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 pl-8 lg:pl-0">
          <img src="/logo.png" alt="Siloq" className="h-8 w-auto" />
        </div>

        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Automation Mode Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 bg-muted border rounded-lg px-2 sm:px-3 py-1.5 hover:bg-muted/80 transition-colors text-sm"
            >
              <Shield className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400 hidden sm:block" />
              <span className="text-gray-600 dark:text-gray-400 hidden md:inline">Automation:</span>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded font-semibold uppercase",
                automationMode === 'manual' && "bg-amber-100 text-amber-700",
                automationMode === 'semi' && "bg-blue-100 text-blue-700",
                automationMode === 'full' && "bg-emerald-100 text-emerald-700"
              )}>
                {automationMode === 'manual' ? 'Manual' : automationMode === 'semi' ? 'Semi' : 'Full'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
            </button>

            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 bg-white border rounded-xl p-2 w-64 sm:w-72 z-50 shadow-2xl">
                {automationModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => { onAutomationChange(mode.id); setShowDropdown(false) }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors",
                      automationMode === mode.id ? 'bg-primary/10' : 'hover:bg-muted'
                    )}
                  >
                    <div>
                      <div className="text-sm font-medium">{mode.label}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{mode.desc}</div>
                    </div>
                    {automationMode === mode.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Site Status */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium hidden md:inline">yoursite.com</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 md:hidden">yoursite</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-muted border rounded-lg px-2 sm:px-3 py-1.5 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors text-sm text-gray-600 dark:text-gray-400 font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
