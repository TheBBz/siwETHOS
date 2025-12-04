/**
 * Sign in with Ethos - Provider Types
 *
 * Type definitions for SIWE (Sign-In with Ethereum) authentication.
 */

// Re-export all SIWE types as the main types
export type {
  SIWEMessage,
  SIWEMessageParams,
  SIWEVerifyParams,
  SIWEVerifyResult,
  NonceStore,
} from './siwe/types';

/**
 * Parameters for wallet-based authentication (SIWE)
 */
export interface WalletAuthParams {
  /** The Ethereum address to authenticate */
  address: string;
  /** The SIWE message that was signed */
  message: string;
  /** The signature from the wallet */
  signature: string;
  /** State parameter for CSRF protection */
  state?: string;
}

/**
 * Result of wallet authentication
 */
export interface WalletAuthResult {
  /** The verified Ethereum address (checksummed) */
  address: string;
  /** Chain ID from the SIWE message */
  chainId: number;
  /** The nonce that was used */
  nonce: string;
}
