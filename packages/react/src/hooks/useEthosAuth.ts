/**
 * Main hook for Ethos authentication
 */

import { useCallback, useMemo } from 'react';
import { EthosWalletAuth } from '@thebbz/siwe-ethos';
import { useEthosModal } from './useEthosModal';
import { checkWalletInstalled } from './useWalletDetection';
import type { 
  UseEthosAuthOptions, 
  UseEthosAuthReturn, 
  WalletId 
} from '../types';
import type { EthereumProvider } from '../globals.d';

/**
 * Get the provider for a specific wallet
 */
function getWalletProvider(walletId: WalletId): EthereumProvider | null {
  if (typeof window === 'undefined') return null;

  const { ethereum, phantom, zerionWallet } = window;

  switch (walletId) {
    case 'metamask': {
      if (ethereum?.providers) {
        const provider = ethereum.providers.find(
          p => p.isMetaMask && !p.isRabby && !p.isBraveWallet
        );
        if (provider) return provider;
      }
      if (ethereum?.isMetaMask && !ethereum?.isRabby && !ethereum?.isBraveWallet) {
        return ethereum;
      }
      return null;
    }

    case 'rabby': {
      if (ethereum?.providers) {
        const provider = ethereum.providers.find(p => p.isRabby);
        if (provider) return provider;
      }
      if (ethereum?.isRabby) return ethereum;
      return null;
    }

    case 'phantom': {
      return phantom?.ethereum as EthereumProvider ?? null;
    }

    case 'zerion': {
      return zerionWallet as EthereumProvider ?? null;
    }

    case 'coinbase': {
      if (ethereum?.providers) {
        const provider = ethereum.providers.find(p => p.isCoinbaseWallet);
        if (provider) return provider;
      }
      if (ethereum?.isCoinbaseWallet) return ethereum;
      return null;
    }

    case 'brave': {
      if (ethereum?.providers) {
        const provider = ethereum.providers.find(p => p.isBraveWallet);
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
 * Connect to a wallet and get account
 */
async function connectWallet(provider: EthereumProvider): Promise<string> {
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
async function signMessage(provider: EthereumProvider, address: string, message: string): Promise<string> {
  const signature = await provider.request({
    method: 'personal_sign',
    params: [message, address],
  }) as string;
  
  return signature;
}

/**
 * Hook for Ethos wallet authentication
 * 
 * Provides a complete authentication flow with modal management.
 * 
 * @param options - Configuration options
 * @returns Authentication state and methods
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { signIn, isOpen, user, Modal } = useEthosAuth({
 *     onSuccess: (result) => {
 *       console.log('Welcome,', result.user.name);
 *     }
 *   });
 * 
 *   return (
 *     <>
 *       <button onClick={signIn}>Sign in with Ethos</button>
 *       <Modal />
 *     </>
 *   );
 * }
 * ```
 */
export function useEthosAuth(options: UseEthosAuthOptions = {}): UseEthosAuthReturn {
  const {
    authServerUrl,
    chainId,
    wallets: _allowedWallets,
    onSuccess,
    onError,
  } = options;

  const { state, actions } = useEthosModal();

  const auth = useMemo(() => 
    EthosWalletAuth.init({
      authServerUrl,
      chainId,
    }), [authServerUrl, chainId]
  );

  const handleWalletSelect = useCallback(async (walletId: WalletId) => {
    // Check if wallet is installed
    if (!checkWalletInstalled(walletId)) {
      actions.setError(`${walletId} is not installed`);
      return;
    }

    const provider = getWalletProvider(walletId);
    if (!provider) {
      actions.setError(`Could not connect to ${walletId}`);
      return;
    }

    actions.selectWallet(walletId);

    try {
      // Step 1: Connect wallet
      actions.setStatus('connecting');
      const address = await connectWallet(provider);

      // Step 2: Get nonce and create message
      actions.setStatus('signing');
      const { nonce } = await auth.getNonce();
      const { messageString } = auth.createMessage(address, nonce);

      // Step 3: Sign message
      const signature = await signMessage(provider, address, messageString);

      // Step 4: Verify with server
      actions.setStatus('verifying');
      const result = await auth.verify({
        message: messageString,
        signature,
        address,
      });

      // Success!
      actions.setSuccess(result.user);
      onSuccess?.(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      
      // Check for user rejection
      if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
        actions.setError('Request was cancelled');
      } else {
        actions.setError(errorMessage);
      }
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [auth, actions, onSuccess, onError]);

  // Create Modal component that uses current state
  const Modal = useCallback(() => {
    // This is a placeholder - the actual Modal component will be imported
    // and rendered with the current state
    return null;
  }, []);

  return {
    signIn: actions.open,
    close: actions.close,
    isOpen: state.isOpen,
    status: state.status,
    user: state.user,
    error: state.error,
    Modal,
    // Expose internal state and actions for custom implementations
    _state: state,
    _actions: { ...actions, handleWalletSelect },
  } as UseEthosAuthReturn & {
    _state: typeof state;
    _actions: typeof actions & { handleWalletSelect: typeof handleWalletSelect };
  };
}
