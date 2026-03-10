/**
 * Subscription Management Component
 * Displays current tier, upgrade options, and billing settings
 */

'use client';

import { useState, useCallback } from 'react';
import { CreditCard, Zap, Building2, Crown, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/services/api';
import { toast } from 'sonner';
import {
  SubscriptionTier,
  TierConfig,
  TIER_CONFIGS,
  AIBillingMode,
} from '@/lib/billing/types';
import { formatTierCapabilities, getUpgradeRecommendation } from '@/lib/billing/tiers';

interface SubscriptionManagerProps {
  currentTier: SubscriptionTier;
  billingMode: AIBillingMode;
  trialPagesUsed?: number;
  trialPagesLimit?: number;
  sitesCount: number;
  silosCount: number;
  onUpgrade: (tier: SubscriptionTier) => void;
  onChangeBillingMode: (mode: AIBillingMode) => void;
}

const tierIcons: Record<SubscriptionTier, React.ReactNode> = {
  free_trial: <Zap className="h-5 w-5" />,
  pro: <CreditCard className="h-5 w-5" />,
  builder_plus: <Building2 className="h-5 w-5" />,
  architect: <Building2 className="h-5 w-5" />,
  empire: <Crown className="h-5 w-5" />,
};

const tierColors: Record<SubscriptionTier, string> = {
  free_trial: 'bg-amber-100 text-amber-700 border-amber-200',
  pro: 'bg-blue-100 text-blue-700 border-blue-200',
  builder_plus: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  architect: 'bg-purple-100 text-purple-700 border-purple-200',
  empire: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export function SubscriptionManager({
  currentTier,
  billingMode,
  trialPagesUsed,
  trialPagesLimit,
  sitesCount,
  silosCount,
  onUpgrade,
  onChangeBillingMode,
}: SubscriptionManagerProps) {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const config = TIER_CONFIGS[currentTier];
  const capabilities = formatTierCapabilities(currentTier);
  const recommendedTier = getUpgradeRecommendation(currentTier, sitesCount, silosCount);

  const handleUpgrade = useCallback(async () => {
    if (!selectedTier) return;
    
    setIsUpgrading(true);
    try {
      const response = await fetchWithAuth('/api/v1/billing/checkout/', {
        method: 'POST',
        body: JSON.stringify({ tier: selectedTier }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to initiate checkout');
      }

      const { checkout_url } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = checkout_url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initiate upgrade');
      setIsUpgrading(false);
    }
  }, [selectedTier]);

  const tiers: SubscriptionTier[] = ['free_trial', 'pro', 'builder_plus', 'architect', 'empire'];

  return (
    <div className="space-y-6">
      {/* Current Tier Card */}
      <div className={cn(
        'rounded-xl border p-6',
        tierColors[currentTier]
      )}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/50">
              {tierIcons[currentTier]}
            </div>
            <div>
              <h3 className="font-semibold">{config.name}</h3>
              <p className="text-sm opacity-80">
                {config.price === 0 ? 'Free Trial' : `$${config.price}/month`}
              </p>
            </div>
          </div>
          {currentTier === 'free_trial' && trialPagesUsed !== undefined && (
            <div className="text-right">
              <p className="text-sm font-medium">
                {trialPagesUsed}/{trialPagesLimit} pages used
              </p>
              <div className="mt-1 h-2 w-24 rounded-full bg-white/30">
                <div
                  className="h-full rounded-full bg-current transition-all"
                  style={{ width: `${(trialPagesUsed / (trialPagesLimit || 1)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="opacity-70">Sites:</span>{' '}
            <span className="font-medium">{capabilities.sites}</span>
          </div>
          <div>
            <span className="opacity-70">Silos:</span>{' '}
            <span className="font-medium">{capabilities.silos}</span>
          </div>
          <div>
            <span className="opacity-70">Automation:</span>{' '}
            <span className="font-medium">{capabilities.automation}</span>
          </div>
          <div>
            <span className="opacity-70">AI Billing:</span>{' '}
            <span className="font-medium">{capabilities.aiBilling}</span>
          </div>
        </div>

        {recommendedTier && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/50 p-3 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>
              Consider upgrading to <strong>{TIER_CONFIGS[recommendedTier].name}</strong> for more features
            </span>
          </div>
        )}
      </div>

      {/* AI Billing Mode */}
      {currentTier !== 'free_trial' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h4 className="mb-4 font-semibold">AI Billing Mode</h4>
          <div className="grid gap-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              <input
                type="radio"
                name="billingMode"
                value="byok"
                checked={billingMode === 'byok'}
                onChange={() => onChangeBillingMode('byok')}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <p className="font-medium">Bring Your Own Key (BYOK)</p>
                <p className="text-sm text-slate-500">
                  Use your own OpenAI/Gemini API key. Pay provider directly.
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              <input
                type="radio"
                name="billingMode"
                value="siloq_managed"
                checked={billingMode === 'siloq_managed'}
                onChange={() => onChangeBillingMode('siloq_managed')}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <p className="font-medium">Siloq-Managed</p>
                <p className="text-sm text-slate-500">
                  Siloq handles AI billing. +5% processing fee.
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Upgrade Options */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Upgrade Options</h4>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.filter((t) => t !== 'free_trial' && t !== currentTier).map((tier) => {
            const tierConfig = TIER_CONFIGS[tier];
            const isRecommended = recommendedTier === tier;

            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={cn(
                  'relative rounded-lg border p-4 text-left transition-all',
                  selectedTier === tier
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                    : 'border-slate-200 hover:border-indigo-300 dark:border-slate-700',
                  isRecommended && 'ring-2 ring-amber-400'
                )}
              >
                {isRecommended && (
                  <span className="absolute -top-2 left-2 rounded bg-amber-400 px-2 py-0.5 text-xs font-medium text-amber-900">
                    Recommended
                  </span>
                )}
                <div className="mb-2 flex items-center gap-2">
                  {tierIcons[tier]}
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tierConfig.name}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">${tierConfig.price}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">/month</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-500" />
                    {tierConfig.sites} site{tierConfig.sites > 1 ? 's' : ''}
                  </li>
                  <li className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-500" />
                    {tierConfig.siloLimit === 'unlimited' ? 'Unlimited' : tierConfig.siloLimit} silos
                  </li>
                  <li className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-500" />
                    {tierConfig.automationOptions.includes('semi_auto') ? 'Auto modes' : 'Manual only'}
                  </li>
                </ul>
              </button>
            );
          })}
        </div>

        {selectedTier && (
          <div className="mt-4 flex flex-col sm:flex-row justify-end">
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="w-full sm:w-auto rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {isUpgrading ? 'Processing...' : `Upgrade to ${TIER_CONFIGS[selectedTier].name}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
