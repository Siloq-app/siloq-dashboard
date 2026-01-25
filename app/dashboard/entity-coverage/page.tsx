'use client'

import { useState } from 'react'
import { useEntities, useEntityCoverage, useSites } from '@/lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Map, Search, Filter, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { DonutChart, BarChart, AreaChart } from '@tremor/react'
import { countToChartData } from '@/lib/chart-utils'
import Link from 'next/link'

export default function EntityCoveragePage() {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all')

  const { data: sites } = useSites()
  const { data: entities, isLoading: entitiesLoading } = useEntities(selectedSiteId || undefined)
  const { data: coverage, isLoading: coverageLoading } = useEntityCoverage(selectedSiteId || undefined)

  const filteredEntities = entities?.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = entityTypeFilter === 'all' || entity.type === entityTypeFilter
    return matchesSearch && matchesType
  }) || []

  // Prepare chart data
  const entityTypeData = entities?.reduce((acc, entity) => {
    acc[entity.type] = (acc[entity.type] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const entityTypeChartData = countToChartData(entityTypeData, (key) => 
    key.charAt(0).toUpperCase() + key.slice(1)
  )

  const coverageData = coverage?.map(item => ({
    name: item.entity.name,
    'Coverage': item.coveragePercentage,
  })) || []

  const topEntitiesByPages = entities
    ?.map(entity => ({
      name: entity.name,
      value: entity.pages.length,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) || []

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Map className="h-8 w-8" />
            Entity Coverage Map
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize entity distribution across your sites
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entities..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
              >
                <option value="">All Sites</option>
                {sites?.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-48">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="brand">Brand</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="location">Location</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entities?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {filteredEntities.length} visible
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Coverage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coverage && coverage.length > 0
                ? Math.round(coverage.reduce((sum, item) => sum + item.coveragePercentage, 0) / coverage.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across entities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Well Covered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coverage?.filter(item => item.coveragePercentage >= 80).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              ≥80% coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coverage?.filter(item => item.coveragePercentage < 50).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              &lt;50% coverage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {(entitiesLoading || coverageLoading) ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-64 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Entity Type Distribution</CardTitle>
              <CardDescription>Breakdown by entity type</CardDescription>
            </CardHeader>
            <CardContent>
              {entityTypeChartData.length > 0 ? (
                <DonutChart
                  data={entityTypeChartData}
                  category="value"
                  index="name"
                  colors={['blue', 'cyan', 'indigo', 'violet']}
                  className="h-64"
                  valueFormatter={(value) => `${value} entities`}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coverage by Entity</CardTitle>
              <CardDescription>Coverage percentage for each entity</CardDescription>
            </CardHeader>
            <CardContent>
              {coverageData.length > 0 ? (
                <AreaChart
                  data={coverageData}
                  index="name"
                  categories={['Coverage']}
                  colors={['blue']}
                  yAxisWidth={60}
                  className="h-64"
                  valueFormatter={(value) => `${value}%`}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No coverage data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Entities */}
      {topEntitiesByPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Entities by Page Count</CardTitle>
            <CardDescription>Entities with the most page coverage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topEntitiesByPages.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <Badge variant="secondary">{item.value} pages</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entity List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Entities</CardTitle>
              <CardDescription>
                {filteredEntities.length} entity(s) found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {entitiesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredEntities.length > 0 ? (
            <div className="space-y-2">
              {filteredEntities.map((entity) => {
                const entityCoverage = coverage?.find(c => c.entity.id === entity.id)
                return (
                  <div
                    key={entity.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium">{entity.name}</span>
                        <Badge variant="outline">{entity.type}</Badge>
                        {entityCoverage && (
                          <Badge
                            variant={entityCoverage.coveragePercentage >= 80 ? 'default' : entityCoverage.coveragePercentage >= 50 ? 'secondary' : 'destructive'}
                          >
                            {entityCoverage.coveragePercentage}% coverage
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {entity.pages.length} page(s) • Coverage score: {entity.coverageScore}/100
                      </div>
                      {entityCoverage && entityCoverage.gaps.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Gaps: {entityCoverage.gaps.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No entities found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
