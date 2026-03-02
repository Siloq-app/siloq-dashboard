'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface MobileBreadcrumbProps {
  title: string;
  onBack?: () => void;
  showHome?: boolean;
  className?: string;
}

export function MobileBreadcrumb({
  title,
  onBack,
  showHome = false,
  className,
}: MobileBreadcrumbProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 border-b bg-background px-2 py-3 sm:hidden',
        className
      )}
    >
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {showHome && (
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Home className="h-4 w-4" />
          </Button>
        </Link>
      )}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold">{title}</h1>
      </div>
    </div>
  );
}
