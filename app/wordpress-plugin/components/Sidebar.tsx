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
  Plug
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
    <div className={`h-full bg-[#1e2327] text-[#c3c4c7] flex flex-col transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-40 md:w-48'}`}>
      {/* Logo Area */}
      <div className="h-8 bg-[#1e2327] flex items-center px-4 border-b border-[#2c3338]">
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
        className="absolute right-0 top-8 p-1 bg-[#2c3338] text-[#c3c4c7] rounded-l hover:bg-[#3c434a] transition-colors"
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
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
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
        <div className="p-4 border-t border-[#2c3338] text-xs text-[#8c8f94]">
          <p>Version 1.2.0</p>
        </div>
      )}
    </div>
  );
}
