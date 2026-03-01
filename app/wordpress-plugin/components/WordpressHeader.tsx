'use client';

import React from 'react';
import { Bell, Plus, Search, Globe } from 'lucide-react';

export function WordpressHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-8 items-center justify-between bg-[#1e2327] px-4 text-[#c3c4c7]">
      {/* Left Side - WordPress Logo */}
      <div className="flex items-center gap-2">
        <Globe size={18} className="text-white" />
        <span className="text-sm font-medium text-white">WordPress</span>
      </div>

      {/* Center - Admin Menu Items */}
      <nav className="hidden items-center gap-4 text-xs md:flex">
        <span className="cursor-pointer transition-colors hover:text-white">Dashboard</span>
        <span className="cursor-pointer transition-colors hover:text-white">Posts</span>
        <span className="cursor-pointer transition-colors hover:text-white">Media</span>
        <span className="cursor-pointer transition-colors hover:text-white">Pages</span>
        <span className="font-medium text-white">Siloq</span>
        <span className="cursor-pointer transition-colors hover:text-white">Settings</span>
      </nav>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden items-center rounded bg-[#2c3338] px-2 py-0.5 sm:flex">
          <Search size={12} className="text-[#8c8f94]" />
          <input
            type="text"
            placeholder="Search"
            className="ml-1 w-20 border-none bg-transparent text-xs text-white placeholder-[#8c8f94] focus:outline-none"
          />
        </div>

        {/* New Button */}
        <button className="flex items-center gap-1 text-xs transition-colors hover:text-white">
          <Plus size={12} />
          <span className="hidden sm:inline">New</span>
        </button>

        {/* Notifications */}
        <button className="relative transition-colors hover:text-white">
          <Bell size={14} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* User Avatar */}
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-400 text-[10px] font-bold text-gray-700">
          A
        </div>
      </div>
    </header>
  );
}
