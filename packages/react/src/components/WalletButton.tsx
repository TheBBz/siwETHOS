/**
 * Wallet Button Component
 */

import type { WalletButtonProps } from '../types';

/**
 * Individual wallet button for selection
 * 
 * @example
 * ```tsx
 * <WalletButton
 *   wallet={metamaskConfig}
 *   onClick={() => handleSelect('metamask')}
 *   isInstalled={true}
 * />
 * ```
 */
export function WalletButton({
  wallet,
  onClick,
  isInstalled = false,
  disabled = false,
  selected = false,
  className = '',
  style,
}: WalletButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '14px 16px',
    border: selected ? '2px solid #6366f1' : '1px solid #e5e7eb',
    borderRadius: '12px',
    backgroundColor: selected ? '#f5f3ff' : '#ffffff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
    fontSize: '15px',
    textAlign: 'left' as const,
  };

  const handleHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !selected) {
      (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1';
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fafafa';
    }
  };

  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !selected) {
      (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff';
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{ ...baseStyles, ...style }}
      onMouseEnter={handleHover}
      onMouseLeave={handleLeave}
    >
      {/* Wallet icon placeholder - users can provide custom icons */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 600,
        }}
      >
        {wallet.name.charAt(0)}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, color: '#1f2937' }}>
          {wallet.name}
        </div>
        {!isInstalled && (
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
            Not detected
          </div>
        )}
      </div>
      
      {isInstalled && (
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
          }}
        />
      )}
    </button>
  );
}
