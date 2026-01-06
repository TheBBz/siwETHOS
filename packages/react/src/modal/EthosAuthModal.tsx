/**
 * Ethos Auth Modal - Main Component
 * Privy-style authentication modal with wallet + social login support
 */

import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { EthosWalletAuth, EthosAuth } from '@thebbz/siwe-ethos';
import type { AuthResult } from '@thebbz/siwe-ethos';

// WebAuthn helper functions
function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

async function isWebAuthnSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}
import { ModalOverlay } from './ModalOverlay';
import { MainSelectView } from './MainSelectView';
import { AllWalletsView } from './AllWalletsView';
import { AllSocialView } from './AllSocialView';
import { TelegramWidgetView, type TelegramAuthData } from './TelegramWidgetView';
import { PasskeyView } from './PasskeyView';
import { ProgressView } from '../components/ProgressView';
import { SuccessView } from '../components/SuccessView';
import { ErrorView } from '../components/ErrorView';
import { useEthosModal } from '../hooks/useEthosModal';
import { useRecentLogins } from '../hooks/useRecentLogins';
import { checkWalletInstalled } from '../hooks/useWalletDetection';
import { WALLET_ICONS, SOCIAL_ICONS } from '../components/Icons';
import { 
  getWalletProvider, 
  parseOAuthCode, 
  formatOAuthError, 
  clearOAuthParams 
} from '../utils';
import type { 
  EthosAuthModalProps, 
  WalletId,
  SocialProviderId,
} from '../types';
import { WALLETS, SOCIAL_PROVIDERS, DEFAULT_THEME } from '../types';

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
  telegramBotUsername,
  className,
  style,
}: EthosAuthModalProps) {
  const t = { ...DEFAULT_THEME, ...theme };
  const { state, actions } = useEthosModal();
  const { addRecentLogin } = useRecentLogins();

  // Track if we've already handled the initial error
  const initialErrorHandledRef = useRef(false);

  // WebAuthn support detection
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);
  useEffect(() => {
    isWebAuthnSupported().then(setWebAuthnSupported);
  }, []);

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
    const errorParam = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Handle OAuth errors first
    if (errorParam) {
      // Clean up URL parameters immediately
      clearOAuthParams(url);

      // Show error in modal using utility
      const errorMessage = formatOAuthError(errorParam, errorDescription);
      
      actions.setError(errorMessage);
      onError?.(new Error(errorMessage));
      return;
    }

    if (!code) return;

    // Show verifying state immediately
    actions.setView('verifying');
    actions.setStatus('verifying');

    // Parse the auth code using extracted utility
    const processCallback = async () => {
      // Small artificial delay to show the verifying animation (like Privy)
      await new Promise(resolve => setTimeout(resolve, 800));

      const parseResult = parseOAuthCode(code);
      
      if (!parseResult.success || !parseResult.user) {
        console.error('[EthosAuthModal] Failed to parse OAuth callback:', parseResult.error);
        actions.setError(parseResult.error || 'Failed to verify authentication');
        return;
      }

      const user = parseResult.user;

      // Clean up URL parameters
      clearOAuthParams(url);

      // Save to recent logins
      const providerId = (user.socialProvider || user.authMethod || 'discord') as SocialProviderId;
      addRecentLogin({
        type: 'social',
        id: providerId,
        name: SOCIAL_PROVIDERS[providerId]?.name || String(providerId),
        identifier: user.ethosUsername || user.name || user.socialId,
      });

      // Call onSuccess with the auth result
      const result: AuthResult = {
        accessToken: parseResult.accessToken!,
        tokenType: 'Bearer',
        expiresIn: parseResult.expiresIn || 3600,
        user,
      };

      // Update state and notify parent - show success view
      actions.setSuccess(user);
      onSuccess?.(result);
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
    if (providerId === 'telegram') {
      if (!telegramBotUsername) {
        actions.setError('Telegram login requires telegramBotUsername prop');
        return;
      }
      // Show Telegram widget view
      actions.setView('telegram-widget');
      return;
    }

    // Farcaster SIWF not yet implemented
    actions.setError(`${providerName} login is not yet implemented in the modal. Use the redirect flow.`);

  }, [socialAuth, actions, redirectUri, addRecentLogin, telegramBotUsername]);

  // Handle Telegram widget callback
  const handleTelegramAuth = useCallback(async (authData: TelegramAuthData) => {
    actions.setView('verifying');
    actions.setStatus('verifying');

    try {
      // Verify with server
      const result = await socialAuth.verifyTelegram(authData);

      // Save to recent logins
      const displayName = authData.last_name
        ? `${authData.first_name} ${authData.last_name}`
        : authData.first_name;

      addRecentLogin({
        type: 'social',
        id: 'telegram',
        name: 'Telegram',
        identifier: authData.username || displayName,
      });

      // Success
      actions.setSuccess(result.user);
      onSuccess?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Telegram authentication failed';
      actions.setError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [socialAuth, actions, addRecentLogin, onSuccess, onError]);

  // Handle passkey button click - show passkey view
  const handlePasskey = useCallback(() => {
    actions.setView('passkey');
  }, [actions]);

  // Handle passkey authentication
  const handlePasskeyAuth = useCallback(async () => {
    actions.setView('verifying');
    actions.setStatus('verifying');

    try {
      // Get authentication options from server
      const options = await socialAuth.getWebAuthnAuthenticationOptions();

      // Convert challenge from base64url to ArrayBuffer
      const challengeBuffer = base64UrlDecode(options.challenge);

      // Build WebAuthn options
      const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        challenge: challengeBuffer.buffer as ArrayBuffer,
        rpId: options.rpId,
        timeout: options.timeout || 60000,
        userVerification: options.userVerification || 'preferred',
        allowCredentials: options.allowCredentials?.map(cred => ({
          id: base64UrlDecode(cred.id).buffer as ArrayBuffer,
          type: cred.type,
          transports: cred.transports as AuthenticatorTransport[] | undefined,
        })),
      };

      // Call WebAuthn API
      const credential = await navigator.credentials.get({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('No credential returned');
      }

      const response = credential.response as AuthenticatorAssertionResponse;

      // Serialize credential for server
      const serializedCredential = {
        id: credential.id,
        rawId: base64UrlEncode(new Uint8Array(credential.rawId)),
        type: credential.type as 'public-key',
        response: {
          clientDataJSON: base64UrlEncode(new Uint8Array(response.clientDataJSON)),
          authenticatorData: base64UrlEncode(new Uint8Array(response.authenticatorData)),
          signature: base64UrlEncode(new Uint8Array(response.signature)),
          userHandle: response.userHandle
            ? base64UrlEncode(new Uint8Array(response.userHandle))
            : undefined,
        },
        authenticatorAttachment: credential.authenticatorAttachment as 'platform' | 'cross-platform' | undefined,
      };

      // Verify with server
      const result = await socialAuth.verifyWebAuthnAuthentication(serializedCredential);

      // Save to recent logins
      addRecentLogin({
        type: 'wallet',
        id: 'metamask', // Using metamask as placeholder for passkey
        name: 'Passkey',
        identifier: result.user.ethosUsername || result.user.name,
      });

      // Success
      actions.setSuccess(result.user);
      onSuccess?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Passkey authentication failed';

      // Check for user cancellation
      if (errorMessage.includes('cancelled') || errorMessage.includes('AbortError')) {
        actions.setView('passkey');
        return;
      }

      actions.setError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [socialAuth, actions, addRecentLogin, onSuccess, onError]);

  // Handle passkey registration
  const handlePasskeyRegister = useCallback(async (username: string) => {
    actions.setView('verifying');
    actions.setStatus('verifying');

    try {
      // Get registration options from server
      const options = await socialAuth.getWebAuthnRegistrationOptions(username);

      // Convert challenge and user ID from base64url to ArrayBuffer
      const challengeBuffer = base64UrlDecode(options.challenge);
      const userIdBuffer = base64UrlDecode(options.user.id);

      // Build WebAuthn options
      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge: challengeBuffer.buffer as ArrayBuffer,
        rp: options.rp,
        user: {
          id: userIdBuffer.buffer as ArrayBuffer,
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: options.pubKeyCredParams,
        timeout: options.timeout || 60000,
        authenticatorSelection: options.authenticatorSelection || {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
        attestation: options.attestation || 'none',
        excludeCredentials: options.excludeCredentials?.map(cred => ({
          id: base64UrlDecode(cred.id).buffer as ArrayBuffer,
          type: cred.type,
          transports: cred.transports as AuthenticatorTransport[] | undefined,
        })),
      };

      // Call WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('No credential returned');
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Serialize credential for server
      const serializedCredential = {
        id: credential.id,
        rawId: base64UrlEncode(new Uint8Array(credential.rawId)),
        type: credential.type as 'public-key',
        response: {
          clientDataJSON: base64UrlEncode(new Uint8Array(response.clientDataJSON)),
          attestationObject: base64UrlEncode(new Uint8Array(response.attestationObject)),
          transports: (response as AuthenticatorAttestationResponse & { getTransports?: () => string[] }).getTransports?.(),
        },
        authenticatorAttachment: credential.authenticatorAttachment as 'platform' | 'cross-platform' | undefined,
      };

      // Verify with server
      const result = await socialAuth.verifyWebAuthnRegistration(serializedCredential);

      // Save to recent logins
      addRecentLogin({
        type: 'wallet',
        id: 'metamask', // Using metamask as placeholder for passkey
        name: 'Passkey',
        identifier: username,
      });

      // Success
      actions.setSuccess(result.user);
      onSuccess?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Passkey registration failed';

      // Check for user cancellation
      if (errorMessage.includes('cancelled') || errorMessage.includes('AbortError')) {
        actions.setView('passkey');
        return;
      }

      actions.setError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [socialAuth, actions, addRecentLogin, onSuccess, onError]);

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
            onPasskey={handlePasskey}
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

      case 'telegram-widget':
        return telegramBotUsername ? (
          <TelegramWidgetView
            botUsername={telegramBotUsername}
            onAuth={handleTelegramAuth}
            onBack={actions.goBack}
            theme={t}
          />
        ) : null;

      case 'passkey':
        return (
          <PasskeyView
            onAuthenticate={handlePasskeyAuth}
            onRegister={handlePasskeyRegister}
            onBack={actions.goBack}
            isSupported={webAuthnSupported}
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
