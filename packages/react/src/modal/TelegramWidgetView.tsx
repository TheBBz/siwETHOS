/**
 * TelegramWidgetView - Telegram Login Widget integration
 *
 * Loads the official Telegram Login Widget script and handles
 * the authentication callback.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { ModalTheme } from '../types';

/**
 * Telegram auth data from widget callback
 */
export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramWidgetViewProps {
  /** Telegram bot username */
  botUsername: string;
  /** Callback when auth data is received */
  onAuth: (data: TelegramAuthData) => void;
  /** Go back to previous view */
  onBack: () => void;
  /** Theme customization */
  theme?: ModalTheme;
}

// Extend window for Telegram callback
declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthData) => void;
  }
}

/**
 * Telegram Login Widget View
 *
 * Renders the official Telegram Login Widget inline in the modal.
 * The widget opens a Telegram popup for authentication.
 */
export function TelegramWidgetView({
  botUsername,
  onAuth,
  onBack,
  theme,
}: TelegramWidgetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  // Memoize callback to avoid re-creating
  const handleAuth = useCallback((user: TelegramAuthData) => {
    onAuth(user);
  }, [onAuth]);

  useEffect(() => {
    if (!containerRef.current || scriptLoadedRef.current) return;

    // Set up global callback before loading script
    window.onTelegramAuth = handleAuth;

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    containerRef.current.appendChild(script);
    scriptLoadedRef.current = true;

    return () => {
      // Clean up global callback
      delete window.onTelegramAuth;
    };
  }, [botUsername, handleAuth]);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
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

        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: theme?.textPrimary || '#ffffff',
          margin: '0 0 8px 0',
        }}>
          Sign in with Telegram
        </h2>

        <p style={{
          fontSize: '14px',
          color: theme?.textSecondary || '#a1a1aa',
          margin: 0,
        }}>
          Click the button below to authenticate with Telegram
        </p>
      </div>

      {/* Widget container */}
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80px',
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      />

      {/* Help text */}
      <p style={{
        fontSize: '12px',
        color: theme?.textMuted || '#71717a',
        textAlign: 'center',
        marginTop: '16px',
      }}>
        A Telegram popup will open for authentication.
        <br />
        Make sure popups are enabled for this site.
      </p>
    </div>
  );
}
