/**
 * Billing API Routes
 * Handles subscription management, billing portal, and AI settings
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createStripeCustomer,
  createSubscription,
  cancelSubscription,
  createSetupIntent,
  createBillingPortalSession,
  getSubscription,
} from '@/lib/billing/stripe';
import {
  SubscriptionTier,
  ProjectAISettings,
  AIBillingMode,
  AutomationMode,
  TIER_CONFIGS,
} from '@/lib/billing/types';
import { initializeTrialSettings } from '@/lib/billing/preflight';

// In-memory store for demo (replace with database in production)
const projectSettings = new Map<string, ProjectAISettings>();

/**
 * GET /api/billing/settings - Get project billing settings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      );
    }

    let settings = projectSettings.get(projectId);

    // Initialize trial if no settings exist
    if (!settings) {
      settings = initializeTrialSettings(projectId);
      projectSettings.set(projectId, settings);
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching billing settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing/subscribe - Create new subscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, tier, email, name, paymentMethodId } = body;

    if (!projectId || !tier || !email) {
      return NextResponse.json(
        { error: 'Project ID, tier, and email required' },
        { status: 400 }
      );
    }

    // Validate tier
    if (!TIER_CONFIGS[tier as SubscriptionTier]) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Create Stripe customer
    const customer = await createStripeCustomer(email, name);

    // Attach payment method if provided
    if (paymentMethodId) {
      // In production, attach payment method to customer
    }

    // Create subscription (skip for trial)
    let subscription = null;
    if (tier !== 'free_trial') {
      subscription = await createSubscription(customer.id, tier as SubscriptionTier);
    }

    // Update project settings
    const settings: ProjectAISettings = {
      id: `settings-${projectId}`,
      projectId,
      billingMode: tier === 'free_trial' ? 'trial' : 'siloq_managed',
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription?.id || null,
      currentTier: tier as SubscriptionTier,
      trialPagesUsed: 0,
      trialPagesLimit: 10,
      trialStartDate: tier === 'free_trial' ? new Date() : undefined,
      trialEndDate: tier === 'free_trial' 
        ? new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) 
        : undefined,
      automationMode: 'manual',
      preauthLimitUsd: 10.00,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    projectSettings.set(projectId, settings);

    return NextResponse.json({
      success: true,
      settings,
      clientSecret: subscription 
        ? (subscription.latest_invoice as any)?.payment_intent?.client_secret 
        : null,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/billing/settings - Update billing settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, updates } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      );
    }

    const existingSettings = projectSettings.get(projectId);
    if (!existingSettings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    const allowedUpdates: Partial<ProjectAISettings> = {};
    
    if (updates.billingMode && ['trial', 'byok', 'siloq_managed'].includes(updates.billingMode)) {
      allowedUpdates.billingMode = updates.billingMode as AIBillingMode;
    }
    
    if (updates.automationMode && ['manual', 'semi_auto', 'full_auto'].includes(updates.automationMode)) {
      allowedUpdates.automationMode = updates.automationMode as AutomationMode;
    }
    
    if (updates.apiKeyEncrypted !== undefined) {
      allowedUpdates.apiKeyEncrypted = updates.apiKeyEncrypted;
    }
    
    if (updates.preauthLimitUsd !== undefined) {
      allowedUpdates.preauthLimitUsd = updates.preauthLimitUsd;
    }

    const updatedSettings: ProjectAISettings = {
      ...existingSettings,
      ...allowedUpdates,
      updatedAt: new Date(),
    };

    projectSettings.set(projectId, updatedSettings);

    return NextResponse.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Error updating billing settings:', error);
    return NextResponse.json(
      { error: 'Failed to update billing settings' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/billing/subscription - Cancel subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      );
    }

    const settings = projectSettings.get(projectId);
    if (!settings?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel in Stripe
    await cancelSubscription(settings.stripeSubscriptionId);

    // Update local settings
    settings.currentTier = 'free_trial';
    settings.billingMode = 'trial';
    settings.stripeSubscriptionId = null;
    settings.updatedAt = new Date();

    projectSettings.set(projectId, settings);

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
