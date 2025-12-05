/**
 * Success View Component
 * Matches the v1 design with "Connected" header and profile card
 */

import type { SuccessViewProps, ModalTheme } from '../types';
import { getScoreColor, getScoreLabel, DEFAULT_THEME } from '../types';

/**
 * Checkmark icon
 */
function CheckIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Arrow icon for "View profile" link
 */
function ArrowRightIcon({ size = 16 }: { size?: number }) {
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
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/**
 * Ethos shield icon
 */
function EthosShieldIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4zm0 18c-3.07-1.14-6-5.22-6-9.5V7.3l6-3 6 3v3.2c0 4.28-2.93 8.36-6 9.5z"/>
      <path d="M10 14.5l-2-2 1.4-1.4.6.6 2.6-2.6 1.4 1.4-4 4z"/>
    </svg>
  );
}

/**
 * Success view showing authenticated user - v1 design
 */
export function SuccessView({
  user,
  showScore = true,
  onContinue,
  theme = DEFAULT_THEME,
  className = '',
  style,
}: SuccessViewProps) {
  const t = { ...DEFAULT_THEME, ...theme };
  const scoreColor = getScoreColor(user.ethosScore);
  const scoreLabel = getScoreLabel(user.ethosScore);
  
  // Generate profile URL if not provided
  const profileUrl = (user as unknown as { profileUrl?: string }).profileUrl || 
    `https://ethos.network/u/${user.ethosUsername || user.ethosProfileId}`;
  
  // Format wallet address if available
  const shortAddress = user.walletAddress 
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : null;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 24px',
        textAlign: 'center',
        ...style,
      }}
    >
      {/* Success checkmark */}
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          color: t.successColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <CheckIcon size={28} />
      </div>
      
      {/* Welcome text */}
      <div
        style={{
          fontSize: '22px',
          fontWeight: 600,
          color: t.textPrimary,
          marginBottom: '4px',
        }}
      >
        Welcome!
      </div>
      
      <div
        style={{
          fontSize: '14px',
          color: t.textSecondary,
          marginBottom: '24px',
        }}
      >
        Signed in with Ethos
      </div>
      
      {/* Profile card */}
      <div
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '16px',
          backgroundColor: t.cardBg,
          border: `1px solid ${t.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {/* Avatar */}
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${t.borderColor}`,
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: t.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {user.name?.charAt(0) || '?'}
          </div>
        )}
        
        {/* Name and address/username */}
        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: t.textPrimary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user.name}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: t.textSecondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {shortAddress || (user.ethosUsername ? `@${user.ethosUsername}` : `Profile #${user.ethosProfileId}`)}
          </div>
        </div>
        
        {/* Score */}
        {showScore && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: t.textPrimary,
              }}
            >
              {user.ethosScore}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: scoreColor,
                fontWeight: 500,
              }}
            >
              {scoreLabel}
            </div>
          </div>
        )}
      </div>
      
      {/* Continue button */}
      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          style={{
            width: '100%',
            padding: '14px 24px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: t.accentColor,
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s ease',
            marginBottom: '16px',
          }}
        >
          Continue
        </button>
      )}
      
      {/* View profile link */}
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: t.accentColor,
          textDecoration: 'none',
          fontWeight: 500,
          marginBottom: '20px',
        }}
      >
        View profile <ArrowRightIcon size={14} />
      </a>
      
      {/* Protected by Ethos footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: t.textSecondary,
          paddingTop: '16px',
          borderTop: `1px solid ${t.borderColor}`,
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <span>Protected by</span>
        <span style={{ color: t.accentColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <EthosShieldIcon size={14} />
          Ethos
        </span>
      </div>
    </div>
  );
}
