/**
 * Stripe Integration Service
 * Handles subscriptions, payments, and billing
 */

import Stripe from 'stripe';
import {
  SubscriptionTier,
  TIER_CONFIGS,
  AIBillingMode,
  ProjectAISettings,
} from './types';

// Lazy initialization of Stripe - only create when needed
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2026-01-28.clover',
    });
  }
  return stripeInstance;
}

// Stripe Price IDs for each tier (to be configured in Stripe dashboard)
const STRIPE_PRICE_IDS: Record<SubscriptionTier, string | null> = {
  free_trial: null, // No Stripe subscription for trial
  pro: process.env.STRIPE_PRICE_ID_PRO || '',
  builder_plus: process.env.STRIPE_PRICE_ID_BUILDER || '',
  architect: process.env.STRIPE_PRICE_ID_ARCHITECT || '',
  empire: process.env.STRIPE_PRICE_ID_EMPIRE || '',
};

/**
 * Create a Stripe customer
 */
export async function createStripeCustomer(
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  return await getStripe().customers.create({
    email,
    name,
  });
}

/**
 * Create a subscription for a customer
 */
export async function createSubscription(
  customerId: string,
  tier: SubscriptionTier
): Promise<Stripe.Subscription | null> {
  const priceId = STRIPE_PRICE_IDS[tier];
  
  if (!priceId) {
    return null; // Trial tier doesn't need subscription
  }

  return await getStripe().subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await getStripe().subscriptions.cancel(subscriptionId);
}

/**
 * Create a PaymentIntent for pre-authorization
 */
export async function createPreauthPaymentIntent(
  customerId: string,
  amountUsd: number,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  // Convert to cents
  const amountCents = Math.round(amountUsd * 100);

  return await getStripe().paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    customer: customerId,
    capture_method: 'manual', // Hold only, don't charge yet
    metadata: {
      type: 'preauth',
      ...metadata,
    },
  });
}

/**
 * Capture a pre-authorized payment
 */
export async function capturePreauthPayment(
  paymentIntentId: string,
  amountToCaptureUsd?: number
): Promise<Stripe.PaymentIntent> {
  const captureOptions: Stripe.PaymentIntentCaptureParams = {};
  
  if (amountToCaptureUsd) {
    captureOptions.amount_to_capture = Math.round(amountToCaptureUsd * 100);
  }

  return await getStripe().paymentIntents.capture(paymentIntentId, captureOptions);
}

/**
 * Cancel a pre-authorized payment
 */
export async function cancelPreauthPayment(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return await getStripe().paymentIntents.cancel(paymentIntentId);
}

/**
 * Create a setup intent for saving payment method
 */
export async function createSetupIntent(
  customerId: string
): Promise<Stripe.SetupIntent> {
  return await getStripe().setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });
}

/**
 * Get customer's default payment method
 */
export async function getDefaultPaymentMethod(
  customerId: string
): Promise<Stripe.PaymentMethod | null> {
  const customer = await getStripe().customers.retrieve(customerId, {
    expand: ['invoice_settings.default_payment_method'],
  });

  if (customer.deleted) {
    return null;
  }

  return (customer as Stripe.Customer).invoice_settings?.default_payment_method as Stripe.PaymentMethod || null;
}

/**
 * Create a billing portal session for customer
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    return await getStripe().subscriptions.retrieve(subscriptionId);
  } catch (error) {
    return null;
  }
}

/**
 * Handle subscription webhook events
 */
export async function handleSubscriptionWebhook(
  event: Stripe.Event
): Promise<{
  type: string;
  customerId?: string;
  subscriptionId?: string;
  status?: string;
  tier?: SubscriptionTier;
}> {
  const result = {
    type: event.type,
  } as {
    type: string;
    customerId?: string;
    subscriptionId?: string;
    status?: string;
    tier?: SubscriptionTier;
  };

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      result.customerId = subscription.customer as string;
      result.subscriptionId = subscription.id;
      result.status = subscription.status;
      
      // Determine tier from price ID
      const priceId = subscription.items.data[0]?.price.id;
      if (priceId) {
        for (const [tier, id] of Object.entries(STRIPE_PRICE_IDS)) {
          if (id === priceId) {
            result.tier = tier as SubscriptionTier;
            break;
          }
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      result.customerId = subscription.customer as string;
      result.subscriptionId = subscription.id;
      result.status = 'canceled';
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      result.customerId = invoice.customer as string;
      result.subscriptionId = (invoice as any).subscription as string;
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      result.customerId = invoice.customer as string;
      result.subscriptionId = (invoice as any).subscription as string;
      break;
    }
  }

  return result;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
}

// Export a dummy stripe object for compatibility (functions use getStripe internally)
export const stripe = {} as Stripe;

/**
 * Get tier from Stripe product/price
 */
export function getTierFromPriceId(priceId: string): SubscriptionTier | null {
  for (const [tier, id] of Object.entries(STRIPE_PRICE_IDS)) {
    if (id === priceId && tier !== 'free_trial') {
      return tier as SubscriptionTier;
    }
  }
  return null;
}
