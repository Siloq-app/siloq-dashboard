/**
 * Billing Portal API
 * Creates Stripe billing portal sessions for customers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createBillingPortalSession, createSetupIntent } from '@/lib/billing/stripe';

// In-memory store (replace with database in production)
const projectSettings = new Map<string, { stripeCustomerId?: string }>();

/**
 * POST /api/billing/portal - Create billing portal session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, returnUrl } = body;

    if (!projectId || !returnUrl) {
      return NextResponse.json(
        { error: 'Project ID and return URL required' },
        { status: 400 }
      );
    }

    const settings = projectSettings.get(projectId);
    if (!settings?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing customer found' },
        { status: 404 }
      );
    }

    const session = await createBillingPortalSession(
      settings.stripeCustomerId,
      returnUrl
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/portal/setup-intent - Create setup intent for adding payment method
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
    if (!settings?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing customer found' },
        { status: 404 }
      );
    }

    const setupIntent = await createSetupIntent(settings.stripeCustomerId);

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}
