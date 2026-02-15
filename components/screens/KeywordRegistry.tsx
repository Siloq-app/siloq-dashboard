'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, ExternalLink, Search, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import { keywordsService, type KeywordResponse } from '@/lib/services/api';

export default function KeywordRegistry() {
  const { selectedSite } = useDashboardContext();
  const [keywords, setKeywords] = useState<KeywordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!selectedSite) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await keywordsService.list(selectedSite.id);
      setKeywords(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load keywords');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Analyzing your site structure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-4" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4" onClick={load}>Retry</Button>
      </div>
    );
  }

  const filtered = keywords.filter(k =>
    !search || k.keyword.toLowerCase().includes(search.toLowerCase()) ||
    k.page_url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Keyword Registry</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">📋</span>
          <h3 className="text-lg font-semibold mb-2">No keywords registered yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Keywords will appear here once Siloq analyzes your site content.
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Keyword</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Page URL</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Page Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Silo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Impressions</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Clicks</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Position</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((kw) => (
                  <tr key={kw.id} className="border-b last:border-0 hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-medium">{kw.keyword}</td>
                    <td className="px-4 py-3">
                      <a
                        href={kw.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline truncate max-w-[300px]"
                        title={kw.page_url}
                      >
                        {kw.page_url.replace(/^https?:\/\//, '')}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">{kw.page_type}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{kw.silo_name || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={kw.status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{kw.impressions?.toLocaleString() ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{kw.clicks?.toLocaleString() ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{kw.position != null ? `#${kw.position.toFixed(1)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    assigned: 'bg-blue-100 text-blue-700',
    conflicted: 'bg-red-100 text-red-700',
    unassigned: 'bg-gray-100 text-gray-500',
  };
  const cls = colors[status.toLowerCase()] || colors.unassigned;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
