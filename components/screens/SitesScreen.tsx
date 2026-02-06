'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Globe,
  Plus,
  Key,
  ChevronLeft,
  Copy,
  Check,
  Trash2,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { fetchWithAuth } from '@/lib/auth-headers'

interface Site {
  id: number
  name: string
  url: string
  is_active: boolean
  api_key_count: number
  page_count: number
  last_synced_at: string | null
  created_at: string
}

interface ApiKey {
  id: number
  site: number
  name: string
  key_prefix: string
  is_active: boolean
  created_at: string
  last_used_at: string | null
  usage_count: number
}

const BACKEND_API_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
    : ''

export default function SitesScreen() {
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoadingSites, setIsLoadingSites] = useState(true)
  const [isLoadingKeys, setIsLoadingKeys] = useState(false)
  const [error, setError] = useState('')
  const [showAddSite, setShowAddSite] = useState(false)
  const [newSiteName, setNewSiteName] = useState('')
  const [newSiteUrl, setNewSiteUrl] = useState('')
  const [isCreatingSite, setIsCreatingSite] = useState(false)
  const [showGenerateToken, setShowGenerateToken] = useState(false)
  const [newTokenName, setNewTokenName] = useState('')
  const [isGeneratingToken, setIsGeneratingToken] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ key: string; name: string } | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)

  const loadSites = useCallback(async () => {
    setIsLoadingSites(true)
    setError('')
    try {
      const res = await fetchWithAuth('/api/v1/sites')
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load sites')
      setSites(Array.isArray(data) ? data : data.results || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load sites')
      setSites([])
    } finally {
      setIsLoadingSites(false)
    }
  }, [])

  const loadApiKeys = useCallback(async (siteId: number) => {
    setIsLoadingKeys(true)
    setError('')
    try {
      const res = await fetchWithAuth(`/api/v1/api-keys?site_id=${siteId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.detail || 'Failed to load API keys')
      setApiKeys(Array.isArray(data) ? data : data.results || data.keys || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load API keys')
      setApiKeys([])
    } finally {
      setIsLoadingKeys(false)
    }
  }, [])

  useEffect(() => {
    loadSites()
  }, [loadSites])

  useEffect(() => {
    if (selectedSite) loadApiKeys(selectedSite.id)
  }, [selectedSite, loadApiKeys])

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSiteName.trim() || !newSiteUrl.trim()) {
      setError('Name and URL are required')
      return
    }
    setIsCreatingSite(true)
    setError('')
    try {
      const res = await fetchWithAuth('/api/v1/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSiteName.trim(), url: newSiteUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.detail || data.url?.[0] || 'Failed to create site')
      setShowAddSite(false)
      setNewSiteName('')
      setNewSiteUrl('')
      loadSites()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create site')
    } finally {
      setIsCreatingSite(false)
    }
  }

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSite || !newTokenName.trim()) return
    setIsGeneratingToken(true)
    setError('')
    setNewlyCreatedKey(null)
    try {
      const res = await fetchWithAuth('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: selectedSite.id, name: newTokenName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || data.detail || 'Failed to create token')
      const fullKey = data.key?.key ?? data.key
      if (fullKey) {
        setNewlyCreatedKey({ key: fullKey, name: newTokenName.trim() })
        setNewTokenName('')
        setShowGenerateToken(false)
        loadApiKeys(selectedSite.id)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create token')
    } finally {
      setIsGeneratingToken(false)
    }
  }

  const handleRevokeKey = async (keyId: number) => {
    if (!confirm('Revoke this API key? It will stop working immediately.')) return
    setError('')
    try {
      const res = await fetchWithAuth(`/api/v1/api-keys/${keyId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || data.detail || 'Failed to revoke')
      }
      if (selectedSite) loadApiKeys(selectedSite.id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to revoke key')
    }
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  if (selectedSite) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSite(null)
              setNewlyCreatedKey(null)
              setShowGenerateToken(false)
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to sites
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {selectedSite.name}
            </CardTitle>
            <CardDescription>
              <a
                href={selectedSite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                {selectedSite.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API keys for this site
                </CardTitle>
                <CardDescription>
                  Tokens are per site. Use one token per WordPress site in the plugin (Settings → Siloq). API URL: {BACKEND_API_URL}/api/v1
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setShowGenerateToken(true)
                  setNewlyCreatedKey(null)
                  setError('')
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate new token
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {newlyCreatedKey && (
              <Alert className="border-amber-500/50 bg-amber-500/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Copy your token now — it won&apos;t be shown again</AlertTitle>
                <AlertDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 text-sm font-mono break-all bg-muted px-2 py-1 rounded">
                      {newlyCreatedKey.key}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyKey(newlyCreatedKey.key)}
                    >
                      {copiedKey ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {showGenerateToken && (
              <form onSubmit={handleGenerateToken} className="flex gap-2 items-end p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="token-name">Token name</Label>
                  <Input
                    id="token-name"
                    placeholder="e.g. WordPress production"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button type="submit" disabled={isGeneratingToken}>
                  {isGeneratingToken ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowGenerateToken(false)}>
                  Cancel
                </Button>
              </form>
            )}

            {isLoadingKeys ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : apiKeys.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                No tokens for this site yet. Generate one and use it only in this site&apos;s WordPress plugin.
              </p>
            ) : (
              <ul className="space-y-2">
                {apiKeys.map((key) => (
                  <li
                    key={key.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div>
                      <span className="font-medium">{key.name}</span>
                      <span className="text-muted-foreground text-sm ml-2 font-mono">{key.key_prefix}</span>
                      <div className="text-xs text-muted-foreground mt-1">
                        Created {new Date(key.created_at).toLocaleDateString()}
                        {key.last_used_at && ` • Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeKey(key.id)}
                      disabled={!key.is_active}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sites</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Connect multiple WordPress sites. Each site has its own tokens — generate keys per site (like GitHub).
          </p>
        </div>
        <Button onClick={() => setShowAddSite(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add site
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showAddSite && (
        <Card>
          <CardHeader>
            <CardTitle>Add WordPress site</CardTitle>
            <CardDescription>
              You can connect multiple sites. Each site gets its own API keys — add as many sites as you need.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSite} className="space-y-4">
              <div>
                <Label htmlFor="site-name">Site name</Label>
                <Input
                  id="site-name"
                  placeholder="e.g. My Blog"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="site-url">Site URL</Label>
                <Input
                  id="site-url"
                  type="url"
                  placeholder="https://example.com"
                  value={newSiteUrl}
                  onChange={(e) => setNewSiteUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isCreatingSite}>
                  {isCreatingSite ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add site'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowAddSite(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {isLoadingSites ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sites.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sites yet. Add a site to get site-specific API keys for the WordPress plugin.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {sites.map((site) => (
                <li key={site.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedSite(site)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium">{site.name}</span>
                        <p className="text-sm text-muted-foreground">{site.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {site.api_key_count} key{site.api_key_count !== 1 ? 's' : ''}
                      </span>
                      <Key className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
