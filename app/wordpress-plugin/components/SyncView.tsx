'use client';

import React, { useState } from 'react';
import { MockPage } from '../types';
import {
  RefreshCw,
  Check,
  CloudOff,
  Search,
  Layers,
  Clock,
  Loader2,
  Hash,
  Cloud,
  User,
} from 'lucide-react';
import { fetchWithApiKey } from '../lib/api-with-key';
import { toast } from 'sonner';

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

  const handleSync = async (id: number) => {
    const page = pages.find((p) => p.id === id);
    if (!page) return;

    setSyncingId(id);
    try {
      const response = await fetchWithApiKey('/api/v1/pages/sync/', {
        method: 'POST',
        body: JSON.stringify({
          pages: [
            {
              wp_post_id: page.id,
              title: page.title,
              url: page.url || `http://localhost:10013/?p=${page.id}`,
              content: page.excerpt || '',
              status: page.status,
              author: page.author,
              date_published: page.date || new Date().toISOString(),
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to sync page');
      }

      const data = await response.json();

      if (data.results && data.results[0]?.success) {
        setPages((prev) =>
          prev.map((p) => {
            if (p.id === id) {
              return { ...p, synced: true, lastSyncedAt: new Date().toLocaleString() };
            }
            return p;
          })
        );
        toast.success(`"${page.title}" synced successfully`);
      } else {
        throw new Error(data.results?.[0]?.error || 'Sync failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sync page');
    } finally {
      setSyncingId(null);
    }
  };

  const handleBulkSync = async () => {
    const unsyncedPages = pages.filter((p) => !p.synced);
    if (unsyncedPages.length === 0) return;

    setIsBulkSyncing(true);
    try {
      const response = await fetchWithApiKey('/api/v1/pages/sync/', {
        method: 'POST',
        body: JSON.stringify({
          pages: unsyncedPages.map((page) => ({
            wp_post_id: page.id,
            title: page.title,
            url: page.url || `http://localhost:10013/?p=${page.id}`,
            content: page.excerpt || '',
            status: page.status,
            author: page.author,
            date_published: page.date || new Date().toISOString(),
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to sync pages');
      }

      const data = await response.json();

      if (data.synced_count > 0) {
        setPages((prev) =>
          prev.map((p) => {
            if (!p.synced) {
              return { ...p, synced: true, lastSyncedAt: new Date().toLocaleString() };
            }
            return p;
          })
        );
        toast.success(`${data.synced_count} pages synced successfully`);
      } else {
        toast.error('No pages were synced');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sync pages');
    } finally {
      setIsBulkSyncing(false);
    }
  };

  const counts = {
    all: pages.length,
    publish: pages.filter((p) => p.status === 'publish').length,
    draft: pages.filter((p) => p.status === 'draft').length,
    private: pages.filter((p) => p.status === 'private').length,
  };

  const filteredPages = pages.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesId = idFilter === '' || p.id.toString().includes(idFilter);
    const matchesAuthor = p.author.toLowerCase().includes(authorFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesId && matchesAuthor;
  });

  const unsyncedCount = pages.filter((p) => !p.synced).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-normal text-gray-800">
            Page Synchronization
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Import your WordPress pages to NextGen for analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-20">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Hash size={14} aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="ID"
              aria-label="Filter by Page ID"
              value={idFilter}
              onChange={(e) => setIdFilter(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
            />
          </div>

          <div className="relative w-32">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <User size={14} aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Author"
              aria-label="Filter by Author"
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="w-full rounded border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
            />
          </div>

          <button
            onClick={handleBulkSync}
            disabled={isBulkSyncing || unsyncedCount === 0}
            className="flex items-center gap-2 rounded bg-[#2271b1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#135e96] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBulkSyncing ? <Loader2 size={16} className="animate-spin" /> : <Cloud size={16} />}
            {isBulkSyncing ? 'Syncing...' : `Sync All (${unsyncedCount})`}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 flex items-center gap-1 text-sm text-gray-600">
            <Search size={14} /> Search:
          </span>
          <input
            type="text"
            placeholder="Page title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-[200px] flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
          />

          <div className="ml-2 flex items-center gap-1">
            {(['all', 'publish', 'draft', 'private'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
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
      <div className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">
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
                className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50"
              >
                <div className="col-span-1 text-sm text-gray-500">#{page.id}</div>
                <div className="col-span-5">
                  <div className="text-sm font-medium text-gray-800">{page.title}</div>
                  <div className="truncate text-xs text-gray-400">
                    {page.excerpt.substring(0, 60)}...
                  </div>
                </div>
                <div className="col-span-2 text-sm text-gray-600">{page.author}</div>
                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      page.status === 'publish'
                        ? 'bg-green-100 text-green-800'
                        : page.status === 'draft'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {page.status}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  {page.synced ? (
                    <button
                      onClick={() => handleSync(page.id)}
                      disabled={syncingId === page.id}
                      className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {syncingId === page.id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} /> Re-sync
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSync(page.id)}
                      disabled={syncingId === page.id}
                      className="inline-flex items-center gap-1 rounded bg-[#2271b1] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#135e96] disabled:opacity-50"
                    >
                      {syncingId === page.id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Syncing...
                        </>
                      ) : (
                        <>
                          <Cloud size={14} /> Sync
                        </>
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
            <Check size={14} /> Synced: {pages.filter((p) => p.synced).length}
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <CloudOff size={14} /> Pending: {unsyncedCount}
          </span>
        </div>
      </div>
    </div>
  );
}
