'use client'

import { useState } from 'react'
import { useContentJobs, useContentJob, useCreateContentJob } from '@/lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye
} from 'lucide-react'
import { ContentJobStatus } from '@/lib/types'
import { DonutChart, BarList } from '@tremor/react'
import { ContentJobStatusBadge } from '@/components/dashboard/content-job-status-badge'
import { formatRelativeTime } from '@/lib/utils'
import { countToChartData } from '@/lib/chart-utils'

function StatusVisualization({ status }: { status: ContentJobStatus }) {
  const steps = [
    { key: 'PREFLIGHT_APPROVED', label: 'Preflight' },
    { key: 'PROMPT_LOCKED', label: 'Prompt Locked' },
    { key: 'GENERATING', label: 'Generating' },
    { key: 'POSTCHECK_PASSED', label: 'Postcheck' },
    { key: 'COMPLETE', label: 'Complete' },
  ]

  const statusOrder: ContentJobStatus[] = [
    'PREFLIGHT_APPROVED',
    'PROMPT_LOCKED',
    'GENERATING',
    'POSTCHECK_PASSED',
    'POSTCHECK_FAILED',
    'COMPLETE',
    'FAILED',
  ]

  const currentIndex = statusOrder.indexOf(status)

  // Map each step to its corresponding status index in statusOrder
  const getStepStatusIndex = (stepKey: string): number => {
    return statusOrder.findIndex(s => s === stepKey)
  }

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const stepStatusIndex = getStepStatusIndex(step.key)
        // Determine if step should be active based on current status
        let isActive = false
        if (stepStatusIndex === -1) {
          isActive = false
        } else if (step.key === 'POSTCHECK_PASSED') {
          // POSTCHECK step is active if we've reached POSTCHECK_PASSED or POSTCHECK_FAILED
          isActive = currentIndex >= 3
        } else {
          // Other steps are active if current status index is >= step's status index
          isActive = currentIndex >= stepStatusIndex
        }
        const isCurrent = stepStatusIndex === currentIndex

        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex flex-col items-center ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                isActive
                  ? isCurrent
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-green-500 bg-green-500 text-white'
                  : 'border-muted bg-background'
              }`}>
                {isActive && !isCurrent ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>
              <span className="text-xs mt-1">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-0.5 w-8 mx-2 ${isActive ? 'bg-green-500' : 'bg-muted'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function JobDetailDialog({ jobId, open, onOpenChange }: { jobId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: job, isLoading } = useContentJob(jobId)

  if (!job) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job.pageTitle}</DialogTitle>
          <DialogDescription>
            Job ID: {job.id}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Status</h4>
            <ContentJobStatusBadge status={job.status} />
            <StatusVisualization status={job.status} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {formatRelativeTime(job.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Updated</p>
              <p className="font-medium">
                {formatRelativeTime(job.updatedAt)}
              </p>
            </div>
            {job.costEstimate && (
              <div>
                <p className="text-sm text-muted-foreground">Cost Estimate</p>
                <p className="font-medium">${job.costEstimate.toFixed(4)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Retries</p>
              <p className="font-medium">{job.retries}/3</p>
            </div>
          </div>

          {job.validationResults && (
            <div>
              <h4 className="font-medium mb-2">Validation Results</h4>
              <div className="space-y-2">
                {job.validationResults.preflight && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Preflight</p>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(job.validationResults.preflight, null, 2)}
                    </pre>
                  </div>
                )}
                {job.validationResults.postcheck && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Postcheck</p>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(job.validationResults.postcheck, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {job.error && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Error</p>
                  <p className="text-sm text-destructive/80 mt-1">{job.error}</p>
                </div>
              </div>
            </div>
          )}

          {job.status === 'FAILED' && job.retries < 3 && (
            <Button className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Job
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ContentJobsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const { data: jobs, isLoading } = useContentJobs(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  )
  const { data: allJobs } = useContentJobs() // Get all jobs for chart

  // Prepare status distribution data
  const statusData = allJobs?.reduce((acc, job) => {
    const statusLabel = job.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    acc[statusLabel] = (acc[statusLabel] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const statusChartData = countToChartData(statusData)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Track AI content generation status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PREFLIGHT_APPROVED">Preflight Approved</SelectItem>
              <SelectItem value="PROMPT_LOCKED">Prompt Locked</SelectItem>
              <SelectItem value="GENERATING">Generating</SelectItem>
              <SelectItem value="POSTCHECK_PASSED">Postcheck Passed</SelectItem>
              <SelectItem value="POSTCHECK_FAILED">Postcheck Failed</SelectItem>
              <SelectItem value="COMPLETE">Complete</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Distribution Chart */}
      {allJobs && allJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Job Status Distribution</CardTitle>
            <CardDescription>
              Overview of all content jobs by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={statusChartData}
              category="value"
              index="name"
              colors={['emerald', 'amber', 'blue', 'violet', 'rose', 'red', 'slate']}
              className="h-64"
              valueFormatter={(value: number) => `${value} jobs`}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>
            {jobs?.length || 0} job(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{job.pageTitle}</h4>
                      <ContentJobStatusBadge status={job.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Job ID: {job.id.substring(0, 8)}...</span>
                      <span>
                        Created {formatRelativeTime(job.createdAt)}
                      </span>
                      {job.costEstimate && (
                        <span>Est. ${job.costEstimate.toFixed(4)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content jobs found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedJobId && (
        <JobDetailDialog
          jobId={selectedJobId}
          open={!!selectedJobId}
          onOpenChange={(open) => !open && setSelectedJobId(null)}
        />
      )}
    </div>
  )
}
