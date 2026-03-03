'use client';

import React, { useState, useCallback } from 'react';
import {
  MapPin,
  ShoppingBag,
  BookOpen,
  Code2,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Plus,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { fetchWithAuth } from '@/lib/auth-headers';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BusinessType = 'local_service' | 'ecommerce' | 'content_blog' | 'saas_software' | 'other';

interface BusinessTypeOption {
  value: BusinessType;
  label: string;
  description: string;
  icon: React.ReactNode;
  selectedBg: string;
  selectedBorder: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
}

interface OnboardingWizardProps {
  siteId: number | string;
  siteName?: string;
  onComplete: () => void;
  onSkip?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUSINESS_TYPES: BusinessTypeOption[] = [
  {
    value: 'local_service',
    label: 'Local / Service Business',
    description: 'Contractors, agencies, healthcare, restaurants — serving customers in a geographic area.',
    icon: <MapPin className="h-5 w-5" />,
    selectedBg: 'bg-emerald-50',
    selectedBorder: 'border-emerald-500',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    textColor: 'text-emerald-700',
  },
  {
    value: 'ecommerce',
    label: 'E-Commerce',
    description: 'Online stores selling physical or digital products to customers anywhere.',
    icon: <ShoppingBag className="h-5 w-5" />,
    selectedBg: 'bg-blue-50',
    selectedBorder: 'border-blue-500',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-700',
  },
  {
    value: 'content_blog',
    label: 'Content / Blog',
    description: 'Publishers, media sites, blogs, and content-driven sites monetized by ads or affiliates.',
    icon: <BookOpen className="h-5 w-5" />,
    selectedBg: 'bg-amber-50',
    selectedBorder: 'border-amber-500',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    textColor: 'text-amber-700',
  },
  {
    value: 'saas_software',
    label: 'SaaS / Software',
    description: 'Subscription software, apps, and platforms targeting business or consumer users.',
    icon: <Code2 className="h-5 w-5" />,
    selectedBg: 'bg-violet-50',
    selectedBorder: 'border-violet-500',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    textColor: 'text-violet-700',
  },
  {
    value: 'other',
    label: 'Other',
    description: "Non-profit, portfolio, community site, or anything that doesn't fit the above.",
    icon: <Briefcase className="h-5 w-5" />,
    selectedBg: 'bg-slate-50',
    selectedBorder: 'border-slate-400',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    textColor: 'text-slate-700',
  },
];

const SERVICE_SUGGESTIONS: Record<BusinessType, string[]> = {
  local_service: ['Plumbing', 'HVAC', 'Roofing', 'Electrical', 'Landscaping', 'House Cleaning', 'Pest Control', 'General Contractor', 'Painting', 'Flooring'],
  ecommerce: ['Clothing & Apparel', 'Electronics', 'Home & Garden', 'Beauty & Health', 'Sports & Outdoors', 'Furniture', 'Jewelry', 'Supplements'],
  content_blog: ['How-to Guides', 'Product Reviews', 'News & Analysis', 'Tutorials', 'Opinion & Commentary', 'Case Studies'],
  saas_software: ['CRM', 'Project Management', 'Analytics', 'Marketing Automation', 'HR Software', 'Accounting', 'Customer Support'],
  other: ['Consulting', 'Portfolio', 'Community', 'Non-profit', 'Events', 'Education'],
};

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <div
              className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                done
                  ? 'w-7 h-7 bg-indigo-600 text-white'
                  : active
                  ? 'w-7 h-7 bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : 'w-7 h-7 bg-slate-100 text-slate-400'
              }`}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="text-xs font-semibold">{i + 1}</span>
              )}
            </div>
            {i < total - 1 && (
              <div
                className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${done ? 'bg-indigo-600' : 'bg-slate-200'}`}
                style={{ minWidth: 32 }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Step 1: Business Type ─────────────────────────────────────────────────────

function Step1BusinessType({
  selected,
  onSelect,
}: {
  selected: BusinessType | null;
  onSelect: (t: BusinessType) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">What kind of business is this?</h2>
      <p className="text-sm text-slate-500 mb-6">
        This helps Siloq tailor content strategies, schema markup, and GEO recommendations to your business model.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BUSINESS_TYPES.map((bt) => {
          const isSelected = selected === bt.value;
          return (
            <button
              key={bt.value}
              onClick={() => onSelect(bt.value)}
              className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 ${
                isSelected
                  ? `${bt.selectedBg} ${bt.selectedBorder} shadow-sm`
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`flex-shrink-0 rounded-lg p-2 ${bt.iconBg}`}>
                <span className={bt.iconColor}>{bt.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold text-sm mb-0.5 ${isSelected ? bt.textColor : 'text-slate-800'}`}>
                  {bt.label}
                </p>
                <p className="text-xs text-slate-500 leading-snug">{bt.description}</p>
              </div>
              {isSelected && (
                <div className="ml-auto flex-shrink-0 mt-0.5">
                  <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Services / Products ───────────────────────────────────────────────

function Step2Services({
  businessType,
  services,
  onChange,
}: {
  businessType: BusinessType | null;
  services: string[];
  onChange: (services: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const suggestions = businessType ? SERVICE_SUGGESTIONS[businessType] : [];
  const unusedSuggestions = suggestions.filter((s) => !services.includes(s));

  const addService = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !services.includes(trimmed)) {
        onChange([...services, trimmed]);
      }
      setInputValue('');
    },
    [services, onChange]
  );

  const removeService = useCallback(
    (service: string) => {
      onChange(services.filter((s) => s !== service));
    },
    [services, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addService(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && services.length > 0) {
      removeService(services[services.length - 1]);
    }
  };

  const businessLabel = BUSINESS_TYPES.find((b) => b.value === businessType)?.label ?? 'your business';

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">What are your main services or products?</h2>
      <p className="text-sm text-slate-500 mb-6">
        Add what you offer — these power your keyword strategy and content recommendations for{' '}
        <span className="font-medium text-slate-700">{businessLabel}</span>.
      </p>

      {/* Tag pill input area */}
      <div className="min-h-[56px] flex flex-wrap gap-2 rounded-xl border-2 border-slate-200 bg-white p-3 focus-within:border-indigo-500 transition-colors duration-150 mb-4">
        {services.map((service) => (
          <span
            key={service}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800"
          >
            {service}
            <button
              onClick={() => removeService(service)}
              className="rounded-full text-indigo-400 hover:text-indigo-600 focus:outline-none"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={services.length === 0 ? 'Type a service and press Enter…' : 'Add more…'}
          className="flex-1 min-w-[140px] border-none outline-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400"
        />
      </div>

      {inputValue && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => addService(inputValue)}
          className="mb-4 gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add &quot;{inputValue}&quot;
        </Button>
      )}

      {/* Suggestions */}
      {unusedSuggestions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Suggestions
          </p>
          <div className="flex flex-wrap gap-2">
            {unusedSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => addService(suggestion)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Plus className="h-3 w-3" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Service Areas ─────────────────────────────────────────────────────

function Step3ServiceAreas({
  serviceAreas,
  isSAB,
  onChange,
}: {
  serviceAreas: string[];
  isSAB: boolean;
  onChange: (areas: string[], isSAB: boolean) => void;
}) {
  const [inputValue, setInputValue] = useState('');

  const addArea = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !serviceAreas.includes(trimmed)) {
        onChange([...serviceAreas, trimmed], isSAB);
      }
      setInputValue('');
    },
    [serviceAreas, isSAB, onChange]
  );

  const removeArea = useCallback(
    (area: string) => {
      onChange(serviceAreas.filter((a) => a !== area), isSAB);
    },
    [serviceAreas, isSAB, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Use Enter only (not comma) so users can type "Kansas City, MO" as a single entry
    if (e.key === 'Enter') {
      e.preventDefault();
      addArea(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && serviceAreas.length > 0) {
      removeArea(serviceAreas[serviceAreas.length - 1]);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Where do you serve customers?</h2>
      <p className="text-sm text-slate-500 mb-6">
        Add cities with their state (e.g. "Kansas City, MO") and press Enter. Siloq will use these to build location-specific landing pages and local SEO strategies.
      </p>

      {/* Area pill input */}
      <div className="min-h-[56px] flex flex-wrap gap-2 rounded-xl border-2 border-slate-200 bg-white p-3 focus-within:border-indigo-500 transition-colors duration-150 mb-4">
        {serviceAreas.map((area) => (
          <span
            key={area}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800"
          >
            <MapPin className="h-3 w-3" />
            {area}
            <button
              onClick={() => removeArea(area)}
              className="rounded-full text-emerald-400 hover:text-emerald-600 focus:outline-none"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={serviceAreas.length === 0 ? 'e.g. Kansas City, MO — press Enter to add' : 'Add another city, state — press Enter'}
          className="flex-1 min-w-[200px] border-none outline-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400"
        />
      </div>

      {inputValue && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => addArea(inputValue)}
          className="mb-6 gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add &quot;{inputValue}&quot;
        </Button>
      )}

      {/* SAB toggle */}
      <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {/* Custom toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={isSAB}
          onClick={() => onChange(serviceAreas, !isSAB)}
          className={`relative mt-0.5 flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            isSAB ? 'bg-indigo-600' : 'bg-slate-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 absolute top-1 ${
              isSAB ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <div>
          <Label
            className="font-semibold text-slate-800 cursor-pointer"
            onClick={() => onChange(serviceAreas, !isSAB)}
          >
            Service Area Business (SAB)
          </Label>
          <p className="text-xs text-slate-500 mt-0.5">
            Enable if you travel to customers rather than having a storefront. Affects local SEO schema markup (no physical address shown).
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Wizard ───────────────────────────────────────────────────────────────

export default function OnboardingWizard({ siteId, siteName, onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [isSAB, setIsSAB] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocalService = businessType === 'local_service';
  const totalSteps = isLocalService ? 3 : 2;

  const canNext = () => {
    if (step === 0) return businessType !== null;
    if (step === 1) return services.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleComplete = async () => {
    if (!businessType) return;
    setSaving(true);
    setError(null);

    try {
      // PATCH site — mark onboarding complete + set business type
      const siteRes = await fetchWithAuth(`/api/v1/sites/${siteId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_type: businessType,
          onboarding_complete: true,
        }),
      });

      if (!siteRes.ok) {
        const err = await siteRes.json().catch(() => ({}));
        throw new Error((err as { detail?: string; message?: string })?.detail || (err as { message?: string })?.message || `Failed to update site (${siteRes.status})`);
      }

      // PATCH entity-profile — services + service areas (non-fatal)
      const profilePayload: Record<string, unknown> = { services };
      if (isLocalService && serviceAreas.length > 0) {
        profilePayload.service_areas = serviceAreas;
        profilePayload.is_service_area_business = isSAB;
      }

      await fetchWithAuth(`/api/v1/sites/${siteId}/entity-profile/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload),
      }).catch((e) => console.warn('[OnboardingWizard] entity-profile patch failed (non-fatal):', e));

      onComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const stepLabels = isLocalService
    ? ['Business Type', 'Services', 'Service Areas']
    : ['Business Type', 'Services'];

  const isLastStep = step === totalSteps - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 mb-4">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to Siloq</h1>
          <p className="text-sm text-slate-500 mt-1">
            {siteName ? (
              <>Let&apos;s set up <span className="font-semibold text-slate-700">{siteName}</span> — takes less than a minute.</>
            ) : (
              "Let's get your site set up — takes less than a minute."
            )}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {/* Progress header */}
          <div className="px-8 pt-7 pb-5 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Step {step + 1} of {totalSteps} — {stepLabels[step]}
            </p>
            <StepIndicator current={step} total={totalSteps} />
          </div>

          {/* Step content */}
          <div className="px-8 py-7 min-h-[340px]">
            {step === 0 && (
              <Step1BusinessType selected={businessType} onSelect={setBusinessType} />
            )}
            {step === 1 && (
              <Step2Services
                businessType={businessType}
                services={services}
                onChange={setServices}
              />
            )}
            {step === 2 && isLocalService && (
              <Step3ServiceAreas
                serviceAreas={serviceAreas}
                isSAB={isSAB}
                onChange={(areas, sab) => {
                  setServiceAreas(areas);
                  setIsSAB(sab);
                }}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 0 || saving}
                className="gap-2 text-slate-500"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              {onSkip && step === 0 && (
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Skip setup
                </Button>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              {error && (
                <p className="text-xs text-red-500 text-right max-w-xs">{error}</p>
              )}
              <div className="flex items-center gap-3">
                {isLastStep && (
                  <button
                    onClick={handleComplete}
                    disabled={saving}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Skip this step
                  </button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={!canNext() || saving}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px] shadow-sm shadow-indigo-200"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Saving…
                    </>
                  ) : isLastStep ? (
                    <>
                      <Check className="h-4 w-4" />
                      Finish Setup
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-5">
          You can update these settings anytime in <span className="font-medium">Settings → Business Profile</span>.
        </p>
      </div>
    </div>
  );
}
