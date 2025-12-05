/**
 * Login Option Button - Unified button for wallet/social options
 * With glassmorphism styling
 */

import type { LoginOptionButtonProps, ModalTheme, DEFAULT_THEME } from '../types';

const defaultTheme: ModalTheme = {
  modalBg: '#1c1c1e',
  cardBg: '#2c2c2e',
  textPrimary: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  borderColor: '#3f3f46',
  accentColor: '#6366f1',
  hoverBg: '#3f3f46',
  successColor: '#22c55e',
  errorColor: '#ef4444',
};

/**
 * Login option button with icon, name, and optional badge
 * Features glassmorphism effect on hover
 */
export function LoginOptionButton({
  id,
  name,
  icon,
  onClick,
  isAvailable = true,
  showIndicator = false,
  disabled = false,
  badge,
  theme = defaultTheme,
  className,
  style,
}: LoginOptionButtonProps) {
  const t = { ...defaultTheme, ...theme };
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '14px 16px',
        // Glassmorphism background
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateY(0)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.background = 'rgba(255, 255, 255, 0.08)';
          btn.style.borderColor = 'rgba(99, 102, 241, 0.5)';
          btn.style.transform = 'translateY(-1px)';
          btn.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        const btn = e.currentTarget as HTMLButtonElement;
        btn.style.background = 'rgba(255, 255, 255, 0.03)';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* Icon with optional indicator */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
          }}
        >
          {icon}
        </div>
        
        {/* Green indicator dot for installed wallets */}
        {showIndicator && (
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: t.successColor,
              border: `2px solid ${t.cardBg}`,
            }}
          />
        )}
      </div>

      {/* Name */}
      <span
        style={{
          flex: 1,
          textAlign: 'left',
          fontSize: '15px',
          fontWeight: 500,
          color: t.textPrimary,
        }}
      >
        {name}
      </span>

      {/* Badge (e.g., "Recent") */}
      {badge && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#a78bfa',
            background: 'rgba(139, 92, 246, 0.15)',
            padding: '4px 10px',
            borderRadius: '8px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
