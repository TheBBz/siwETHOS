/**
 * All Social View - Shows all available social login options
 */

import { LoginOptionButton } from '../components/LoginOptionButton';
import { SOCIAL_ICONS } from '../components/Icons';
import type { SocialProviderId, ModalTheme } from '../types';
import { SOCIAL_PROVIDERS, DEFAULT_THEME } from '../types';

interface AllSocialViewProps {
  /** Social providers to show */
  providers?: SocialProviderId[];
  /** Provider selection handler */
  onSelect: (providerId: SocialProviderId) => void;
  /** Go back handler */
  onBack: () => void;
  /** Theme */
  theme?: ModalTheme;
}

// All available social providers
const ALL_PROVIDERS: SocialProviderId[] = ['twitter', 'discord', 'telegram', 'farcaster'];

/**
 * Back button component
 */
function BackButton({ onClick, theme }: { onClick: () => void; theme: ModalTheme }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 0',
        background: 'none',
        border: 'none',
        color: theme.textSecondary,
        fontSize: '14px',
        cursor: 'pointer',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}

/**
 * All social providers selection view
 */
export function AllSocialView({
  providers = ALL_PROVIDERS,
  onSelect,
  onBack,
  theme = DEFAULT_THEME,
}: AllSocialViewProps) {
  const t = { ...DEFAULT_THEME, ...theme };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <BackButton onClick={onBack} theme={t} />
        
        <h2
          style={{
            margin: '8px 0 0',
            fontSize: '20px',
            fontWeight: 600,
            color: t.textPrimary,
          }}
        >
          Log in with social
        </h2>
        
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '14px',
            color: t.textSecondary,
          }}
        >
          Connect a social account linked to your Ethos profile
        </p>
      </div>

      {/* Provider list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {providers.map((providerId) => {
          const provider = SOCIAL_PROVIDERS[providerId];
          const IconComponent = SOCIAL_ICONS[providerId];
          
          return (
            <LoginOptionButton
              key={providerId}
              id={providerId}
              name={provider.name}
              icon={<IconComponent />}
              onClick={() => onSelect(providerId)}
              theme={t}
            />
          );
        })}
      </div>

      {/* Help text */}
      <p
        style={{
          margin: '16px 0 0',
          fontSize: '12px',
          color: t.textMuted,
          textAlign: 'center',
        }}
      >
        Your social account must be linked to an{' '}
        <a
          href="https://ethos.network"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: t.accentColor, textDecoration: 'none' }}
        >
          Ethos profile
        </a>
      </p>
    </div>
  );
}
