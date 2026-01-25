import { render, screen } from '@testing-library/react'
import { SiteStatusBadge } from '../site-status-badge'
import { SiteStatus } from '@/lib/types'

describe('SiteStatusBadge', () => {
  it('renders Connected badge for connected status', () => {
    render(<SiteStatusBadge status="connected" />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('renders Syncing badge for syncing status', () => {
    render(<SiteStatusBadge status="syncing" />)
    expect(screen.getByText('Syncing')).toBeInTheDocument()
  })

  it('renders Error badge for error status', () => {
    render(<SiteStatusBadge status="error" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('renders Disconnected badge for disconnected status', () => {
    render(<SiteStatusBadge status="disconnected" />)
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
  })

  it('renders Disconnected badge for unknown status', () => {
    render(<SiteStatusBadge status={'unknown' as SiteStatus} />)
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
  })
})
