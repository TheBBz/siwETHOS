/**
 * Progress View Component
 */

import type { ProgressViewProps, ConnectionStatus, ModalTheme } from '../types';
import { DEFAULT_THEME } from '../types';

const STATUS_MESSAGES: Record<ConnectionStatus, string> = {
  idle: 'Ready to connect',
  connecting: 'Connecting...',
  signing: 'Please sign the message',
  verifying: 'Confirming authentication...',
  success: 'Successfully authenticated!',
  error: 'Something went wrong',
};

const STATUS_DESCRIPTIONS: Record<ConnectionStatus, string> = {
  idle: 'Click to connect your wallet',
  connecting: 'Please approve the connection request',
  signing: 'Sign the message to prove ownership',
  verifying: 'Verifying your identity with Ethos',
  success: 'You have been authenticated',
  error: 'Please try again',
};

/**
 * Spinner component
 */
function Spinner({ size = 48, color = '#6366f1' }: { size?: number; color?: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        style={{
          animation: 'spin 1s linear infinite',
        }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          style={{
            color: 'rgba(255,255,255,0.2)',
          }}
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="80, 200"
          strokeDashoffset="0"
        />
      </svg>
    </div>
  );
}

/**
 * Progress view showing connection status
 */
export function ProgressView({
  status,
  methodName,
  methodIcon,
  onBack,
  theme = DEFAULT_THEME,
  className = '',
  style,
}: ProgressViewProps) {
  const t = { ...DEFAULT_THEME, ...theme };
  const canGoBack = status !== 'verifying' && status !== 'success';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        minHeight: '320px',
        ...style,
      }}
    >
      {/* Method icon or spinner */}
      <div
        style={{
          marginBottom: '24px',
          position: 'relative',
        }}
      >
        {status === 'connecting' || status === 'signing' || status === 'verifying' ? (
          <Spinner size={64} color={t.accentColor} />
        ) : (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: t.cardBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {methodIcon}
          </div>
        )}
      </div>
      
      {/* Status message */}
      <div
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: t.textPrimary,
        }}
      >
        {STATUS_MESSAGES[status]}
      </div>
      
      {/* Description */}
      <div
        style={{
          marginTop: '8px',
          fontSize: '14px',
          color: t.textSecondary,
          maxWidth: '280px',
        }}
      >
        {STATUS_DESCRIPTIONS[status]}
      </div>
      
      {/* Method name */}
      {methodName && (
        <div
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: t.cardBg,
            borderRadius: '8px',
            fontSize: '13px',
            color: t.textSecondary,
          }}
        >
          {methodName}
        </div>
      )}
      
      {/* Back button */}
      {canGoBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            marginTop: '24px',
            padding: '8px 16px',
            fontSize: '14px',
            color: t.accentColor,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ← Choose a different method
        </button>
      )}
      
      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
