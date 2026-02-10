/**
 * AI Usage Tracking API
 * Logs and retrieves AI usage for cost tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIUsageLog, AICostEstimate, ProjectAISettings } from '@/lib/billing/types';

// In-memory store for demo (replace with database in production)
const usageLogs: AIUsageLog[] = [];
const projectSettings = new Map<string, ProjectAISettings>();

/**
 * GET /api/billing/usage - Get usage logs for a project
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      );
    }

    // Filter logs for this project
    const projectLogs = usageLogs
      .filter((log) => log.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    // Calculate totals
    const totalCost = projectLogs.reduce((sum, log) => sum + log.totalChargeUsd, 0);
    const totalProviderCost = projectLogs.reduce((sum, log) => sum + log.providerCostUsd, 0);
    const totalSiloqFee = projectLogs.reduce((sum, log) => sum + log.siloqFeeUsd, 0);

    // Get settings for trial info
    const settings = projectSettings.get(projectId);
    const trialInfo = settings?.billingMode === 'trial' ? {
      pagesUsed: settings.trialPagesUsed,
      pagesLimit: settings.trialPagesLimit,
      pagesRemaining: settings.trialPagesLimit - settings.trialPagesUsed,
      endDate: settings.trialEndDate,
    } : null;

    return NextResponse.json({
      logs: projectLogs,
      summary: {
        totalCost,
        totalProviderCost,
        totalSiloqFee,
        count: projectLogs.length,
      },
      trial: trialInfo,
      pagination: {
        limit,
        offset,
        total: usageLogs.filter((log) => log.projectId === projectId).length,
      },
    });
  } catch (error) {
    console.error('Error fetching usage logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing/usage - Log AI usage
 * This would typically be called internally after AI generation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      contentJobId,
      provider,
      model,
      inputTokens,
      outputTokens,
      providerCostUsd,
      siloqFeeUsd,
      totalChargeUsd,
    } = body;

    if (!projectId || !provider || !model) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      );
    }

    // Create usage log
    const log: AIUsageLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      contentJobId,
      provider,
      model,
      inputTokens,
      outputTokens,
      providerCostUsd,
      siloqFeeUsd,
      totalChargeUsd,
      isTrial: false,
      createdAt: new Date(),
    };

    // Update trial counter if in trial mode
    const settings = projectSettings.get(projectId);
    if (settings?.billingMode === 'trial') {
      log.isTrial = true;
      settings.trialPagesUsed += 1;
      projectSettings.set(projectId, settings);
    }

    usageLogs.push(log);

    return NextResponse.json({
      success: true,
      log,
      trialPagesUsed: settings?.trialPagesUsed,
      trialPagesRemaining: settings ? settings.trialPagesLimit - settings.trialPagesUsed : undefined,
    });
  } catch (error) {
    console.error('Error logging usage:', error);
    return NextResponse.json(
      { error: 'Failed to log usage' },
      { status: 500 }
    );
  }
}
