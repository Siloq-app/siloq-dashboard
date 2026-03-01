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
    .filter((p) => p.synced && p.lastSyncedAt)
    .sort((a, b) => (b.lastSyncedAt || '').localeCompare(a.lastSyncedAt || ''))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-normal text-gray-800">
          WordPress Plugin <span className="text-lg text-gray-500">Dashboard</span>
        </h1>
      </div>

      {/* Status Banner */}
      <div
        className={`flex items-start justify-between rounded-md border-l-4 p-4 shadow-sm ${config.connected ? 'border-green-500 bg-white' : 'border-amber-500 bg-white'}`}
      >
        <div className="flex gap-3">
          {config.connected ? (
            <CheckCircle className="mt-1 text-green-500" size={24} />
          ) : (
            <AlertCircle className="mt-1 text-amber-500" size={24} />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {config.connected ? 'System Fully Operational' : 'Action Required: Connect API'}
            </h3>
            <p className="mt-1 text-gray-600">
              {config.connected
                ? 'Your site is successfully connected to the NextGen Cloud. All systems are go.'
                : 'Please complete the setup wizard to unlock all features.'}
            </p>
          </div>
        </div>
        {!config.connected && (
          <button
            onClick={() => onChangeView(AppView.SETUP)}
            className="rounded bg-[#2271b1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#135e96]"
          >
            Run Setup Wizard
          </button>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Card 1 */}
        <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded bg-blue-100 p-2 text-blue-600">
              <Zap size={20} />
            </div>
            <h3 className="font-semibold text-gray-800">Quick Scan</h3>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Analyze your latest pages for lead generation opportunities using our AI engine.
          </p>
          <button
            onClick={() => onChangeView(AppView.SCANNER)}
            className="flex items-center gap-1 text-sm font-medium text-[#2271b1] hover:underline"
          >
            Start Scanner <ArrowRight size={14} />
          </button>
        </div>

        {/* Card 2 */}
        <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded bg-purple-100 p-2 text-purple-600">
              <FileText size={20} />
            </div>
            <h3 className="font-semibold text-gray-800">Page Sync</h3>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Ensure all your local WordPress content is synchronized with the NextGen backend.
          </p>
          <button
            onClick={() => onChangeView(AppView.SYNC)}
            className="flex items-center gap-1 text-sm font-medium text-[#2271b1] hover:underline"
          >
            Manage Sync <ArrowRight size={14} />
          </button>
        </div>

        {/* Card 3 */}
        <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded bg-green-100 p-2 text-green-600">
              <CheckCircle size={20} />
            </div>
            <h3 className="font-semibold text-gray-800">API Status</h3>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Current Status:{' '}
            <span
              className={config.connected ? 'font-bold text-green-600' : 'font-bold text-amber-600'}
            >
              {config.connected ? 'Active' : 'Disconnected'}
            </span>
            <br />
            Key: {config.apiKey ? `${config.apiKey.substring(0, 8)}...` : 'Not set'}
          </p>
          <button
            onClick={() => onChangeView(AppView.SETTINGS)}
            className="flex items-center gap-1 text-sm font-medium text-[#2271b1] hover:underline"
          >
            Configure <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Recent Sync Activity Section */}
      <div className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-gray-800">
            <Clock size={16} className="text-gray-500" /> Recent Sync Activity
          </h3>
          <button
            onClick={() => onChangeView(AppView.SYNC)}
            className="text-xs font-medium text-[#2271b1] hover:underline"
          >
            View All Pages
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {recentSynced.length > 0 ? (
            recentSynced.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-full bg-green-100 p-1.5 text-green-600">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{page.title}</div>
                    <div className="text-xs text-gray-400">
                      ID: {page.id} • {page.status}
                    </div>
                  </div>
                </div>
                <div className="pl-4 text-right">
                  <div className="mb-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
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
