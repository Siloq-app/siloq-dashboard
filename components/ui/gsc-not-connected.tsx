'use client';

import { BarChart3 } from 'lucide-react';
import { Button } from './button';

interface GscNotConnectedProps {
  onConnect?: () => void;
}

export function GscNotConnected({ onConnect }: GscNotConnectedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <BarChart3 className="h-7 w-7 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Google Search Console is not connected
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Connect GSC to enable impression-weighted scoring and conflict detection.
        </p>
      </div>
      {onConnect && (
        <Button onClick={onConnect} size="sm">
          Connect GSC →
        </Button>
      )}
    </div>
  );
}
