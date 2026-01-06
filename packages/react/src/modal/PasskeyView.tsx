/**
 * PasskeyView - WebAuthn/Passkey authentication view
 *
 * Allows users to authenticate with an existing passkey
 * or register a new one.
 */

import { useState, useCallback } from 'react';
import { PasskeyIcon } from '../components/Icons';
import type { ModalTheme } from '../types';

interface PasskeyViewProps {
  /** Callback to authenticate with passkey */
  onAuthenticate: () => Promise<void>;
  /** Callback to register a new passkey */
  onRegister: (username: string) => Promise<void>;
  /** Go back to previous view */
  onBack: () => void;
  /** Whether WebAuthn is supported */
  isSupported: boolean;
  /** Theme customization */
  theme?: ModalTheme;
}

/**
 * Passkey authentication view
 */
export function PasskeyView({
  onAuthenticate,
  onRegister,
  onBack,
  isSupported,
  theme,
}: PasskeyViewProps) {
  const [mode, setMode] = useState<'select' | 'register'>('select');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthenticate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onAuthenticate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, [onAuthenticate]);

  const handleRegister = useCallback(async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await onRegister(username.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }, [onRegister, username]);

  if (!isSupported) {
    return (
      <div style={{ padding: '24px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: theme?.textSecondary || '#a1a1aa',
            cursor: 'pointer',
            padding: '4px 0',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '16px',
          }}>
            <PasskeyIcon size={32} />
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme?.textPrimary || '#ffffff',
            margin: '0 0 8px 0',
          }}>
            Passkeys Not Supported
          </h3>
          <p style={{
            fontSize: '14px',
            color: theme?.textSecondary || '#a1a1aa',
            margin: 0,
          }}>
            Your browser or device doesn't support passkeys.
            Try using a different browser or device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <button
        type="button"
        onClick={mode === 'register' ? () => setMode('select') : onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: theme?.textSecondary || '#a1a1aa',
          cursor: 'pointer',
          padding: '4px 0',
          fontSize: '14px',
          marginBottom: '16px',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Icon */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `rgba(99, 102, 241, 0.1)`,
          borderRadius: '16px',
        }}>
          <PasskeyIcon size={32} />
        </div>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: theme?.textPrimary || '#ffffff',
          margin: '0 0 8px 0',
        }}>
          {mode === 'select' ? 'Use a Passkey' : 'Create a Passkey'}
        </h2>
        <p style={{
          fontSize: '14px',
          color: theme?.textSecondary || '#a1a1aa',
          margin: 0,
        }}>
          {mode === 'select'
            ? 'Sign in securely with your fingerprint, face, or device PIN'
            : 'Create a passkey to sign in without a password'}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ef4444',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {mode === 'select' ? (
        /* Selection mode - choose authenticate or register */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={handleAuthenticate}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 20px',
              background: theme?.accentColor || '#6366f1',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Sign in with Passkey
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMode('register')}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: theme?.textPrimary || '#ffffff',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create new Passkey
          </button>
        </div>
      ) : (
        /* Register mode - enter username */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="passkey-username"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: theme?.textSecondary || '#a1a1aa',
                marginBottom: '8px',
              }}
            >
              Username
            </label>
            <input
              id="passkey-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a username"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: theme?.textPrimary || '#ffffff',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleRegister();
                }
              }}
            />
            <p style={{
              fontSize: '12px',
              color: theme?.textMuted || '#71717a',
              marginTop: '8px',
            }}>
              This will be your display name for this passkey
            </p>
          </div>

          <button
            type="button"
            onClick={handleRegister}
            disabled={isLoading || !username.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 20px',
              background: theme?.accentColor || '#6366f1',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isLoading || !username.trim() ? 'not-allowed' : 'pointer',
              opacity: isLoading || !username.trim() ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? 'Creating Passkey...' : 'Create Passkey'}
          </button>
        </div>
      )}

      {/* Help text */}
      <p style={{
        fontSize: '12px',
        color: theme?.textMuted || '#71717a',
        textAlign: 'center',
        marginTop: '24px',
      }}>
        Passkeys are a secure, passwordless way to sign in using your device's
        biometrics or PIN.
      </p>
    </div>
  );
}
