import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithTheme } from '../../test/testHelpers';
import AuthModal from '../AuthModal';

// Mock useAuth hook
const mockSignInWithGoogle = vi.fn();
const mockSignInWithNaver = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signInWithGoogle: mockSignInWithGoogle,
    signInWithNaver: mockSignInWithNaver,
    isAuthenticated: false
  })
}));



describe('AuthModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open is true', () => {
    renderWithTheme(<AuthModal open={true} onClose={mockOnClose} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render modal when open is false', () => {
    renderWithTheme(<AuthModal open={false} onClose={mockOnClose} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays login title and description', () => {
    renderWithTheme(<AuthModal open={true} onClose={mockOnClose} />);
    
    expect(screen.getByText(/로그인/)).toBeInTheDocument();
    expect(screen.getByText(/NEWStep/)).toBeInTheDocument();
  });

  it('shows Google login button', () => {
    renderWithTheme(<AuthModal open={true} onClose={mockOnClose} />);
    
    const googleButton = screen.getByRole('button', { name: /google/i }) ||
                        screen.getByText(/Google/);
    expect(googleButton).toBeInTheDocument();
  });

  it('shows Naver login button', () => {
    renderWithTheme(<AuthModal open={true} onClose={mockOnClose} />);
    
    const naverButton = screen.getByRole('button', { name: /naver/i }) ||
                       screen.getByText(/네이버/);
    expect(naverButton).toBeInTheDocument();
  });

  it('calls signInWithGoogle when Google button is clicked', async () => {
    renderWithTheme(<AuthModal open={true} onClose={mockOnClose} />);
    
    const googleButton = screen.getByRole('button', { name: /google/i }) ||
                        screen.getByText(/Google/).closest('button');
    
    fireEvent.click(googleButton);
    
    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
    });
  });

  it('calls signInWithNaver when Naver button is clicked', async () => {
    renderWithTheme(<AuthModal open={true} onClose={mockOnClose} />);
    
    const naverButton = screen.getByRole('button', { name: /naver/i }) ||
                       screen.getByText(/네이버/).closest('button');
    
    fireEvent.click(naverButton);
    
    await waitFor(() => {
      expect(mockSignInWithNaver).toHaveBeenCalled();
    });
  });

  it('shows loading state during authentication', async () => {
    mockSignInWithGoogle.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithTheme(<AuthModal open={true} onClose={mockOnClose} />);
    
    const googleButton = screen.getByRole('button', { name: /google/i }) ||
                        screen.getByText(/Google/).closest('button');
    
    fireEvent.click(googleButton);
    
    // Should show loading indicator
    await waitFor(() => {
      expect(screen.getByRole('progressbar') || 
             screen.queryByText(/로딩/) ||
             googleButton.disabled).toBeTruthy();
    });
  });

  it('displays error message when authentication fails', async () => {
    const errorMessage = 'Authentication failed';
    mockSignInWithGoogle.mockRejectedValue(new Error(errorMessage));
    
    renderWithTheme(<AuthModal open={true} onClose={mockOnClose} />);
    
    const googleButton = screen.getByRole('button', { name: /google/i }) ||
                        screen.getByText(/Google/).closest('button');
    
    fireEvent.click(googleButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/오류/) || 
             screen.queryByText(/실패/) ||
             screen.queryByText(/error/i)).toBeTruthy();
    });
  });

  it('closes modal when close button is clicked', () => {
    renderWithTheme(<AuthModal open={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i }) ||
                       screen.getByLabelText(/close/i) ||
                       document.querySelector('[aria-label*="close"]');
    
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('closes modal when backdrop is clicked', () => {
    renderWithTheme(<AuthModal open={true} onClose={mockOnClose} />);
    
    const backdrop = document.querySelector('.MuiBackdrop-root') ||
                    screen.getByRole('dialog').parentElement;
    
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('handles keyboard navigation correctly', () => {
    renderWithTheme(<AuthModal open={true} onClose={mockOnClose} />);
    
    const modal = screen.getByRole('dialog');
    
    // Should be focusable and handle escape key
    fireEvent.keyDown(modal, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays login image when available', () => {
    renderWithTheme(<AuthModal open={true} onClose={mockOnClose} />);
    
    const image = screen.queryByRole('img') ||
                 document.querySelector('img');
    
    // Should have some visual element (image or illustration)
    expect(document.querySelector('[src]') || 
           document.querySelector('.login-image')).toBeTruthy();
  });

  it('maintains accessibility standards', () => {
    renderWithTheme(<AuthModal open={true} onClose={mockOnClose} />);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    
    // Should have proper ARIA labels
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type');
    });
  });
});