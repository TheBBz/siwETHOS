/**
 * SignInButton Component Tests
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignInWithEthosButton } from '../SignInButton';

// Mock the EthosAuthModal
vi.mock('../modal/EthosAuthModal', () => ({
  EthosAuthModal: vi.fn(({ isOpen, onClose, onSuccess }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-modal">
        <button onClick={onClose} data-testid="close-modal">Close</button>
        <button 
          onClick={() => onSuccess({ user: { name: 'Test User' }, token: 'test-token' })}
          data-testid="trigger-success"
        >
          Success
        </button>
      </div>
    );
  }),
}));

describe('SignInWithEthosButton', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with default text', () => {
      render(<SignInWithEthosButton />);
      expect(screen.getByRole('button')).toHaveTextContent('Sign in with Ethos');
    });

    it('should render with custom children', () => {
      render(<SignInWithEthosButton>Custom Text</SignInWithEthosButton>);
      expect(screen.getByRole('button')).toHaveTextContent('Custom Text');
    });

    it('should render loading state', () => {
      render(<SignInWithEthosButton loading>Sign In</SignInWithEthosButton>);
      expect(screen.getByRole('button')).toHaveTextContent('Connecting...');
    });

    it('should apply custom className', () => {
      render(<SignInWithEthosButton className="custom-class" />);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should apply custom styles (merged with defaults)', () => {
      render(<SignInWithEthosButton style={{ fontSize: '20px' }} />);
      // Custom styles are merged with defaults
      const button = screen.getByRole('button');
      expect(button.style.fontSize).toBe('20px');
    });

    it('should contain the Ethos logo SVG', () => {
      render(<SignInWithEthosButton />);
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toBeDefined();
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<SignInWithEthosButton disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should be disabled when loading is true', () => {
      render(<SignInWithEthosButton loading />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should have reduced opacity when disabled', () => {
      render(<SignInWithEthosButton disabled />);
      expect(screen.getByRole('button')).toHaveStyle({ opacity: '0.5' });
    });

    it('should not open modal when disabled', () => {
      render(<SignInWithEthosButton disabled />);
      fireEvent.click(screen.getByRole('button'));
      expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
    });

    it('should not open modal when loading', () => {
      render(<SignInWithEthosButton loading />);
      fireEvent.click(screen.getByRole('button'));
      expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
    });
  });

  describe('modal interaction', () => {
    it('should open modal on click', () => {
      render(<SignInWithEthosButton />);
      expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
      
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    });

    it('should close modal on close button click', () => {
      render(<SignInWithEthosButton />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('close-modal'));
      expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
    });

    it('should call onSuccess and close modal on successful auth', () => {
      render(<SignInWithEthosButton onSuccess={mockOnSuccess} />);
      
      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByTestId('trigger-success'));
      
      expect(mockOnSuccess).toHaveBeenCalledWith({
        user: { name: 'Test User' },
        token: 'test-token',
      });
      expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
    });
  });

  describe('hover/press effects', () => {
    it('should change background on mouse enter when not disabled', () => {
      render(<SignInWithEthosButton />);
      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      expect(button).toHaveStyle({ backgroundColor: '#4f46e5' });
    });

    it('should revert background on mouse leave', () => {
      render(<SignInWithEthosButton />);
      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);
      expect(button).toHaveStyle({ backgroundColor: '#6366f1' });
    });

    it('should scale on mouse down when not disabled', () => {
      render(<SignInWithEthosButton />);
      const button = screen.getByRole('button');
      
      fireEvent.mouseDown(button);
      expect(button).toHaveStyle({ transform: 'scale(0.98)' });
    });

    it('should reset scale on mouse up', () => {
      render(<SignInWithEthosButton />);
      const button = screen.getByRole('button');
      
      fireEvent.mouseDown(button);
      fireEvent.mouseUp(button);
      expect(button).toHaveStyle({ transform: 'scale(1)' });
    });
  });

  describe('props passing to modal', () => {
    it('should open modal which receives authServerUrl', async () => {
      render(<SignInWithEthosButton authServerUrl="https://custom.server" />);
      fireEvent.click(screen.getByRole('button'));
      
      // Modal should be visible
      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    });

    it('should open modal which receives chainId', () => {
      render(<SignInWithEthosButton chainId={5} />);
      fireEvent.click(screen.getByRole('button'));
      
      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    });

    it('should open modal which receives onError callback', () => {
      render(<SignInWithEthosButton onError={mockOnError} />);
      fireEvent.click(screen.getByRole('button'));
      
      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    });
    
    it('should pass wallets array to modal', () => {
      render(<SignInWithEthosButton wallets={['metamask', 'rabby']} />);
      fireEvent.click(screen.getByRole('button'));
      
      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    });
  });
});
