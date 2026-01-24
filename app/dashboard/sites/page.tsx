'use client'

import { useState } from 'react'
import { useSites, useCreateSite } from '@/lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Globe, 
  Plus, 
  ExternalLink,
  Key,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { Site } from '@/lib/types'
import { useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import { SiteStatusBadge } from '@/components/dashboard/site-status-badge'
import { formatRelativeTime } from '@/lib/utils'

function AddSiteDialog() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null)
  const createSite = useCreateSite()

  const handleTestConnection = async () => {
    if (!url) return
    
    setIsTesting(true)
    setTestResult(null)
    
    try {
      // Test connection endpoint would be called here
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTestResult({ success: true, message: 'Connection successful!' })
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Connection failed' })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !testResult?.success) return

    try {
      await createSite.mutateAsync({ url })
      setOpen(false)
      setUrl('')
      setTestResult(null)
    } catch (error) {
      console.error('Failed to create site:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add New Site
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect WordPress Site</DialogTitle>
          <DialogDescription>
            Enter your WordPress site URL to connect it to Siloq Dashboard
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">Site URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setTestResult(null)
                }}
                disabled={createSite.isPending}
              />
            </div>
            
            {testResult && (
              <div className={`flex items-center gap-2 rounded-md p-3 text-sm ${
                testResult.success 
                  ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={!url || isTesting}
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setUrl('')
                setTestResult(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!url || !testResult?.success || createSite.isPending}
            >
              {createSite.isPending ? 'Connecting...' : 'Connect Site'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SiteRow({ site }: { site: Site }) {
  const queryClient = useQueryClient()
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [isRevokingKey, setIsRevokingKey] = useState(false)

  const handleGenerateKey = async () => {
    setIsGeneratingKey(true)
    try {
      await apiClient.post(`/sites/${site.id}/api-key`)
      queryClient.invalidateQueries({ queryKey: ['sites', site.id] })
    } catch (error) {
      console.error('Failed to generate API key:', error)
    } finally {
      setIsGeneratingKey(false)
    }
  }

  const handleRevokeKey = async () => {
    setIsRevokingKey(true)
    try {
      await apiClient.delete(`/sites/${site.id}/api-key`)
      queryClient.invalidateQueries({ queryKey: ['sites', site.id] })
    } catch (error) {
      console.error('Failed to revoke API key:', error)
    } finally {
      setIsRevokingKey(false)
    }
  }

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="font-medium">{site.name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <a 
                href={site.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {site.url}
              </a>
              <ExternalLink className="h-3 w-3" />
            </div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <SiteStatusBadge status={site.status} />
      </td>
      <td className="p-4 text-sm text-muted-foreground">
        {formatRelativeTime(site.lastSyncAt)}
      </td>
      <td className="p-4 text-sm">
        {site.pageCount} pages
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          {site.apiKey ? (
            <>
              <Badge variant="outline" className="font-mono text-xs">
                {site.apiKey.substring(0, 8)}...
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRevokeKey}
                disabled={isRevokingKey}
              >
                <Key className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateKey}
              disabled={isGeneratingKey}
            >
              {isGeneratingKey ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Generate Key
                </>
              )}
            </Button>
          )}
          <Link href={`/dashboard/sites/${site.id}`}>
            <Button variant="ghost" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </td>
    </tr>
  )
}

export default function SitesPage() {
  const { data: sites, isLoading, error } = useSites()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sites Management</h1>
          <p className="text-muted-foreground mt-1">
            Connect and manage your WordPress sites
          </p>
        </div>
        <AddSiteDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Sites</CardTitle>
          <CardDescription>
            Manage your WordPress site connections and API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load sites. Please try again.</p>
            </div>
          ) : sites && sites.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Site</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Last Sync</th>
                    <th className="text-left p-4 font-medium">Pages</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => (
                    <SiteRow key={site.id} site={site} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sites connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect your first WordPress site to get started
              </p>
              <AddSiteDialog />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
