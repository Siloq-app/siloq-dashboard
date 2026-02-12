/**
 * Content Generation with Billing Integration
 * Validates billing before allowing AI content generation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  preflightCheck,
  estimateAICost,
  canAutoExecute,
  formatCostMessage,
} from '@/lib/billing/preflight';
import {
  ProjectAISettings,
  AIBillingMode,
  SubscriptionTier,
  AutomationMode,
} from '@/lib/billing/types';
import { isFeatureAvailable } from '@/lib/billing/tiers';

// In-memory store for demo (replace with database in production)
const projectSettings = new Map<string, ProjectAISettings>();

interface GenerateRequest {
  projectId: string;
  prompt: string;
  contentType: string;
  entityCluster: string;
  siloId: string;
  targetPageId: string;
  isBulk?: boolean;
}

/**
 * POST /api/content/generate - Generate content with billing validation
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { projectId, prompt, contentType, entityCluster, siloId, targetPageId, isBulk } = body;

    if (!projectId || !prompt || !contentType || !entityCluster || !siloId) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      );
    }

    // Get project settings
    let settings = projectSettings.get(projectId);
    if (!settings) {
      // Initialize trial settings if none exist
      settings = {
        id: `settings-${projectId}`,
        projectId,
        billingMode: 'trial',
        currentTier: 'free_trial',
        trialPagesUsed: 0,
        trialPagesLimit: 10,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        automationMode: 'manual',
        preauthLimitUsd: 10.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      projectSettings.set(projectId, settings);
    }

    // Check if content generation feature is available
    if (!isFeatureAvailable('content_generation_limited', settings.currentTier) &&
        !isFeatureAvailable('unlimited_content', settings.currentTier)) {
      return NextResponse.json(
        { 
          error: 'Content generation not available on your plan',
          code: 'FEATURE_NOT_AVAILABLE',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Estimate AI cost
    const estimate = estimateAICost(
      prompt,
      2000, // Expected output tokens
      'openai',
      'gpt-4-turbo',
      settings.billingMode
    );

    // Run preflight check
    const preflight = await preflightCheck(settings, estimate, isBulk);

    if (!preflight.allowed) {
      return NextResponse.json(
        {
          error: preflight.error?.message,
          code: preflight.error?.code,
          cta: preflight.error?.cta,
          upgradeRequired: preflight.error?.code === 'AI_TRIAL_LIMIT_REACHED' || 
                         preflight.error?.code === 'AI_TRIAL_EXPIRED',
        },
        { status: 402 } // Payment Required
      );
    }

    // Check if auto-execution is allowed
    const autoExecute = canAutoExecute(settings, estimate.totalCostUsd, 'safe');

    // If requires pre-authorization for bulk job
    if (preflight.requiresPreauth) {
      return NextResponse.json(
        {
          requiresPreauth: true,
          estimate: preflight.estimate,
          message: 'This bulk job requires pre-authorization.',
        },
        { status: 200 }
      );
    }

    // Simulate content generation (in production, this would call AI provider)
    // For now, return the estimate and require manual approval
    return NextResponse.json({
      success: true,
      requiresApproval: !autoExecute,
      estimate: preflight.estimate,
      costMessage: formatCostMessage(
        preflight.estimate!,
        settings.trialPagesUsed,
        settings.trialPagesLimit
      ),
      message: autoExecute 
        ? 'Content will be generated automatically.' 
        : 'Please review and approve the content generation.',
    });

  } catch (error) {
    console.error('Error in content generation:', error);
    return NextResponse.json(
      { error: 'Failed to process content generation request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content/generate/status - Check generation status and trial info
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

    const settings = projectSettings.get(projectId);
    if (!settings) {
      return NextResponse.json(
        { error: 'Project settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      billingMode: settings.billingMode,
      currentTier: settings.currentTier,
      trialInfo: settings.billingMode === 'trial' ? {
        pagesUsed: settings.trialPagesUsed,
        pagesLimit: settings.trialPagesLimit,
        pagesRemaining: settings.trialPagesLimit - settings.trialPagesUsed,
        endDate: settings.trialEndDate,
      } : null,
      automationMode: settings.automationMode,
    });

  } catch (error) {
    console.error('Error fetching generation status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generation status' },
      { status: 500 }
    );
  }
}
