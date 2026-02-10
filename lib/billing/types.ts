/**
 * Billing System Types and Constants
 * Based on Siloq V1 Consolidated Requirements
 */

// Subscription Tiers
export type SubscriptionTier = 'free_trial' | 'pro' | 'builder_plus' | 'architect' | 'empire';

// AI Billing Modes
export type AIBillingMode = 'trial' | 'byok' | 'siloq_managed';

// Change Types for Approval Workflow
export type ChangeType = 
  | 'link_add' 
  | 'entity_assign' 
  | 'new_content' 
  | 'anchor_optimize' 
  | 'schema_update'
  | 'redirect_301'
  | 'page_delete'
  | 'content_merge'
  | 'keyword_reassign'
  | 'silo_restructure';

export type ChangeClassification = 'safe' | 'destructive';

export type AutomationMode = 'manual' | 'semi_auto' | 'full_auto';

// Tier Configuration
export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  price: number; // monthly in USD
  duration: string;
  sites: number;
  siloLimit: number | 'unlimited';
  aiBillingMode: AIBillingMode[];
  scanScope: string;
  cannibalizationDetection: string;
  architectureView: string;
  remediationPlan: string;
  contentGeneration: string;
  automationOptions: AutomationMode[];
  creditCardRequired: boolean;
}

// Subscription Tier Definitions
export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  free_trial: {
    id: 'free_trial',
    name: 'Free Trial',
    price: 0,
    duration: '10 days',
    sites: 1,
    siloLimit: 1,
    aiBillingMode: ['trial'],
    scanScope: 'Single silo analysis',
    cannibalizationDetection: 'Within assigned silo',
    architectureView: 'View assigned silo',
    remediationPlan: 'Per-page suggestions',
    contentGeneration: '10 pages max',
    automationOptions: ['manual'],
    creditCardRequired: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 199,
    duration: 'Monthly',
    sites: 1,
    siloLimit: 2,
    aiBillingMode: ['byok', 'siloq_managed'],
    scanScope: '2 silos with full analysis',
    cannibalizationDetection: 'Within assigned silos',
    architectureView: 'View assigned silos',
    remediationPlan: 'Per-silo suggestions',
    contentGeneration: 'Unlimited',
    automationOptions: ['manual'],
    creditCardRequired: true,
  },
  builder_plus: {
    id: 'builder_plus',
    name: 'Builder+',
    price: 399,
    duration: 'Monthly',
    sites: 1,
    siloLimit: 'unlimited',
    aiBillingMode: ['byok', 'siloq_managed'],
    scanScope: 'Full site crawl + remediation',
    cannibalizationDetection: 'Auto-detect entire site',
    architectureView: 'Auto-generated site-wide map',
    remediationPlan: 'Complete prioritized plan',
    contentGeneration: 'Unlimited',
    automationOptions: ['manual', 'semi_auto', 'full_auto'],
    creditCardRequired: true,
  },
  architect: {
    id: 'architect',
    name: 'Architect',
    price: 799,
    duration: 'Monthly',
    sites: 5,
    siloLimit: 'unlimited',
    aiBillingMode: ['byok', 'siloq_managed'],
    scanScope: 'Multi-site crawl',
    cannibalizationDetection: 'Auto-detect all sites',
    architectureView: 'Multi-site architecture',
    remediationPlan: 'Cross-site prioritized plan',
    contentGeneration: 'Unlimited',
    automationOptions: ['manual', 'semi_auto', 'full_auto'],
    creditCardRequired: true,
  },
  empire: {
    id: 'empire',
    name: 'Empire',
    price: 1999,
    duration: 'Monthly',
    sites: 20,
    siloLimit: 'unlimited',
    aiBillingMode: ['byok', 'siloq_managed'],
    scanScope: 'Multi-site crawl',
    cannibalizationDetection: 'Auto-detect all sites',
    architectureView: 'Multi-site architecture',
    remediationPlan: 'Cross-site prioritized plan',
    contentGeneration: 'Unlimited',
    automationOptions: ['manual', 'semi_auto', 'full_auto'],
    creditCardRequired: true,
  },
};

// Change Type Configurations
export const CHANGE_TYPE_CONFIG: Record<ChangeType, { 
  classification: ChangeClassification; 
  triggersAICost: boolean;
  label: string;
}> = {
  link_add: { classification: 'safe', triggersAICost: false, label: 'Add Internal Link' },
  entity_assign: { classification: 'safe', triggersAICost: false, label: 'Assign Entity' },
  new_content: { classification: 'safe', triggersAICost: true, label: 'Generate New Content' },
  anchor_optimize: { classification: 'safe', triggersAICost: false, label: 'Optimize Anchor Text' },
  schema_update: { classification: 'safe', triggersAICost: false, label: 'Update Schema Markup' },
  redirect_301: { classification: 'destructive', triggersAICost: false, label: 'Create 301 Redirect' },
  page_delete: { classification: 'destructive', triggersAICost: false, label: 'Delete Page' },
  content_merge: { classification: 'destructive', triggersAICost: true, label: 'Merge Content' },
  keyword_reassign: { classification: 'destructive', triggersAICost: false, label: 'Reassign Keywords' },
  silo_restructure: { classification: 'destructive', triggersAICost: false, label: 'Restructure Silo' },
};

// Billing Constants
export const BILLING_CONSTANTS = {
  TRIAL_DURATION_DAYS: 10,
  TRIAL_PAGES_LIMIT: 10,
  SILOQ_MANAGED_FEE_PERCENT: 0.05,
  PREAUTH_THRESHOLD_USD: 10.00,
  AUTO_EXECUTE_COST_THRESHOLD_USD: 1.00,
  ROLLBACK_WINDOW_HOURS: 48,
};

// Error Codes for Billing Failures
export type BillingErrorCode = 
  | 'AI_TRIAL_LIMIT_REACHED'
  | 'AI_TRIAL_EXPIRED'
  | 'AI_API_KEY_MISSING'
  | 'AI_BILLING_DISABLED'
  | 'AI_BILLING_PREAUTH_FAILED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'TIER_LIMIT_EXCEEDED';

export interface BillingError {
  code: BillingErrorCode;
  message: string;
  cta?: string;
}

// AI Usage Log Entry
export interface AIUsageLog {
  id: string;
  projectId: string;
  contentJobId?: string;
  provider: 'openai' | 'gemini';
  model: string;
  inputTokens: number;
  outputTokens: number;
  providerCostUsd: number;
  siloqFeeUsd: number;
  totalChargeUsd: number;
  isTrial: boolean;
  createdAt: Date;
}

// AI Settings for a Project
export interface ProjectAISettings {
  id: string;
  projectId: string;
  billingMode: AIBillingMode;
  apiKeyEncrypted?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentTier: SubscriptionTier;
  trialPagesUsed: number;
  trialPagesLimit: number;
  trialStartDate?: Date;
  trialEndDate?: Date;
  automationMode: AutomationMode;
  preauthLimitUsd: number;
  createdAt: Date;
  updatedAt: Date;
}

// Cost Estimate
export interface AICostEstimate {
  inputTokens: number;
  outputTokens: number;
  providerCostUsd: number;
  siloqFeeUsd: number;
  totalCostUsd: number;
  billingMode: AIBillingMode;
  trialPagesUsed?: number;
  trialPagesRemaining?: number;
}

// Preflight Check Result
export interface PreflightCheckResult {
  allowed: boolean;
  error?: BillingError;
  estimate?: AICostEstimate;
  requiresPreauth?: boolean;
}
