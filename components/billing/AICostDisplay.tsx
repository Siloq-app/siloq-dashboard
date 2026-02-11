/**
 * AI Cost Display Component
 * Shows estimated or actual AI costs with appropriate messaging
 */

'use client';

import { DollarSign, Info } from 'lucide-react';
import { AICostEstimate, AIBillingMode } from '@/lib/billing/types';
import { formatCostMessage } from '@/lib/billing/preflight';

interface AICostDisplayProps {
  estimate: AICostEstimate;
  trialPagesUsed?: number;
  trialPagesLimit?: number;
  isActual?: boolean;
  className?: string;
}

export function AICostDisplay({
  estimate,
  trialPagesUsed,
  trialPagesLimit,
  isActual = false,
  className,
}: AICostDisplayProps) {
  const costMessage = formatCostMessage(estimate, trialPagesUsed, trialPagesLimit);

  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
          <DollarSign className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {isActual ? 'Actual AI Cost' : 'Estimated AI Cost'}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {costMessage}
          </p>

          {/* Detailed breakdown */}
          <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-500">
            <div className="flex justify-between">
              <span>Input tokens:</span>
              <span>{estimate.inputTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Output tokens:</span>
              <span>{estimate.outputTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Provider cost:</span>
              <span>${estimate.providerCostUsd.toFixed(4)}</span>
            </div>
            {estimate.siloqFeeUsd > 0 && (
              <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                <span>Siloq fee (5%):</span>
                <span>${estimate.siloqFeeUsd.toFixed(4)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-1 font-medium dark:border-slate-700">
              <span>Total:</span>
              <span>${estimate.totalCostUsd.toFixed(4)}</span>
            </div>
          </div>

          {/* Trial info */}
          {estimate.billingMode === 'trial' && trialPagesUsed !== undefined && trialPagesLimit !== undefined && (
            <div className="mt-3 flex items-center gap-2 rounded bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <Info className="h-3 w-3" />
              <span>
                Trial: {trialPagesUsed}/{trialPagesLimit} pages used. 
                {trialPagesLimit - trialPagesUsed} remaining.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
