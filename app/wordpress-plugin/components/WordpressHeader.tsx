'use client';

import React from 'react';
import { Bell, Plus, Search, Globe } from 'lucide-react';

export function WordpressHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 h-8 bg-[#1e2327] z-50 flex items-center justify-between px-4 text-[#c3c4c7]">
      {/* Left Side - WordPress Logo */}
      <div className="flex items-center gap-2">
        <Globe size={18} className="text-white" />
        <span className="text-sm font-medium text-white">WordPress</span>
      </div>

      {/* Center - Admin Menu Items */}
      <nav className="hidden md:flex items-center gap-4 text-xs">
        <span className="hover:text-white cursor-pointer transition-colors">Dashboard</span>
        <span className="hover:text-white cursor-pointer transition-colors">Posts</span>
        <span className="hover:text-white cursor-pointer transition-colors">Media</span>
        <span className="hover:text-white cursor-pointer transition-colors">Pages</span>
        <span className="text-white font-medium">Siloq</span>
        <span className="hover:text-white cursor-pointer transition-colors">Settings</span>
      </nav>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden sm:flex items-center bg-[#2c3338] rounded px-2 py-0.5">
          <Search size={12} className="text-[#8c8f94]" />
          <input
            type="text"
            placeholder="Search"
            className="bg-transparent border-none text-xs text-white placeholder-[#8c8f94] focus:outline-none w-20 ml-1"
          />
        </div>

        {/* New Button */}
        <button className="flex items-center gap-1 text-xs hover:text-white transition-colors">
          <Plus size={12} />
          <span className="hidden sm:inline">New</span>
        </button>

        {/* Notifications */}
        <button className="relative hover:text-white transition-colors">
          <Bell size={14} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Avatar */}
        <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-700">
          A
        </div>
      </div>
    </header>
  );
}
