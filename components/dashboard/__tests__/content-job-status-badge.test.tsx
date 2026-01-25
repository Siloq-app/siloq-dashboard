import { render, screen } from '@testing-library/react'
import { ContentJobStatusBadge } from '../content-job-status-badge'
import { ContentJobStatus } from '@/lib/types'

describe('ContentJobStatusBadge', () => {
  const statuses: ContentJobStatus[] = [
    'PREFLIGHT_APPROVED',
    'PROMPT_LOCKED',
    'GENERATING',
    'POSTCHECK_PASSED',
    'POSTCHECK_FAILED',
    'COMPLETE',
    'FAILED',
  ]

  statuses.forEach((status) => {
    it(`renders correct badge for ${status} status`, () => {
      render(<ContentJobStatusBadge status={status} />)
      const badge = screen.getByRole('status', { hidden: true }).closest('div') || screen.getByText(/./)
      expect(badge).toBeInTheDocument()
    })
  })

  it('renders Preflight Approved label for PREFLIGHT_APPROVED status', () => {
    render(<ContentJobStatusBadge status="PREFLIGHT_APPROVED" />)
    expect(screen.getByText('Preflight Approved')).toBeInTheDocument()
  })

  it('renders Generating label for GENERATING status', () => {
    render(<ContentJobStatusBadge status="GENERATING" />)
    expect(screen.getByText('Generating')).toBeInTheDocument()
  })

  it('renders Complete label for COMPLETE status', () => {
    render(<ContentJobStatusBadge status="COMPLETE" />)
    expect(screen.getByText('Complete')).toBeInTheDocument()
  })

  it('renders Failed label for FAILED status', () => {
    render(<ContentJobStatusBadge status="FAILED" />)
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })
})
