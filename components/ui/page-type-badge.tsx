'use client';

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

interface PageTypeBadgeProps {
  pageType: PageClassificationType;
  isOverride?: boolean;
  className?: string;
}

export function PageTypeBadge({ pageType, isOverride, className }: PageTypeBadgeProps) {
  const config = PAGE_TYPE_CONFIG[pageType] || PAGE_TYPE_CONFIG.supporting;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        config.bg,
        config.text,
        config.darkBg,
        config.darkText,
        className
      )}
    >
      <Icon size={10} />
      {config.label}
      {isOverride && <Lock size={8} className="ml-0.5 opacity-60" />}
    </span>
  );
}

export { PAGE_TYPE_CONFIG };
