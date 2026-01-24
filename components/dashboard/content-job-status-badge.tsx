import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, RefreshCw, Lock } from 'lucide-react'
import { ContentJobStatus } from '@/lib/types'

export function ContentJobStatusBadge({ status }: { status: ContentJobStatus }) {
  const variants: Record<ContentJobStatus, { variant: any; icon: any; label: string }> = {
    PREFLIGHT_APPROVED: { variant: 'success', icon: CheckCircle2, label: 'Preflight Approved' },
    PROMPT_LOCKED: { variant: 'warning', icon: Lock, label: 'Prompt Locked' },
    GENERATING: { variant: 'warning', icon: RefreshCw, label: 'Generating' },
    POSTCHECK_PASSED: { variant: 'success', icon: CheckCircle2, label: 'Postcheck Passed' },
    POSTCHECK_FAILED: { variant: 'destructive', icon: XCircle, label: 'Postcheck Failed' },
    COMPLETE: { variant: 'success', icon: CheckCircle2, label: 'Complete' },
    FAILED: { variant: 'destructive', icon: XCircle, label: 'Failed' },
  }

  const config = variants[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {status === 'GENERATING' && <Icon className="h-3 w-3 animate-spin" />}
      {status !== 'GENERATING' && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  )
}
