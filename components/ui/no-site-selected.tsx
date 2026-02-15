'use client';

import { Globe } from 'lucide-react';

interface NoSiteSelectedProps {
  message?: string;
}

export function NoSiteSelected({
  message = 'Select a site to get started',
}: NoSiteSelectedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Globe className="h-7 w-7 text-slate-400 dark:text-slate-500" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No site selected</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      </div>
    </div>
  );
}
