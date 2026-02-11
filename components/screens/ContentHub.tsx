'use client';

import { Target, Zap, Crown, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onGenerateClick: () => void;
}

const contentActions = [
  {
    title: 'Generate Money Page',
    desc: 'Create a new pillar page (Money Page) that will receive links from Supporting Content',
    icon: Crown,
    color: 'amber' as const,
  },
  {
    title: 'Generate Supporting Content',
    desc: 'Create Supporting Content that links UP to a Money Page',
    icon: Shield,
    color: 'indigo' as const,
  },
  {
    title: 'Differentiate Page',
    desc: 'Rewrite content to target different entities and eliminate cannibalization',
    icon: Zap,
    color: 'rose' as const,
  },
  {
    title: 'Fill Entity Gap',
    desc: 'Generate content for entity clusters not yet covered in a silo',
    icon: Target,
    color: 'emerald' as const,
  },
];

const getColorClasses = (color: string) => {
  const colors: Record<
    string,
    { bg: string; icon: string; border: string; gradient: string }
  > = {
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      icon: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      gradient: 'from-amber-500 to-orange-500',
    },
    indigo: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      icon: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800',
      gradient: 'from-indigo-500 to-purple-500',
    },
    rose: {
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      icon: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800',
      gradient: 'from-rose-500 to-pink-500',
    },
    emerald: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      icon: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      gradient: 'from-emerald-500 to-teal-500',
    },
  };
  return colors[color] || colors.indigo;
};

export default function ContentHub({ onGenerateClick }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Content Generation
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Generate content that fits your Content Strategy architecture
          </p>
        </div>
        <button
          onClick={onGenerateClick}
          className="focus-visible:ring-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
        >
          Generate Content
          <Sparkles size={16} />
        </button>
      </div>

      {/* Content Actions Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {contentActions.map((action, i) => {
          const colors = getColorClasses(action.color);
          const Icon = action.icon;
          return (
            <div
              key={i}
              onClick={onGenerateClick}
              className={cn(
                'bg-card text-card-foreground group relative cursor-pointer overflow-hidden rounded-xl border p-5 shadow transition-all',
                'hover:border-slate-300 hover:shadow-md dark:hover:border-slate-600',
                colors.border
              )}
            >
              {/* Gradient decoration */}
              <div
                className={cn(
                  'absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 blur-xl',
                  colors.gradient
                )}
              />

              <div className="relative">
                <div
                  className={cn(
                    'mb-4 flex h-12 w-12 items-center justify-center rounded-xl border',
                    colors.bg,
                    colors.border
                  )}
                >
                  <Icon size={24} className={colors.icon} />
                </div>

                <h3 className="mb-1 text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">
                  {action.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {action.desc}
                </p>

                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">
                  Get Started
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Preview Card */}
      <div className="bg-card text-card-foreground relative overflow-hidden rounded-xl border p-5 shadow">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-400 via-blue-400 to-violet-400" />

        <div className="relative">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Agent Console
            </span>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">➜</span>
              <span className="text-slate-300">
                Scanning site architecture…
              </span>
              <span className="ml-auto text-xs text-emerald-400">✓</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">➜</span>
              <span className="text-slate-300">Locking primary intent…</span>
              <span className="ml-auto text-xs text-emerald-400">✓</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-violet-400">➜</span>
              <span className="text-slate-300">
                Enforcing entity inheritance…
              </span>
              <span className="ml-auto text-xs text-emerald-400">✓</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400">➜</span>
              <span className="text-slate-300">
                Blocking unauthorized outbound links…
              </span>
              <span className="ml-auto text-xs text-emerald-400">✓</span>
            </div>
            <div className="flex items-center gap-2 border-t border-slate-800 pt-2">
              <span className="animate-pulse text-emerald-400">➜</span>
              <span className="text-emerald-300">
                Generating structured output…
              </span>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            This terminal animation appears during content generation —
            differentiates Siloq from generic AI tools.
          </p>
        </div>
      </div>
    </div>
  );
}
