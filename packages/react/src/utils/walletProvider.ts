/**
 * Wallet Provider Utilities
 * 
 * Helper functions for detecting and retrieving wallet providers
 */

import type { WalletId } from '../types';
import type { EthereumProvider } from '../globals.d';

/**
 * Get the provider for a specific wallet
 * Handles multi-wallet environments and provider detection
 */
export function getWalletProvider(walletId: WalletId): EthereumProvider | null {
  if (typeof window === 'undefined') return null;

  const { ethereum, phantom, zerionWallet } = window;

  switch (walletId) {
    case 'metamask': {
      // Check providers array first (multi-wallet environment)
      if (ethereum?.providers) {
        const provider = ethereum.providers.find(
          (p: EthereumProvider) => p.isMetaMask && !p.isRabby && !p.isBraveWallet
        );
        if (provider) return provider;
      }
      // Fall back to direct ethereum check
      if (ethereum?.isMetaMask && !ethereum?.isRabby && !ethereum?.isBraveWallet) {
        return ethereum;
      }
      return null;
    }

    case 'rabby': {
      if (ethereum?.providers) {
        const provider = ethereum.providers.find((p: EthereumProvider) => p.isRabby);
        if (provider) return provider;
      }
      if (ethereum?.isRabby) return ethereum;
      return null;
    }

    case 'phantom': {
      return (phantom?.ethereum as EthereumProvider) ?? null;
    }

    case 'zerion': {
      return (zerionWallet as EthereumProvider) ?? null;
    }

    case 'coinbase': {
      if (ethereum?.providers) {
        const provider = ethereum.providers.find((p: EthereumProvider) => p.isCoinbaseWallet);
        if (provider) return provider;
      }
      if (ethereum?.isCoinbaseWallet) return ethereum;
      return null;
    }

    case 'brave': {
      if (ethereum?.providers) {
        const provider = ethereum.providers.find((p: EthereumProvider) => p.isBraveWallet);
        if (provider) return provider;
      }
      if (ethereum?.isBraveWallet) return ethereum;
      return null;
    }

    default:
      return null;
  }
}

/**
 * Connect to a wallet and get the first account
 */
export async function connectWallet(provider: EthereumProvider): Promise<string> {
  const accounts = await provider.request({ 
    method: 'eth_requestAccounts' 
  }) as string[];
  
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts returned from wallet');
  }
  
  return accounts[0];
}

/**
 * Sign a message with the wallet
 */
export async function signMessage(
  provider: EthereumProvider, 
  address: string, 
  message: string
): Promise<string> {
  const signature = await provider.request({
    method: 'personal_sign',
    params: [message, address],
  }) as string;
  
  return signature;
}
