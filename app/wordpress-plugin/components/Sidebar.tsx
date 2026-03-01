'use client';

import React from 'react';
import { AppView } from '../types';
import {
  LayoutDashboard,
  Settings,
  FileText,
  ScanSearch,
  ChevronLeft,
  ChevronRight,
  Plug,
} from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export function Sidebar({ currentView, onChangeView, isCollapsed, toggleCollapse }: SidebarProps) {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.SYNC, label: 'Page Sync', icon: FileText },
    { id: AppView.SCANNER, label: 'Lead Scanner', icon: ScanSearch },
    { id: AppView.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <div
      className={`flex h-full flex-col bg-[#1e2327] text-[#c3c4c7] transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-40 md:w-48'}`}
    >
      {/* Logo Area */}
      <div className="flex h-8 items-center border-b border-[#2c3338] bg-[#1e2327] px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Plug size={18} className="text-[#2271b1]" />
            <span className="text-sm font-semibold text-white">Siloq</span>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute right-0 top-8 rounded-l bg-[#2c3338] p-1 text-[#c3c4c7] transition-colors hover:bg-[#3c434a]"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Menu Items */}
      <nav className="flex-1 py-2">
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onChangeView(item.id)}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-[#2271b1] text-white'
                      : 'text-[#c3c4c7] hover:bg-[#2c3338] hover:text-white'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={18} />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-[#2c3338] p-4 text-xs text-[#8c8f94]">
          <p>Version 1.2.0</p>
        </div>
      )}
    </div>
  );
}
