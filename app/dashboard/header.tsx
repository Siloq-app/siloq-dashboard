'use client';

import { useState } from 'react';
import { Shield, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutomationMode } from './types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface HeaderProps {
  automationMode: AutomationMode;
  onAutomationChange: (mode: AutomationMode) => void;
  activeTab: string;
}

const automationModes = [
  {
    id: 'manual' as const,
    label: 'Manual',
    desc: 'All changes require approval',
  },
  {
    id: 'semi' as const,
    label: 'Semi-Auto',
    desc: 'Safe changes auto-execute',
  },
  { id: 'full' as const, label: 'Full-Auto', desc: '48-hour rollback window' },
];

export default function Header({
  automationMode,
  onAutomationChange,
  activeTab,
}: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1 inline-flex h-7 w-7 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium text-slate-900 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 dark:text-slate-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" />

      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />

      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {activeTab === 'overview' || activeTab === 'dashboard'
                ? 'Overview'
                : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Automation Mode Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-lg border bg-muted px-2 py-1.5 text-sm transition-colors hover:bg-muted/80 sm:px-3"
          >
            <Shield className="hidden h-3.5 w-3.5 text-gray-700 dark:text-gray-300 sm:block" />
            <span className="hidden text-gray-700 dark:text-gray-300 md:inline">
              Automation:
            </span>
            <span
              className={cn(
                'rounded px-2 py-0.5 text-[10px] font-semibold uppercase',
                automationMode === 'manual' && 'bg-amber-100 text-amber-700',
                automationMode === 'semi' && 'bg-blue-100 text-blue-700',
                automationMode === 'full' && 'bg-emerald-100 text-emerald-700'
              )}
            >
              {automationMode === 'manual'
                ? 'Manual'
                : automationMode === 'semi'
                  ? 'Semi'
                  : 'Full'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border bg-white p-2 shadow-2xl sm:w-72">
              {automationModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    onAutomationChange(mode.id);
                    setShowDropdown(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors',
                    automationMode === mode.id
                      ? 'bg-primary/10'
                      : 'hover:bg-muted'
                  )}
                >
                  <div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {mode.label}
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      {mode.desc}
                    </div>
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
        <div className="flex items-center gap-2 pl-2 sm:pl-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            yoursite.com
          </span>
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
        </div>
      </div>
    </header>
  );
}
