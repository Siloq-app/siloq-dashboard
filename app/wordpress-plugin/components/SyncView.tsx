'use client';

import React, { useState } from 'react';
import { MockPage } from '../types';
import { RefreshCw, Check, CloudOff, Search, Layers, Clock, Loader2, Hash, Cloud, User } from 'lucide-react';

interface SyncViewProps {
  pages: MockPage[];
  setPages: React.Dispatch<React.SetStateAction<MockPage[]>>;
}

export function SyncView({ pages, setPages }: SyncViewProps) {
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [idFilter, setIdFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'publish' | 'draft' | 'private'>('all');

  const handleSync = (id: number) => {
    setSyncingId(id);
    setTimeout(() => {
      setPages(prev => prev.map(p => {
        if (p.id === id) {
          return { ...p, synced: true, lastSyncedAt: new Date().toLocaleString() };
        }
        return p;
      }));
      setSyncingId(null);
    }, 1500);
  };

  const handleBulkSync = () => {
    setIsBulkSyncing(true);
    setTimeout(() => {
      setPages(prev => prev.map(p => {
        if (!p.synced) {
          return { ...p, synced: true, lastSyncedAt: new Date().toLocaleString() };
        }
        return p;
      }));
      setIsBulkSyncing(false);
    }, 2000);
  };

  const counts = {
    all: pages.length,
    publish: pages.filter(p => p.status === 'publish').length,
    draft: pages.filter(p => p.status === 'draft').length,
    private: pages.filter(p => p.status === 'private').length,
  };

  const filteredPages = pages.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesId = idFilter === '' || p.id.toString().includes(idFilter);
    const matchesAuthor = p.author.toLowerCase().includes(authorFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesId && matchesAuthor;
  });

  const unsyncedCount = pages.filter(p => !p.synced).length;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-gray-800 flex items-center gap-2">
            Page Synchronization
          </h1>
          <p className="text-gray-500 text-sm mt-1">Import your WordPress pages to NextGen for analysis.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-20">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Hash size={14} aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="ID"
              aria-label="Filter by Page ID"
              value={idFilter}
              onChange={(e) => setIdFilter(e.target.value.replace(/\D/g, ''))}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            />
          </div>

          <div className="relative w-32">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <User size={14} aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Author"
              aria-label="Filter by Author"
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            />
          </div>

          <button
            onClick={handleBulkSync}
            disabled={isBulkSyncing || unsyncedCount === 0}
            className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white text-sm font-medium rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBulkSyncing ? <Loader2 size={16} className="animate-spin" /> : <Cloud size={16} />}
            {isBulkSyncing ? 'Syncing...' : `Sync All (${unsyncedCount})`}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 flex items-center gap-1 mr-2">
            <Search size={14} /> Search:
          </span>
          <input
            type="text"
            placeholder="Page title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
          />

          <div className="flex items-center gap-1 ml-2">
            {(['all', 'publish', 'draft', 'private'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-[#2271b1] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status} ({counts[status]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
          <div className="col-span-1">ID</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Author</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredPages.length > 0 ? (
            filteredPages.map((page) => (
              <div
                key={page.id}
                className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors"
              >
                <div className="col-span-1 text-sm text-gray-500">#{page.id}</div>
                <div className="col-span-5">
                  <div className="text-sm font-medium text-gray-800">{page.title}</div>
                  <div className="text-xs text-gray-400 truncate">{page.excerpt.substring(0, 60)}...</div>
                </div>
                <div className="col-span-2 text-sm text-gray-600">{page.author}</div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    page.status === 'publish'
                      ? 'bg-green-100 text-green-800'
                      : page.status === 'draft'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {page.status}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  {page.synced ? (
                    <div className="flex items-center justify-end gap-2 text-green-600">
                      <Check size={16} />
                      <span className="text-xs font-medium">Synced</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSync(page.id)}
                      disabled={syncingId === page.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                    >
                      {syncingId === page.id ? (
                        <><Loader2 size={14} className="animate-spin" /> Syncing...</>
                      ) : (
                        <><Cloud size={14} /> Sync</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">
              No pages found matching your criteria.
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Layers size={14} /> Total: {pages.length}
          </span>
          <span className="flex items-center gap-1 text-green-600">
            <Check size={14} /> Synced: {pages.filter(p => p.synced).length}
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <CloudOff size={14} /> Pending: {unsyncedCount}
          </span>
        </div>
      </div>
    </div>
  );
}
