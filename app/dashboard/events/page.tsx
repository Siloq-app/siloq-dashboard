'use client'

import { useSystemEvents } from '@/lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Activity, Search, Download } from 'lucide-react'
import { useState } from 'react'
import { DonutChart, BarChart } from '@tremor/react'
import { formatRelativeTime } from '@/lib/utils'
import { countToChartData, groupByTime } from '@/lib/chart-utils'

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: events, isLoading } = useSystemEvents()

  const filteredEvents = events?.filter(event =>
    event.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.actor.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // Prepare data for charts
  const eventTypeData = events?.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const eventTypeChartData = countToChartData(eventTypeData)

  // Group events by hour for timeline
  const timelineChartData = events
    ? groupByTime(events, (event) => event.timestamp, 'hour', 24).map((item) => ({
        name: item.name,
        'Events': item.value,
      }))
    : []

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            System Events
          </h1>
          <p className="text-muted-foreground mt-1">
            Audit log viewer for all system activities
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Charts Section */}
      {events && events.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Event Type Distribution</CardTitle>
              <CardDescription>
                Breakdown of events by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={eventTypeChartData}
                category="value"
                index="name"
                colors={['blue', 'cyan', 'indigo', 'violet', 'fuchsia', 'rose', 'orange', 'amber']}
                className="h-64"
                valueFormatter={(value) => `${value} events`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Timeline</CardTitle>
              <CardDescription>
                Events over the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timelineChartData.length > 0 ? (
                <BarChart
                  data={timelineChartData}
                  index="name"
                  categories={['Events']}
                  colors={['blue']}
                  yAxisWidth={40}
                  className="h-64"
                  valueFormatter={(value) => `${value}`}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No timeline data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Events</CardTitle>
              <CardDescription>
                {filteredEvents.length} event(s) found
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                className="pl-8 w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
          ) : filteredEvents.length > 0 ? (
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium">{event.eventType}</span>
                      <span className="text-sm text-muted-foreground">
                        by {event.actor}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {event.resourceType}: {event.resourceId}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatRelativeTime(event.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
