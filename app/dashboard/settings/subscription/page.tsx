/**
 * Subscription Settings Page
 * Manage billing, subscription tier, and AI billing mode
 */

'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { SubscriptionManager } from '@/components/billing/SubscriptionManager';
import { AICostDisplay } from '@/components/billing/AICostDisplay';
import { SubscriptionTier, AIBillingMode, AICostEstimate } from '@/lib/billing/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock data - replace with actual API calls
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free_trial');
  const [billingMode, setBillingMode] = useState<AIBillingMode>('trial');
  const [trialPagesUsed, setTrialPagesUsed] = useState(3);
  const trialPagesLimit = 10;
  const sitesCount = 1;
  const silosCount = 1;

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      
      if (response.ok) {
        setCurrentTier(tier);
        // Redirect to Stripe checkout or show success
        const data = await response.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeBillingMode = async (mode: AIBillingMode) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiBillingMode: mode }),
      });
      
      if (response.ok) {
        setBillingMode(mode);
      }
    } catch (error) {
      console.error('Failed to update billing mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock cost estimate for display
  const mockCostEstimate: AICostEstimate = {
    inputTokens: 1500,
    outputTokens: 800,
    providerCostUsd: 0.08,
    siloqFeeUsd: 0.004,
    totalCostUsd: 0.084,
    billingMode: billingMode,
  };

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <CreditCard className="h-8 w-8" />
          Subscription & Billing
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription tier, AI billing preferences, and view usage.
        </p>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Processing...</span>
          </div>
        </div>
      )}

      <div className="grid gap-8">
        {/* Subscription Manager */}
        <SubscriptionManager
          currentTier={currentTier}
          billingMode={billingMode}
          trialPagesUsed={trialPagesUsed}
          trialPagesLimit={trialPagesLimit}
          sitesCount={sitesCount}
          silosCount={silosCount}
          onUpgrade={handleUpgrade}
          onChangeBillingMode={handleChangeBillingMode}
        />

        <Separator />

        {/* AI Cost Display Example */}
        <Card>
          <CardHeader>
            <CardTitle>AI Cost Estimation</CardTitle>
            <CardDescription>
              Example of how AI costs are calculated before content generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AICostDisplay
              estimate={mockCostEstimate}
              trialPagesUsed={billingMode === 'trial' ? trialPagesUsed : undefined}
              trialPagesLimit={billingMode === 'trial' ? trialPagesLimit : undefined}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Billing Portal Access */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Portal</CardTitle>
            <CardDescription>
              Manage your payment methods, view invoices, and update billing information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/billing/portal" method="POST">
              <input type="hidden" name="return_url" value={typeof window !== 'undefined' ? window.location.href : ''} />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Open Billing Portal
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
