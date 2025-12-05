/**
 * Main Select View - Privy-style login selector
 * Shows: Recent logins, Wallet options, Social options
 */

import { useMemo } from 'react';
import { LoginOptionButton } from '../components/LoginOptionButton';
import { useWalletDetection } from '../hooks/useWalletDetection';
import { useRecentLogins } from '../hooks/useRecentLogins';
import {
  WALLET_ICONS,
  SOCIAL_ICONS,
  WalletIcon,
  SocialIcon,
  PasskeyIcon,
  EthosLogo,
  EthosShield,
} from '../components/Icons';
import type { 
  WalletId, 
  SocialProviderId, 
  ModalTheme,
  RecentLogin 
} from '../types';
import { WALLETS, SOCIAL_PROVIDERS, DEFAULT_THEME } from '../types';

interface MainSelectViewProps {
  /** Wallets to show */
  wallets?: WalletId[];
  /** Social providers to show */
  socialProviders?: SocialProviderId[];
  /** Whether to show recent logins */
  showRecent?: boolean;
  /** Max recent logins to display */
  maxRecent?: number;
  /** Wallet selection handler */
  onSelectWallet: (walletId: WalletId) => void;
  /** Social provider selection handler */
  onSelectSocial: (providerId: SocialProviderId) => void;
  /** Show all wallets */
  onShowAllWallets: () => void;
  /** Show all social providers */
  onShowAllSocial: () => void;
  /** Show passkey option */
  showPasskey?: boolean;
  /** Passkey handler */
  onPasskey?: () => void;
  /** Title */
  title?: string;
  /** Terms URL */
  termsUrl?: string;
  /** Privacy URL */
  privacyUrl?: string;
  /** Theme */
  theme?: ModalTheme;
}

// Default order of wallets to show in main view
const MAIN_WALLETS: WalletId[] = ['metamask', 'rabby'];
// Default social providers to show
const ALL_SOCIAL: SocialProviderId[] = ['twitter', 'discord', 'telegram', 'farcaster'];

/**
 * Main login selector view
 */
export function MainSelectView({
  wallets = MAIN_WALLETS,
  socialProviders = ALL_SOCIAL,
  showRecent = true,
  maxRecent = 3,
  onSelectWallet,
  onSelectSocial,
  onShowAllWallets,
  onShowAllSocial,
  showPasskey = true,
  onPasskey,
  title = 'Log in or sign up',
  termsUrl = 'https://ethos.network/terms',
  privacyUrl = 'https://ethos.network/privacy',
  theme = DEFAULT_THEME,
}: MainSelectViewProps) {
  const t = { ...DEFAULT_THEME, ...theme };
  const { isInstalled, detectedWallets } = useWalletDetection();
  const { recentLogins } = useRecentLogins();

  // Get wallets to display (detected ones + specified)
  const displayWallets = useMemo(() => {
    // Start with detected wallets that are in our list
    const detected = detectedWallets.filter(w => wallets.includes(w));
    // Add other specified wallets
    const others = wallets.filter(w => !detected.includes(w));
    // Return detected first, limited to 2 for main view
    return [...detected, ...others].slice(0, 2);
  }, [wallets, detectedWallets]);

  // Get recent logins to display
  const displayRecent = useMemo(() => {
    if (!showRecent) return [];
    return recentLogins.slice(0, maxRecent);
  }, [showRecent, recentLogins, maxRecent]);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header with Ethos logo */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EthosLogo size={48} />
        </div>
        
        <h2
          style={{
            margin: '24px 0 0',
            fontSize: '20px',
            fontWeight: 500,
            fontStyle: 'italic',
            color: t.textPrimary,
          }}
        >
          {title}
        </h2>
      </div>

      {/* Login options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Recent logins section */}
        {displayRecent.length > 0 && (
          <>
            {displayRecent.map((recent) => {
              const IconComponent = recent.type === 'wallet' 
                ? WALLET_ICONS[recent.id as WalletId] || WalletIcon
                : SOCIAL_ICONS[recent.id as SocialProviderId] || SocialIcon;
              
              return (
                <LoginOptionButton
                  key={`${recent.type}-${recent.id}`}
                  id={recent.id}
                  name={recent.name}
                  icon={<IconComponent />}
                  onClick={() => {
                    if (recent.type === 'wallet') {
                      onSelectWallet(recent.id as WalletId);
                    } else {
                      onSelectSocial(recent.id as SocialProviderId);
                    }
                  }}
                  badge="Recent"
                  showIndicator={recent.type === 'wallet' && isInstalled(recent.id as WalletId)}
                  theme={t}
                />
              );
            })}
          </>
        )}

        {/* Wallet options */}
        {displayWallets.map((walletId) => {
          const wallet = WALLETS[walletId];
          const IconComponent = WALLET_ICONS[walletId];
          const installed = isInstalled(walletId);
          
          // Skip if already in recent
          if (displayRecent.some(r => r.type === 'wallet' && r.id === walletId)) {
            return null;
          }
          
          return (
            <LoginOptionButton
              key={walletId}
              id={walletId}
              name={wallet.name}
              icon={<IconComponent />}
              onClick={() => onSelectWallet(walletId)}
              showIndicator={installed}
              theme={t}
            />
          );
        })}

        {/* Other wallets button */}
        <LoginOptionButton
          id="other-wallets"
          name="Other wallets"
          icon={<WalletIcon />}
          onClick={onShowAllWallets}
          theme={t}
        />

        {/* Social login button */}
        <LoginOptionButton
          id="social-login"
          name="Log in with a social account"
          icon={<SocialIcon />}
          onClick={onShowAllSocial}
          theme={t}
        />

        {/* Passkey option */}
        {showPasskey && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onPasskey}
              style={{
                background: 'none',
                border: 'none',
                color: t.accentColor,
                fontSize: '14px',
                cursor: 'pointer',
                padding: '8px',
              }}
            >
              I have a passkey
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: t.textMuted,
          }}
        >
          By logging in I agree to the{' '}
          <a
            href={termsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: t.accentColor, textDecoration: 'none' }}
          >
            Terms
          </a>
          {' & '}
          <a
            href={privacyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: t.accentColor, textDecoration: 'none' }}
          >
            Privacy Policy
          </a>
        </p>
        
        <p
          style={{
            margin: '16px 0 0',
            fontSize: '11px',
            color: t.textMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          Protected by
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            color: t.textSecondary,
            fontWeight: 500,
          }}>
            <EthosShield size={12} />
            ethos
          </span>
        </p>
      </div>
    </div>
  );
}
