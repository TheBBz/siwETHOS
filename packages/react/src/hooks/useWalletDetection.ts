/**
 * Hook for detecting installed wallets
 */

import { useState, useEffect, useCallback } from 'react';
import type { WalletId, UseWalletDetectionReturn } from '../types';

// Global types are automatically picked up from globals.d.ts

/**
 * Check if a specific wallet is installed
 */
function checkWalletInstalled(walletId: WalletId): boolean {
  if (typeof window === 'undefined') return false;

  const { ethereum, phantom, zerionWallet } = window;

  switch (walletId) {
    case 'metamask': {
      // Check for MetaMask specifically (not just any provider claiming to be)
      if (ethereum?.providers) {
        return ethereum.providers.some(p => p.isMetaMask && !p.isRabby && !p.isBraveWallet);
      }
      return !!(ethereum?.isMetaMask && !ethereum?.isRabby && !ethereum?.isBraveWallet);
    }

    case 'rabby': {
      if (ethereum?.providers) {
        return ethereum.providers.some(p => p.isRabby);
      }
      return !!ethereum?.isRabby;
    }

    case 'phantom': {
      return !!phantom?.ethereum;
    }

    case 'zerion': {
      return !!zerionWallet;
    }

    case 'coinbase': {
      if (ethereum?.providers) {
        return ethereum.providers.some(p => p.isCoinbaseWallet);
      }
      return !!ethereum?.isCoinbaseWallet;
    }

    case 'brave': {
      if (ethereum?.providers) {
        return ethereum.providers.some(p => p.isBraveWallet);
      }
      return !!ethereum?.isBraveWallet;
    }

    default:
      return false;
  }
}

/**
 * Get all detected wallet IDs
 */
function detectWallets(): WalletId[] {
  const walletIds: WalletId[] = ['metamask', 'rabby', 'phantom', 'zerion', 'coinbase', 'brave'];
  return walletIds.filter(checkWalletInstalled);
}

/**
 * Hook for detecting installed browser wallets
 * 
 * @returns Object with detected wallets and helper functions
 * 
 * @example
 * ```tsx
 * const { detectedWallets, isInstalled, isReady } = useWalletDetection();
 * 
 * if (isReady) {
 *   console.log('Detected wallets:', detectedWallets);
 *   console.log('MetaMask installed:', isInstalled('metamask'));
 * }
 * ```
 */
export function useWalletDetection(): UseWalletDetectionReturn {
  const [detectedWallets, setDetectedWallets] = useState<WalletId[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Detect wallets after mount (client-side only)
    const detected = detectWallets();
    setDetectedWallets(detected);
    setIsReady(true);

    // Re-detect on ethereum provider changes
    const handleProviderChange = () => {
      setDetectedWallets(detectWallets());
    };

    if (typeof window !== 'undefined' && window.ethereum) {
      // Some wallets emit events when they become available
      window.addEventListener('ethereum#initialized', handleProviderChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('ethereum#initialized', handleProviderChange);
      }
    };
  }, []);

  const isInstalled = useCallback((walletId: WalletId): boolean => {
    return detectedWallets.includes(walletId);
  }, [detectedWallets]);

  return {
    detectedWallets,
    isInstalled,
    isReady,
  };
}

export { checkWalletInstalled, detectWallets };
