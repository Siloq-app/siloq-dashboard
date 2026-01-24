import { Badge } from '@/components/ui/badge'
import { SiteStatus } from '@/lib/types'

export function SiteStatusBadge({ status }: { status: SiteStatus }) {
  switch (status) {
    case 'connected':
      return <Badge variant="success">Connected</Badge>
    case 'syncing':
      return <Badge variant="warning">Syncing</Badge>
    case 'error':
      return <Badge variant="destructive">Error</Badge>
    default:
      return <Badge variant="outline">Disconnected</Badge>
  }
}
