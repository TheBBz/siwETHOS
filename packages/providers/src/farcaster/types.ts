/**
 * Farcaster SIWF Provider Types
 */

/**
 * Farcaster provider configuration
 */
export interface FarcasterConfig {
  /** Domain for SIWF message */
  domain: string;
  /** URI for SIWF message */
  uri: string;
}

/**
 * Farcaster Sign-In message (SIWF)
 * Similar to SIWE but for Farcaster
 */
export interface SIWFMessage {
  /** Domain making the request */
  domain: string;
  /** The Farcaster ID (FID) */
  fid: number;
  /** Custody address that signed */
  custodyAddress: string;
  /** Human-readable statement */
  statement?: string;
  /** URI of the resource */
  uri: string;
  /** Nonce for replay protection */
  nonce: string;
  /** ISO timestamp when message was issued */
  issuedAt: string;
  /** ISO timestamp when message expires */
  expirationTime?: string;
  /** Resources the user is accessing */
  resources?: string[];
}

/**
 * Parameters for creating a SIWF message
 */
export interface SIWFMessageParams {
  /** Farcaster ID */
  fid: number;
  /** Custody address */
  custodyAddress: string;
  /** Nonce (get from auth server) */
  nonce: string;
  /** Domain (defaults to config) */
  domain?: string;
  /** URI (defaults to config) */
  uri?: string;
  /** Optional statement */
  statement?: string;
  /** Expiration time in seconds (default: 24h) */
  expirationTime?: number;
  /** Resources */
  resources?: string[];
}

/**
 * Parameters for verifying SIWF
 */
export interface SIWFVerifyParams {
  /** The formatted SIWF message that was signed */
  message: string;
  /** The signature from the custody address */
  signature: string;
  /** The Farcaster ID */
  fid: number;
  /** The custody address */
  custodyAddress: string;
}

/**
 * Verified Farcaster user
 */
export interface FarcasterUser {
  /** Farcaster ID */
  fid: number;
  /** Custody address (checksummed) */
  custodyAddress: string;
  /** Nonce used */
  nonce: string;
  /** Domain that requested auth */
  domain: string;
}

/**
 * Ethos lookup key for Farcaster users
 */
export interface FarcasterEthosLookup {
  /** Provider identifier */
  provider: 'farcaster';
  /** Farcaster ID */
  fid: string;
}

/**
 * Farcaster verification error
 */
export class FarcasterVerificationError extends Error {
  constructor(
    message: string,
    public code: 'invalid_signature' | 'expired' | 'invalid_message' | 'fid_mismatch'
  ) {
    super(message);
    this.name = 'FarcasterVerificationError';
  }
}
