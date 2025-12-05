/**
 * Ethos Auth Modal - Main Component
 * Privy-style authentication modal with wallet + social login support
 */

import { useCallback, useMemo, useEffect, useRef } from 'react';
import { EthosWalletAuth, EthosAuth } from '@thebbz/siwe-ethos';
import type { AuthResult } from '@thebbz/siwe-ethos';
import { ModalOverlay } from './ModalOverlay';
import { MainSelectView } from './MainSelectView';
import { AllWalletsView } from './AllWalletsView';
import { AllSocialView } from './AllSocialView';
import { ProgressView } from '../components/ProgressView';
import { SuccessView } from '../components/SuccessView';
import { ErrorView } from '../components/ErrorView';
import { useEthosModal } from '../hooks/useEthosModal';
import { useRecentLogins } from '../hooks/useRecentLogins';
import { checkWalletInstalled } from '../hooks/useWalletDetection';
import { WALLET_ICONS, SOCIAL_ICONS } from '../components/Icons';
import type { 
  EthosAuthModalProps, 
  WalletId,
  SocialProviderId,
  EthosUser,
} from '../types';
import { WALLETS, SOCIAL_PROVIDERS, DEFAULT_THEME } from '../types';

// Ethereum provider type
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isBraveWallet?: boolean;
  isCoinbaseWallet?: boolean;
  providers?: EthereumProvider[];
}

/**
 * Get the provider for a specific wallet
 */
function getWalletProvider(walletId: WalletId): EthereumProvider | null {
  if (typeof window === 'undefined') return null;

  const ethereum = (window as { ethereum?: EthereumProvider }).ethereum;
  const phantom = (window as { phantom?: { ethereum?: EthereumProvider } }).phantom;
  const zerionWallet = (window as { zerionWallet?: EthereumProvider }).zerionWallet;

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
      return phantom?.ethereum ?? null;
    }

    case 'zerion': {
      return zerionWallet ?? null;
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
 * Ethos Auth Modal
 * 
 * A Privy-style authentication modal supporting:
 * - Recent login methods
 * - Wallet connections (MetaMask, Rabby, Phantom, etc.)
 * - Social logins (Twitter, Discord, Telegram, Farcaster)
 */
export function EthosAuthModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  initialError,
  authServerUrl,
  chainId,
  statement,
  wallets,
  socialProviders,
  showRecent = true,
  maxRecent = 3,
  showScore = true,
  title,
  theme = DEFAULT_THEME,
  portalTarget,
  disablePortal,
  redirectUri,
  showPasskey = false,
  termsUrl,
  privacyUrl,
  className,
  style,
}: EthosAuthModalProps) {
  const t = { ...DEFAULT_THEME, ...theme };
  const { state, actions } = useEthosModal();
  const { addRecentLogin } = useRecentLogins();
  
  // Track if we've already handled the initial error
  const initialErrorHandledRef = useRef(false);

  // Initialize auth clients
  const walletAuth = useMemo(() => EthosWalletAuth.init({
    authServerUrl,
    chainId,
    statement,
  }), [authServerUrl, chainId, statement]);

  const socialAuth = useMemo(() => EthosAuth.init({
    authServerUrl,
  }), [authServerUrl]);

  // Reset the initial error handled flag when modal closes or initialError changes
  useEffect(() => {
    if (!isOpen) {
      initialErrorHandledRef.current = false;
    }
  }, [isOpen]);

  // Handle initialError prop - show error immediately when modal opens with initial error
  // Only run once per modal open to prevent re-showing error after goBack
  useEffect(() => {
    if (isOpen && initialError && !initialErrorHandledRef.current) {
      initialErrorHandledRef.current = true;
      actions.setError(initialError);
      onError?.(new Error(initialError));
    }
  }, [isOpen, initialError, actions, onError]);

  // Handle OAuth callback - check for code or error parameter in URL
  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen) return;

    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const errorParam = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Handle OAuth errors first
    if (errorParam) {
      // Clean up URL parameters immediately
      url.searchParams.delete('error');
      url.searchParams.delete('error_description');
      url.searchParams.delete('state');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));

      // Show error in modal
      const errorMessage = errorDescription || 
        (errorParam === 'no_ethos_profile' 
          ? 'No Ethos profile found. Please connect your account on ethos.network first.'
          : `Authentication failed: ${errorParam}`);
      
      actions.setError(errorMessage);
      onError?.(new Error(errorMessage));
      return;
    }

    if (!code) return;

    // Show verifying state immediately
    actions.setView('verifying');
    actions.setStatus('verifying');

    // Helper to decode base64url with proper UTF-8 support
    const decodeBase64Url = (str: string): string => {
      // Convert base64url to base64
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      // Decode base64 to binary string
      const binary = atob(base64);
      // Convert binary string to UTF-8
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    };

    // Parse the auth code (it's a base64url encoded JWT)
    // Small delay to show the "Confirming" state like Privy does
    const processCallback = async () => {
      try {
        // Parse the outer JSON wrapper first
        let payload: Record<string, unknown>;
        
        // The code could be a JSON object encoded as base64url
        try {
          const decoded = decodeBase64Url(code);
          const parsed = JSON.parse(decoded);
          
          // If it's our wrapper format with user data
          if (parsed.user) {
            payload = parsed.user;
          } else if (parsed.accessToken) {
            // Decode the inner JWT
            const [, innerPayloadB64] = parsed.accessToken.split('.');
            if (innerPayloadB64) {
              payload = JSON.parse(decodeBase64Url(innerPayloadB64));
            } else {
              payload = parsed;
            }
          } else {
            payload = parsed;
          }
        } catch {
          // Try parsing as JWT directly
          const [, payloadB64] = code.split('.');
          if (!payloadB64) return;
          payload = JSON.parse(decodeBase64Url(payloadB64));
        }

        // Small artificial delay to show the verifying animation (like Privy)
        await new Promise(resolve => setTimeout(resolve, 800));

        // Extract user data from the token (matching EthosUser type)
        const authMethod = (payload.authMethod || payload.socialProvider || 'discord') as 'wallet' | 'twitter' | 'discord' | 'telegram' | 'farcaster';
        const socialProvider = (payload.socialProvider || payload.authMethod) as 'twitter' | 'discord' | 'telegram' | 'farcaster' | undefined;
        
        // Generate profile URL if not provided in payload
        // Format: https://app.ethos.network/profile/{provider}/{username}
        const provider = (payload.socialProvider as string) || (payload.authMethod as string) || 'eth';
        const profileUrl = (payload.profileUrl as string) || 
          `https://app.ethos.network/profile/${provider}/${(payload.ethosUsername as string) || (payload.ethosProfileId as number)}`;
        
        const user: EthosUser = {
          sub: (payload.sub as string) || `ethos:${(payload as Record<string, unknown>).ethosProfileId || 0}`,
          name: (payload.name as string) || '',
          picture: (payload.picture as string) || null,
          ethosProfileId: (payload.ethosProfileId as number) || 0,
          ethosUsername: (payload.ethosUsername as string) || null,
          ethosScore: (payload.ethosScore as number) || 0,
          ethosStatus: (payload.ethosStatus as string) || 'UNKNOWN',
          ethosAttestations: (payload.ethosAttestations as string[]) || [],
          authMethod,
          socialProvider,
          socialId: (payload.socialId as string) || (payload.sub as string),
          profileUrl,
        };

        // Clean up URL parameters
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        window.history.replaceState({}, '', url.pathname + (url.search || ''));

        // Save to recent logins
        const providerId = (payload.socialProvider || payload.authMethod || 'discord') as SocialProviderId;
        addRecentLogin({
          type: 'social',
          id: providerId,
          name: SOCIAL_PROVIDERS[providerId]?.name || String(providerId),
          identifier: user.ethosUsername || user.name || user.socialId,
        });

        // Call onSuccess with the auth result
        const result: AuthResult = {
          accessToken: code,
          tokenType: 'Bearer',
          expiresIn: (payload.exp as number) ? (payload.exp as number) - Math.floor(Date.now() / 1000) : 3600,
          user,
        };

        // Update state and notify parent - show success view
        actions.setSuccess(user);
        onSuccess?.(result);
      } catch (e) {
        console.error('[EthosAuthModal] Failed to parse OAuth callback:', e);
        actions.setError('Failed to verify authentication');
      }
    };

    processCallback();
  }, [isOpen, actions, addRecentLogin, onSuccess, onError]);

  // Get method name for current selection
  const getMethodName = useCallback(() => {
    if (!state.selectedMethod) return '';
    const { type, id } = state.selectedMethod;
    if (type === 'wallet') {
      return WALLETS[id as WalletId]?.name || id;
    }
    return SOCIAL_PROVIDERS[id as SocialProviderId]?.name || id;
  }, [state.selectedMethod]);

  // Get method icon for current selection
  const getMethodIcon = useCallback(() => {
    if (!state.selectedMethod) return null;
    const { type, id } = state.selectedMethod;
    if (type === 'wallet') {
      const Icon = WALLET_ICONS[id as WalletId];
      return Icon ? <Icon /> : null;
    }
    const Icon = SOCIAL_ICONS[id as SocialProviderId];
    return Icon ? <Icon /> : null;
  }, [state.selectedMethod]);

  // Handle wallet selection and connection
  const handleWalletSelect = useCallback(async (walletId: WalletId) => {
    const walletName = WALLETS[walletId]?.name || walletId;
    
    // Check if wallet is installed
    if (!checkWalletInstalled(walletId)) {
      actions.setError(`${walletName} is not installed`);
      return;
    }

    const provider = getWalletProvider(walletId);
    if (!provider) {
      actions.setError(`Could not connect to ${walletName}`);
      return;
    }

    actions.selectWallet(walletId);

    try {
      // Step 1: Connect wallet
      actions.setStatus('connecting');
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      }) as string[];
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet');
      }
      const address = accounts[0];

      // Step 2: Get nonce and create message
      actions.setStatus('signing');
      const { nonce } = await walletAuth.getNonce();
      const { messageString } = walletAuth.createMessage(address, nonce);

      // Step 3: Sign message
      const signature = await provider.request({
        method: 'personal_sign',
        params: [messageString, address],
      }) as string;

      // Step 4: Verify with server
      actions.setStatus('verifying');
      const result = await walletAuth.verify({
        message: messageString,
        signature,
        address,
      });

      // Save to recent logins
      addRecentLogin({
        type: 'wallet',
        id: walletId,
        name: walletName,
        identifier: `${address.slice(0, 6)}...${address.slice(-4)}`,
      });

      // Success!
      actions.setSuccess(result.user);
      onSuccess?.(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      
      // Check for user rejection
      if (errorMessage.includes('rejected') || errorMessage.includes('denied') || errorMessage.includes('cancelled')) {
        actions.setError('Request was cancelled');
      } else {
        actions.setError(errorMessage);
      }
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [walletAuth, actions, onSuccess, onError, addRecentLogin]);

  // Handle social provider selection
  const handleSocialSelect = useCallback(async (providerId: SocialProviderId) => {
    const providerName = SOCIAL_PROVIDERS[providerId]?.name || providerId;
    
    actions.selectSocial(providerId);

    // For OAuth providers, redirect to auth URL
    const provider = SOCIAL_PROVIDERS[providerId];
    if (provider?.isOAuth) {
      actions.setStatus('connecting');
      
      // Build redirect URI
      const callbackUri = redirectUri || (typeof window !== 'undefined' ? window.location.href : '');
      
      // Use provider ID directly - SDK now supports twitter, discord, telegram, farcaster
      if (providerId === 'twitter' || providerId === 'discord' || providerId === 'telegram' || providerId === 'farcaster') {
        const authUrl = socialAuth.getAuthUrl(providerId, {
          redirectUri: callbackUri,
          state: crypto.randomUUID(),
        });
        
        // Save to recent before redirect
        addRecentLogin({
          type: 'social',
          id: providerId,
          name: providerName,
        });
        
        // Redirect to OAuth
        window.location.href = authUrl;
      }
      return;
    }

    // For non-OAuth providers (Telegram widget, Farcaster SIWF)
    // These need special handling
    actions.setStatus('connecting');
    
    // TODO: Implement Telegram widget and Farcaster SIWF flows
    actions.setError(`${providerName} login is not yet implemented in the modal. Use the redirect flow.`);
    
  }, [socialAuth, actions, redirectUri, addRecentLogin]);

  // Handle close with reset
  const handleClose = useCallback(() => {
    actions.reset();
    onClose();
  }, [actions, onClose]);

  // Retry handler - goes back to main view to let user try again
  const handleRetry = useCallback(() => {
    if (state.selectedMethod) {
      // If user selected a method, retry that specific method
      if (state.selectedMethod.type === 'wallet') {
        handleWalletSelect(state.selectedMethod.id as WalletId);
      } else {
        handleSocialSelect(state.selectedMethod.id as SocialProviderId);
      }
    } else {
      // If no method was selected (e.g., error from OAuth redirect), go back to main
      actions.goBack();
    }
  }, [state.selectedMethod, handleWalletSelect, handleSocialSelect, actions]);

  // Render current view
  const renderView = () => {
    switch (state.view) {
      case 'main':
        return (
          <MainSelectView
            wallets={wallets}
            socialProviders={socialProviders}
            showRecent={showRecent}
            maxRecent={maxRecent}
            onSelectWallet={handleWalletSelect}
            onSelectSocial={handleSocialSelect}
            onShowAllWallets={() => actions.setView('all-wallets')}
            onShowAllSocial={() => actions.setView('all-social')}
            showPasskey={showPasskey}
            title={title}
            termsUrl={termsUrl}
            privacyUrl={privacyUrl}
            theme={t}
          />
        );
      
      case 'all-wallets':
        return (
          <AllWalletsView
            wallets={wallets}
            onSelect={handleWalletSelect}
            onBack={actions.goBack}
            theme={t}
          />
        );
      
      case 'all-social':
        return (
          <AllSocialView
            providers={socialProviders}
            onSelect={handleSocialSelect}
            onBack={actions.goBack}
            theme={t}
          />
        );
      
      case 'connecting':
      case 'signing':
      case 'verifying':
        return (
          <ProgressView
            status={state.status}
            methodName={getMethodName()}
            methodIcon={getMethodIcon()}
            onBack={actions.goBack}
            theme={t}
          />
        );
      
      case 'success':
        return state.user ? (
          <SuccessView
            user={state.user}
            showScore={showScore}
            onContinue={handleClose}
            theme={t}
          />
        ) : null;
      
      case 'error':
        return (
          <ErrorView
            message={state.error || 'Something went wrong'}
            onRetry={handleRetry}
            onBack={actions.goBack}
            theme={t}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={handleClose}
      portalTarget={portalTarget}
      disablePortal={disablePortal}
    >
      <div 
        className={className} 
        style={{
          // Glassmorphism background
          background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.95) 0%, rgba(20, 20, 25, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          position: 'relative',
          minWidth: '360px',
          maxWidth: '400px',
          // Subtle border glow effect
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
          `,
          ...style,
        }}
      >
        {/* Close button - Glassmorphism style */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.6)',
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = 'rgba(255, 255, 255, 0.1)';
            btn.style.color = 'rgba(255, 255, 255, 0.9)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = 'rgba(255, 255, 255, 0.05)';
            btn.style.color = 'rgba(255, 255, 255, 0.6)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {renderView()}
      </div>
    </ModalOverlay>
  );
}
