/**
 * Stripe Checkout Session API
 * Creates a Stripe Checkout session and returns the URL for redirect
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { SubscriptionTier, TIER_CONFIGS } from '@/lib/billing/types';

const STRIPE_PRICE_MAP: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_ID_PRO || process.env.STRIPE_PRICE_PRO || 'price_1SyxO5KDs3XWQBFA19JTyI1o',
  builder_plus: process.env.STRIPE_PRICE_ID_BUILDER || process.env.STRIPE_PRICE_BUILDER || 'price_1SyxODKDs3XWQBFAZbLZPUZA',
  architect: process.env.STRIPE_PRICE_ID_ARCHITECT || process.env.STRIPE_PRICE_ARCHITECT || 'price_1SyxOMKDs3XWQBFAfF69thcn',
  empire: process.env.STRIPE_PRICE_ID_EMPIRE || process.env.STRIPE_PRICE_EMPIRE || 'price_1SyxOTKDs3XWQBFAN1GOBpJq',
};

function getStripe(): Stripe | null {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return null;
  return new Stripe(apiKey, { apiVersion: '2026-01-28.clover' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier } = body;

    if (!tier || tier === 'free_trial') {
      return NextResponse.json({ error: 'Invalid tier for checkout' }, { status: 400 });
    }

    const priceId = STRIPE_PRICE_MAP[tier];
    if (!priceId) {
      return NextResponse.json({ error: 'Unknown tier' }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const origin = request.headers.get('origin') || 'https://app.siloq.ai';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/settings/subscription?upgraded=true`,
      cancel_url: `${origin}/dashboard/settings/subscription?canceled=true`,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
