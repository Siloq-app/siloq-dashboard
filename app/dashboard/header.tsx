'use client';

import { useState } from 'react';
import { Shield, ChevronDown, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutomationMode } from './types';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import { useTheme } from '@/lib/hooks/theme-context';
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

export default function Header({ automationMode, onAutomationChange, activeTab }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const { sites, selectedSite, selectSite } = useDashboardContext();
  const { mode, setMode } = useTheme();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1 inline-flex h-7 w-7 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium text-slate-900 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 dark:text-slate-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" />

      <Separator
        orientation="vertical"
        className="mr-2 hidden data-[orientation=vertical]:h-4 sm:block"
      />

      <Breadcrumb className="hidden lg:block">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden lg:block">
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden lg:block" />
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
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle - Smaller on mobile */}
        <button
          onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
          className="relative flex h-6 w-12 items-center rounded-full border bg-muted transition-all duration-150 hover:bg-muted/80 sm:h-7 sm:w-14"
          style={{
            backgroundColor: mode === 'light' ? '#e2e4eb' : '#212026',
            borderColor: mode === 'light' ? '#e2e4eb' : 'transparent',
          }}
        >
          <div
            className="absolute flex h-4 w-4 items-center justify-center rounded-full text-xs transition-all duration-300 sm:h-5 sm:w-5"
            style={{
              left: mode === 'light' ? '2px' : '26px',
              backgroundColor: mode === 'light' ? '#fff' : '#212026',
              boxShadow: mode === 'light' ? '0 1px 3px #00000026' : 'none',
            }}
          >
            {mode === 'light' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="size-3 text-yellow-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                />
              </svg>
            )}
          </div>
        </button>

        {/* Automation Mode Selector - Compact on mobile */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex h-9 items-center gap-1 rounded-md border bg-background px-2 text-sm shadow-sm transition-colors hover:bg-muted sm:gap-2"
            style={{
              backgroundColor: mode === 'light' ? '' : '#1A1D27',
              borderColor: mode === 'light' ? '' : '#2C3050',
              color: mode === 'light' ? '' : '#E8EAF0',
            }}
          >
            <Shield className="h-3.5 w-3.5" style={{ color: mode === 'light' ? '' : '#7B82A0' }} />
            <span className="hidden sm:inline" style={{ color: mode === 'light' ? '' : '#7B82A0' }}>
              Automation:
            </span>
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase sm:px-2 sm:text-[10px]',
                automationMode === 'manual' &&
                  (mode === 'light'
                    ? 'bg-[#FEF3C7] text-[#78350E]'
                    : 'bg-amber-900/30 text-amber-300'),
                automationMode === 'semi' &&
                  (mode === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-blue-900/30 text-blue-300'),
                automationMode === 'full' &&
                  (mode === 'light'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-emerald-900/30 text-emerald-300')
              )}
            >
              {automationMode === 'manual' ? 'M' : automationMode === 'semi' ? 'S' : 'F'}
            </span>
            <ChevronDown
              className="h-3.5 w-3.5"
              style={{ color: mode === 'light' ? '' : '#7B82A0' }}
            />
          </button>

          {showDropdown && (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border bg-white p-2 shadow-2xl"
              style={{
                backgroundColor: mode === 'light' ? '#ffffff' : '#1A1D27',
                borderColor: mode === 'light' ? '' : '#2C3050',
              }}
            >
              {automationModes.map((modeOption) => (
                <button
                  key={modeOption.id}
                  onClick={() => {
                    onAutomationChange(modeOption.id);
                    setShowDropdown(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors',
                    automationMode === modeOption.id
                      ? mode === 'light'
                        ? 'bg-primary/10'
                        : 'bg-orange-900/20'
                      : mode === 'light'
                        ? 'hover:bg-muted'
                        : 'hover:bg-[#22263A]'
                  )}
                  style={{
                    color: mode === 'light' ? '' : '#E8EAF0',
                  }}
                >
                  <div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: mode === 'light' ? '' : '#E8EAF0' }}
                    >
                      {modeOption.label}
                    </div>
                    <div className="text-xs" style={{ color: mode === 'light' ? '' : '#7B82A0' }}>
                      {modeOption.desc}
                    </div>
                  </div>
                  {automationMode === modeOption.id && (
                    <Check
                      className="h-4 w-4"
                      style={{ color: mode === 'light' ? '#78350E' : '#FBBF23' }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Site Selector - More compact on mobile */}
        <div className="relative">
          <button
            onClick={() => setShowSiteDropdown(!showSiteDropdown)}
            className="flex h-9 items-center gap-1 rounded-md border bg-background px-2 text-sm shadow-sm transition-colors hover:bg-muted sm:gap-2"
            style={{
              backgroundColor: mode === 'light' ? '' : '#1A1D27',
              borderColor: mode === 'light' ? '' : '#2C3050',
              color: mode === 'light' ? '' : '#E8EAF0',
            }}
          >
            <Globe className="h-3.5 w-3.5" style={{ color: mode === 'light' ? '' : '#7B82A0' }} />
            <span
              className="max-w-[100px] truncate sm:max-w-[150px] md:max-w-[200px]"
              style={{ color: mode === 'light' ? '' : '#E8EAF0' }}
            >
              {selectedSite?.name || 'Select site'}
            </span>
            <ChevronDown
              className="h-3.5 w-3.5"
              style={{ color: mode === 'light' ? '' : '#7B82A0' }}
            />
          </button>

          {showSiteDropdown && (
            <div
              className="absolute right-0 top-full z-50 mt-2 h-[83px] w-72 overflow-y-auto rounded-xl border bg-white p-2 shadow-2xl"
              style={{
                backgroundColor: mode === 'light' ? '#ffffff' : '#1A1D27',
                borderColor: mode === 'light' ? '' : '#2C3050',
              }}
            >
              {sites.length === 0 ? (
                <div
                  className="px-3 py-2 text-sm"
                  style={{ color: mode === 'light' ? '' : '#7B82A0' }}
                >
                  No sites available
                </div>
              ) : (
                sites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      selectSite(site);
                      setShowSiteDropdown(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors',
                      selectedSite?.id === site.id
                        ? mode === 'light'
                          ? 'bg-primary/10'
                          : 'bg-orange-900/20'
                        : mode === 'light'
                          ? 'hover:bg-muted'
                          : 'hover:bg-[#22263A]'
                    )}
                    style={{
                      color: mode === 'light' ? '' : '#E8EAF0',
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-sm font-medium"
                        style={{ color: mode === 'light' ? '' : '#E8EAF0' }}
                      >
                        {site.name}
                      </div>
                      <div
                        className="truncate text-xs"
                        style={{ color: mode === 'light' ? '' : '#7B82A0' }}
                      >
                        {site.url}
                      </div>
                    </div>
                    {selectedSite?.id === site.id && (
                      <Check
                        className="ml-2 h-4 w-4 flex-shrink-0"
                        style={{ color: mode === 'light' ? '#78350E' : '#FBBF23' }}
                      />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
