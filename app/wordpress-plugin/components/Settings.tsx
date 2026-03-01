'use client';

import React, { useState, useEffect } from 'react';
import { SetupConfig } from '../types';
import { Check, AlertCircle, Download, Trash2 } from 'lucide-react';

interface SettingsProps {
  config: SetupConfig;
  onDisconnect: () => void;
  onUpdateConfig: (config: SetupConfig) => void;
}

export function Settings({ config, onDisconnect, onUpdateConfig }: SettingsProps) {
  const [apiUrl, setApiUrl] = useState('https://api.siloq.com/v1');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [geminiKey, setGeminiKey] = useState('');
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    config.postTypes.length > 0 ? config.postTypes : ['page']
  );
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiKey(config.apiKey || '');

    setAutoSync(config.autoSync);

    setSelectedTypes(config.postTypes.length > 0 ? config.postTypes : ['page']);
  }, [config]);

  const handleSave = () => {
    onUpdateConfig({
      ...config,
      apiKey: apiKey || config.apiKey,
      postTypes: selectedTypes,
      autoSync,
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect? This will remove all API credentials.')) {
      onDisconnect();
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-gray-800">Plugin Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure your WordPress plugin integration.</p>
      </div>

      {/* Connection Status */}
      <div
        className={`flex items-center gap-3 rounded-md border-l-4 p-4 shadow-sm ${config.connected ? 'border-green-500 bg-white' : 'border-amber-500 bg-white'}`}
      >
        {config.connected ? (
          <Check className="text-green-500" size={24} />
        ) : (
          <AlertCircle className="text-amber-500" size={24} />
        )}
        <div>
          <h3 className="font-semibold text-gray-800">
            {config.connected ? 'Connected to NextGen Cloud' : 'Not Connected'}
          </h3>
          <p className="text-sm text-gray-600">
            {config.connected
              ? `API Key: ${config.apiKey.substring(0, 8)}...`
              : 'Please configure your API settings to connect.'}
          </p>
        </div>
      </div>

      {/* API Configuration */}
      <div className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h3 className="font-semibold text-gray-800">API Configuration</h3>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">API URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            />
            <p className="mt-1 text-xs text-gray-400">Your NextGen Cloud API endpoint.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config.apiKey ? '••••••••••••••••' : 'Enter your API key'}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            />
            <p className="mt-1 text-xs text-gray-400">Your Siloq API key for authentication.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Gemini API Key (Optional)
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Enter Gemini API key for AI features"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            />
            <p className="mt-1 text-xs text-gray-400">Required for AI content analysis features.</p>
          </div>
        </div>
      </div>

      {/* Sync Settings */}
      <div className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h3 className="font-semibold text-gray-800">Sync Settings</h3>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Content Types to Sync
            </label>
            <div className="space-y-2">
              {['post', 'page', 'product'].map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-3 rounded border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTypes([...selectedTypes, type]);
                      } else {
                        setSelectedTypes(selectedTypes.filter((t) => t !== type));
                      }
                    }}
                    className="h-4 w-4 rounded text-[#2271b1] focus:ring-[#2271b1]"
                  />
                  <span className="font-medium capitalize text-gray-700">{type}s</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="h-4 w-4 rounded text-[#2271b1] focus:ring-[#2271b1]"
              />
              <div>
                <span className="font-medium text-gray-700">Enable Auto-Sync</span>
                <p className="text-xs text-gray-400">
                  Automatically sync pages when published or updated.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleSave}
          className="rounded bg-[#2271b1] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#135e96]"
        >
          Save Changes
        </button>

        {showSuccess && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check size={16} /> Settings saved!
          </span>
        )}
      </div>

      {/* Danger Zone */}
      {config.connected && (
        <div className="mt-8 overflow-hidden rounded border border-red-200 bg-white shadow-sm">
          <div className="border-b border-red-200 bg-red-50 px-6 py-4">
            <h3 className="font-semibold text-red-800">Danger Zone</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800">Disconnect Site</h4>
                <p className="text-sm text-gray-500">
                  Remove all API credentials and reset plugin settings.
                </p>
              </div>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                <Trash2 size={16} /> Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
