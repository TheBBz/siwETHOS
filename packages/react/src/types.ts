/**
 * Sign in with Ethos - React Types
 */

import type { AuthResult, EthosUser, SocialProvider } from '@thebbz/siwe-ethos';

// ============================================================================
// Login Method Types
// ============================================================================

/**
 * All supported login method types
 */
export type LoginMethodType = 'wallet' | 'social';

/**
 * Supported wallet identifiers
 */
export type WalletId = 
  | 'metamask'
  | 'rabby'
  | 'phantom'
  | 'zerion'
  | 'coinbase'
  | 'brave';

/**
 * Supported social provider identifiers
 */
export type SocialProviderId = 'twitter' | 'discord' | 'telegram' | 'farcaster';

/**
 * Combined login method identifier
 */
export type LoginMethodId = WalletId | SocialProviderId;

/**
 * Wallet configuration
 */
export interface WalletConfig {
  /** Unique wallet identifier */
  id: WalletId;
  /** Display name */
  name: string;
  /** Icon (SVG string or URL) */
  icon?: string;
  /** Deep link URL pattern for mobile */
  deepLink?: string;
  /** Check if wallet is installed */
  isInstalled: () => boolean;
  /** Get the provider (injected or otherwise) */
  getProvider: () => unknown | undefined;
}

/**
 * Social provider configuration
 */
export interface SocialProviderConfig {
  /** Unique provider identifier */
  id: SocialProviderId;
  /** Display name */
  name: string;
  /** Icon (SVG string or URL) */
  icon?: string;
  /** Whether this is a redirect-based OAuth flow */
  isOAuth: boolean;
}

/**
 * Recent login entry (persisted in localStorage)
 */
export interface RecentLogin {
  /** Login method type */
  type: LoginMethodType;
  /** Method identifier */
  id: LoginMethodId;
  /** Display name */
  name: string;
  /** Icon (optional) */
  icon?: string;
  /** Last used timestamp */
  lastUsed: number;
  /** Associated address or user id (for display) */
  identifier?: string;
}

/**
 * Default wallet configurations
 */
export const WALLETS: Record<WalletId, Omit<WalletConfig, 'isInstalled' | 'getProvider'>> = {
  metamask: {
    id: 'metamask',
    name: 'MetaMask',
    deepLink: 'https://metamask.app.link/dapp/',
  },
  rabby: {
    id: 'rabby',
    name: 'Rabby',
  },
  phantom: {
    id: 'phantom',
    name: 'Phantom',
    deepLink: 'https://phantom.app/ul/browse/',
  },
  zerion: {
    id: 'zerion',
    name: 'Zerion',
    deepLink: 'https://wallet.zerion.io/',
  },
  coinbase: {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    deepLink: 'https://go.cb-w.com/dapp/',
  },
  brave: {
    id: 'brave',
    name: 'Brave Wallet',
  },
};

/**
 * Default social provider configurations
 */
export const SOCIAL_PROVIDERS: Record<SocialProviderId, SocialProviderConfig> = {
  twitter: {
    id: 'twitter',
    name: 'Twitter',
    isOAuth: true,
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    isOAuth: true,
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    isOAuth: false, // Uses widget callback
  },
  farcaster: {
    id: 'farcaster',
    name: 'Farcaster',
    isOAuth: true, // Uses redirect flow with Farcaster relay
  },
};

// ============================================================================
// Score Colors
// ============================================================================

/**
 * Score color configuration
 */
export interface ScoreColor {
  min: number;
  max: number;
  color: string;
  label: string;
}

/**
 * Default score color ranges based on Ethos scoring
 */
export const SCORE_COLORS: ScoreColor[] = [
  { min: 0, max: 699, color: '#ef4444', label: 'Very Low' },
  { min: 700, max: 999, color: '#f97316', label: 'Low' },
  { min: 1000, max: 1299, color: '#eab308', label: 'Moderate' },
  { min: 1300, max: 1599, color: '#84cc16', label: 'Good' },
  { min: 1600, max: 1899, color: '#22c55e', label: 'Great' },
  { min: 1900, max: 2199, color: '#14b8a6', label: 'Excellent' },
  { min: 2200, max: 2800, color: '#0ea5e9', label: 'Exemplary' },
];

/**
 * Get color for a given score
 */
export function getScoreColor(score: number): string {
  const range = SCORE_COLORS.find(r => score >= r.min && score <= r.max);
  return range?.color ?? '#6b7280';
}

/**
 * Get label for a given score
 */
export function getScoreLabel(score: number): string {
  const range = SCORE_COLORS.find(r => score >= r.min && score <= r.max);
  return range?.label ?? 'Unknown';
}

// ============================================================================
// Modal Types
// ============================================================================

/**
 * Modal view states
 */
export type ModalView = 
  | 'main'           // Main view with recent, wallets, social sections
  | 'all-wallets'    // Expanded view showing all wallets
  | 'all-social'     // Expanded view showing all social providers
  | 'connecting'     // Connecting to wallet/provider
  | 'signing'        // Waiting for signature
  | 'verifying'      // Verifying with server
  | 'success'        // Authentication successful
  | 'error';         // Error occurred

/**
 * Connection status
 */
export type ConnectionStatus = 
  | 'idle'
  | 'connecting'
  | 'signing'
  | 'verifying'
  | 'success'
  | 'error';

/**
 * Modal state
 */
export interface ModalState {
  /** Whether modal is open */
  isOpen: boolean;
  /** Current view */
  view: ModalView;
  /** Connection status */
  status: ConnectionStatus;
  /** Selected login method */
  selectedMethod: { type: LoginMethodType; id: LoginMethodId } | null;
  /** Error message if any */
  error: string | null;
  /** Authenticated user (on success) */
  user: EthosUser | null;
}

/**
 * Modal actions
 */
export interface ModalActions {
  /** Open the modal */
  open: () => void;
  /** Close the modal */
  close: () => void;
  /** Select a wallet and start connection */
  selectWallet: (walletId: WalletId) => void;
  /** Select a social provider and start auth */
  selectSocial: (providerId: SocialProviderId) => void;
  /** Navigate to a view */
  setView: (view: ModalView) => void;
  /** Set status */
  setStatus: (status: ConnectionStatus) => void;
  /** Set error */
  setError: (error: string) => void;
  /** Set success */
  setSuccess: (user: EthosUser) => void;
  /** Reset to initial state */
  reset: () => void;
  /** Go back to main view */
  goBack: () => void;
}

// ============================================================================
// Component Props
// ============================================================================

/**
 * Base props for modal customization
 */
export interface ModalStyleProps {
  /** Custom class names */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * Theme configuration for dark mode support
 */
export interface ModalTheme {
  /** Modal background color */
  modalBg?: string;
  /** Card/option background color */
  cardBg?: string;
  /** Primary text color */
  textPrimary?: string;
  /** Secondary text color */
  textSecondary?: string;
  /** Muted text color */
  textMuted?: string;
  /** Border color */
  borderColor?: string;
  /** Accent/brand color */
  accentColor?: string;
  /** Hover state background */
  hoverBg?: string;
  /** Success color */
  successColor?: string;
  /** Error color */
  errorColor?: string;
}

/**
 * Default dark theme (matches Privy/Ethos style)
 */
export const DEFAULT_THEME: ModalTheme = {
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
 * Props for the main EthosAuthModal
 */
export interface EthosAuthModalProps extends ModalStyleProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Callback on successful authentication */
  onSuccess?: (result: AuthResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Initial error to display when modal opens */
  initialError?: string | null;
  /** Auth server URL */
  authServerUrl?: string;
  /** Chain ID for SIWE */
  chainId?: number;
  /** Custom statement for SIWE message */
  statement?: string;
  /** Wallets to display (defaults to detected + common) */
  wallets?: WalletId[];
  /** Social providers to display */
  socialProviders?: SocialProviderId[];
  /** Whether to show recent logins section */
  showRecent?: boolean;
  /** Max recent logins to show */
  maxRecent?: number;
  /** Whether to show the Ethos score after auth */
  showScore?: boolean;
  /** Custom title */
  title?: string;
  /** Theme customization */
  theme?: ModalTheme;
  /** Portal target (defaults to document.body) */
  portalTarget?: HTMLElement | null;
  /** Disable portal (render inline) */
  disablePortal?: boolean;
  /** Redirect URI for OAuth flows */
  redirectUri?: string;
  /** Show passkey option */
  showPasskey?: boolean;
  /** Custom Terms URL */
  termsUrl?: string;
  /** Custom Privacy URL */
  privacyUrl?: string;
}

/**
 * Props for SignInWithEthosButton
 */
export interface SignInButtonProps extends ModalStyleProps {
  /** Button text */
  children?: React.ReactNode;
  /** Callback on successful authentication */
  onSuccess?: (result: AuthResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Auth server URL */
  authServerUrl?: string;
  /** Chain ID for SIWE */
  chainId?: number;
  /** Wallets to display in modal */
  wallets?: WalletId[];
  /** Social providers to display */
  socialProviders?: SocialProviderId[];
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Theme */
  theme?: ModalTheme;
}

/**
 * Props for LoginOptionButton component
 */
export interface LoginOptionButtonProps extends ModalStyleProps {
  /** Option identifier */
  id: string;
  /** Display name */
  name: string;
  /** Icon component */
  icon?: React.ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Whether option is available/installed */
  isAvailable?: boolean;
  /** Show green dot indicator */
  showIndicator?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Badge text (e.g., "Recent") */
  badge?: string;
  /** Theme */
  theme?: ModalTheme;
}

/**
 * Props for WalletButton component
 */
export interface WalletButtonProps extends ModalStyleProps {
  /** Wallet to display */
  wallet: WalletConfig;
  /** Click handler */
  onClick: () => void;
  /** Whether wallet is installed */
  isInstalled?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Selected state */
  selected?: boolean;
}

/**
 * Props for WalletList component
 */
export interface WalletListProps extends ModalStyleProps {
  /** Wallets to display */
  wallets: WalletConfig[];
  /** Wallet selection handler */
  onSelect: (walletId: WalletId) => void;
  /** Currently selected wallet */
  selectedWallet?: WalletId | null;
  /** Disabled wallets */
  disabledWallets?: WalletId[];
}

/**
 * Props for ProgressView component
 */
export interface ProgressViewProps extends ModalStyleProps {
  /** Current status */
  status: ConnectionStatus;
  /** Selected method name */
  methodName: string;
  /** Method icon */
  methodIcon?: React.ReactNode;
  /** Go back handler */
  onBack?: () => void;
  /** Theme */
  theme?: ModalTheme;
}

/**
 * Props for SuccessView component
 */
export interface SuccessViewProps extends ModalStyleProps {
  /** Authenticated user */
  user: EthosUser;
  /** Whether to show score */
  showScore?: boolean;
  /** Continue handler */
  onContinue?: () => void;
  /** Theme */
  theme?: ModalTheme;
}

/**
 * Props for ErrorView component
 */
export interface ErrorViewProps extends ModalStyleProps {
  /** Error message */
  message: string;
  /** Retry handler */
  onRetry?: () => void;
  /** Go back handler */
  onBack?: () => void;
  /** Theme */
  theme?: ModalTheme;
}

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Return type for useEthosAuth hook
 */
export interface UseEthosAuthReturn {
  /** Open the auth modal */
  signIn: () => void;
  /** Close the auth modal */
  close: () => void;
  /** Whether modal is open */
  isOpen: boolean;
  /** Current status */
  status: ConnectionStatus;
  /** Authenticated user */
  user: EthosUser | null;
  /** Error if any */
  error: string | null;
  /** Modal component to render */
  Modal: React.ComponentType;
}

/**
 * Options for useEthosAuth hook
 */
export interface UseEthosAuthOptions {
  /** Auth server URL */
  authServerUrl?: string;
  /** Chain ID */
  chainId?: number;
  /** Wallets to show */
  wallets?: WalletId[];
  /** Social providers to show */
  socialProviders?: SocialProviderId[];
  /** Success callback */
  onSuccess?: (result: AuthResult) => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

/**
 * Return type for useWalletDetection hook
 */
export interface UseWalletDetectionReturn {
  /** List of detected wallets */
  detectedWallets: WalletId[];
  /** Check if specific wallet is installed */
  isInstalled: (walletId: WalletId) => boolean;
  /** Whether detection is complete */
  isReady: boolean;
}

/**
 * Return type for useRecentLogins hook
 */
export interface UseRecentLoginsReturn {
  /** Recent logins sorted by last used */
  recentLogins: RecentLogin[];
  /** Add a recent login */
  addRecentLogin: (login: Omit<RecentLogin, 'lastUsed'>) => void;
  /** Clear all recent logins */
  clearRecentLogins: () => void;
}

// Re-export SDK types
export type { AuthResult, EthosUser, SocialProvider } from '@thebbz/siwe-ethos';
