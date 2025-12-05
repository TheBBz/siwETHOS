/**
 * All Wallets View - Shows all available wallet options
 */

import { useMemo } from 'react';
import { LoginOptionButton } from '../components/LoginOptionButton';
import { useWalletDetection } from '../hooks/useWalletDetection';
import { WALLET_ICONS } from '../components/Icons';
import type { WalletId, ModalTheme } from '../types';
import { WALLETS, DEFAULT_THEME } from '../types';

interface AllWalletsViewProps {
  /** Wallets to show */
  wallets?: WalletId[];
  /** Wallet selection handler */
  onSelect: (walletId: WalletId) => void;
  /** Go back handler */
  onBack: () => void;
  /** Theme */
  theme?: ModalTheme;
}

// All available wallets
const ALL_WALLETS: WalletId[] = ['metamask', 'rabby', 'phantom', 'zerion', 'coinbase', 'brave'];

/**
 * Back button component
 */
function BackButton({ onClick, theme }: { onClick: () => void; theme: ModalTheme }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 0',
        background: 'none',
        border: 'none',
        color: theme.textSecondary,
        fontSize: '14px',
        cursor: 'pointer',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}

/**
 * All wallets selection view
 */
export function AllWalletsView({
  wallets = ALL_WALLETS,
  onSelect,
  onBack,
  theme = DEFAULT_THEME,
}: AllWalletsViewProps) {
  const t = { ...DEFAULT_THEME, ...theme };
  const { isInstalled, detectedWallets: _detectedWallets } = useWalletDetection();

  // Sort wallets - detected first
  const sortedWallets = useMemo(() => {
    return [...wallets].sort((a, b) => {
      const aInstalled = isInstalled(a);
      const bInstalled = isInstalled(b);
      if (aInstalled && !bInstalled) return -1;
      if (!aInstalled && bInstalled) return 1;
      return 0;
    });
  }, [wallets, isInstalled]);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <BackButton onClick={onBack} theme={t} />
        
        <h2
          style={{
            margin: '8px 0 0',
            fontSize: '20px',
            fontWeight: 600,
            color: t.textPrimary,
          }}
        >
          Connect a wallet
        </h2>
        
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '14px',
            color: t.textSecondary,
          }}
        >
          Select your wallet to continue
        </p>
      </div>

      {/* Wallet list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedWallets.map((walletId) => {
          const wallet = WALLETS[walletId];
          const IconComponent = WALLET_ICONS[walletId];
          const installed = isInstalled(walletId);
          
          return (
            <LoginOptionButton
              key={walletId}
              id={walletId}
              name={wallet.name}
              icon={<IconComponent />}
              onClick={() => onSelect(walletId)}
              showIndicator={installed}
              isAvailable={installed}
              theme={t}
            />
          );
        })}
      </div>

      {/* Help text */}
      <p
        style={{
          margin: '16px 0 0',
          fontSize: '12px',
          color: t.textMuted,
          textAlign: 'center',
        }}
      >
        Don't have a wallet?{' '}
        <a
          href="https://ethereum.org/en/wallets/find-wallet/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: t.accentColor, textDecoration: 'none' }}
        >
          Get one here
        </a>
      </p>
    </div>
  );
}
