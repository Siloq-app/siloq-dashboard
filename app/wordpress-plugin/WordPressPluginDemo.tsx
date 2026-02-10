'use client';

import React, { useState, useEffect } from 'react';
import { AppView, SetupConfig, MockPage } from './types';
import { MOCK_PAGES } from './constants';
import { Dashboard } from './components/Dashboard';
import { SetupWizard } from './components/SetupWizard';
import { SyncView } from './components/SyncView';
import { ScannerView } from './components/ScannerView';
import { Settings } from './components/Settings';
import { Sidebar } from './components/Sidebar';
import { WordpressHeader } from './components/WordpressHeader';

const DEFAULT_CONFIG: SetupConfig = {
  apiKey: '',
  connected: false,
  postTypes: [],
  autoSync: false,
};

export function WordPressPluginDemo() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [config, setConfig] = useState<SetupConfig>(DEFAULT_CONFIG);
  const [pages, setPages] = useState<MockPage[]>(MOCK_PAGES);
  const [isLoading, setIsLoading] = useState(true);

  // Load config from local storage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('wp_plugin_demo_config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Failed to parse config", e);
      }
    }
    setIsLoading(false);
  }, []);

  const handleSetupComplete = (newConfig: SetupConfig) => {
    setConfig(newConfig);
    localStorage.setItem('wp_plugin_demo_config', JSON.stringify(newConfig));
    setCurrentView(AppView.DASHBOARD);
  };

  const handleUpdateConfig = (newConfig: SetupConfig) => {
    setConfig(newConfig);
    localStorage.setItem('wp_plugin_demo_config', JSON.stringify(newConfig));
  };

  const handleDisconnect = () => {
    const newConfig = DEFAULT_CONFIG;
    setConfig(newConfig);
    localStorage.removeItem('wp_plugin_demo_config');
    setCurrentView(AppView.DASHBOARD);
  };

  const renderContent = () => {
    // If not connected and trying to access dashboard, show setup
    if (!config.connected && currentView === AppView.DASHBOARD) {
      return (
        <div className="p-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Siloq WordPress Plugin</h2>
            <p className="text-gray-600 mb-6">
              Please complete the setup wizard to connect your WordPress site to the NextGen Cloud.
            </p>
            <button
              onClick={() => setCurrentView(AppView.SETUP)}
              className="px-6 py-3 bg-[#2271b1] hover:bg-[#135e96] text-white font-medium rounded transition-colors"
            >
              Start Setup Wizard
            </button>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard config={config} onChangeView={setCurrentView} pages={pages} />;
      case AppView.SETUP:
        return <SetupWizard onComplete={handleSetupComplete} />;
      case AppView.SYNC:
        return <SyncView pages={pages} setPages={setPages} />;
      case AppView.SCANNER:
        return <ScannerView pages={pages} setPages={setPages} />;
      case AppView.SETTINGS:
        return <Settings config={config} onDisconnect={handleDisconnect} onUpdateConfig={handleUpdateConfig} />;
      default:
        return <Dashboard config={config} onChangeView={setCurrentView} pages={pages} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f0f1] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f1] flex flex-col font-sans">
      <WordpressHeader />

      <div className="flex flex-1 pt-8">
        <aside className="fixed left-0 top-8 bottom-0 z-30">
          <Sidebar
            currentView={currentView}
            onChangeView={setCurrentView}
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </aside>

        <main
          className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-12' : 'ml-40 md:ml-48'} p-2`}
        >
          <div className="mt-4">
            {renderContent()}

            {/* Footer */}
            <div className="mt-12 py-6 px-8 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
              <span>Thank you for creating with WordPress.</span>
              <span>Version 1.2.0</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
