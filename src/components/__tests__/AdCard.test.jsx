import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AdCard from '../AdCard'

// Mock adsense config
vi.mock('../../config/adsenseConfig', () => ({
  getAdsenseConfig: () => ({
    enabled: false,
    clientId: 'test-client-id',
    adSlots: {
      articleBanner: {
        slot: 'test-slot',
        format: 'auto',
        responsive: true
      }
    }
  }),
  loadAdsenseScript: vi.fn(),
  isAdBlockerActive: () => false
}))

describe('AdCard', () => {
  it('renders placeholder when adsense is disabled', () => {
    render(<AdCard />)
    
    expect(screen.getByText('Advertisement')).toBeInTheDocument()
    expect(screen.getByText('Ad content will be displayed here.')).toBeInTheDocument()
  })

  it('applies custom styles and className', () => {
    const customStyle = { backgroundColor: 'red' }
    const customClassName = 'test-class'
    
    render(
      <AdCard 
        style={customStyle} 
        className={customClassName}
        minHeight="300px"
      />
    )
    
    const container = screen.getByText('Advertisement').closest('div')
    expect(container).toHaveClass(customClassName)
  })

  it('can hide the advertisement label', () => {
    render(<AdCard showLabel={false} />)
    
    expect(screen.queryByText('Advertisement')).not.toBeInTheDocument()
    expect(screen.getByText('Ad content will be displayed here.')).toBeInTheDocument()
  })
})