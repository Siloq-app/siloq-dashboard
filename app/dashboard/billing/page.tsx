'use client'

import { useBillingUsage } from '@/lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, TrendingUp, Zap, FileText } from 'lucide-react'
import { DonutChart, BarChart, ProgressBar } from '@tremor/react'
import { countToChartData } from '@/lib/chart-utils'

export default function BillingPage() {
  const { data: usage, isLoading } = useBillingUsage()

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Billing & Usage
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys and track costs
          </p>
        </div>
        <Button>Upgrade Plan</Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-32 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : usage ? (
        <>
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {usage.plan}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Active subscription
                  </p>
                </div>
                <Button variant="outline">Change Plan</Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Meters */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sites</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usage.sitesUsed} / {usage.sitesLimit}
                </div>
                <ProgressBar
                  value={(usage.sitesUsed / usage.sitesLimit) * 100}
                  className="mt-2"
                  color="blue"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {((usage.sitesUsed / usage.sitesLimit) * 100).toFixed(1)}% of limit used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Tokens</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usage.tokensConsumed.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Consumed this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Jobs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usage.contentJobsThisMonth}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* API Key Management */}
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>
                Configure your OpenAI/Anthropic API keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">BYOK Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Use your own API keys (no 5% fee)
                  </p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Siloq Managed</p>
                  <p className="text-sm text-muted-foreground">
                    We manage API keys (5% service fee)
                  </p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cost by Site</CardTitle>
                <CardDescription>
                  Usage costs distributed across sites
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(usage.costBreakdown.bySite).length > 0 ? (
                  <DonutChart
                    data={countToChartData(usage.costBreakdown.bySite).map((item) => ({
                      ...item,
                      value: Number(item.value.toFixed(2)),
                    }))}
                    category="value"
                    index="name"
                    colors={['blue', 'cyan', 'indigo', 'violet', 'fuchsia', 'rose', 'orange']}
                    className="h-64"
                    valueFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No cost data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost by Job Type</CardTitle>
                <CardDescription>
                  Usage costs by content job type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(usage.costBreakdown.byJobType).length > 0 ? (
                  <BarChart
                    data={countToChartData(usage.costBreakdown.byJobType).map((item) => ({
                      name: item.name,
                      'Cost': Number(item.value.toFixed(2)),
                    }))}
                    index="name"
                    categories={['Cost']}
                    colors={['blue']}
                    yAxisWidth={60}
                    className="h-64"
                    valueFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No cost data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Unable to load billing information</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
