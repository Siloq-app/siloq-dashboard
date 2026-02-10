/**
 * Tier Management and Feature Gating
 * Controls feature availability based on subscription tier
 */

import {
  SubscriptionTier,
  TierConfig,
  TIER_CONFIGS,
  AutomationMode,
  ProjectAISettings,
} from './types';

// Feature availability by tier
interface FeatureConfig {
  id: string;
  name: string;
  minTier: SubscriptionTier;
  description?: string;
}

// Feature definitions
export const FEATURES: FeatureConfig[] = [
  // Free Trial features
  { id: 'cannibalization_detection', name: 'Cannibalization Detection', minTier: 'free_trial' },
  { id: 'architecture_view', name: 'Architecture Visualization', minTier: 'free_trial' },
  { id: 'remediation_plan', name: 'Remediation Planning', minTier: 'free_trial' },
  { id: 'content_generation_limited', name: 'Content Generation (10 pages)', minTier: 'free_trial' },

  // Pro features
  { id: 'multi_silo', name: 'Multiple Silos (2 max)', minTier: 'pro' },
  { id: 'unlimited_content', name: 'Unlimited Content Generation', minTier: 'pro' },
  { id: 'byok_billing', name: 'Bring Your Own Key (BYOK)', minTier: 'pro' },

  // Builder+ features
  { id: 'unlimited_silos', name: 'Unlimited Silos', minTier: 'builder_plus' },
  { id: 'auto_detection', name: 'Auto-detect Site-wide Cannibalization', minTier: 'builder_plus' },
  { id: 'auto_architecture', name: 'Auto-generated Architecture Map', minTier: 'builder_plus' },
  { id: 'batch_queue', name: 'Batch Queue Management', minTier: 'builder_plus' },
  { id: 'semi_auto', name: 'Semi-Auto Mode', minTier: 'builder_plus' },
  { id: 'full_auto', name: 'Full-Auto Mode', minTier: 'builder_plus' },

  // Architect features
  { id: 'multi_site', name: 'Multi-site Management (5 sites)', minTier: 'architect' },
  { id: 'cross_site_detection', name: 'Cross-site Cannibalization Detection', minTier: 'architect' },
  { id: 'multi_site_architecture', name: 'Multi-site Architecture View', minTier: 'architect' },
  { id: 'cross_site_plan', name: 'Cross-site Prioritized Planning', minTier: 'architect' },

  // Empire features
  { id: 'enterprise_sites', name: 'Enterprise Sites (20 max)', minTier: 'empire' },
  { id: 'delegation', name: 'Remediation Plan Delegation', minTier: 'empire' },
  { id: 'centralized_control', name: 'Centralized Portfolio Control', minTier: 'empire' },
];

// Tier hierarchy for comparison
const TIER_HIERARCHY: SubscriptionTier[] = [
  'free_trial',
  'pro',
  'builder_plus',
  'architect',
  'empire',
];

/**
 * Check if a feature is available for a given tier
 */
export function isFeatureAvailable(
  featureId: string,
  tier: SubscriptionTier
): boolean {
  const feature = FEATURES.find((f) => f.id === featureId);
  if (!feature) return false;

  const userTierIndex = TIER_HIERARCHY.indexOf(tier);
  const requiredTierIndex = TIER_HIERARCHY.indexOf(feature.minTier);

  return userTierIndex >= requiredTierIndex;
}

/**
 * Get all available features for a tier
 */
export function getAvailableFeatures(tier: SubscriptionTier): FeatureConfig[] {
  return FEATURES.filter((feature) => isFeatureAvailable(feature.id, tier));
}

/**
 * Get tier configuration
 */
export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return TIER_CONFIGS[tier];
}

/**
 * Check if tier allows specific automation mode
 */
export function canUseAutomationMode(
  tier: SubscriptionTier,
  mode: AutomationMode
): boolean {
  const config = TIER_CONFIGS[tier];
  return config.automationOptions.includes(mode);
}

/**
 * Check if tier allows specific AI billing mode
 */
export function canUseAIBillingMode(
  tier: SubscriptionTier,
  mode: 'trial' | 'byok' | 'siloq_managed'
): boolean {
  const config = TIER_CONFIGS[tier];
  return config.aiBillingMode.includes(mode as any);
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  return TIER_CONFIGS[tier].name;
}

/**
 * Get tier price
 */
export function getTierPrice(tier: SubscriptionTier): number {
  return TIER_CONFIGS[tier].price;
}

/**
 * Check if user has exceeded tier limits
 */
export function checkTierLimits(
  settings: ProjectAISettings,
  sitesCount: number,
  silosCount: number
): { allowed: boolean; limit?: string; current?: number; max?: number | string } {
  const config = TIER_CONFIGS[settings.currentTier];

  // Check site limit
  if (sitesCount >= config.sites) {
    return {
      allowed: false,
      limit: 'sites',
      current: sitesCount,
      max: config.sites,
    };
  }

  // Check silo limit
  if (config.siloLimit !== 'unlimited' && silosCount >= config.siloLimit) {
    return {
      allowed: false,
      limit: 'silos',
      current: silosCount,
      max: config.siloLimit,
    };
  }

  return { allowed: true };
}

/**
 * Get upgrade recommendation based on usage
 */
export function getUpgradeRecommendation(
  currentTier: SubscriptionTier,
  sitesCount: number,
  silosCount: number,
  wantsAutoMode: boolean = false,
  wantsMultiSite: boolean = false
): SubscriptionTier | null {
  const config = TIER_CONFIGS[currentTier];

  // Check if current tier is insufficient
  if (config.siloLimit !== 'unlimited' && silosCount >= config.siloLimit) {
    // Need unlimited silos
    if (sitesCount <= 1) return 'builder_plus';
    if (sitesCount <= 5) return 'architect';
    return 'empire';
  }

  if (sitesCount >= config.sites) {
    // Need more sites
    if (sitesCount < 5) return 'architect';
    return 'empire';
  }

  if (wantsAutoMode && !canUseAutomationMode(currentTier, 'semi_auto')) {
    // Wants automation but not available
    if (sitesCount <= 1) return 'builder_plus';
    return 'architect';
  }

  if (wantsMultiSite && currentTier === 'builder_plus') {
    return 'architect';
  }

  return null;
}

/**
 * Format tier capabilities for display
 */
export function formatTierCapabilities(tier: SubscriptionTier): {
  sites: string;
  silos: string;
  automation: string;
  aiBilling: string;
} {
  const config = TIER_CONFIGS[tier];

  return {
    sites: config.sites === 1 ? '1 site' : `${config.sites} sites`,
    silos: config.siloLimit === 'unlimited' ? 'Unlimited silos' : `${config.siloLimit} silos`,
    automation: config.automationOptions.join(', ').replace(/_/g, ' '),
    aiBilling: config.aiBillingMode.includes('byok') && config.aiBillingMode.includes('siloq_managed')
      ? 'BYOK or Siloq-Managed'
      : config.aiBillingMode[0],
  };
}
