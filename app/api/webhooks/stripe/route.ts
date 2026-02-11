/**
 * Stripe Webhook Handler
 * Processes subscription and payment events
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, handleSubscriptionWebhook } from '@/lib/billing/stripe';

/**
 * POST /api/webhooks/stripe - Handle Stripe webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    // Verify webhook signature
    let event;
    try {
      event = verifyWebhookSignature(payload, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    const result = await handleSubscriptionWebhook(event);

    // Process based on event type
    switch (event.type) {
      case 'customer.subscription.created':
        console.log('Subscription created:', result);
        // Update database with new subscription
        break;

      case 'customer.subscription.updated':
        console.log('Subscription updated:', result);
        // Update database with subscription changes
        break;

      case 'customer.subscription.deleted':
        console.log('Subscription canceled:', result);
        // Update database to mark subscription as canceled
        break;

      case 'invoice.payment_failed':
        console.log('Payment failed:', result);
        // Send notification to user about failed payment
        break;

      case 'invoice.payment_succeeded':
        console.log('Payment succeeded:', result);
        // Update last successful payment date
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
