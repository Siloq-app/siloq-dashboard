'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronRight, X } from 'lucide-react';
import { entityProfileService } from '@/lib/services/api';

interface GettingStartedCardProps {
  siteId: number;
  onNavigate: (tab: string, subtab?: string) => void;
}

interface Step {
  id: string;
  label: string;
  description: string;
  done: boolean;
  cta?: string;
  action?: () => void;
}

export default function GettingStartedCard({ siteId, onNavigate }: GettingStartedCardProps) {
  const [profileComplete, setProfileComplete] = useState(false);
  const [firstAnalysisDone, setFirstAnalysisDone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissKey = `siloq_onboarding_done_${siteId}`;
    if (localStorage.getItem(dismissKey)) {
      setDismissed(true);
      return;
    }

    // Check first analysis
    const analysisKey = `siloq_first_analysis_done_${siteId}`;
    if (localStorage.getItem(analysisKey)) setFirstAnalysisDone(true);

    // Check business profile
    entityProfileService.get(siteId).then(profile => {
      setProfileComplete(!!(profile?.business_name));
    }).catch(() => {});
  }, [siteId]);

  const steps: Step[] = [
    {
      id: 'site',
      label: 'Connect your WordPress site',
      description: 'Your site is connected and pages are syncing.',
      done: true,
    },
    {
      id: 'profile',
      label: 'Complete your Business Profile',
      description: 'Powers schema generation and GEO recommendations.',
      done: profileComplete,
      cta: 'Set up now',
      action: () => onNavigate('settings', 'business-profile'),
    },
    {
      id: 'analysis',
      label: 'Run your first page analysis',
      description: 'Get Three-Layer SEO + GEO + CRO recommendations.',
      done: firstAnalysisDone,
      cta: 'Go to Pages',
      action: () => onNavigate('pages'),
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === steps.length;

  // Auto-dismiss when all steps done
  useEffect(() => {
    if (allDone) {
      localStorage.setItem(`siloq_onboarding_done_${siteId}`, '1');
      setDismissed(true);
    }
  }, [allDone, siteId]);

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(`siloq_onboarding_done_${siteId}`, '1');
    setDismissed(true);
  };

  return (
    <div className="mb-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-indigo-900">🚀 Finish setting up Siloq</h3>
          <p className="text-xs text-indigo-600 mt-0.5">{completedCount} of {steps.length} steps complete</p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-indigo-300 hover:text-indigo-500 transition-colors"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-indigo-100 rounded-full h-1.5 mb-4">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2.5">
        {steps.map(step => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-indigo-200" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
              )}
            </div>
            {!step.done && step.action && (
              <button
                onClick={step.action}
                className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {step.cta}
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
