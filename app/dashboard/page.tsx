'use client'

import { useSites } from '@/lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Globe, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Plus,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { Site } from '@/lib/types'
import { DonutChart, BarChart, BarList } from '@tremor/react'
import { SiteStatusBadge } from '@/components/dashboard/site-status-badge'
import { formatRelativeTime, getHealthScoreColor } from '@/lib/utils'
import { countToChartData } from '@/lib/chart-utils'

function SiteCard({ site }: { site: Site }) {

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {site.name}
            </CardTitle>
            <CardDescription className="mt-1">
              <a 
                href={site.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                {site.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </div>
          <SiteStatusBadge status={site.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Silo Health</p>
              <p className={`text-2xl font-bold ${getHealthScoreColor(site.siloHealthScore)}`}>
                {site.siloHealthScore}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
              <p className="text-2xl font-bold">{site.activeContentJobs}</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Sync</span>
              <span>
                {formatRelativeTime(site.lastSyncAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pages</span>
              <span>{site.pageCount}</span>
            </div>
          </div>

          {site.syncError && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{site.syncError}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Link href={`/dashboard/sites/${site.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </Link>
            <Link href={`/dashboard/sites/${site.id}/planner`}>
              <Button variant="default">
                Plan Silo
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: sites, isLoading, error } = useSites()

  const systemAlerts = sites?.filter(site => 
    site.status === 'error' || site.siloHealthScore < 60
  ) || []

  const totalActiveJobs = sites?.reduce((sum, site) => sum + site.activeContentJobs, 0) || 0
  const avgHealthScore = sites?.length 
    ? Math.round(sites.reduce((sum, site) => sum + site.siloHealthScore, 0) / sites.length)
    : 0

  // Prepare data for Tremor charts
  const statusData = sites?.reduce((acc, site) => {
    acc[site.status] = (acc[site.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const statusChartData = countToChartData(statusData, (key) => 
    key.charAt(0).toUpperCase() + key.slice(1)
  )

  const healthScoreData = sites?.map(site => ({
    name: site.name,
    'Health Score': site.siloHealthScore,
  })) || []

  const topSitesByJobs = sites
    ?.map(site => ({
      name: site.name,
      value: site.activeContentJobs,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of all connected sites and system health
          </p>
        </div>
        <Link href="/dashboard/sites">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Button>
        </Link>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sites?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {sites?.filter(s => s.status === 'connected').length || 0} connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHealthScore}%</div>
            <p className="text-xs text-muted-foreground">
              {avgHealthScore >= 80 ? 'Excellent' : avgHealthScore >= 60 ? 'Good' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveJobs}</div>
            <p className="text-xs text-muted-foreground">
              Content generation in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {sites && sites.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Site Status Distribution</CardTitle>
              <CardDescription>Breakdown of site connection status</CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={statusChartData}
                category="value"
                index="name"
                colors={['emerald', 'amber', 'red', 'slate']}
                className="h-64"
                valueFormatter={(value) => `${value} sites`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health Scores by Site</CardTitle>
              <CardDescription>Individual site health metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={healthScoreData}
                index="name"
                categories={['Health Score']}
                colors={['emerald']}
                yAxisWidth={60}
                className="h-64"
                valueFormatter={(value) => `${value}%`}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Sites by Active Jobs */}
      {topSitesByJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Sites by Active Jobs</CardTitle>
            <CardDescription>Sites with the most content generation in progress</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              data={topSitesByJobs}
              className="mt-2"
              valueFormatter={(value) => `${value} jobs`}
            />
          </CardContent>
        </Card>
      )}

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              System Alerts
            </CardTitle>
            <CardDescription>
              Issues requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {systemAlerts.map((site) => (
                <div key={site.id} className="flex items-center justify-between rounded-md bg-yellow-50 dark:bg-yellow-950 p-3">
                  <div>
                    <p className="font-medium">{site.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {site.status === 'error' 
                        ? `Sync error: ${site.syncError || 'Unknown error'}`
                        : `Low health score: ${site.siloHealthScore}%`}
                    </p>
                  </div>
                  <Link href={`/dashboard/sites/${site.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sites Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Connected Sites</h2>
          <Link href="/dashboard/sites">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Failed to load sites. Please try again.</p>
              </div>
            </CardContent>
          </Card>
        ) : sites && sites.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No sites connected</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by connecting your first WordPress site
                </p>
                <Link href="/dashboard/sites">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Site
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
