'use client'

import { useParams } from 'next/navigation'
import { useSite, usePages } from '@/lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Globe, 
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { ComplianceBadge } from '@/components/dashboard/compliance-badge'
import { formatRelativeTime } from '@/lib/utils'

export default function SiteDetailPage() {
  const params = useParams()
  const siteId = params.siteId as string
  const { data: site, isLoading: siteLoading } = useSite(siteId)
  const { data: pages, isLoading: pagesLoading } = usePages(siteId)

  if (siteLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (!site) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Site not found</h3>
        <Link href="/dashboard/sites">
          <Button variant="outline">Back to Sites</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sites">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8" />
            {site.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {site.url}
            </a>
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Now
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
            <CardTitle className="text-2xl">
              {site.status === 'connected' ? 'Connected' : 
               site.status === 'syncing' ? 'Syncing' :
               site.status === 'error' ? 'Error' : 'Disconnected'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Silo Health</CardDescription>
            <CardTitle className="text-2xl">{site.siloHealthScore}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pages</CardDescription>
            <CardTitle className="text-2xl">{site.pageCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Jobs</CardDescription>
            <CardTitle className="text-2xl">{site.activeContentJobs}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Pages</CardTitle>
              <CardDescription>
                View and manage pages from this site
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pagesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : pages && pages.length > 0 ? (
                <div className="space-y-2">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{page.title}</h4>
                          <ComplianceBadge status={page.complianceStatus} />
                          <Badge variant="outline">{page.pageType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{page.path}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {formatRelativeTime(page.lastModified)}
                        </div>
                        <Link href={`/dashboard/sites/${siteId}/pages/${page.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No pages found. Sync the site to load pages.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
              <CardDescription>
                Configure sync settings and connection options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Last Sync</p>
                <p className="text-sm text-muted-foreground">
                  {site.lastSyncAt 
                    ? formatRelativeTime(site.lastSyncAt)
                    : 'Never synced'}
                </p>
              </div>
              {site.syncError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Sync Error: {site.syncError}</span>
                  </div>
                </div>
              )}
              <div>
                <Button variant="destructive">Disconnect Site</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
