/**
 * Sign in with Ethos SDK
 * 
 * OAuth 2.0-compatible authentication with Ethos Network reputation verification.
 * Supports wallet-based (SIWE) and social (Discord, Telegram, Farcaster, Twitter) authentication.
 * 
 * @packageDocumentation
 * @module @thebbz/siwe-ethos
 * 
 * @example
 * ```ts
 * import { EthosAuth, EthosWalletAuth, setGlobalConfig } from '@thebbz/siwe-ethos';
 * 
 * // Set global config (optional)
 * setGlobalConfig({ authServerUrl: 'https://your-auth-server.com' });
 * 
 * // Wallet authentication
 * const walletAuth = EthosWalletAuth.init();
 * const result = await walletAuth.signIn(address, signMessage);
 * 
 * // Social authentication (redirect flow)
 * const auth = EthosAuth.init({ minScore: 500 });
 * const url = auth.getAuthUrl('discord', { redirectUri: 'https://myapp.com/callback' });
 * ```
 */

// ============================================================================
// Core Clients
// ============================================================================

export { EthosAuth, EthosWalletAuth } from './clients';

// ============================================================================
// Configuration
// ============================================================================

export {
  setGlobalConfig,
  getGlobalConfig,
  resetGlobalConfig,
} from './config';

// ============================================================================
// Error Classes
// ============================================================================

export { EthosAuthError } from './errors';

// ============================================================================
// Constants
// ============================================================================

export { DEFAULTS, STORAGE_KEYS, ENDPOINTS } from './constants';

// ============================================================================
// Utility Functions
// ============================================================================

export {
  formatSIWEMessage,
  createSIWEMessage,
  isValidAddress,
  checksumAddress,
} from './utils';

// ============================================================================
// Types
// ============================================================================

export type {
  // Auth methods
  AuthMethod,
  SocialProvider,
  
  // Configuration
  EthosAuthConfig,
  WalletAuthConfig,
  
  // SIWE
  SIWEMessage,
  NonceResponse,
  ConnectParams,
  VerifyParams,
  
  // User
  EthosUser,
  
  // Results
  AuthResult,
  WalletAuthResult,
  
  // Social auth
  SocialAuthParams,
  TelegramAuthData,
  FarcasterAuthParams,
  
  // Session (for future use)
  SessionState,
  SessionStorage,
  AuthStateChangeCallback,
} from './types';

// ============================================================================
// Re-exports from @thebbz/siwe-ethos-providers
// ============================================================================

// Ethos API Client - fetch profiles and scores
export {
  fetchEthosProfile,
  fetchEthosScore,
  getProfileByAddress,
  getProfileByTwitter,
  getProfileByDiscord,
  getProfileByFarcaster,
  getProfileByTelegram,
  getProfileById,
  getScoreByAddress,
  EthosProfileNotFoundError,
  EthosApiError,
} from '@thebbz/siwe-ethos-providers';

export type {
  EthosClientConfig,
  EthosLookupType,
  EthosAttestation,
  EthosProfile,
  EthosScoreResult,
} from '@thebbz/siwe-ethos-providers';

// Score validation utilities
export {
  validateMinScore,
  meetsMinScore,
  getScoreTier,
  EthosScoreInsufficientError,
  SCORE_TIERS,
} from '@thebbz/siwe-ethos-providers';

export type { UserWithScore } from '@thebbz/siwe-ethos-providers';

// ============================================================================
// Default Export
// ============================================================================

export { EthosAuth as default } from './clients';
