/**
 * Sign In with Ethos Button
 * 
 * A pre-built button component that opens the auth modal.
 */

import { useState, useCallback } from 'react';
import type { AuthResult } from '@thebbz/siwe-ethos';
import { EthosAuthModal } from './modal/EthosAuthModal';
import type { SignInButtonProps } from './types';

/**
 * Pre-built Sign In button with integrated modal
 * 
 * @example
 * ```tsx
 * <SignInWithEthosButton
 *   onSuccess={(result) => {
 *     console.log('Welcome,', result.user.name);
 *   }}
 * >
 *   Sign in with Ethos
 * </SignInWithEthosButton>
 * ```
 */
export function SignInWithEthosButton({
  children = 'Sign in with Ethos',
  onSuccess,
  onError,
  authServerUrl,
  chainId,
  wallets,
  disabled = false,
  loading = false,
  className = '',
  style,
}: SignInButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = useCallback(() => {
    if (!disabled && !loading) {
      setIsOpen(true);
    }
  }, [disabled, loading]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSuccess = useCallback((result: AuthResult) => {
    setIsOpen(false);
    onSuccess?.(result);
  }, [onSuccess]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 24px',
          fontSize: '15px',
          fontWeight: 500,
          color: '#ffffff',
          backgroundColor: '#6366f1',
          border: 'none',
          borderRadius: '10px',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          fontFamily: 'inherit',
          transition: 'background-color 0.15s ease, transform 0.1s ease',
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !loading) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1';
        }}
        onMouseDown={(e) => {
          if (!disabled && !loading) {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
          }
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        {/* Ethos logo */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
        </svg>
        
        {loading ? (
          <span>Connecting...</span>
        ) : (
          children
        )}
      </button>

      <EthosAuthModal
        isOpen={isOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        onError={onError}
        authServerUrl={authServerUrl}
        chainId={chainId}
        wallets={wallets}
      />
    </>
  );
}
