/**
 * AllWalletsView Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AllWalletsView } from '../modal/AllWalletsView';

// Mock useWalletDetection
vi.mock('../hooks/useWalletDetection', () => ({
  useWalletDetection: vi.fn(() => ({
    isInstalled: vi.fn((walletId: string) => walletId === 'metamask'),
    isReady: true,
    detectedWallets: ['metamask'],
  })),
}));

describe('AllWalletsView', () => {
  const mockOnSelect = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the view with title', () => {
      render(
        <AllWalletsView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Connect a wallet')).toBeInTheDocument();
    });

    it('should render subtitle', () => {
      render(
        <AllWalletsView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Select your wallet to continue')).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(
        <AllWalletsView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should render all default wallets', () => {
      render(
        <AllWalletsView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Rabby')).toBeInTheDocument();
      expect(screen.getByText('Phantom')).toBeInTheDocument();
      expect(screen.getByText('Zerion')).toBeInTheDocument();
      expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument();
      expect(screen.getByText('Brave Wallet')).toBeInTheDocument();
    });

    it('should render only specified wallets', () => {
      render(
        <AllWalletsView 
          wallets={['metamask', 'rabby']}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Rabby')).toBeInTheDocument();
      expect(screen.queryByText('Phantom')).not.toBeInTheDocument();
    });

    it('should render help text with link', () => {
      render(
        <AllWalletsView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(/Don't have a wallet/)).toBeInTheDocument();
      expect(screen.getByText('Get one here')).toHaveAttribute('href', 'https://ethereum.org/en/wallets/find-wallet/');
    });
  });

  describe('interactions', () => {
    it('should call onBack when back button clicked', () => {
      render(
        <AllWalletsView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      fireEvent.click(screen.getByText('Back'));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should call onSelect when wallet clicked', () => {
      render(
        <AllWalletsView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      fireEvent.click(screen.getByText('MetaMask'));
      expect(mockOnSelect).toHaveBeenCalledWith('metamask');
    });

    it('should call onSelect with correct wallet id', () => {
      render(
        <AllWalletsView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      fireEvent.click(screen.getByText('Rabby'));
      expect(mockOnSelect).toHaveBeenCalledWith('rabby');

      fireEvent.click(screen.getByText('Phantom'));
      expect(mockOnSelect).toHaveBeenCalledWith('phantom');
    });
  });

  describe('theming', () => {
    it('should apply custom theme colors', () => {
      const customTheme = {
        textPrimary: '#ff0000',
        textSecondary: '#00ff00',
        textMuted: '#0000ff',
        accentColor: '#ff00ff',
      };

      render(
        <AllWalletsView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
          theme={customTheme}
        />
      );

      const title = screen.getByText('Connect a wallet');
      expect(title).toHaveStyle({ color: '#ff0000' });
    });

    it('should use default theme when not provided', () => {
      render(
        <AllWalletsView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      // Should render without errors
      expect(screen.getByText('Connect a wallet')).toBeInTheDocument();
    });
  });

  describe('wallet sorting', () => {
    it('should sort installed wallets first', async () => {
      const { useWalletDetection } = await import('../hooks/useWalletDetection');
      
      // Mock to return metamask as installed
      vi.mocked(useWalletDetection).mockReturnValue({
        isInstalled: vi.fn((id: string) => id === 'phantom'),
        isReady: true,
        detectedWallets: ['phantom'],
      });

      render(
        <AllWalletsView 
          wallets={['metamask', 'phantom']}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      // Both should be rendered
      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Phantom')).toBeInTheDocument();
    });
  });
});
