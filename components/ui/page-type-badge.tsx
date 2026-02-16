'use client';

import { useState, useEffect, useRef } from 'react';
import { Crown, ArrowUp, Settings, Target, Archive, ShoppingCart, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageClassificationType } from '@/app/dashboard/types';

const PAGE_TYPE_CONFIG: Record<PageClassificationType, {
  label: string;
  icon: typeof Crown;
  bg: string;
  text: string;
  darkBg: string;
  darkText: string;
}> = {
  money: {
    label: 'Money Page',
    icon: Crown,
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    darkBg: 'dark:bg-amber-900/30',
    darkText: 'dark:text-amber-400',
  },
  supporting: {
    label: 'Supporting',
    icon: ArrowUp,
    bg: 'bg-sky-100',
    text: 'text-sky-700',
    darkBg: 'dark:bg-sky-900/30',
    darkText: 'dark:text-sky-400',
  },
  utility: {
    label: 'Utility',
    icon: Settings,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    darkBg: 'dark:bg-slate-800',
    darkText: 'dark:text-slate-400',
  },
  conversion: {
    label: 'Conversion',
    icon: Target,
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    darkBg: 'dark:bg-purple-900/30',
    darkText: 'dark:text-purple-400',
  },
  archive: {
    label: 'Archive',
    icon: Archive,
    bg: 'bg-slate-200',
    text: 'text-slate-700',
    darkBg: 'dark:bg-slate-700',
    darkText: 'dark:text-slate-300',
  },
  product: {
    label: 'Product',
    icon: ShoppingCart,
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    darkBg: 'dark:bg-emerald-900/30',
    darkText: 'dark:text-emerald-400',
  },
};

const ALL_TYPES: PageClassificationType[] = ['money', 'supporting', 'utility', 'conversion', 'archive', 'product'];

interface PageTypeBadgeProps {
  pageType: PageClassificationType;
  isOverride?: boolean;
  className?: string;
  onChangeType?: (newType: PageClassificationType) => void;
}

export function PageTypeBadge({ pageType, isOverride, className, onChangeType }: PageTypeBadgeProps) {
  const config = PAGE_TYPE_CONFIG[pageType] || PAGE_TYPE_CONFIG.supporting;
  const Icon = config.icon;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <span
        onClick={onChangeType ? () => setOpen(o => !o) : undefined}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
          config.bg,
          config.text,
          config.darkBg,
          config.darkText,
          onChangeType && 'cursor-pointer hover:opacity-80',
          className
        )}
      >
        <Icon size={10} />
        {config.label}
        {isOverride && <Lock size={8} className="ml-0.5 opacity-60" />}
      </span>

      {open && onChangeType && (
        <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {ALL_TYPES.map((type) => {
            const c = PAGE_TYPE_CONFIG[type];
            const TypeIcon = c.icon;
            return (
              <button
                key={type}
                onClick={() => {
                  onChangeType(type);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700',
                  type === pageType && 'bg-slate-50 dark:bg-slate-700'
                )}
              >
                <span className={cn('h-2 w-2 rounded-full', c.bg)} />
                <TypeIcon size={12} className={c.text} />
                <span className="text-slate-700 dark:text-slate-300">{c.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { PAGE_TYPE_CONFIG };
