/**
 * AI Billing Preflight Guards
 * Validates billing before any AI execution
 */

import {
  SubscriptionTier,
  AIBillingMode,
  ProjectAISettings,
  BILLING_CONSTANTS,
  BillingError,
  PreflightCheckResult,
  AICostEstimate,
} from './types';

// Token cost estimation (approximate)
const TOKEN_COSTS = {
  openai: {
    'gpt-4': { input: 0.00003, output: 0.00006 }, // per token
    'gpt-4-turbo': { input: 0.00001, output: 0.00003 },
    'gpt-3.5-turbo': { input: 0.0000005, output: 0.0000015 },
  },
  gemini: {
    'gemini-pro': { input: 0.0000005, output: 0.0000015 },
    'gemini-ultra': { input: 0.000001, output: 0.000002 },
  },
};

/**
 * Estimates AI cost based on prompt and expected output
 */
export function estimateAICost(
  prompt: string,
  expectedOutputTokens: number = 1000,
  provider: 'openai' | 'gemini' = 'openai',
  model: string = 'gpt-4-turbo',
  billingMode: AIBillingMode = 'byok'
): AICostEstimate {
  // Rough estimate: 1 token ≈ 4 characters for English
  const inputTokens = Math.ceil(prompt.length / 4);
  
  const providerRates = (TOKEN_COSTS[provider] as Record<string, { input: number; output: number }>)[model] || TOKEN_COSTS.openai['gpt-4-turbo'];
  
  const providerCostUsd = 
    (inputTokens * providerRates.input) + 
    (expectedOutputTokens * providerRates.output);
  
  const siloqFeeUsd = billingMode === 'siloq_managed' 
    ? providerCostUsd * BILLING_CONSTANTS.SILOQ_MANAGED_FEE_PERCENT 
    : 0;
  
  return {
    inputTokens,
    outputTokens: expectedOutputTokens,
    providerCostUsd,
    siloqFeeUsd,
    totalCostUsd: providerCostUsd + siloqFeeUsd,
    billingMode,
  };
}

/**
 * Preflight check before AI execution
 * Returns result indicating if execution is allowed
 */
export async function preflightCheck(
  settings: ProjectAISettings,
  estimatedCost: AICostEstimate,
  isBulkJob: boolean = false
): Promise<PreflightCheckResult> {
  const now = new Date();

  // 1. Trial Mode Validation
  if (settings.billingMode === 'trial') {
    // Check trial expiration
    if (settings.trialEndDate && now > settings.trialEndDate) {
      return {
        allowed: false,
        error: {
          code: 'AI_TRIAL_EXPIRED',
          message: '10-day trial expired. Upgrade to continue generating content.',
          cta: 'Upgrade to Pro ($199/mo) or Builder ($399/mo)',
        },
      };
    }

    // Check trial page limit
    if (settings.trialPagesUsed >= settings.trialPagesLimit) {
      return {
        allowed: false,
        error: {
          code: 'AI_TRIAL_LIMIT_REACHED',
          message: `Trial limit reached (${settings.trialPagesUsed}/${settings.trialPagesLimit} pages).`,
          cta: 'Upgrade to Pro ($199/mo) or Builder ($399/mo) to continue.',
        },
      };
    }

    return {
      allowed: true,
      estimate: {
        ...estimatedCost,
        trialPagesUsed: settings.trialPagesUsed,
        trialPagesRemaining: settings.trialPagesLimit - settings.trialPagesUsed,
      },
    };
  }

  // 2. BYOK Mode Validation
  if (settings.billingMode === 'byok') {
    if (!settings.apiKeyEncrypted) {
      return {
        allowed: false,
        error: {
          code: 'AI_API_KEY_MISSING',
          message: 'API key required for BYOK billing mode.',
          cta: 'Add your OpenAI or Gemini API key in Settings',
        },
      };
    }

    return {
      allowed: true,
      estimate: estimatedCost,
    };
  }

  // 3. Siloq-Managed Mode Validation
  if (settings.billingMode === 'siloq_managed') {
    if (!settings.stripeCustomerId) {
      return {
        allowed: false,
        error: {
          code: 'AI_BILLING_DISABLED',
          message: 'Payment method required for Siloq-Managed billing.',
          cta: 'Add payment method to continue',
        },
      };
    }

    // Bulk job pre-authorization check
    if (isBulkJob && estimatedCost.totalCostUsd > BILLING_CONSTANTS.PREAUTH_THRESHOLD_USD) {
      // In real implementation, this would check Stripe PaymentIntent
      // For now, flag that pre-authorization is required
      return {
        allowed: true,
        requiresPreauth: true,
        estimate: estimatedCost,
      };
    }

    return {
      allowed: true,
      estimate: estimatedCost,
    };
  }

  return {
    allowed: false,
    error: {
      code: 'AI_BILLING_DISABLED',
      message: 'Invalid billing configuration.',
      cta: 'Check billing settings',
    },
  };
}

/**
 * Check if auto-execution is allowed based on cost threshold
 */
export function canAutoExecute(
  settings: ProjectAISettings,
  estimatedCost: number,
  changeClassification: 'safe' | 'destructive'
): boolean {
  // Destructive changes never auto-execute
  if (changeClassification === 'destructive') {
    return false;
  }

  // Trial mode never auto-executes (manual approval only)
  if (settings.billingMode === 'trial') {
    return false;
  }

  // Check automation mode
  if (settings.automationMode === 'manual') {
    return false;
  }

  // Check cost threshold for semi-auto mode
  if (settings.automationMode === 'semi_auto') {
    return estimatedCost <= BILLING_CONSTANTS.AUTO_EXECUTE_COST_THRESHOLD_USD;
  }

  // Full-auto can execute anything within preauth limit
  if (settings.automationMode === 'full_auto') {
    return estimatedCost <= settings.preauthLimitUsd;
  }

  return false;
}

/**
 * Format cost message for display
 */
export function formatCostMessage(
  cost: AICostEstimate,
  trialPagesUsed?: number,
  trialPagesLimit?: number
): string {
  if (cost.billingMode === 'trial') {
    const remaining = trialPagesLimit && trialPagesUsed !== undefined 
      ? trialPagesLimit - trialPagesUsed 
      : '?';
    return `Est. AI cost: $${cost.totalCostUsd.toFixed(2)} (covered by trial - ${trialPagesUsed}/${trialPagesLimit} pages)`;
  }

  if (cost.billingMode === 'byok') {
    return `Est. AI cost: $${cost.providerCostUsd.toFixed(2)} (billed to your provider account)`;
  }

  if (cost.billingMode === 'siloq_managed') {
    return `Est. AI cost: $${cost.totalCostUsd.toFixed(2)} (provider: $${cost.providerCostUsd.toFixed(2)} + 5% processing)`;
  }

  return `Est. AI cost: $${cost.totalCostUsd.toFixed(2)}`;
}

export { checkTierLimits } from './tiers';

/**
 * Initialize trial settings for new project
 */
export function initializeTrialSettings(projectId: string): ProjectAISettings {
  const now = new Date();
  const trialEndDate = new Date(now);
  trialEndDate.setDate(trialEndDate.getDate() + BILLING_CONSTANTS.TRIAL_DURATION_DAYS);

  return {
    id: `settings-${projectId}`,
    projectId,
    billingMode: 'trial',
    currentTier: 'free_trial',
    trialPagesUsed: 0,
    trialPagesLimit: BILLING_CONSTANTS.TRIAL_PAGES_LIMIT,
    trialStartDate: now,
    trialEndDate,
    automationMode: 'manual',
    preauthLimitUsd: BILLING_CONSTANTS.PREAUTH_THRESHOLD_USD,
    createdAt: now,
    updatedAt: now,
  };
}
