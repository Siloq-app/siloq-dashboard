'use client';

import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Shield, Check, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type AutomationMode = 'manual' | 'semi' | 'full';

const automationModes = [
  {
    id: 'manual' as const,
    label: 'Manual',
    desc: 'All changes require approval',
  },
  {
    id: 'semi' as const,
    label: 'Semi-Auto',
    desc: 'Safe changes auto-approved',
  },
  {
    id: 'full' as const,
    label: 'Full Auto',
    desc: 'All changes executed automatically',
  },
];

interface SiteHeaderProps {
  automationMode?: AutomationMode;
  onAutomationChange?: (mode: AutomationMode) => void;
  selectedSite?: { domain: string } | null;
}

export function SiteHeader({
  automationMode = 'manual',
  onAutomationChange,
  selectedSite = null,
}: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Server logout error:', err);
      }
    }
    localStorage.removeItem('token');
    sessionStorage.clear();
    window.location.href = '/auth/login';
  };

  return (
    <header className="bg-background flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear lg:px-6">
      <div className="flex w-full items-center gap-1 lg:gap-2">
        <SidebarTrigger className="-ml-1 h-7 w-7" />
        <Separator orientation="vertical" className="mx-2 h-4" />

        {/* Site Info */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {selectedSite?.domain || 'yoursite.com'}
          </span>
          <span className="flex items-center gap-1 text-xs text-green-600">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Live
          </span>
        </div>

        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-2 px-8 sm:gap-3">
          {/* Automation Mode Selector */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                automationMode === 'full'
                  ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                  : automationMode === 'semi'
                    ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              <span className="hidden text-xs text-gray-600 sm:inline dark:text-gray-400">
                Automation
              </span>
              <span className="font-medium">
                {automationModes.find((m) => m.id === automationMode)?.label}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {isOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border bg-white p-1 shadow-lg">
                {automationModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      onAutomationChange?.(mode.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                      automationMode === mode.id
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {automationMode === mode.id && (
                      <Check className="h-4 w-4" />
                    )}
                    <span
                      className={automationMode === mode.id ? 'ml-0' : 'ml-6'}
                    >
                      {mode.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Separator orientation="vertical" className="h-4" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
