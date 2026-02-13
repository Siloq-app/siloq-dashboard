'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  BarChart3,
  MousePointerClick,
  Eye,
  Target,
  TrendingUp,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  gscService,
  GscData,
  GscSite,
  Site,
} from '@/lib/services/api';

type ConnectionStep = 'idle' | 'loading' | 'select-property' | 'connecting';

interface Props {
  selectedSite: Site | null;
}

export default function SearchConsole({ selectedSite }: Props) {
  const isConnected = selectedSite?.gsc_connected === true;

  // Connection state
  const [connectionStep, setConnectionStep] = useState<ConnectionStep>('idle');
  const [gscSites, setGscSites] = useState<GscSite[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Data state
  const [gscData, setGscData] = useState<GscData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);

  const siteId = selectedSite?.id;

  // Load GSC data when connected
  const loadData = useCallback(async () => {
    if (!siteId || !isConnected) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const data = await gscService.getData(siteId);
      setGscData(data);
    } catch (err: unknown) {
      setDataError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  }, [siteId, isConnected]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check URL for GSC callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gsc_callback') === 'true') {
      // OAuth callback completed, load available properties
      handleLoadProperties();
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('gsc_callback');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const handleConnect = async () => {
    setConnectionError(null);
    setConnectionStep('loading');
    try {
      const { url } = await gscService.getAuthUrl(siteId ?? undefined);
      window.location.href = url;
    } catch (err: unknown) {
      setConnectionError(err instanceof Error ? err.message : 'Failed to start authorization');
      setConnectionStep('idle');
    }
  };

  const handleLoadProperties = async () => {
    setConnectionError(null);
    setConnectionStep('loading');
    try {
      const sites = await gscService.getSites();
      setGscSites(sites);
      setConnectionStep('select-property');
    } catch (err: unknown) {
      setConnectionError(err instanceof Error ? err.message : 'Failed to load properties');
      setConnectionStep('idle');
    }
  };

  const handleSelectProperty = async (gscUrl: string) => {
    if (!siteId) return;
    setConnectionStep('connecting');
    setConnectionError(null);
    try {
      await gscService.connectSite(siteId, gscUrl);
      setConnectionStep('idle');
      // Reload to pick up gsc_connected change
      window.location.reload();
    } catch (err: unknown) {
      setConnectionError(err instanceof Error ? err.message : 'Failed to connect property');
      setConnectionStep('select-property');
    }
  };

  const handleAnalyze = async () => {
    if (!siteId) return;
    setAnalyzing(true);
    setAnalysisMessage(null);
    try {
      const result = await gscService.analyze(siteId);
      setAnalysisMessage(result.message || 'Analysis started successfully');
    } catch (err: unknown) {
      setAnalysisMessage(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // --- Not Connected UI ---
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Search Console</h2>
          <p className="text-muted-foreground">
            Connect Google Search Console to see your search performance data.
          </p>
        </div>

        <Card className="mx-auto max-w-lg">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <div className="rounded-full bg-muted p-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Connect Google Search Console</h3>
            <p className="text-center text-sm text-muted-foreground max-w-sm">
              Link your GSC property to view queries, clicks, impressions, and
              run cannibalization analysis powered by real search data.
            </p>

            {connectionError && (
              <p className="text-sm text-destructive">{connectionError}</p>
            )}

            {connectionStep === 'select-property' && gscSites.length > 0 ? (
              <div className="w-full space-y-2">
                <p className="text-sm font-medium">Select a property:</p>
                {gscSites.map((site) => (
                  <button
                    key={site.siteUrl}
                    onClick={() => handleSelectProperty(site.siteUrl)}
                    className="flex w-full items-center justify-between rounded-md border p-3 text-left text-sm hover:bg-accent transition-colors"
                  >
                    <span className="truncate">{site.siteUrl}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {site.permissionLevel}
                    </span>
                  </button>
                ))}
              </div>
            ) : connectionStep === 'select-property' && gscSites.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No GSC properties found. Make sure you have access in Google Search Console.
              </p>
            ) : null}

            <Button
              onClick={connectionStep === 'idle' ? handleConnect : handleLoadProperties}
              disabled={connectionStep === 'loading' || connectionStep === 'connecting'}
            >
              {(connectionStep === 'loading' || connectionStep === 'connecting') && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {connectionStep === 'connecting'
                ? 'Connecting...'
                : connectionStep === 'select-property'
                  ? 'Refresh Properties'
                  : 'Connect with Google'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Connected UI ---
  const totals = gscData?.totals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Search Console</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500">
              <CheckCircle2 className="h-3 w-3" /> Connected
            </span>
          </div>
          <p className="text-muted-foreground">Last 90 days of search performance data.</p>
        </div>
        <Button onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="mr-2 h-4 w-4" />
          )}
          Run Analysis
        </Button>
      </div>

      {analysisMessage && (
        <p className="text-sm text-muted-foreground">{analysisMessage}</p>
      )}

      {dataLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {dataError && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive">{dataError}</p>
            <Button variant="outline" className="mt-4" onClick={loadData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!dataLoading && !dataError && totals && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Total Clicks',
                value: totals.clicks.toLocaleString(),
                icon: MousePointerClick,
                color: 'text-blue-400',
              },
              {
                title: 'Total Impressions',
                value: totals.impressions.toLocaleString(),
                icon: Eye,
                color: 'text-purple-400',
              },
              {
                title: 'Avg CTR',
                value: `${(totals.ctr * 100).toFixed(1)}%`,
                icon: TrendingUp,
                color: 'text-green-400',
              },
              {
                title: 'Avg Position',
                value: totals.position.toFixed(1),
                icon: Target,
                color: 'text-amber-400',
              },
            ].map((stat) => (
              <Card key={stat.title}>
                <CardContent className="flex items-center gap-4 py-5">
                  <div className={`rounded-lg bg-muted p-2.5 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top Queries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" /> Top Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Query</th>
                      <th className="pb-2 pr-4 font-medium text-right">Clicks</th>
                      <th className="pb-2 pr-4 font-medium text-right">Impressions</th>
                      <th className="pb-2 pr-4 font-medium text-right">CTR</th>
                      <th className="pb-2 font-medium text-right">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(gscData.queries ?? []).slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 pr-4 font-medium">{row.query}</td>
                        <td className="py-2.5 pr-4 text-right">{row.clicks.toLocaleString()}</td>
                        <td className="py-2.5 pr-4 text-right">{row.impressions.toLocaleString()}</td>
                        <td className="py-2.5 pr-4 text-right">{(row.ctr * 100).toFixed(1)}%</td>
                        <td className="py-2.5 text-right">{row.position.toFixed(1)}</td>
                      </tr>
                    ))}
                    {(!gscData.queries || gscData.queries.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No query data available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Top Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Page</th>
                      <th className="pb-2 pr-4 font-medium text-right">Clicks</th>
                      <th className="pb-2 font-medium text-right">Impressions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(gscData.pages ?? []).slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 pr-4">
                          <a
                            href={row.page}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:underline truncate max-w-md"
                          >
                            {row.page.replace(/^https?:\/\//, '')}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </td>
                        <td className="py-2.5 pr-4 text-right">{row.clicks.toLocaleString()}</td>
                        <td className="py-2.5 text-right">{row.impressions.toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!gscData.pages || gscData.pages.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-muted-foreground">
                          No page data available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
