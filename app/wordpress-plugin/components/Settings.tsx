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
  const [selectedTypes, setSelectedTypes] = useState<string[]>(config.postTypes.length > 0 ? config.postTypes : ['page']);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setApiKey(config.apiKey || '');
    setAutoSync(config.autoSync);
    setSelectedTypes(config.postTypes.length > 0 ? config.postTypes : ['page']);
  }, [config]);

  const handleSave = () => {
    onUpdateConfig({
      ...config,
      apiKey: apiKey || config.apiKey,
      postTypes: selectedTypes,
      autoSync
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
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-gray-800">Plugin Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your WordPress plugin integration.</p>
      </div>

      {/* Connection Status */}
      <div className={`p-4 rounded-md border-l-4 shadow-sm flex items-center gap-3 ${config.connected ? 'bg-white border-green-500' : 'bg-white border-amber-500'}`}>
        {config.connected ? (
          <Check className="text-green-500" size={24} />
        ) : (
          <AlertCircle className="text-amber-500" size={24} />
        )}
        <div>
          <h3 className="font-semibold text-gray-800">
            {config.connected ? 'Connected to NextGen Cloud' : 'Not Connected'}
          </h3>
          <p className="text-gray-600 text-sm">
            {config.connected
              ? `API Key: ${config.apiKey.substring(0, 8)}...`
              : 'Please configure your API settings to connect.'}
          </p>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-800">API Configuration</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-[#2271b1] focus:border-[#2271b1] outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Your NextGen Cloud API endpoint.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config.apiKey ? '••••••••••••••••' : 'Enter your API key'}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-[#2271b1] focus:border-[#2271b1] outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Your Siloq API key for authentication.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key (Optional)</label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Enter Gemini API key for AI features"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-[#2271b1] focus:border-[#2271b1] outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Required for AI content analysis features.</p>
          </div>
        </div>
      </div>

      {/* Sync Settings */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-800">Sync Settings</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Types to Sync</label>
            <div className="space-y-2">
              {['post', 'page', 'product'].map((type) => (
                <label key={type} className="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTypes([...selectedTypes, type]);
                      } else {
                        setSelectedTypes(selectedTypes.filter(t => t !== type));
                      }
                    }}
                    className="w-4 h-4 text-[#2271b1] rounded focus:ring-[#2271b1]"
                  />
                  <span className="capitalize font-medium text-gray-700">{type}s</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 text-[#2271b1] rounded focus:ring-[#2271b1]"
              />
              <div>
                <span className="font-medium text-gray-700">Enable Auto-Sync</span>
                <p className="text-xs text-gray-400">Automatically sync pages when published or updated.</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-[#2271b1] hover:bg-[#135e96] text-white font-medium rounded transition-colors"
        >
          Save Changes
        </button>

        {showSuccess && (
          <span className="text-green-600 text-sm flex items-center gap-1">
            <Check size={16} /> Settings saved!
          </span>
        )}
      </div>

      {/* Danger Zone */}
      {config.connected && (
        <div className="bg-white rounded shadow-sm border border-red-200 overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-red-200 bg-red-50">
            <h3 className="font-semibold text-red-800">Danger Zone</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800">Disconnect Site</h4>
                <p className="text-sm text-gray-500">Remove all API credentials and reset plugin settings.</p>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
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
