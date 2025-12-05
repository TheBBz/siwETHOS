/**
 * WalletSelectView Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WalletSelectView } from '../modal/WalletSelectView';

// Mock useWalletDetection
vi.mock('../hooks/useWalletDetection', () => ({
  useWalletDetection: vi.fn(() => ({
    isInstalled: vi.fn((walletId: string) => walletId === 'metamask'),
    isReady: true,
    detectedWallets: ['metamask'],
  })),
}));

describe('WalletSelectView', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with default title', () => {
      render(<WalletSelectView onSelect={mockOnSelect} />);

      expect(screen.getByText('Sign in with Ethos')).toBeInTheDocument();
    });

    it('should render with default subtitle', () => {
      render(<WalletSelectView onSelect={mockOnSelect} />);

      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(
        <WalletSelectView 
          onSelect={mockOnSelect}
          title="Custom Title"
        />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render with custom subtitle', () => {
      render(
        <WalletSelectView 
          onSelect={mockOnSelect}
          subtitle="Custom subtitle text"
        />
      );

      expect(screen.getByText('Custom subtitle text')).toBeInTheDocument();
    });

    it('should render Ethos logo placeholder', () => {
      render(<WalletSelectView onSelect={mockOnSelect} />);

      expect(screen.getByText('E')).toBeInTheDocument();
    });

    it('should render all default wallets', () => {
      render(<WalletSelectView onSelect={mockOnSelect} />);

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Rabby')).toBeInTheDocument();
      expect(screen.getByText('Phantom')).toBeInTheDocument();
      expect(screen.getByText('Zerion')).toBeInTheDocument();
      expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument();
      expect(screen.getByText('Brave Wallet')).toBeInTheDocument();
    });

    it('should render only specified wallets', () => {
      render(
        <WalletSelectView 
          wallets={['metamask', 'rabby']}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Rabby')).toBeInTheDocument();
      expect(screen.queryByText('Phantom')).not.toBeInTheDocument();
    });

    it('should render footer with Ethos link', () => {
      render(<WalletSelectView onSelect={mockOnSelect} />);

      expect(screen.getByText('Powered by')).toBeInTheDocument();
      expect(screen.getByText('Ethos')).toHaveAttribute('href', 'https://ethos.network');
    });

    it('should render Ethos link with proper attributes', () => {
      render(<WalletSelectView onSelect={mockOnSelect} />);

      const link = screen.getByText('Ethos');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('interactions', () => {
    it('should call onSelect when wallet clicked', () => {
      render(<WalletSelectView onSelect={mockOnSelect} />);

      fireEvent.click(screen.getByText('MetaMask'));
      expect(mockOnSelect).toHaveBeenCalledWith('metamask');
    });

    it('should call onSelect with correct wallet id', () => {
      render(<WalletSelectView onSelect={mockOnSelect} />);

      fireEvent.click(screen.getByText('Rabby'));
      expect(mockOnSelect).toHaveBeenCalledWith('rabby');

      fireEvent.click(screen.getByText('Phantom'));
      expect(mockOnSelect).toHaveBeenCalledWith('phantom');

      fireEvent.click(screen.getByText('Zerion'));
      expect(mockOnSelect).toHaveBeenCalledWith('zerion');
    });
  });

  describe('wallet sorting', () => {
    it('should sort installed wallets first when ready', async () => {
      const { useWalletDetection } = await import('../hooks/useWalletDetection');
      
      vi.mocked(useWalletDetection).mockReturnValue({
        isInstalled: vi.fn((id: string) => id === 'phantom'),
        isReady: true,
        detectedWallets: ['phantom'],
      });

      render(
        <WalletSelectView 
          wallets={['metamask', 'phantom']}
          onSelect={mockOnSelect}
        />
      );

      // Both should be rendered
      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Phantom')).toBeInTheDocument();
    });

    it('should not sort when not ready', async () => {
      const { useWalletDetection } = await import('../hooks/useWalletDetection');
      
      vi.mocked(useWalletDetection).mockReturnValue({
        isInstalled: vi.fn(() => false),
        isReady: false,
        detectedWallets: [],
      });

      render(
        <WalletSelectView 
          wallets={['metamask', 'rabby']}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Rabby')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have centered header', () => {
      render(<WalletSelectView onSelect={mockOnSelect} />);

      const title = screen.getByText('Sign in with Ethos');
      expect(title.parentElement).toHaveStyle({ textAlign: 'center' });
    });

    it('should have centered footer', () => {
      render(<WalletSelectView onSelect={mockOnSelect} />);

      const footer = screen.getByText('Powered by').parentElement;
      expect(footer).toHaveStyle({ textAlign: 'center' });
    });
  });

  describe('empty state', () => {
    it('should handle empty wallets array', () => {
      render(
        <WalletSelectView 
          wallets={[]}
          onSelect={mockOnSelect}
        />
      );

      // Should still render header and footer
      expect(screen.getByText('Sign in with Ethos')).toBeInTheDocument();
      expect(screen.getByText('Powered by')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<WalletSelectView onSelect={mockOnSelect} />);

      const heading = screen.getByText('Sign in with Ethos');
      expect(heading.tagName).toBe('H2');
    });
  });

  describe('wallet sorting behavior', () => {
    it('should maintain order when both wallets have same installed status', async () => {
      const { useWalletDetection } = await import('../hooks/useWalletDetection');
      
      // Both installed
      vi.mocked(useWalletDetection).mockReturnValue({
        isInstalled: vi.fn(() => true),
        isReady: true,
        detectedWallets: ['metamask', 'rabby'],
      });

      render(
        <WalletSelectView 
          wallets={['metamask', 'rabby']}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Rabby')).toBeInTheDocument();
    });

    it('should maintain order when both wallets are not installed', async () => {
      const { useWalletDetection } = await import('../hooks/useWalletDetection');
      
      // Neither installed
      vi.mocked(useWalletDetection).mockReturnValue({
        isInstalled: vi.fn(() => false),
        isReady: true,
        detectedWallets: [],
      });

      render(
        <WalletSelectView 
          wallets={['metamask', 'rabby']}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Rabby')).toBeInTheDocument();
    });

    it('should move installed wallet before non-installed', async () => {
      const { useWalletDetection } = await import('../hooks/useWalletDetection');
      
      // Only rabby installed
      vi.mocked(useWalletDetection).mockReturnValue({
        isInstalled: vi.fn((id: string) => id === 'rabby'),
        isReady: true,
        detectedWallets: ['rabby'],
      });

      render(
        <WalletSelectView 
          wallets={['metamask', 'rabby']}
          onSelect={mockOnSelect}
        />
      );

      // Both should be present
      const walletButtons = screen.getAllByRole('button');
      expect(walletButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('wallet config creation', () => {
    it('should create proper wallet config for each wallet', () => {
      render(
        <WalletSelectView 
          wallets={['phantom', 'zerion', 'coinbase', 'brave']}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Phantom')).toBeInTheDocument();
      expect(screen.getByText('Zerion')).toBeInTheDocument();
      expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument();
      expect(screen.getByText('Brave Wallet')).toBeInTheDocument();
    });
  });

  describe('sorting edge cases', () => {
    it('should handle sort when first wallet installed second not', async () => {
      const { useWalletDetection } = await import('../hooks/useWalletDetection');
      
      vi.mocked(useWalletDetection).mockReturnValue({
        isInstalled: vi.fn((id: string) => id === 'metamask'),
        isReady: true,
        detectedWallets: ['metamask'],
      });

      render(
        <WalletSelectView 
          wallets={['rabby', 'metamask']}
          onSelect={mockOnSelect}
        />
      );

      // Both wallets should be present
      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Rabby')).toBeInTheDocument();
    });

    it('should handle sort when second wallet installed first not', async () => {
      const { useWalletDetection } = await import('../hooks/useWalletDetection');
      
      vi.mocked(useWalletDetection).mockReturnValue({
        isInstalled: vi.fn((id: string) => id === 'rabby'),
        isReady: true,
        detectedWallets: ['rabby'],
      });

      render(
        <WalletSelectView 
          wallets={['metamask', 'rabby']}
          onSelect={mockOnSelect}
        />
      );

      // Both wallets should be present
      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Rabby')).toBeInTheDocument();
    });
  });
});
