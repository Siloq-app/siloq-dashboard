import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { ComplianceStatus } from '@/lib/types'

export function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  switch (status) {
    case 'compliant':
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Compliant
        </Badge>
      )
    case 'warning':
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Warning
        </Badge>
      )
    case 'violation':
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Violation
        </Badge>
      )
  }
}
