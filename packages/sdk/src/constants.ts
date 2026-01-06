/**
 * Sign in with Ethos SDK - Constants and Defaults
 * 
 * Default values and configuration constants.
 * 
 * @module constants
 */

/**
 * Default configuration values
 */
export const DEFAULTS = {
  /** Default auth server URL */
  AUTH_SERVER_URL: 'https://ethos.thebbz.xyz',
  /** Default chain ID (Ethereum mainnet) */
  CHAIN_ID: 1,
  /** Default SIWE statement */
  STATEMENT: 'Sign in with Ethos to verify your credibility score.',
  /** Default message expiration (5 minutes) */
  EXPIRATION_TIME: 300,
} as const;

/**
 * Storage keys for session management
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ethos_access_token',
  REFRESH_TOKEN: 'ethos_refresh_token',
  USER: 'ethos_user',
  EXPIRES_AT: 'ethos_expires_at',
} as const;

/**
 * API endpoints
 */
export const ENDPOINTS = {
  NONCE: '/api/auth/nonce',
  WALLET_VERIFY: '/api/auth/wallet/verify',
  TELEGRAM_VERIFY: '/api/auth/telegram/verify',
  FARCASTER_VERIFY: '/api/auth/farcaster/verify',
  WEBAUTHN_REGISTER_OPTIONS: '/api/auth/webauthn/register/options',
  WEBAUTHN_REGISTER_VERIFY: '/api/auth/webauthn/register/verify',
  WEBAUTHN_AUTH_OPTIONS: '/api/auth/webauthn/authenticate/options',
  WEBAUTHN_AUTH_VERIFY: '/api/auth/webauthn/authenticate/verify',
  TOKEN: '/api/auth/token',
  TOKEN_REFRESH: '/api/auth/token/refresh',
  USERINFO: '/api/userinfo',
} as const;
