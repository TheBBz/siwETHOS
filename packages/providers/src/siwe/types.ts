/**
 * SIWE Types
 *
 * Type definitions for Sign-In with Ethereum (EIP-4361)
 */

/**
 * SIWE Message parameters following EIP-4361
 */
export interface SIWEMessageParams {
  /** RFC 4501 DNS authority for the signing domain */
  domain: string;
  
  /** Ethereum address performing the signing */
  address: string;
  
  /** Human-readable ASCII assertion about signing */
  statement?: string;
  
  /** RFC 3986 URI referring to the resource that is the subject of the signing */
  uri: string;
  
  /** Current version of the message (must be '1') */
  version: '1';
  
  /** EIP-155 chain ID (1 for Ethereum mainnet, 8453 for Base, etc.) */
  chainId: number;
  
  /** Randomized token to prevent replay attacks */
  nonce: string;
  
  /** ISO 8601 datetime when the message was issued */
  issuedAt: string;
  
  /** ISO 8601 datetime when the signed authentication expires */
  expirationTime?: string;
  
  /** ISO 8601 datetime when the signed authentication becomes valid */
  notBefore?: string;
  
  /** System-specific identifier for the request */
  requestId?: string;
  
  /** List of resources the user wishes to access */
  resources?: string[];
}

/**
 * Parsed SIWE message
 */
export interface SIWEMessage extends SIWEMessageParams {
  /** The raw message string that was signed */
  raw: string;
}

/**
 * Parameters for verifying a SIWE signature
 */
export interface SIWEVerifyParams {
  /** The SIWE message (can be string or parsed object) */
  message: string | SIWEMessage;
  
  /** The signature from the wallet */
  signature: string;
  
  /** Expected domain (must match message domain) */
  domain?: string;
  
  /** Expected nonce (must match message nonce) */
  nonce?: string;
  
  /** Current time for expiration checks (defaults to now) */
  time?: Date;
}

/**
 * Result of SIWE verification
 */
export interface SIWEVerifyResult {
  /** Whether the signature is valid */
  success: boolean;
  
  /** The recovered Ethereum address */
  address: string;
  
  /** Parsed SIWE message */
  message: SIWEMessage;
  
  /** Error message if verification failed */
  error?: string;
}

/**
 * Nonce store interface for server-side nonce management
 */
export interface NonceStore {
  /** Generate and store a new nonce */
  create(ttlSeconds?: number): Promise<string>;
  
  /** Validate and consume a nonce (returns false if invalid/expired/used) */
  consume(nonce: string): Promise<boolean>;
}
