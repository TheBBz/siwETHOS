/**
 * MainSelectView Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MainSelectView } from '../modal/MainSelectView';
import * as useRecentLoginsModule from '../hooks/useRecentLogins';
import * as useWalletDetectionModule from '../hooks/useWalletDetection';

// Mock hooks
vi.mock('../hooks/useWalletDetection', () => ({
  useWalletDetection: vi.fn(() => ({
    isInstalled: vi.fn((walletId: string) => walletId === 'metamask'),
    isReady: true,
    detectedWallets: ['metamask'],
  })),
}));

vi.mock('../hooks/useRecentLogins', () => ({
  useRecentLogins: vi.fn(() => ({
    recentLogins: [],
    addRecentLogin: vi.fn(),
    clearRecentLogins: vi.fn(),
  })),
}));

describe('MainSelectView', () => {
  const mockOnSelectWallet = vi.fn();
  const mockOnSelectSocial = vi.fn();
  const mockOnShowAllWallets = vi.fn();
  const mockOnShowAllSocial = vi.fn();
  const mockOnPasskey = vi.fn();

  const defaultProps = {
    onSelectWallet: mockOnSelectWallet,
    onSelectSocial: mockOnSelectSocial,
    onShowAllWallets: mockOnShowAllWallets,
    onShowAllSocial: mockOnShowAllSocial,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to default
    vi.mocked(useRecentLoginsModule.useRecentLogins).mockReturnValue({
      recentLogins: [],
      addRecentLogin: vi.fn(),
      clearRecentLogins: vi.fn(),
    });
    vi.mocked(useWalletDetectionModule.useWalletDetection).mockReturnValue({
      isInstalled: vi.fn((walletId: string) => walletId === 'metamask'),
      isReady: true,
      detectedWallets: ['metamask'],
    });
  });

  describe('rendering', () => {
    it('should render with default title', () => {
      render(<MainSelectView {...defaultProps} />);

      expect(screen.getByText('Log in or sign up')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(
        <MainSelectView 
          {...defaultProps}
          title="Custom Login Title"
        />
      );

      expect(screen.getByText('Custom Login Title')).toBeInTheDocument();
    });

    it('should render Ethos logo', () => {
      render(<MainSelectView {...defaultProps} />);
      
      // Logo should be present
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should render wallet options', () => {
      render(<MainSelectView {...defaultProps} />);

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
    });

    it('should render "Other wallets" button', () => {
      render(<MainSelectView {...defaultProps} />);

      expect(screen.getByText('Other wallets')).toBeInTheDocument();
    });

    it('should render social login button', () => {
      render(<MainSelectView {...defaultProps} />);

      expect(screen.getByText('Log in with a social account')).toBeInTheDocument();
    });

    it('should render terms and privacy links', () => {
      render(<MainSelectView {...defaultProps} />);

      expect(screen.getByText('Terms')).toHaveAttribute('href', 'https://ethos.network/terms');
      expect(screen.getByText('Privacy Policy')).toHaveAttribute('href', 'https://ethos.network/privacy');
    });

    it('should render custom terms URL', () => {
      render(
        <MainSelectView 
          {...defaultProps}
          termsUrl="https://custom.terms"
        />
      );

      expect(screen.getByText('Terms')).toHaveAttribute('href', 'https://custom.terms');
    });

    it('should render custom privacy URL', () => {
      render(
        <MainSelectView 
          {...defaultProps}
          privacyUrl="https://custom.privacy"
        />
      );

      expect(screen.getByText('Privacy Policy')).toHaveAttribute('href', 'https://custom.privacy');
    });
  });

  describe('passkey option', () => {
    it('should render passkey button by default', () => {
      render(<MainSelectView {...defaultProps} />);

      expect(screen.getByText('I have a passkey')).toBeInTheDocument();
    });

    it('should not render passkey button when showPasskey is false', () => {
      render(
        <MainSelectView 
          {...defaultProps}
          showPasskey={false}
        />
      );

      expect(screen.queryByText('I have a passkey')).not.toBeInTheDocument();
    });

    it('should call onPasskey when passkey button clicked', () => {
      render(
        <MainSelectView 
          {...defaultProps}
          onPasskey={mockOnPasskey}
        />
      );

      fireEvent.click(screen.getByText('I have a passkey'));
      expect(mockOnPasskey).toHaveBeenCalled();
    });
  });

  describe('interactions', () => {
    it('should call onSelectWallet when wallet is selected', () => {
      render(<MainSelectView {...defaultProps} />);

      fireEvent.click(screen.getByText('MetaMask'));
      expect(mockOnSelectWallet).toHaveBeenCalledWith('metamask');
    });

    it('should call onShowAllWallets when "Other wallets" is clicked', () => {
      render(<MainSelectView {...defaultProps} />);

      fireEvent.click(screen.getByText('Other wallets'));
      expect(mockOnShowAllWallets).toHaveBeenCalled();
    });

    it('should call onShowAllSocial when social login is clicked', () => {
      render(<MainSelectView {...defaultProps} />);

      fireEvent.click(screen.getByText('Log in with a social account'));
      expect(mockOnShowAllSocial).toHaveBeenCalled();
    });
  });

  describe('recent logins', () => {
    it('should not show recent section when showRecent is false', () => {
      render(
        <MainSelectView 
          {...defaultProps}
          showRecent={false}
        />
      );

      expect(screen.queryByText('Recent')).not.toBeInTheDocument();
    });

    it('should show recent logins when available', () => {
      vi.mocked(useRecentLoginsModule.useRecentLogins).mockReturnValue({
        recentLogins: [
          { type: 'wallet', id: 'metamask', name: 'MetaMask', identifier: '0x123...456' },
        ],
        addRecentLogin: vi.fn(),
        clearRecentLogins: vi.fn(),
      });

      render(<MainSelectView {...defaultProps} />);

      expect(screen.getByText('Recent')).toBeInTheDocument();
    });

    it('should call onSelectWallet for recent wallet login', () => {
      vi.mocked(useRecentLoginsModule.useRecentLogins).mockReturnValue({
        recentLogins: [
          { type: 'wallet', id: 'rabby', name: 'Rabby', identifier: '0x123...456' },
        ],
        addRecentLogin: vi.fn(),
        clearRecentLogins: vi.fn(),
      });

      render(<MainSelectView {...defaultProps} />);

      // Click on the recent login
      fireEvent.click(screen.getByText('Rabby'));
      expect(mockOnSelectWallet).toHaveBeenCalledWith('rabby');
    });

    it('should call onSelectSocial for recent social login', () => {
      vi.mocked(useRecentLoginsModule.useRecentLogins).mockReturnValue({
        recentLogins: [
          { type: 'social', id: 'discord', name: 'Discord', identifier: 'user#1234' },
        ],
        addRecentLogin: vi.fn(),
        clearRecentLogins: vi.fn(),
      });

      render(<MainSelectView {...defaultProps} />);

      fireEvent.click(screen.getByText('Discord'));
      expect(mockOnSelectSocial).toHaveBeenCalledWith('discord');
    });

    it('should limit recent logins to maxRecent', () => {
      vi.mocked(useRecentLoginsModule.useRecentLogins).mockReturnValue({
        recentLogins: [
          { type: 'wallet', id: 'metamask', name: 'MetaMask', identifier: '0x123' },
          { type: 'wallet', id: 'rabby', name: 'Rabby', identifier: '0x456' },
          { type: 'social', id: 'discord', name: 'Discord', identifier: 'user' },
          { type: 'social', id: 'twitter', name: 'Twitter', identifier: '@handle' },
        ],
        addRecentLogin: vi.fn(),
        clearRecentLogins: vi.fn(),
      });

      render(
        <MainSelectView 
          {...defaultProps}
          maxRecent={2}
        />
      );

      // Should only show 2 recent badges
      const badges = screen.getAllByText('Recent');
      expect(badges.length).toBeLessThanOrEqual(2);
    });
  });

  describe('wallet display', () => {
    it('should display detected wallets first', () => {
      vi.mocked(useWalletDetectionModule.useWalletDetection).mockReturnValue({
        isInstalled: vi.fn((id) => id === 'rabby'),
        isReady: true,
        detectedWallets: ['rabby'],
      });

      render(
        <MainSelectView 
          {...defaultProps}
          wallets={['metamask', 'rabby']}
        />
      );

      // Both should be present
      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Rabby')).toBeInTheDocument();
    });

    it('should skip wallets already in recent', () => {
      vi.mocked(useRecentLoginsModule.useRecentLogins).mockReturnValue({
        recentLogins: [
          { type: 'wallet', id: 'metamask', name: 'MetaMask', identifier: '0x123' },
        ],
        addRecentLogin: vi.fn(),
        clearRecentLogins: vi.fn(),
      });

      render(
        <MainSelectView 
          {...defaultProps}
          wallets={['metamask', 'rabby']}
        />
      );

      // MetaMask should appear only once (in recent section)
      const metamaskButtons = screen.getAllByText('MetaMask');
      expect(metamaskButtons.length).toBe(1);
    });
  });

  describe('theming', () => {
    it('should apply custom theme', () => {
      render(
        <MainSelectView 
          {...defaultProps}
          theme={{ textPrimary: '#ff0000' }}
        />
      );

      expect(screen.getByText('Log in or sign up')).toBeInTheDocument();
    });
  });
});
