'use client';

import React, { useState } from 'react';
import { SetupConfig } from '../types';
import {
  Check,
  ArrowRight,
  Loader2,
  KeyRound,
  Database,
  PartyPopper,
  AlertCircle,
} from 'lucide-react';

interface SetupWizardProps {
  onComplete: (config: SetupConfig) => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('sk_siloq_u6bMMXkobJy7dKU-92gjEpfvxGAlfAwp2cv8i0tTlkE');
  const [error, setError] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['post', 'page']);

  const handleConnect = () => {
    if (!apiKey) return;

    // API Key Validation
    if (!apiKey.trim().startsWith('sk_siloq_')) {
      setError('Invalid API Key. Key must start with "sk_siloq_".');
      return;
    }

    setLoading(true);
    // Simulate API verification
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleFinish = () => {
    setLoading(true);
    // Simulate final config save
    setTimeout(() => {
      setLoading(false);
      onComplete({
        apiKey,
        connected: true,
        postTypes: selectedTypes,
        autoSync: true,
      });
      setStep(3);
    }, 1000);
  };

  const steps = [
    { num: 1, label: 'Connect API' },
    { num: 2, label: 'Sync Settings' },
    { num: 3, label: 'Complete' },
  ];

  return (
    <div className="mx-auto mt-10 max-w-2xl">
      {/* Progress Bar */}
      <div
        className="relative mb-8 flex justify-between"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={3}
        aria-label="Setup Progress"
      >
        <div className="absolute left-0 top-1/2 -z-10 h-1 w-full rounded bg-gray-200"></div>
        <div
          className="absolute left-0 top-1/2 -z-10 h-1 rounded bg-[#2271b1] transition-all duration-300"
          style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-2 bg-[#f0f0f1] px-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${step >= s.num ? 'bg-[#2271b1] text-white' : 'bg-gray-300 text-gray-500'}`}
              aria-hidden="true"
            >
              {step > s.num ? <Check size={16} /> : s.num}
            </div>
            <span
              className={`text-xs font-medium ${step >= s.num ? 'text-[#2271b1]' : 'text-gray-400'}`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex min-h-[400px] flex-col rounded border border-gray-200 bg-white p-8 shadow-sm">
        {step === 1 && (
          <div className="flex flex-1 flex-col justify-center">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2271b1]">
                <KeyRound size={32} aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Connect to NextGen Cloud</h2>
              <p className="mt-2 text-gray-500">
                Enter your API Key to verify your license and enable features.
              </p>
            </div>

            <div className="mx-auto w-full max-w-md space-y-4">
              <div>
                <label
                  htmlFor="setup-api-key"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  API Key
                </label>
                <input
                  id="setup-api-key"
                  type="text"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="ng_live_..."
                  className={`w-full rounded border px-3 py-2 outline-none focus:ring-2 ${
                    error
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-[#2271b1] focus:ring-[#2271b1]'
                  }`}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'api-key-error' : undefined}
                />
                {error ? (
                  <p
                    id="api-key-error"
                    className="mt-1 flex items-center gap-1 text-xs text-red-600"
                  >
                    <AlertCircle size={12} aria-hidden="true" /> {error}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">
                    Found in your NextGen dashboard settings.
                  </p>
                )}
              </div>
              <button
                onClick={handleConnect}
                disabled={!apiKey || loading}
                className="flex w-full items-center justify-center gap-2 rounded bg-[#2271b1] py-2.5 font-medium text-white transition-colors hover:bg-[#135e96] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} aria-hidden="true" /> Verifying...
                  </>
                ) : (
                  'Verify & Connect'
                )}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-1 flex-col justify-center">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2271b1]">
                <Database size={32} aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Sync Configuration</h2>
              <p className="mt-2 text-gray-500">Select which content types you want to analyze.</p>
            </div>

            <div
              className="mx-auto w-full max-w-md space-y-4"
              role="group"
              aria-label="Content Type Selection"
            >
              <div className="space-y-2">
                {['post', 'page', 'product'].map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-3 rounded border border-gray-200 p-3 focus-within:ring-2 focus-within:ring-[#2271b1] hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTypes([...selectedTypes, type]);
                        else setSelectedTypes(selectedTypes.filter((t) => t !== type));
                      }}
                      className="h-4 w-4 rounded text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <span className="font-medium capitalize text-gray-700">{type}s</span>
                  </label>
                ))}
              </div>

              <button
                onClick={handleFinish}
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded bg-[#2271b1] py-2.5 font-medium text-white transition-colors hover:bg-[#135e96] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} aria-hidden="true" /> Saving...
                  </>
                ) : (
                  'Save & Finish'
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-20 w-20 animate-bounce items-center justify-center rounded-full bg-green-100 text-green-600">
              <PartyPopper size={40} aria-hidden="true" />
            </div>
            <h2 className="mb-2 text-3xl font-bold text-gray-800">Setup Complete!</h2>
            <p className="mb-8 max-w-sm text-gray-500">
              Your WordPress site is now connected. You can start syncing pages and running lead
              generation scans immediately.
            </p>
            <button
              onClick={() => {
                onComplete({ apiKey, connected: true, postTypes: selectedTypes, autoSync: true });
              }}
              className="flex items-center gap-2 rounded bg-[#2271b1] px-6 py-2.5 font-medium text-white hover:bg-[#135e96] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:ring-offset-1"
            >
              Go to Dashboard <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
