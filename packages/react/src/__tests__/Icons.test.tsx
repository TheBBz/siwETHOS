/**
 * Icons Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { 
  WALLET_ICONS, 
  SOCIAL_ICONS,
  EthosLogo,
} from '../components/Icons';

// Mock the Web3Icon component
vi.mock('@bgd-labs/react-web3-icons', () => ({
  Web3Icon: ({ walletKey }: { walletKey: string }) => (
    <svg data-testid={`wallet-icon-${walletKey}`} />
  ),
}));

describe('Icons', () => {
  describe('EthosLogo', () => {
    it('should render with default size', () => {
      render(<EthosLogo />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render with custom size', () => {
      render(<EthosLogo size={100} />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '100');
      expect(svg).toHaveAttribute('height', '100');
    });
  });

  describe('WALLET_ICONS', () => {
    it('should have MetaMask icon', () => {
      const MetaMaskIcon = WALLET_ICONS.metamask;
      render(<MetaMaskIcon />);
      expect(screen.getByTestId('wallet-icon-metamask')).toBeInTheDocument();
    });

    it('should have Rabby icon', () => {
      const RabbyIcon = WALLET_ICONS.rabby;
      render(<RabbyIcon />);
      expect(screen.getByTestId('wallet-icon-rabbywallet')).toBeInTheDocument();
    });

    it('should have Phantom icon', () => {
      const PhantomIcon = WALLET_ICONS.phantom;
      render(<PhantomIcon />);
      expect(screen.getByTestId('wallet-icon-phantomwallet')).toBeInTheDocument();
    });

    it('should have Zerion icon', () => {
      const ZerionIcon = WALLET_ICONS.zerion;
      render(<ZerionIcon />);
      expect(screen.getByTestId('wallet-icon-zerionwallet')).toBeInTheDocument();
    });

    it('should have Coinbase icon', () => {
      const CoinbaseIcon = WALLET_ICONS.coinbase;
      render(<CoinbaseIcon />);
      expect(screen.getByTestId('wallet-icon-coinbasewallet')).toBeInTheDocument();
    });

    it('should have Brave icon', () => {
      const BraveIcon = WALLET_ICONS.brave;
      render(<BraveIcon />);
      expect(screen.getByTestId('wallet-icon-bravewallet')).toBeInTheDocument();
    });
  });

  describe('SOCIAL_ICONS', () => {
    it('should have Twitter icon', () => {
      const TwitterIcon = SOCIAL_ICONS.twitter;
      render(<TwitterIcon />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have Discord icon', () => {
      const DiscordIcon = SOCIAL_ICONS.discord;
      render(<DiscordIcon />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have Telegram icon', () => {
      const TelegramIcon = SOCIAL_ICONS.telegram;
      render(<TelegramIcon />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have Farcaster icon', () => {
      const FarcasterIcon = SOCIAL_ICONS.farcaster;
      render(<FarcasterIcon />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
