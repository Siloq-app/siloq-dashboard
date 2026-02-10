'use client';

import React, { useState } from 'react';
import { SetupConfig } from '../types';
import { Check, ArrowRight, Loader2, KeyRound, Database, PartyPopper, AlertCircle } from 'lucide-react';

interface SetupWizardProps {
  onComplete: (config: SetupConfig) => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['post', 'page']);

  const handleConnect = () => {
    if (!apiKey) return;

    // API Key Validation
    if (!apiKey.trim().startsWith('ng_live_')) {
      setError('Invalid API Key. Key must start with "ng_live_".');
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
        autoSync: true
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
    <div className="max-w-2xl mx-auto mt-10">
      {/* Progress Bar */}
      <div className="mb-8 flex justify-between relative" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3} aria-label="Setup Progress">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded"></div>
        <div
          className="absolute top-1/2 left-0 h-1 bg-[#2271b1] -z-10 rounded transition-all duration-300"
          style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-2 bg-[#f0f0f1] px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s.num ? 'bg-[#2271b1] text-white' : 'bg-gray-300 text-gray-500'}`} aria-hidden="true">
              {step > s.num ? <Check size={16} /> : s.num}
            </div>
            <span className={`text-xs font-medium ${step >= s.num ? 'text-[#2271b1]' : 'text-gray-400'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-8 min-h-[400px] flex flex-col">
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#2271b1]">
                <KeyRound size={32} aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Connect to NextGen Cloud</h2>
              <p className="text-gray-500 mt-2">Enter your API Key to verify your license and enable features.</p>
            </div>

            <div className="space-y-4 max-w-md mx-auto w-full">
              <div>
                <label htmlFor="setup-api-key" className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  id="setup-api-key"
                  type="text"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="ng_live_..."
                  className={`w-full border rounded px-3 py-2 outline-none focus:ring-2 ${
                    error
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-[#2271b1] focus:border-[#2271b1]'
                  }`}
                  aria-invalid={!!error}
                  aria-describedby={error ? "api-key-error" : undefined}
                />
                {error ? (
                  <p id="api-key-error" className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} aria-hidden="true" /> {error}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">Found in your NextGen dashboard settings.</p>
                )}
              </div>
              <button
                onClick={handleConnect}
                disabled={!apiKey || loading}
                className="w-full bg-[#2271b1] hover:bg-[#135e96] text-white font-medium py-2.5 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:ring-offset-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} aria-hidden="true" /> Verifying...
                  </>
                ) : 'Verify & Connect'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#2271b1]">
                <Database size={32} aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Sync Configuration</h2>
              <p className="text-gray-500 mt-2">Select which content types you want to analyze.</p>
            </div>

            <div className="space-y-4 max-w-md mx-auto w-full" role="group" aria-label="Content Type Selection">
              <div className="space-y-2">
                {['post', 'page', 'product'].map((type) => (
                  <label key={type} className="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-[#2271b1]">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTypes([...selectedTypes, type]);
                        else setSelectedTypes(selectedTypes.filter(t => t !== type));
                      }}
                      className="w-4 h-4 text-[#2271b1] rounded focus:ring-[#2271b1]"
                    />
                    <span className="capitalize font-medium text-gray-700">{type}s</span>
                  </label>
                ))}
              </div>

              <button
                onClick={handleFinish}
                disabled={loading}
                className="w-full bg-[#2271b1] hover:bg-[#135e96] text-white font-medium py-2.5 rounded flex items-center justify-center gap-2 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:ring-offset-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} aria-hidden="true" /> Saving...
                  </>
                ) : 'Save & Finish'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 animate-bounce">
              <PartyPopper size={40} aria-hidden="true" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Setup Complete!</h2>
            <p className="text-gray-500 max-w-sm mb-8">
              Your WordPress site is now connected. You can start syncing pages and running lead generation scans immediately.
            </p>
            <button
              onClick={() => { onComplete({ apiKey, connected: true, postTypes: selectedTypes, autoSync: true }); }}
              className="px-6 py-2.5 bg-[#2271b1] hover:bg-[#135e96] text-white font-medium rounded flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:ring-offset-1"
            >
              Go to Dashboard <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
