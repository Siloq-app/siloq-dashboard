import { render, screen } from '@testing-library/react'
import { ComplianceBadge } from '../compliance-badge'
import { ComplianceStatus } from '@/lib/types'

describe('ComplianceBadge', () => {
  it('renders Compliant badge for compliant status', () => {
    render(<ComplianceBadge status="compliant" />)
    expect(screen.getByText('Compliant')).toBeInTheDocument()
  })

  it('renders Warning badge for warning status', () => {
    render(<ComplianceBadge status="warning" />)
    expect(screen.getByText('Warning')).toBeInTheDocument()
  })

  it('renders Violation badge for violation status', () => {
    render(<ComplianceBadge status="violation" />)
    expect(screen.getByText('Violation')).toBeInTheDocument()
  })
})
