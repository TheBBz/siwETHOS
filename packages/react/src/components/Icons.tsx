/**
 * Icons for wallets and social providers
 * Uses @bgd-labs/react-web3-icons for high-quality wallet icons
 */

import { Web3Icon } from '@bgd-labs/react-web3-icons';
import type { WalletId, SocialProviderId } from '../types';

// ============================================================================
// Wallet Keys for @bgd-labs/react-web3-icons
// ============================================================================

export const WALLET_KEYS: Record<WalletId, string> = {
  metamask: 'metamask',
  rabby: 'rabbywallet',
  phantom: 'phantomwallet',
  zerion: 'zerionwallet',
  coinbase: 'coinbasewallet',
  brave: 'bravewallet',
};

// ============================================================================
// Wallet Icon Components using Web3Icon
// ============================================================================

export const MetaMaskIcon = () => (
  <Web3Icon walletKey="metamask" className="w-7 h-7" />
);

export const RabbyIcon = () => (
  <Web3Icon walletKey="rabbywallet" className="w-7 h-7" />
);

export const PhantomIcon = () => (
  <Web3Icon walletKey="phantomwallet" className="w-7 h-7" />
);

export const ZerionIcon = () => (
  <Web3Icon walletKey="zerionwallet" className="w-7 h-7" />
);

export const CoinbaseIcon = () => (
  <Web3Icon walletKey="coinbasewallet" className="w-7 h-7" />
);

export const BraveIcon = () => (
  <Web3Icon walletKey="bravewallet" className="w-7 h-7" />
);

// Generic wallet icon
export const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <path d="M3 10H21" />
    <circle cx="16" cy="14" r="1.5" fill="currentColor" />
  </svg>
);

// ============================================================================
// Ethos Logo - Main "E" pattern logo (from original demo)
// ============================================================================

export const EthosLogo = ({ size = 64, className }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 512 512"
    width={size}
    height={size}
    className={className}
  >
    <rect width="512" height="512" fill="currentColor" opacity="0.1" rx="100" />
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M255.38 255.189a254.98 254.98 0 0 1-1.935 31.411H101v62.2h136.447a251.522 251.522 0 0 1-35.932 62.2H411v-62.2H237.447a250.584 250.584 0 0 0 15.998-62.2H411v-62.2H253.521a250.604 250.604 0 0 0-15.826-62.2H411V100H202.003a251.526 251.526 0 0 1 35.692 62.2H101v62.2h152.521a255 255 0 0 1 1.859 30.789Z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Ethos Shield Icon - Protection badge
 */
export const EthosShield = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ============================================================================
// Social Icons
// ============================================================================

export const TwitterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#000000"/>
    <path d="M13.3 10.7L18 5H16.7L12.7 9.9L9.5 5H5L10 12.9L5 19H6.3L10.6 13.7L14 19H18.5L13.3 10.7ZM11.2 13L10.6 12.2L6.8 5.9H9L11.7 9.8L12.3 10.6L16.7 18.2H14.5L11.2 13Z" fill="white"/>
  </svg>
);

export const DiscordIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#5865F2"/>
    <path d="M18.59 6.42C17.46 5.91 16.26 5.53 15 5.3C14.84 5.59 14.65 5.97 14.52 6.28C13.18 6.07 11.85 6.07 10.54 6.28C10.41 5.97 10.22 5.59 10.05 5.3C8.79 5.53 7.59 5.91 6.46 6.42C4.15 9.87 3.53 13.24 3.84 16.55C5.32 17.65 6.76 18.32 8.17 18.76C8.54 18.26 8.87 17.73 9.17 17.17C8.63 16.97 8.11 16.72 7.62 16.43C7.75 16.33 7.87 16.23 7.99 16.12C10.56 17.31 13.49 17.31 16.03 16.12C16.15 16.23 16.27 16.33 16.4 16.43C15.91 16.72 15.39 16.97 14.85 17.17C15.15 17.73 15.48 18.26 15.85 18.76C17.26 18.32 18.7 17.65 20.18 16.55C20.54 12.72 19.55 9.38 18.59 6.42ZM9.07 14.46C8.25 14.46 7.58 13.7 7.58 12.78C7.58 11.86 8.23 11.1 9.07 11.1C9.91 11.1 10.58 11.86 10.56 12.78C10.56 13.7 9.91 14.46 9.07 14.46ZM14.95 14.46C14.13 14.46 13.46 13.7 13.46 12.78C13.46 11.86 14.11 11.1 14.95 11.1C15.79 11.1 16.46 11.86 16.44 12.78C16.44 13.7 15.79 14.46 14.95 14.46Z" fill="white"/>
  </svg>
);

export const TelegramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#229ED9"/>
    <path d="M9.417 15.181l-.397 5.584c.568 0 .814-.244 1.109-.537l2.663-2.545 5.518 4.041c1.012.564 1.725.267 1.998-.931l3.622-16.972c.321-1.496-.541-2.081-1.527-1.714L3.938 10.502c-1.45.564-1.428 1.374-.247 1.741l4.911 1.524 11.39-7.111c.537-.337 1.026-.15.623.186L9.417 15.181z" fill="white"/>
  </svg>
);

export const FarcasterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 1000 1000" fill="none">
    <rect width="1000" height="1000" rx="200" fill="#855DCD"/>
    <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z" fill="white"/>
    <path d="M128.889 253.333L182.222 351.111H257.778V253.333H128.889Z" fill="white"/>
    <path d="M742.222 253.333V351.111H817.778L871.111 253.333H742.222Z" fill="white"/>
    <path d="M182.222 351.111H257.778V746.667H217.778C182.222 746.667 182.222 711.111 182.222 711.111V351.111Z" fill="white"/>
    <path d="M742.222 351.111H817.778V711.111C817.778 711.111 817.778 746.667 782.222 746.667H742.222V351.111Z" fill="white"/>
  </svg>
);

export const SocialIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" strokeLinecap="round" />
  </svg>
);

export const PasskeyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 14C14.2091 14 16 12.2091 16 10C16 7.79086 14.2091 6 12 6C9.79086 6 8 7.79086 8 10C8 12.2091 9.79086 14 12 14Z" />
    <path d="M12 14V20M12 20L9 17M12 20L15 17" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ============================================================================
// Icon Map
// ============================================================================

export const WALLET_ICONS: Record<WalletId, React.ComponentType> = {
  metamask: MetaMaskIcon,
  rabby: RabbyIcon,
  phantom: PhantomIcon,
  zerion: ZerionIcon,
  coinbase: CoinbaseIcon,
  brave: BraveIcon,
};

export const SOCIAL_ICONS: Record<SocialProviderId, React.ComponentType> = {
  twitter: TwitterIcon,
  discord: DiscordIcon,
  telegram: TelegramIcon,
  farcaster: FarcasterIcon,
};

/**
 * Get icon component for a login method
 */
export function getMethodIcon(type: 'wallet' | 'social', id: string): React.ComponentType {
  if (type === 'wallet') {
    return WALLET_ICONS[id as WalletId] || WalletIcon;
  }
  return SOCIAL_ICONS[id as SocialProviderId] || SocialIcon;
}
