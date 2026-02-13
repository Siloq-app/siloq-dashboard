'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Star,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchWithAuth } from '@/lib/auth-headers';

interface Page {
  id: number;
  url: string;
  title: string;
  status: 'publish' | 'draft' | 'private' | string;
  published_at: string | null;
  last_synced_at: string | null;
  is_money_page: boolean;
  seo_score: number | null;
  issue_count: number;
}

interface PagesScreenProps {
  onAnalyze?: (pageIds: number[]) => void;
}

export default function PagesScreen({ onAnalyze }: PagesScreenProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moneyPageFilter, setMoneyPageFilter] = useState<string>('all');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isToggling, setIsToggling] = useState<number | null>(null);

  const itemsPerPage = 20;

  const loadPages = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth('/api/v1/pages/');
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.detail || 'Failed to load pages');
      
      const results = Array.isArray(data) ? data : data.results || [];
      setPages(results);
      setTotalPages(Math.ceil(results.length / itemsPerPage) || 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load pages');
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const toggleMoneyPage = async (pageId: number) => {
    setIsToggling(pageId);
    try {
      const res = await fetchWithAuth(
        `/api/v1/pages/${pageId}/toggle_money_page/`,
        { method: 'POST' }
      );
      if (!res.ok) {
        throw new Error(`Failed to toggle money page status (${res.status})`);
      }
      const data = await res.json();
      
      setPages(prev =>
        prev.map(p =>
          p.id === pageId ? { ...p, is_money_page: data.is_money_page } : p
        )
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to toggle');
    } finally {
      setIsToggling(null);
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredPages.map(p => p.id);
    const allSelected = allIds.every(id => selectedPages.has(id));
    
    if (allSelected) {
      // Deselect all
      const newSelected = new Set(selectedPages);
      allIds.forEach(id => newSelected.delete(id));
      setSelectedPages(newSelected);
    } else {
      // Select all
      const newSelected = new Set(selectedPages);
      allIds.forEach(id => newSelected.add(id));
      setSelectedPages(newSelected);
    }
  };

  const handleSelectPage = (pageId: number) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleAnalyze = () => {
    if (selectedPages.size === 0) return;
    onAnalyze?.(Array.from(selectedPages));
  };

  // Filter pages
  const filteredPages = pages.filter(page => {
    const matchesSearch =
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || page.status === statusFilter;
    const matchesMoneyPage =
      moneyPageFilter === 'all'
        ? true
        : moneyPageFilter === 'money'
        ? page.is_money_page
        : !page.is_money_page;
    return matchesSearch && matchesStatus && matchesMoneyPage;
  });

  // Paginate
  const paginatedPages = filteredPages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const moneyPageCount = pages.filter(p => p.is_money_page).length;
  const totalSynced = pages.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pages</h1>
          <p className="text-sm text-slate-500">
            Manage your synced WordPress pages and mark money pages for analysis
          </p>
        </div>
        <Button onClick={loadPages} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Pages</p>
                <p className="text-2xl font-semibold">{totalSynced}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 size={20} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Money Pages</p>
                <p className="text-2xl font-semibold text-amber-600">
                  {moneyPageCount}
                </p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Star size={20} className="text-amber-600" fill="currentColor" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Selected</p>
                <p className="text-2xl font-semibold text-indigo-600">
                  {selectedPages.size}
                </p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CheckCircle2 size={20} className="text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedPages.size > 0 && (
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600" />
                <span className="text-sm font-medium text-indigo-900">
                  {selectedPages.size} pages selected
                </span>
              </div>
              <Button onClick={handleAnalyze} size="sm">
                <Sparkles size={16} className="mr-2" />
                Analyze for Cannibalization
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Search pages..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="publish">Published</option>
                <option value="draft">Draft</option>
                <option value="private">Private</option>
              </select>
              <select
                value={moneyPageFilter}
                onChange={e => setMoneyPageFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm bg-white"
              >
                <option value="all">All Pages</option>
                <option value="money">Money Pages Only</option>
                <option value="regular">Regular Pages Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Pages Table */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle>All Pages</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {paginatedPages.every(p => selectedPages.has(p.id))
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
              Loading pages...
            </div>
          ) : paginatedPages.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No pages found. Sync pages from your WordPress site.
            </div>
          ) : (
            <div className="divide-y">
              {paginatedPages.map(page => (
                <div
                  key={page.id}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedPages.has(page.id)}
                      onChange={() => handleSelectPage(page.id)}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-slate-900 truncate">
                            {page.title || 'Untitled'}
                          </h3>
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 mt-0.5"
                          >
                            {page.url}
                            <ExternalLink size={12} />
                          </a>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={
                              page.status === 'publish'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {page.status}
                          </Badge>
                          <button
                            onClick={() => toggleMoneyPage(page.id)}
                            disabled={isToggling === page.id}
                            className={`p-1.5 rounded-md transition-colors ${
                              page.is_money_page
                                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                            title={
                              page.is_money_page
                                ? 'Remove money page status'
                                : 'Mark as money page'
                            }
                          >
                            <Star
                              size={18}
                              fill={page.is_money_page ? 'currentColor' : 'none'}
                              className={
                                isToggling === page.id ? 'animate-pulse' : ''
                              }
                            />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        {page.seo_score !== null && (
                          <span className="flex items-center gap-1">
                            <BarChart3 size={14} />
                            SEO Score: {page.seo_score}
                          </span>
                        )}
                        {page.issue_count > 0 && (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertCircle size={14} />
                            {page.issue_count} issues
                          </span>
                        )}
                        <span>
                          Last synced:{' '}
                          {page.last_synced_at
                            ? new Date(page.last_synced_at).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
