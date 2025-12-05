/**
 * Wallet Select View
 */

import { useMemo } from 'react';
import { WalletButton } from '../components/WalletButton';
import { useWalletDetection } from '../hooks/useWalletDetection';
import type { WalletId, WalletConfig } from '../types';

interface WalletSelectViewProps {
  wallets?: WalletId[];
  onSelect: (walletId: WalletId) => void;
  title?: string;
  subtitle?: string;
}

// Default wallet order
const DEFAULT_WALLET_ORDER: WalletId[] = [
  'metamask',
  'rabby',
  'phantom',
  'zerion',
  'coinbase',
  'brave',
];

// Wallet display info
const WALLET_INFO: Record<WalletId, { name: string }> = {
  metamask: { name: 'MetaMask' },
  rabby: { name: 'Rabby' },
  phantom: { name: 'Phantom' },
  zerion: { name: 'Zerion' },
  coinbase: { name: 'Coinbase Wallet' },
  brave: { name: 'Brave Wallet' },
};

/**
 * View for selecting a wallet
 */
export function WalletSelectView({
  wallets = DEFAULT_WALLET_ORDER,
  onSelect,
  title = 'Sign in with Ethos',
  subtitle = 'Connect your wallet to continue',
}: WalletSelectViewProps) {
  const { isInstalled, isReady } = useWalletDetection();

  // Sort wallets - detected ones first
  const sortedWallets = useMemo(() => {
    if (!isReady) return wallets;
    
    return [...wallets].sort((a, b) => {
      const aInstalled = isInstalled(a);
      const bInstalled = isInstalled(b);
      if (aInstalled && !bInstalled) return -1;
      if (!aInstalled && bInstalled) return 1;
      return 0;
    });
  }, [wallets, isInstalled, isReady]);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        {/* Ethos logo placeholder */}
        <div
          style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 16px',
            borderRadius: '12px',
            backgroundColor: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '20px',
          }}
        >
          E
        </div>
        
        <h2
          style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 600,
            color: '#1f2937',
          }}
        >
          {title}
        </h2>
        
        <p
          style={{
            margin: '8px 0 0',
            fontSize: '14px',
            color: '#6b7280',
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Wallet list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {sortedWallets.map((walletId) => {
          const walletInfo = WALLET_INFO[walletId];
          const installed = isInstalled(walletId);
          
          const config: WalletConfig = {
            id: walletId,
            name: walletInfo.name,
            isInstalled: () => installed,
            getProvider: () => undefined,
          };

          return (
            <WalletButton
              key={walletId}
              wallet={config}
              onClick={() => onSelect(walletId)}
              isInstalled={installed}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: '#9ca3af',
          }}
        >
          Powered by{' '}
          <a
            href="https://ethos.network"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#6366f1',
              textDecoration: 'none',
            }}
          >
            Ethos
          </a>
        </p>
      </div>
    </div>
  );
}
