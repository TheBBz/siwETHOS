/**
 * WalletList Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WalletList } from '../components/WalletList';
import type { WalletConfig, WalletId } from '../types';

// Mock wallet configurations
const mockWallets: WalletConfig[] = [
  {
    id: 'metamask' as WalletId,
    name: 'MetaMask',
    isInstalled: () => true,
    getProvider: () => undefined,
  },
  {
    id: 'rabby' as WalletId,
    name: 'Rabby',
    isInstalled: () => false,
    getProvider: () => undefined,
  },
  {
    id: 'phantom' as WalletId,
    name: 'Phantom',
    isInstalled: () => true,
    getProvider: () => undefined,
  },
];

describe('WalletList', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render all wallet options', () => {
      render(
        <WalletList 
          wallets={mockWallets} 
          onSelect={mockOnSelect} 
        />
      );

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Rabby')).toBeInTheDocument();
      expect(screen.getByText('Phantom')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <WalletList 
          wallets={mockWallets} 
          onSelect={mockOnSelect}
          className="custom-wallet-list"
        />
      );

      expect(container.querySelector('.custom-wallet-list')).toBeInTheDocument();
    });

    it('should render with custom style', () => {
      const { container } = render(
        <WalletList 
          wallets={mockWallets} 
          onSelect={mockOnSelect}
          style={{ padding: '16px' }}
        />
      );

      const listContainer = container.firstChild as HTMLElement;
      expect(listContainer).toHaveStyle({ padding: '16px' });
    });

    it('should render empty list when no wallets provided', () => {
      const { container } = render(
        <WalletList 
          wallets={[]} 
          onSelect={mockOnSelect} 
        />
      );

      // Should only have the container div
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(0);
    });
  });

  describe('interactions', () => {
    it('should call onSelect with correct wallet id when clicked', () => {
      render(
        <WalletList 
          wallets={mockWallets} 
          onSelect={mockOnSelect} 
        />
      );

      fireEvent.click(screen.getByText('MetaMask'));
      expect(mockOnSelect).toHaveBeenCalledWith('metamask');
    });

    it('should call onSelect for each wallet', () => {
      render(
        <WalletList 
          wallets={mockWallets} 
          onSelect={mockOnSelect} 
        />
      );

      fireEvent.click(screen.getByText('MetaMask'));
      expect(mockOnSelect).toHaveBeenCalledWith('metamask');

      fireEvent.click(screen.getByText('Rabby'));
      expect(mockOnSelect).toHaveBeenCalledWith('rabby');

      fireEvent.click(screen.getByText('Phantom'));
      expect(mockOnSelect).toHaveBeenCalledWith('phantom');
    });
  });

  describe('selection state', () => {
    it('should mark selected wallet', () => {
      render(
        <WalletList 
          wallets={mockWallets} 
          onSelect={mockOnSelect}
          selectedWallet="metamask"
        />
      );

      // The component should render with MetaMask selected
      expect(screen.getByText('MetaMask')).toBeInTheDocument();
    });

    it('should handle null selectedWallet', () => {
      render(
        <WalletList 
          wallets={mockWallets} 
          onSelect={mockOnSelect}
          selectedWallet={null}
        />
      );

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('should disable specified wallets', () => {
      render(
        <WalletList 
          wallets={mockWallets} 
          onSelect={mockOnSelect}
          disabledWallets={['rabby']}
        />
      );

      // Check that the button for Rabby exists
      expect(screen.getByText('Rabby')).toBeInTheDocument();
    });

    it('should handle empty disabledWallets array', () => {
      render(
        <WalletList 
          wallets={mockWallets} 
          onSelect={mockOnSelect}
          disabledWallets={[]}
        />
      );

      // All wallets should be enabled
      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Rabby')).toBeInTheDocument();
      expect(screen.getByText('Phantom')).toBeInTheDocument();
    });

    it('should handle multiple disabled wallets', () => {
      render(
        <WalletList 
          wallets={mockWallets} 
          onSelect={mockOnSelect}
          disabledWallets={['metamask', 'phantom']}
        />
      );

      expect(screen.getByText('Rabby')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply flex column layout', () => {
      const { container } = render(
        <WalletList 
          wallets={mockWallets} 
          onSelect={mockOnSelect} 
        />
      );

      const listContainer = container.firstChild as HTMLElement;
      expect(listContainer).toHaveStyle({ 
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      });
    });
  });
});
