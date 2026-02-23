'use client';

import { useState, useEffect, Suspense } from 'react';
import { toast } from 'sonner';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { DashboardProvider } from '@/lib/hooks/dashboard-context';
import Header from '@/app/dashboard/header';
import { fetchWithAuth } from '@/lib/auth-headers';

interface MasterKey {
  id: string;
  name: string;
  key?: string;
  key_prefix: string;
  created_at?: string;
  is_active?: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  key?: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

interface Site {
  id: string;
  name: string;
  url: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [masterKeys, setMasterKeys] = useState<MasterKey[]>([]);
  const [masterKeyName, setMasterKeyName] = useState('Master Key');
  const [newlyCreatedMasterKey, setNewlyCreatedMasterKey] = useState<MasterKey | null>(null);
  const [isGeneratingMaster, setIsGeneratingMaster] = useState(false);
  const [isMasterLoading, setIsMasterLoading] = useState(false);

  useEffect(() => {
    fetchApiKeys();
    fetchSites();
    fetchMasterKeys();
  }, []);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth('/api/v1/api-keys');
      const data = await res.json();
      if (res.ok) {
        // API returns snake_case — map to camelCase for this component
        const raw: any[] = data.results || data.keys || (Array.isArray(data) ? data : []);
        setApiKeys(raw.map((k) => ({
          id: k.id,
          name: k.name,
          key: k.key,
          keyPrefix: k.key_prefix ?? k.keyPrefix ?? '',
          createdAt: k.created_at ?? k.createdAt ?? '',
          lastUsedAt: k.last_used_at ?? k.lastUsedAt ?? null,
          isActive: k.is_active ?? k.isActive ?? false,
        })));
      } else {
        setError(data.message || 'Failed to fetch API keys');
      }
    } catch (err) {
      setError('Failed to fetch API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await fetchWithAuth('/api/v1/sites');
      const data = await res.json();
      if (res.ok && data.results) {
        setSites(data.results);
        if (data.results.length > 0) {
          setSelectedSiteId(data.results[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sites');
    }
  };

  const fetchMasterKeys = async () => {
    setIsMasterLoading(true);
    try {
      const res = await fetchWithAuth('/api/v1/account-keys/');
      const data = await res.json();
      if (res.ok) {
        const keys = Array.isArray(data) ? data : (data.results || []);
        setMasterKeys(keys);
      }
    } catch (err) {
      console.error('Failed to fetch master keys');
    } finally {
      setIsMasterLoading(false);
    }
  };

  const generateMasterKey = async () => {
    if (!masterKeyName.trim()) {
      toast.error('Please enter a name for the master key');
      return;
    }
    setIsGeneratingMaster(true);
    try {
      const res = await fetchWithAuth('/api/v1/account-keys/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: masterKeyName }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to generate master key');
      }
      setNewlyCreatedMasterKey(data.key);
      setMasterKeyName('Master Key');
      toast.success('Master API key generated successfully!');
      fetchMasterKeys();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGeneratingMaster(false);
    }
  };

  const revokeMasterKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this master key? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetchWithAuth(`/api/v1/account-keys/${keyId}/`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to revoke master key');
      }
      toast.success('Master key revoked successfully');
      fetchMasterKeys();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const generateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }
    if (!selectedSiteId) {
      toast.error('Please select a site for this API key');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const res = await fetchWithAuth('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName, site_id: selectedSiteId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to generate API key');
      }

      setNewlyCreatedKey(data.key);
      setNewKeyName('');
      toast.success('API key generated successfully!');
      fetchApiKeys();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const revokeKey = async (keyId: string) => {
    if (
      !confirm(
        'Are you sure you want to revoke this API key? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const res = await fetchWithAuth(`/api/v1/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to revoke key');
      }

      toast.success('API key revoked successfully');
      fetchApiKeys();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardProvider>
    <SidebarProvider>
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <SidebarInset>
        <Header
          automationMode="manual"
          onAutomationChange={() => {}}
          activeTab="settings"
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex-1 p-4">
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <Key className="h-5 w-5" />
                  API Keys
                </h1>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Manage API keys for your WordPress plugin and external integrations
                </p>
              </div>

              {/* Master API Key Card */}
              <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <Key className="h-5 w-5" />
                    Master API Key
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                    A master key works across all your sites. When you install the WordPress plugin and connect with a master key, Siloq automatically creates the site for you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="masterKeyName" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Key Name
                      </Label>
                      <Input
                        id="masterKeyName"
                        placeholder="e.g., Master Key"
                        value={masterKeyName}
                        onChange={(e) => setMasterKeyName(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={generateMasterKey}
                        disabled={isGeneratingMaster}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600"
                      >
                        {isGeneratingMaster ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Key className="mr-2 h-4 w-4" />
                            Generate Master Key
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Newly Created Master Key */}
                  {newlyCreatedMasterKey && (
                    <div className="mt-6 rounded-md border border-amber-500/50 bg-amber-500/5 p-4">
                      <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" clipRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                        </svg>
                        Copy your master API key now!
                      </div>
                      <p className="mb-2 mt-1 text-sm text-amber-700 dark:text-amber-300">It won&apos;t be shown again.</p>
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-800/80 p-3">
                        <code className="flex-1 break-all font-mono text-sm text-slate-200">
                          {newlyCreatedMasterKey.key}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            newlyCreatedMasterKey.key &&
                            copyToClipboard(newlyCreatedMasterKey.key, 'new-master')
                          }
                          className="text-slate-400 hover:text-slate-200"
                        >
                          {copiedId === 'new-master' ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Existing Master Keys */}
                  {isMasterLoading ? (
                    <div className="mt-6 flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : masterKeys.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Existing Master Keys</h4>
                      {masterKeys.map((mk) => (
                        <div
                          key={mk.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                                {mk.name}
                              </span>
                              <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                                Master
                              </span>
                            </div>
                            <div className="font-mono text-sm text-slate-500 dark:text-slate-500">
                              {mk.key_prefix}
                            </div>
                            {mk.created_at && (
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-600">
                                Created {new Date(mk.created_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => revokeMasterKey(mk.id)}
                            className="self-start sm:self-center text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generate New Key Card */}
              <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <Plus className="h-5 w-5" />
                    Generate New API Key
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                    Create a new API key to connect your WordPress site to Siloq
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  {error && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                      <strong>Error</strong> — {error}
                    </div>
                  )}

                  {sites.length === 0 && (
                    <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                      <strong>No sites found</strong> — You need to create a site first before generating API keys.{" "}
                      <a href="/dashboard?tab=sites" className="font-semibold underline">
                        Go to Sites tab →
                      </a>
                    </div>
                  )}
                  <div className="flex flex-col gap-4">
                    {sites.length > 0 && (
                      <div>
                        <Label htmlFor="siteSelect" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Select Site <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="siteSelect"
                          value={selectedSiteId}
                          onChange={(e) => setSelectedSiteId(e.target.value)}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {sites.map((site) => (
                            <option key={site.id} value={site.id}>
                              {site.name} ({site.url})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Label htmlFor="keyName" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Key Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="keyName"
                          placeholder="e.g., Production WordPress Site"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={generateKey}
                          disabled={isGenerating || !selectedSiteId}
                          className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600"
                        >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Key className="mr-2 h-4 w-4" />
                            Generate Key
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                  {/* Newly Created Key Success */}
                  {newlyCreatedKey && (
                    <div className="mt-6 rounded-md border border-amber-500/50 bg-amber-500/5 p-4">
                      <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" clipRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                        </svg>
                        Copy your API key now!
                      </div>
                      <p className="mb-2 mt-1 text-sm text-amber-700 dark:text-amber-300">It won&apos;t be shown again.</p>
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-800/80 p-3">
                        <code className="flex-1 break-all font-mono text-sm text-slate-200">
                          {newlyCreatedKey.key}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            newlyCreatedKey.key &&
                            copyToClipboard(newlyCreatedKey.key, 'new')
                          }
                          className="text-slate-400 hover:text-slate-200"
                        >
                          {copiedId === 'new' ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Existing API Keys */}
              <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your API Keys</CardTitle>
                  <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                    {apiKeys?.length || 0} active key{apiKeys?.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : apiKeys?.length === 0 ? (
                    <div className="py-8 text-center">
                      <Key className="mx-auto mb-3 h-12 w-12 opacity-50 text-slate-400" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">No API keys yet. Generate one above to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {apiKeys?.map((key) => (
                        <div
                          key={key.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                                {key.name}
                              </span>
                              {key.isActive ? (
                                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                  Active
                                </span>
                              ) : (
                                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                                  Revoked
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-sm text-slate-500 dark:text-slate-500">
                              {key.keyPrefix}
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-600">
                              Created {new Date(key.createdAt).toLocaleDateString()}
                              {key.lastUsedAt &&
                                ` • Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => revokeKey(key.id)}
                            disabled={!key.isActive}
                            className="self-start sm:self-center text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* WordPress Integration Info */}
              <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    WordPress Integration
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                    How to use your API key with the Siloq WordPress plugin
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  <ol className="list-inside list-decimal space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    <li>
                      Install the Siloq plugin from the WordPress plugin directory
                    </li>
                    <li>
                      Go to <strong className="text-slate-900 dark:text-slate-200">Settings → Siloq</strong> in your WordPress admin
                    </li>
                    <li>Paste your API key in the &quot;Siloq API Key&quot; field</li>
                    <li>Click &quot;Connect to Siloq&quot;</li>
                    <li>
                      Your WordPress site will now sync with your Siloq — The SEO
                      Architect
                    </li>
                  </ol>
                  <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                    <strong>Tip:</strong> Create separate API keys for production and staging environments for better security.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </DashboardProvider>
  );
}
