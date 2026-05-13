'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, Search, Globe, Link, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: string;
  priority: number;
  title?: string;
}

interface Props {
  selectedSite: any;
}

export default function SitemapScreen({ selectedSite }: Props) {
  const [sitemapData, setSitemapData] = useState<SitemapEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSite?.id) {
      loadSitemapData();
    }
  }, [selectedSite]);

  const loadSitemapData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data for now - in real app this would fetch from API
      const mockData: SitemapEntry[] = [
        {
          url: selectedSite?.url || 'https://example.com',
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: 1.0,
          title: 'Home'
        },
        {
          url: `${selectedSite?.url || 'https://example.com'}/about`,
          lastmod: new Date(Date.now() - 86400000).toISOString(),
          changefreq: 'monthly',
          priority: 0.8,
          title: 'About Us'
        },
        {
          url: `${selectedSite?.url || 'https://example.com'}/services`,
          lastmod: new Date(Date.now() - 172800000).toISOString(),
          changefreq: 'weekly',
          priority: 0.9,
          title: 'Services'
        },
        {
          url: `${selectedSite?.url || 'https://example.com'}/blog`,
          lastmod: new Date(Date.now() - 3600000).toISOString(),
          changefreq: 'daily',
          priority: 0.7,
          title: 'Blog'
        },
        {
          url: `${selectedSite?.url || 'https://example.com'}/contact`,
          lastmod: new Date(Date.now() - 259200000).toISOString(),
          changefreq: 'monthly',
          priority: 0.6,
          title: 'Contact'
        }
      ];
      setSitemapData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sitemap data');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = sitemapData.filter(entry =>
    entry.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const downloadSitemap = () => {
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapData.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    const blob = new Blob([sitemapXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!selectedSite) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
          <Globe className="h-7 w-7" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No site selected</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Select a site to view and manage its sitemap configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 lg:gap-6">
        <div className="p-0">
          <h1 className="text-2xl text-slate-900 dark:text-white">Site Map</h1>
          <p className="text-xs text-slate-500 dark:text-white">
            Manage your XML sitemap for better search engine indexing and crawling
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSitemapData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={downloadSitemap}
            disabled={sitemapData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download XML
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400 mr-2" />
              <span className="text-slate-500">Loading sitemap data...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button variant="outline" onClick={loadSitemapData}>Try Again</Button>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {searchQuery ? 'No URLs found matching your search.' : 'No sitemap entries found.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                <span className="flex-1">URL</span>
                <span className="w-20">Priority</span>
                <span className="w-24">Frequency</span>
                <span className="w-32">Last Modified</span>
              </div>
              {filteredData.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <div className="truncate">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {entry.title || entry.url}
                        </div>
                        <div className="text-sm text-slate-500 truncate">
                          {entry.url}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-20 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      entry.priority >= 0.8 ? 'bg-green-100 text-green-700' :
                      entry.priority >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {entry.priority}
                    </span>
                  </div>
                  <div className="w-24 text-sm text-slate-500">
                    {entry.changefreq}
                  </div>
                  <div className="w-32 text-sm text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(entry.lastmod).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {sitemapData.length}
                </div>
                <div className="text-xs text-slate-500">Total URLs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Globe className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {sitemapData.filter(e => e.priority >= 0.8).length}
                </div>
                <div className="text-xs text-slate-500">High Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {sitemapData.filter(e => e.changefreq === 'daily').length}
                </div>
                <div className="text-xs text-slate-500">Daily Updates</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
