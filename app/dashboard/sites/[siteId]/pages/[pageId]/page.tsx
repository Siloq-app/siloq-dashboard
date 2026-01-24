'use client'

import { useParams } from 'next/navigation'
import { useSite, usePage } from '@/lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Shield,
  AlertCircle,
  ExternalLink,
  Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'
import { ComplianceBadge } from '@/components/dashboard/compliance-badge'
import { formatRelativeTime } from '@/lib/utils'

export default function PageDetailPage() {
  const params = useParams()
  const siteId = params.siteId as string
  const pageId = params.pageId as string
  const { data: site } = useSite(siteId)
  const { data: page, isLoading } = usePage(pageId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (!page) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Page not found</h3>
        <Link href={`/dashboard/sites/${siteId}/pages`}>
          <Button variant="outline">Back to Pages</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/sites/${siteId}/pages`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            {page.title}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1">
            <a 
              href={page.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {page.path}
            </a>
            <ExternalLink className="h-3 w-3" />
          </p>
        </div>
        <ComplianceBadge status={page.complianceStatus} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Page Type</CardDescription>
            <CardTitle className="text-2xl">{page.pageType}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compliance Status</CardDescription>
            <CardTitle className="text-2xl">
              <ComplianceBadge status={page.complianceStatus} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last Modified</CardDescription>
            <CardTitle className="text-lg">
              {formatRelativeTime(page.lastModified)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="cannibalization">Cannibalization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Title</p>
                <p>{page.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">URL</p>
                <a 
                  href={page.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {page.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Silo Assignment</p>
                <p className="text-muted-foreground">
                  {page.siloId ? `Silo ${page.siloId.substring(0, 8)}...` : 'Not assigned'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entity Coverage</CardTitle>
              <CardDescription>
                Entities mentioned on this page
              </CardDescription>
            </CardHeader>
            <CardContent>
              {page.entities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {page.entities.map((entity) => (
                    <Badge key={entity} variant="secondary">
                      {entity}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No entities assigned</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Inbound Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{page.inboundLinks}</div>
                <p className="text-sm text-muted-foreground">
                  Pages linking to this page
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Outbound Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{page.outboundLinks}</div>
                <p className="text-sm text-muted-foreground">
                  Links from this page
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cannibalization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cannibalization Check</CardTitle>
              <CardDescription>
                Keyword conflict analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {page.cannibalizationIssues && page.cannibalizationIssues.length > 0 ? (
                <div className="space-y-4">
                  {page.cannibalizationIssues.map((issue, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">Keyword: {issue.keyword}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {issue.conflictingPages.length} conflicting page(s)
                          </p>
                        </div>
                        {issue.suggestedKing && (
                          <Badge variant="outline">King: {issue.suggestedKing}</Badge>
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Conflicting Pages:</p>
                        <div className="space-y-1">
                          {issue.conflictingPages.map((pageId, idx) => (
                            <div key={idx} className="text-sm text-muted-foreground">
                              • {pageId}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No cannibalization issues detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
