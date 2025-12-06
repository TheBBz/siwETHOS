/**
 * Sign in with Ethos SDK - Type Definitions
 * 
 * All interfaces, types, and type aliases for the SDK.
 * 
 * @module types
 */

// ============================================================================
// Authentication Methods
// ============================================================================

/**
 * Supported authentication methods
 */
export type AuthMethod = 'wallet' | 'discord' | 'telegram' | 'farcaster' | 'twitter';

/**
 * Supported social authentication providers
 */
export type SocialProvider = 'discord' | 'telegram' | 'farcaster' | 'twitter';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Base configuration for Ethos authentication
 */
export interface EthosAuthConfig {
  /** URL of the auth server (default: https://ethos.thebbz.xyz) */
  authServerUrl?: string;
  /** Minimum Ethos score required for authentication */
  minScore?: number;
}

/**
 * Configuration for wallet-based authentication (extends base config)
 */
export interface WalletAuthConfig extends EthosAuthConfig {
  /** Chain ID for SIWE messages (default: 1 for mainnet) */
  chainId?: number;
  /** Custom statement for SIWE messages */
  statement?: string;
  /** Message expiration time in seconds (default: 300) */
  expirationTime?: number;
}

// ============================================================================
// SIWE (Sign-In with Ethereum)
// ============================================================================

/**
 * SIWE message structure (EIP-4361)
 */
export interface SIWEMessage {
  domain: string;
  address: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  statement?: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

/**
 * Nonce response from the auth server
 */
export interface NonceResponse {
  nonce: string;
  expiresAt: string;
}

/**
 * Parameters for wallet connection
 */
export interface ConnectParams {
  requestId?: string;
}

/**
 * Parameters for SIWE verification
 */
export interface VerifyParams {
  /** The SIWE message string that was signed */
  message: string;
  /** The signature from the wallet */
  signature: string;
  /** The wallet address */
  address: string;
}

// ============================================================================
// User Profile
// ============================================================================

/**
 * Ethos user profile returned after authentication
 */
export interface EthosUser {
  /** Unique subject identifier */
  sub: string;
  /** Display name */
  name: string;
  /** Profile picture URL */
  picture: string | null;
  /** Ethos profile ID */
  ethosProfileId: number;
  /** Ethos username */
  ethosUsername: string | null;
  /** Ethos credibility score */
  ethosScore: number;
  /** Ethos status (e.g., 'active') */
  ethosStatus: string;
  /** List of attestation types */
  ethosAttestations: string[];
  /** Authentication method used */
  authMethod: AuthMethod;
  /** Wallet address (for wallet auth) */
  walletAddress?: string;
  /** Social provider (for social auth) */
  socialProvider?: SocialProvider;
  /** Social account ID (for social auth) */
  socialId?: string;
  /** URL to user's Ethos profile page */
  profileUrl?: string;
}

// ============================================================================
// Authentication Results
// ============================================================================

/**
 * Base authentication result
 */
export interface AuthResult {
  /** JWT access token */
  accessToken: string;
  /** Token type (always 'Bearer') */
  tokenType: 'Bearer';
  /** Token expiration time in seconds */
  expiresIn: number;
  /** Authenticated user profile */
  user: EthosUser;
  /** Refresh token (optional, for session management) */
  refreshToken?: string;
}

/**
 * Wallet authentication result (same as AuthResult for now)
 */
export type WalletAuthResult = AuthResult;

// ============================================================================
// Social Auth Types
// ============================================================================

/**
 * Parameters for social auth redirect
 */
export interface SocialAuthParams {
  /** URI to redirect back to after authentication */
  redirectUri: string;
  /** Optional state parameter for CSRF protection */
  state?: string;
  /** Optional minimum score requirement (overrides config) */
  minScore?: number;
}

/**
 * Telegram auth data from Login Widget
 */
export interface TelegramAuthData {
  /** Telegram user ID */
  id: number;
  /** User's first name */
  first_name: string;
  /** User's last name (optional) */
  last_name?: string;
  /** Username (optional) */
  username?: string;
  /** Profile photo URL (optional) */
  photo_url?: string;
  /** Unix timestamp of auth */
  auth_date: number;
  /** Hash for verification */
  hash: string;
}

/**
 * Farcaster SIWF message params
 */
export interface FarcasterAuthParams {
  /** Farcaster FID */
  fid: number;
  /** Custody address that signed */
  custodyAddress: string;
  /** The message that was signed */
  message: string;
  /** The signature */
  signature: string;
}

// ============================================================================
// Session Types (for future session management)
// ============================================================================

/**
 * Session state
 */
export interface SessionState {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Current user (if authenticated) */
  user: EthosUser | null;
  /** Access token (if authenticated) */
  accessToken: string | null;
  /** Token expiration timestamp */
  expiresAt: number | null;
  /** Refresh token (if available) */
  refreshToken: string | null;
}

/**
 * Session storage interface
 */
export interface SessionStorage {
  get(key: string): string | null | Promise<string | null>;
  set(key: string, value: string): void | Promise<void>;
  remove(key: string): void | Promise<void>;
}

/**
 * Auth state change callback
 */
export type AuthStateChangeCallback = (state: SessionState) => void;
