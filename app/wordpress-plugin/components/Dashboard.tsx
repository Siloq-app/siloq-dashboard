'use client';

import React from 'react';
import { SetupConfig, MockPage, AppView } from '../types';
import { CheckCircle, AlertCircle, ArrowRight, Zap, FileText, Clock } from 'lucide-react';

interface DashboardProps {
  config: SetupConfig;
  onChangeView: (view: AppView) => void;
  pages: MockPage[];
}

export function Dashboard({ config, onChangeView, pages }: DashboardProps) {
  const recentSynced = pages
    .filter(p => p.synced && p.lastSyncedAt)
    .sort((a, b) => (b.lastSyncedAt || '').localeCompare(a.lastSyncedAt || ''))
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-normal text-gray-800">
          WordPress Plugin <span className="text-gray-500 text-lg">Dashboard</span>
        </h1>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-md border-l-4 shadow-sm flex items-start justify-between ${config.connected ? 'bg-white border-green-500' : 'bg-white border-amber-500'}`}>
        <div className="flex gap-3">
          {config.connected ? (
            <CheckCircle className="text-green-500 mt-1" size={24} />
          ) : (
            <AlertCircle className="text-amber-500 mt-1" size={24} />
          )}
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">
              {config.connected ? 'System Fully Operational' : 'Action Required: Connect API'}
            </h3>
            <p className="text-gray-600 mt-1">
              {config.connected
                ? 'Your site is successfully connected to the NextGen Cloud. All systems are go.'
                : 'Please complete the setup wizard to unlock all features.'}
            </p>
          </div>
        </div>
        {!config.connected && (
          <button
            onClick={() => onChangeView(AppView.SETUP)}
            className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-sm font-medium transition-colors"
          >
            Run Setup Wizard
          </button>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded text-blue-600">
              <Zap size={20} />
            </div>
            <h3 className="font-semibold text-gray-800">Quick Scan</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Analyze your latest pages for lead generation opportunities using our AI engine.
          </p>
          <button
            onClick={() => onChangeView(AppView.SCANNER)}
            className="text-[#2271b1] text-sm font-medium hover:underline flex items-center gap-1"
          >
            Start Scanner <ArrowRight size={14} />
          </button>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 rounded text-purple-600">
              <FileText size={20} />
            </div>
            <h3 className="font-semibold text-gray-800">Page Sync</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Ensure all your local WordPress content is synchronized with the NextGen backend.
          </p>
          <button
            onClick={() => onChangeView(AppView.SYNC)}
            className="text-[#2271b1] text-sm font-medium hover:underline flex items-center gap-1"
          >
            Manage Sync <ArrowRight size={14} />
          </button>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-100 rounded text-green-600">
              <CheckCircle size={20} />
            </div>
            <h3 className="font-semibold text-gray-800">API Status</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Current Status: <span className={config.connected ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>{config.connected ? 'Active' : 'Disconnected'}</span><br/>
            Key: {config.apiKey ? `${config.apiKey.substring(0, 8)}...` : 'Not set'}
          </p>
          <button
            onClick={() => onChangeView(AppView.SETTINGS)}
            className="text-[#2271b1] text-sm font-medium hover:underline flex items-center gap-1"
          >
            Configure <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Recent Sync Activity Section */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Clock size={16} className="text-gray-500" /> Recent Sync Activity
          </h3>
          <button
            onClick={() => onChangeView(AppView.SYNC)}
            className="text-xs text-[#2271b1] hover:underline font-medium"
          >
            View All Pages
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {recentSynced.length > 0 ? (
            recentSynced.map(page => (
              <div key={page.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-green-100 text-green-600 rounded-full shrink-0">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{page.title}</div>
                    <div className="text-xs text-gray-400">ID: {page.id} • {page.status}</div>
                  </div>
                </div>
                <div className="text-right pl-4">
                  <div className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full inline-block mb-1">
                    {page.lastSyncedAt?.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {page.lastSyncedAt?.split(' ')[1]}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">
              No pages have been synced yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
