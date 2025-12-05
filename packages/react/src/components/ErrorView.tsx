/**
 * Error View Component
 */

import type { ErrorViewProps, ModalTheme } from '../types';
import { DEFAULT_THEME } from '../types';

/**
 * Error icon
 */
function ErrorIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

/**
 * Error view showing error message with retry option
 */
export function ErrorView({
  message,
  onRetry,
  onBack,
  theme = DEFAULT_THEME,
  className = '',
  style,
}: ErrorViewProps) {
  const t = { ...DEFAULT_THEME, ...theme };
  
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        minHeight: '320px',
        ...style,
      }}
    >
      {/* Error icon */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: t.errorColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <ErrorIcon size={32} />
      </div>
      
      {/* Title */}
      <div
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: t.textPrimary,
          marginBottom: '8px',
        }}
      >
        Authentication Failed
      </div>
      
      {/* Error message */}
      <div
        style={{
          fontSize: '14px',
          color: t.textSecondary,
          maxWidth: '280px',
          marginBottom: '24px',
          lineHeight: 1.5,
        }}
      >
        {message}
      </div>
      
      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
        }}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: t.textPrimary,
              backgroundColor: t.cardBg,
              border: `1px solid ${t.borderColor}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background-color 0.15s ease',
            }}
          >
            Go Back
          </button>
        )}
        
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#ffffff',
              backgroundColor: t.accentColor,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background-color 0.15s ease',
            }}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
