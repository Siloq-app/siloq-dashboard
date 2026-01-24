'use client'

import { useParams } from 'next/navigation'
import { useSite, usePages } from '@/lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  ArrowLeft,
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  ExternalLink,
  Target,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Page, CannibalizationIssue } from '@/lib/types'
import { ComplianceBadge } from '@/components/dashboard/compliance-badge'
import { formatRelativeTime } from '@/lib/utils'

function PageRow({ page }: { page: Page }) {
  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-4">
        <div>
          <div className="font-medium">{page.title}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <a 
              href={page.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {page.path}
            </a>
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      </td>
      <td className="p-4">
        <Badge variant="outline">{page.pageType}</Badge>
      </td>
      <td className="p-4">
        <ComplianceBadge status={page.complianceStatus} />
      </td>
      <td className="p-4 text-sm text-muted-foreground">
        {page.siloId ? `Silo ${page.siloId.substring(0, 8)}...` : '—'}
      </td>
      <td className="p-4 text-sm">
        {formatRelativeTime(page.lastModified)}
      </td>
      <td className="p-4">
        <Link href={`/dashboard/sites/${page.siteId}/pages/${page.id}`}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      </td>
    </tr>
  )
}

function CannibalizationPanel({ pages }: { pages: Page[] }) {
  // Mock cannibalization issues - in real app, this would come from API
  const issues: CannibalizationIssue[] = pages
    .filter(p => p.cannibalizationIssues && p.cannibalizationIssues.length > 0)
    .flatMap(p => p.cannibalizationIssues || [])

  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Cannibalization Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No keyword conflicts detected</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          Cannibalization Detection
        </CardTitle>
        <CardDescription>
          Keyword conflicts found across pages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {issues.map((issue, index) => (
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
                  {issue.conflictingPages.map((pageId, idx) => {
                    const page = pages.find(p => p.id === pageId)
                    return (
                      <div key={idx} className="text-sm text-muted-foreground">
                        • {page?.title || pageId}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function PagesPage() {
  const params = useParams()
  const siteId = params.siteId as string
  const { data: site } = useSite(siteId)
  const { data: pages, isLoading } = usePages(siteId)
  const [searchQuery, setSearchQuery] = useState('')
  const [complianceFilter, setComplianceFilter] = useState<string>('all')

  const filteredPages = pages?.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         page.path.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCompliance = complianceFilter === 'all' || page.complianceStatus === complianceFilter
    return matchesSearch && matchesCompliance
  }) || []

  const complianceStats = {
    compliant: pages?.filter(p => p.complianceStatus === 'compliant').length || 0,
    warning: pages?.filter(p => p.complianceStatus === 'warning').length || 0,
    violation: pages?.filter(p => p.complianceStatus === 'violation').length || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/sites/${siteId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Page Governance
          </h1>
          <p className="text-muted-foreground mt-1">
            View all pages and their compliance status
          </p>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compliant</CardDescription>
            <CardTitle className="text-2xl text-green-600">{complianceStats.compliant}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Warnings</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{complianceStats.warning}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Violations</CardDescription>
            <CardTitle className="text-2xl text-red-600">{complianceStats.violation}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">All Pages</TabsTrigger>
          <TabsTrigger value="cannibalization">Cannibalization</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pages</CardTitle>
                  <CardDescription>
                    {filteredPages.length} page(s) found
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search pages..."
                      className="pl-8 w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={complianceFilter}
                    onChange={(e) => setComplianceFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="compliant">Compliant</option>
                    <option value="warning">Warning</option>
                    <option value="violation">Violation</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredPages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Page</th>
                        <th className="text-left p-4 font-medium">Type</th>
                        <th className="text-left p-4 font-medium">Compliance</th>
                        <th className="text-left p-4 font-medium">Silo</th>
                        <th className="text-left p-4 font-medium">Last Modified</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPages.map((page) => (
                        <PageRow key={page.id} page={page} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pages found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cannibalization" className="space-y-4">
          <CannibalizationPanel pages={pages || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
