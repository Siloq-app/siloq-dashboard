'use client'

import { useState } from 'react'
import { useRestorationQueue, useCreateRestorationJob, useCancelRestorationJob, useSites } from '@/lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  RefreshCw, 
  Plus, 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play,
  Pause,
  Trash2
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { DonutChart, BarChart } from '@tremor/react'
import { countToChartData } from '@/lib/chart-utils'

function RestorationJobCard({ job, onCancel }: { job: any; onCancel: (id: string) => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-blue-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              {job.siteName}
            </CardTitle>
            <CardDescription className="mt-1">
              Job ID: {job.id.slice(0, 8)}...
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityColor(job.priority)}>
              {job.priority}
            </Badge>
            <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
              {job.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          {job.status === 'in_progress' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">{job.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(job.status)}`}
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Pages to Restore</p>
              <p className="font-medium">{job.pagesToRestore}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pages Restored</p>
              <p className="font-medium">{job.pagesRestored}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatRelativeTime(job.createdAt)}</span>
            </div>
            {job.startedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started</span>
                <span>{formatRelativeTime(job.startedAt)}</span>
              </div>
            )}
            {job.completedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span>{formatRelativeTime(job.completedAt)}</span>
              </div>
            )}
            {job.estimatedCompletion && job.status === 'in_progress' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Completion</span>
                <span>{formatRelativeTime(job.estimatedCompletion)}</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {job.error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{job.error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {job.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(job.id)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            {job.status === 'failed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(job.id)}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AddRestorationJobDialog({ 
  sites, 
  onCreate, 
  onClose 
}: { 
  sites: any[]; 
  onCreate: (data: any) => void; 
  onClose: () => void 
}) {
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSiteId) {
      onCreate({ siteId: selectedSiteId, priority })
      onClose()
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Restoration Job</DialogTitle>
          <DialogDescription>
            Queue a site restoration workflow
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-select">Site</Label>
            <select
              id="site-select"
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              required
            >
              <option value="">Select a site...</option>
              {sites?.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority-select">Priority</Label>
            <select
              id="priority-select"
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Job
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function RestorationQueuePage() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const { data: sites } = useSites()
  const { data: jobs, isLoading } = useRestorationQueue()
  const createJob = useCreateRestorationJob()
  const cancelJob = useCancelRestorationJob()

  const handleCreateJob = async (data: { siteId: string; priority: 'low' | 'medium' | 'high' | 'critical' }) => {
    await createJob.mutateAsync(data)
  }

  const handleCancelJob = async (jobId: string) => {
    if (confirm('Are you sure you want to cancel this restoration job?')) {
      await cancelJob.mutateAsync(jobId)
    }
  }

  // Prepare chart data
  const statusData = jobs?.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const statusChartData = countToChartData(statusData, (key) => 
    key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')
  )

  const priorityData = jobs?.reduce((acc, job) => {
    acc[job.priority] = (acc[job.priority] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const priorityChartData = countToChartData(priorityData, (key) => 
    key.charAt(0).toUpperCase() + key.slice(1)
  )

  const activeJobs = jobs?.filter(job => job.status === 'in_progress' || job.status === 'pending') || []
  const completedJobs = jobs?.filter(job => job.status === 'completed') || []
  const failedJobs = jobs?.filter(job => job.status === 'failed') || []

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RefreshCw className="h-8 w-8" />
            Restoration Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage site restoration workflow
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              All restoration jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              In progress or pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              Successfully restored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              Jobs that failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {jobs && jobs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Breakdown by job status</CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={statusChartData}
                category="value"
                index="name"
                colors={['blue', 'green', 'red', 'gray']}
                className="h-64"
                valueFormatter={(value) => `${value} jobs`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
              <CardDescription>Breakdown by priority level</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={priorityChartData}
                index="name"
                categories={['value']}
                colors={['blue']}
                yAxisWidth={60}
                className="h-64"
                valueFormatter={(value) => `${value} jobs`}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Active Jobs</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeJobs.map((job) => (
              <RestorationJobCard
                key={job.id}
                job={job}
                onCancel={handleCancelJob}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Jobs */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">All Jobs</h2>
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
        ) : jobs && jobs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <RestorationJobCard
                key={job.id}
                job={job}
                onCancel={handleCancelJob}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No restoration jobs</h3>
                <p className="text-muted-foreground mb-4">
                  Create a restoration job to get started
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showAddDialog && (
        <AddRestorationJobDialog
          sites={sites || []}
          onCreate={handleCreateJob}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </div>
  )
}
