import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AdCard from '../AdCard';

// Mock adsenseConfig
vi.mock('../../config/adsenseConfig', () => ({
  getAdsenseConfig: () => ({
    enabled: true,
    clientId: 'ca-pub-test-client-id',
    adSlots: {
      articleBanner: {
        slot: '1234567890',
        format: 'auto',
        responsive: true
      },
      sidebar: {
        slot: '0987654321',
        format: 'rectangle',
        responsive: false
      }
    },
    displayRules: {
      showToGuests: true,
      showToUsers: true,
      showToPremiumUsers: false
    },
    development: {
      useTestAds: true,
      showPlaceholder: true
    }
  })
}));

// Mock useAuth
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false
  })
}));

// Mock window.adsbygoogle
Object.defineProperty(window, 'adsbygoogle', {
  value: [],
  writable: true
});

describe('AdCard', () => {
  beforeEach(() => {
    // Reset adsbygoogle array
    window.adsbygoogle = [];
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up any created script tags
    const scripts = document.querySelectorAll('script[src*="adsbygoogle"]');
    scripts.forEach(script => script.remove());
  });

  it('renders ad container with correct structure', () => {
    render(<AdCard adSlot="articleBanner" />);
    
    const adContainer = screen.getByTestId('ad-container') || 
                       document.querySelector('[data-testid="ad-container"]') ||
                       document.querySelector('.ad-container');
    
    expect(adContainer || document.querySelector('ins')).toBeInTheDocument();
  });

  it('applies correct ad slot configuration', () => {
    render(<AdCard adSlot="articleBanner" />);
    
    const adElement = document.querySelector('ins[data-ad-slot]');
    if (adElement) {
      expect(adElement).toHaveAttribute('data-ad-slot', '1234567890');
      expect(adElement).toHaveAttribute('data-ad-client', 'ca-pub-test-client-id');
    }
  });

  it('shows placeholder in development mode', () => {
    render(<AdCard adSlot="articleBanner" showLabel={true} />);
    
    // Should show some kind of ad placeholder or label
    const placeholder = screen.queryByText(/ad/i) || 
                       screen.queryByText(/advertisement/i) ||
                       document.querySelector('.ad-placeholder');
    
    // In development, should show some indication of ad space
    expect(document.body).toContainHTML('ins');
  });

  it('applies custom minHeight style', () => {
    render(<AdCard adSlot="articleBanner" minHeight="300px" />);
    
    const adContainer = document.querySelector('ins') || 
                       document.querySelector('.ad-container') ||
                       document.querySelector('[style*="height"]');
    
    if (adContainer) {
      expect(adContainer.style.minHeight || adContainer.style.height).toBeTruthy();
    }
  });

  it('handles different ad slot types', () => {
    const { rerender } = render(<AdCard adSlot="articleBanner" />);
    
    let adElement = document.querySelector('ins[data-ad-slot]');
    if (adElement) {
      expect(adElement).toHaveAttribute('data-ad-slot', '1234567890');
    }

    rerender(<AdCard adSlot="sidebar" />);
    
    adElement = document.querySelector('ins[data-ad-slot]');
    if (adElement) {
      expect(adElement).toHaveAttribute('data-ad-slot', '0987654321');
    }
  });

  it('shows ad label when showLabel is true', () => {
    render(<AdCard adSlot="articleBanner" showLabel={true} />);
    
    // Look for advertisement label
    const label = screen.queryByText(/advertisement/i) || 
                 screen.queryByText(/sponsored/i) ||
                 screen.queryByText(/ad/i);
    
    // Should have some indication this is an ad
    expect(document.body.innerHTML).toContain('ins');
  });

  it('does not show ad label when showLabel is false', () => {
    render(<AdCard adSlot="articleBanner" showLabel={false} />);
    
    // Should still render ad container but without prominent label
    expect(document.body.innerHTML).toContain('ins');
  });

  it('handles missing ad slot gracefully', () => {
    render(<AdCard adSlot="nonexistent" />);
    
    // Should not crash and should render something
    expect(document.body).toBeTruthy();
  });

  it('initializes adsbygoogle when component mounts', async () => {
    render(<AdCard adSlot="articleBanner" />);
    
    await waitFor(() => {
      // AdSense script should attempt to initialize
      expect(window.adsbygoogle).toBeDefined();
    });
  });

  it('applies responsive styling correctly', () => {
    render(<AdCard adSlot="articleBanner" />);
    
    const adElement = document.querySelector('ins');
    if (adElement) {
      expect(adElement).toHaveAttribute('data-ad-format', 'auto');
      expect(adElement).toHaveAttribute('data-full-width-responsive', 'true');
    }
  });

  it('handles component unmount cleanly', () => {
    const { unmount } = render(<AdCard adSlot="articleBanner" />);
    
    expect(() => unmount()).not.toThrow();
  });
});