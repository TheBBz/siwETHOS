/**
 * SIWE Nonce Management
 *
 * Cryptographically secure nonce generation and validation
 * for preventing replay attacks.
 */

/**
 * Generate a cryptographically secure random nonce
 *
 * @param length - Length of the nonce (default: 32)
 * @returns A random alphanumeric string
 *
 * @example
 * ```ts
 * const nonce = generateNonce();
 * // => "aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV"
 * ```
 */
export function generateNonce(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}

/**
 * Validate nonce format
 *
 * @param nonce - The nonce to validate
 * @param minLength - Minimum required length (default: 8)
 * @returns true if valid format
 */
export function isValidNonceFormat(nonce: string, minLength: number = 8): boolean {
  if (!nonce || nonce.length < minLength) {
    return false;
  }
  // Must be alphanumeric only
  return /^[a-zA-Z0-9]+$/.test(nonce);
}

/**
 * Create a nonce with expiration metadata
 *
 * @param ttlSeconds - Time-to-live in seconds (default: 300 = 5 minutes)
 * @returns Object with nonce and expiration timestamp
 */
export function createTimedNonce(ttlSeconds: number = 300): {
  nonce: string;
  expiresAt: number;
} {
  return {
    nonce: generateNonce(),
    expiresAt: Date.now() + ttlSeconds * 1000,
  };
}

/**
 * Check if a timed nonce is expired
 *
 * @param expiresAt - Expiration timestamp in milliseconds
 * @returns true if expired
 */
export function isNonceExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

/**
 * Validate a nonce against stored data
 *
 * This is a helper for building nonce stores.
 * For production, use a proper store that handles concurrency.
 *
 * @param nonce - The nonce to validate
 * @param storedNonce - The expected nonce
 * @param expiresAt - Optional expiration timestamp
 * @returns true if valid and not expired
 */
export function validateNonce(
  nonce: string,
  storedNonce: string,
  expiresAt?: number
): boolean {
  if (!nonce || !storedNonce) {
    return false;
  }

  if (nonce !== storedNonce) {
    return false;
  }

  if (expiresAt !== undefined && isNonceExpired(expiresAt)) {
    return false;
  }

  return true;
}
