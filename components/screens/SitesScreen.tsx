'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Globe,
  Plus,
  Key,
  ChevronLeft,
  Copy,
  Check,
  Trash2,
  Loader2,
  ExternalLink,
  Download,
} from 'lucide-react';

const PLUGIN_DOWNLOAD_URL = 'https://github.com/Siloq-app/siloq-wordpress/releases/download/v1.5.10/siloq-connector-v1.5.10.zip';
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
import { fetchWithAuth } from '@/lib/auth-headers';

interface Site {
  id: number;
  name: string;
  url: string;
  is_active: boolean;
  api_key_count: number;
  page_count: number;
  last_synced_at: string | null;
  created_at: string;
}

interface ApiKey {
  id: number;
  site: number;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  usage_count: number;
}

const BACKEND_API_URL =
  typeof window !== 'undefined'
    ? (
        process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.siloq.ai'
      ).replace(/\/+$/, '')
    : 'https://api.siloq.ai';

interface SitesScreenProps {
  onSiteCreated?: () => void;
}

export default function SitesScreen({ onSiteCreated }: SitesScreenProps = {}) {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState(true);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [error, setError] = useState('');
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [isCreatingSite, setIsCreatingSite] = useState(false);
  const [showGenerateToken, setShowGenerateToken] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{
    key: string;
    name: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const loadSites = useCallback(async () => {
    setIsLoadingSites(true);
    try {
      const res = await fetchWithAuth('/api/v1/sites');
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(
          `Backend returned ${res.status} ${res.statusText}. ` +
          (text.includes('<!DOCTYPE') || text.includes('<html')
            ? 'Backend is not running or returned an HTML error page.'
            : 'Expected JSON response but got non-JSON content.')
        );
      }
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.detail || 'Failed to load sites');
      setSites(Array.isArray(data) ? data : data.results || []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load sites');
      setSites([]);
    } finally {
      setIsLoadingSites(false);
    }
  }, []);

  const loadApiKeys = useCallback(async (siteId: number) => {
    setIsLoadingKeys(true);
    setError('');
    try {
      const res = await fetchWithAuth(`/api/v1/api-keys?site_id=${siteId}`);
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(
          `Backend returned ${res.status} ${res.statusText}. ` +
          (text.includes('<!DOCTYPE') || text.includes('<html')
            ? 'Backend is not running or returned an HTML error page.'
            : 'Expected JSON response but got non-JSON content.')
        );
      }
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.message || data.detail || 'Failed to load API keys'
        );
      setApiKeys(Array.isArray(data) ? data : data.results || data.keys || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load API keys');
      setApiKeys([]);
    } finally {
      setIsLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  useEffect(() => {
    if (selectedSite) loadApiKeys(selectedSite.id);
  }, [selectedSite, loadApiKeys]);

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Site name validations
    const trimmedName = newSiteName.trim();
    const trimmedUrl = newSiteUrl.trim();
    
    if (!trimmedName && !trimmedUrl) {
      toast.error('Please fill in all required fields', {
        description: 'Site name and URL are required',
      });
      return;
    }
    
    if (!trimmedName) {
      toast.error('Site name is required');
      return;
    }
    
    if (trimmedName.length < 2) {
      toast.error('Site name is too short', {
        description: 'Site name must be at least 2 characters long',
      });
      return;
    }
    
    if (trimmedName.length > 100) {
      toast.error('Site name is too long', {
        description: 'Site name must not exceed 100 characters',
      });
      return;
    }
    
    // Check for invalid characters in site name
    const invalidNameChars = /[<>\"'&]/;
    if (invalidNameChars.test(trimmedName)) {
      toast.error('Invalid characters in site name', {
        description: 'Site name cannot contain < > " \' & characters',
      });
      return;
    }
    
    if (!trimmedUrl) {
      toast.error('Site URL is required');
      return;
    }
    
    // URL must start with http:// or https://
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      toast.error('URL must start with http:// or https://', {
        description: 'Please include the protocol in your URL',
      });
      return;
    }
    
    // URL format validation
    const urlPattern = /^(https?:\/\/)(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(\/.*)?$/i;
    if (!urlPattern.test(trimmedUrl)) {
      toast.error('Please enter a valid URL', {
        description: 'URL format is invalid. Example: https://example.com',
      });
      return;
    }
    
    // Check for spaces in URL
    if (trimmedUrl.includes(' ')) {
      toast.error('URL cannot contain spaces');
      return;
    }
    
    setIsCreatingSite(true);
    try {
      const res = await fetchWithAuth('/api/v1/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          url: trimmedUrl,
        }),
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(
          `Backend returned ${res.status} ${res.statusText}. ` +
          (text.includes('<!DOCTYPE') || text.includes('<html')
            ? 'Backend is not running or returned an HTML error page.'
            : 'Expected JSON response but got non-JSON content.')
        );
      }
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.message ||
            data.detail ||
            data.url?.[0] ||
            'Failed to create site'
        );
      setShowAddSite(false);
      setNewSiteName('');
      setNewSiteUrl('');
      toast.success('Site added successfully!');
      loadSites();
      onSiteCreated?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create site');
    } finally {
      setIsCreatingSite(false);
    }
  };

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Token name validation
    const trimmedTokenName = newTokenName.trim();
    
    if (!selectedSite) {
      toast.error('No site selected', {
        description: 'Please select a site first',
      });
      return;
    }
    
    if (!trimmedTokenName) {
      toast.error('Token name is required');
      return;
    }
    
    if (trimmedTokenName.length < 2) {
      toast.error('Token name is too short', {
        description: 'Token name must be at least 2 characters long',
      });
      return;
    }
    
    if (trimmedTokenName.length > 50) {
      toast.error('Token name is too long', {
        description: 'Token name must not exceed 50 characters',
      });
      return;
    }
    
    // Check for invalid characters in token name
    const invalidTokenChars = /[<>\"'&]/;
    if (invalidTokenChars.test(trimmedTokenName)) {
      toast.error('Invalid characters in token name', {
        description: 'Token name cannot contain < > " \' & characters',
      });
      return;
    }
    
    setIsGeneratingToken(true);
    setNewlyCreatedKey(null);
    try {
      const res = await fetchWithAuth('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: selectedSite.id,
          name: trimmedTokenName,
        }),
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(
          `Backend returned ${res.status} ${res.statusText}. ` +
          (text.includes('<!DOCTYPE') || text.includes('<html')
            ? 'Backend is not running or returned an HTML error page.'
            : 'Expected JSON response but got non-JSON content.')
        );
      }
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.message || data.error || data.detail || 'Failed to create token'
        );
      const fullKey = data.key?.key ?? data.key;
      if (fullKey) {
        setNewlyCreatedKey({ key: fullKey, name: trimmedTokenName });
        setNewTokenName('');
        setShowGenerateToken(false);
        toast.success('API key generated successfully!');
        loadApiKeys(selectedSite.id);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create token');
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleRevokeKey = async (keyId: number) => {
    try {
      const res = await fetchWithAuth(`/api/v1/api-keys/${keyId}`, {
        method: 'DELETE',
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(
          `Backend returned ${res.status} ${res.statusText}. ` +
          (text.includes('<!DOCTYPE') || text.includes('<html')
            ? 'Backend is not running or returned an HTML error page.'
            : 'Expected JSON response but got non-JSON content.')
        );
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.detail || 'Failed to revoke');
      }
      toast.success('API key revoked');
      if (selectedSite) loadApiKeys(selectedSite.id);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to revoke API key');
    }
  };

  const handleDeleteSite = async (siteId: number) => {
    toast.info('Deleting site...');
    try {
      const res = await fetchWithAuth(`/api/v1/sites/${siteId}`, {
        method: 'DELETE',
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(
          `Backend returned ${res.status} ${res.statusText}. ` +
          (text.includes('<!DOCTYPE') || text.includes('<html')
            ? 'Backend is not running or returned an HTML error page.'
            : 'Expected JSON response but got non-JSON content.')
        );
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.detail || 'Failed to delete site');
      }
      toast.success('Site deleted successfully');
      setSelectedSite(null);
      loadSites();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete site');
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (selectedSite) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSite(null);
              setNewlyCreatedKey(null);
              setShowGenerateToken(false);
            }}
            className="hover:text-foreground text-gray-600 dark:text-gray-400"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to sites
          </Button>
        </div>
        <Card className="bg-card border-border rounded-lg border">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Globe className="h-4 w-4" />
                  {selectedSite.name}
                </CardTitle>
                <CardDescription className="truncate font-mono text-xs text-slate-700 dark:text-slate-500">
                  <a
                    href={selectedSite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 font-mono hover:underline"
                  >
                    {selectedSite.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardDescription>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Delete "${selectedSite.name}" and all its API keys? This cannot be undone.`)) {
                    handleDeleteSite(selectedSite.id);
                  }
                }}
                className="focus-visible:ring-ring inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
        </Card>

        <Card className={`rounded-lg border ${selectedSite.page_count === 0 ? 'border-blue-400 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-950/30 ring-2 ring-blue-200 dark:ring-blue-800' : 'bg-card border-border'}`}>
          <CardHeader className="p-4">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Download className="h-4 w-4" />
                {selectedSite.page_count === 0 ? 'Get Started — Connect Your WordPress Site' : 'WordPress Plugin'}
              </CardTitle>
              {selectedSite.page_count === 0 && (
                <CardDescription className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Follow these steps to connect your site and start syncing content.
                </CardDescription>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-4">
              {/* Step 1: Download */}
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Download the Siloq plugin</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">WordPress plugin (.zip file) — installs in seconds</p>
                  <a
                    href={PLUGIN_DOWNLOAD_URL}
                    download
                    className="mt-2 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    Download Plugin (.zip)
                  </a>
                </div>
              </div>

              {/* Step 2: Install */}
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">2</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Install it in WordPress</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Go to <strong>Plugins → Add New → Upload Plugin</strong>, select the zip, and click <strong>Install Now</strong>. Then activate it.</p>
                </div>
              </div>

              {/* Step 3: API Key */}
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">3</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Enter your API key and click &quot;Test Connection&quot;</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">In WordPress, go to <strong>Settings → Siloq</strong>, paste your API key (generate one below), and test the connection.</p>
                </div>
              </div>

              {/* Step 4: Sync */}
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">4</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Sync your pages</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Click &quot;Sync Now&quot; in the plugin to push your pages to Siloq. You&apos;re all set!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-lg border">
          <CardHeader className="p-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Key className="h-4 w-4" />
                  API keys for this site:
                </CardTitle>
                <CardDescription className="truncate font-mono text-xs text-slate-700 dark:text-slate-500">
                  Tokens are per site. Use one token per WordPress site in the
                  plugin (Settings → Siloq). API URL: {BACKEND_API_URL}/api/v1
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setShowGenerateToken(true);
                  setNewlyCreatedKey(null);
                  setError('');
                }}
              >
                <Plus className="mr-2 h-5 w-5" />
                Generate new token
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4 w-1/2">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                <strong>Error</strong> — {error}
              </div>
            )}

            {newlyCreatedKey && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" clipRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                  </svg>
                  Copy your token now — it won&apos;t be shown again
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="bg-muted break-all rounded px-2 py-1 font-mono text-xs">
                    {newlyCreatedKey.key}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyKey(newlyCreatedKey.key)}
                  >
                    {copiedKey ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {showGenerateToken && (
              <form
                onSubmit={handleGenerateToken}
                className="bg-muted/50 flex items-end gap-2 rounded-lg p-3"
              >
                <div className="flex-1">
                  <Label htmlFor="token-name" className="text-sm">
                    Token name
                  </Label>
                  <Input
                    id="token-name"
                    placeholder="e.g. WordPress production"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isGeneratingToken}
                  className="focus-visible:ring-ring ml-auto flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                >
                  {isGeneratingToken ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Generate'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateToken(false)}
                  className="focus-visible:ring-ring inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </form>
            )}

            {isLoadingKeys ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-600 dark:text-gray-400" />
              </div>
            ) : apiKeys.length === 0 ? (
              <p className="py-4 text-sm text-gray-600 dark:text-gray-400">
                No tokens for this site yet. Generate one and use it only in
                this site&apos;s WordPress plugin.
              </p>
            ) : (
              <ul className="space-y-2">
                {apiKeys.map((key) => (
                  <li
                    key={key.id}
                    className={`border-border flex items-center justify-between rounded-lg border p-3 ${
                      key.is_active
                        ? 'bg-card'
                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          key.is_active ? '' : 'text-gray-500 line-through'
                        }`}>{key.name}</span>
                        <span className={`font-mono text-sm ${
                          key.is_active
                            ? 'text-gray-600 dark:text-gray-400'
                            : 'text-gray-400 dark:text-gray-500 line-through'
                        }`}>
                          {key.key_prefix}
                        </span>
                        {!key.is_active && (
                          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                            Revoked
                          </span>
                        )}
                      </div>
                      <div className="truncate font-mono text-xs text-slate-700 dark:text-slate-500">
                        Created {new Date(key.created_at).toLocaleDateString()}
                        {key.last_used_at &&
                          ` • Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      disabled={!key.is_active}
                      className="focus-visible:ring-ring inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Sites
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Connect multiple WordPress sites. Each site has its own tokens —
            generate keys per site (like GitHub).
          </p>
        </div>
        <button
          onClick={() => setShowAddSite(true)}
          className="focus-visible:ring-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
        >
          Add site
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <strong>Error</strong> — {error}
        </div>
      )}

      {showAddSite && (
        <Card className="bg-card border-border rounded-lg border">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold">
              Add WordPress site
            </CardTitle>
            <CardDescription className="truncate font-mono text-xs text-slate-700 dark:text-slate-500">
              You can connect multiple sites. Each site gets its own API keys —
              add as many sites as you need.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleAddSite} className="space-y-3 w-1/2">
              <div className="space-y-1.5">
                <Label htmlFor="site-name" className="text-sm">
                  Site name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="site-name"
                  placeholder="e.g. My Blog"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="site-url" className="text-sm">
                  Site URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="site-url"
                  type="url"
                  placeholder="https://example.com"
                  value={newSiteUrl}
                  onChange={(e) => setNewSiteUrl(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Must start with http:// or https://
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isCreatingSite}
                  className="focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50"
                >
                  {isCreatingSite ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Add site'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSite(false)}
                  className="focus-visible:ring-ring inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border rounded-lg border">
        <CardContent className="p-4">
          {isLoadingSites ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-600 dark:text-gray-400" />
            </div>
          ) : sites.length === 0 ? (
            <div className="py-8 text-center text-gray-600 dark:text-gray-400">
              <Globe className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="text-sm">
                No sites yet. Add a site to get site-specific API keys for the
                WordPress plugin.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {sites.map((site) => (
                <li key={site.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedSite(site)}
                    className="hover:bg-muted/50 border-border bg-card flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
                        <Globe className="text-primary h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-foreground text-sm font-medium">
                          {site.name}
                        </span>
                        <p className="font-mono truncate font-mono text-xs text-slate-700 dark:text-slate-500">
                          {site.url}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums text-gray-600 dark:text-gray-400">
                        {site.api_key_count} key
                        {site.api_key_count !== 1 ? 's' : ''}
                      </span>
                      <Key className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
