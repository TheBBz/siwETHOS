/**
 * SIWE (Sign-In with Ethereum) Module
 *
 * This module provides utilities for wallet-based authentication
 * following the EIP-4361 SIWE standard.
 *
 * Security notes:
 * - Nonces must be stored server-side and validated once
 * - Message expiration should be enforced
 * - Domain binding prevents cross-site message reuse
 */

export { createSIWEMessage, formatSIWEMessage, parseSIWEMessage } from './message';
export { verifySIWEMessage, recoverAddress } from './verify';
export { generateNonce, validateNonce, isValidNonceFormat, createTimedNonce, isNonceExpired } from './nonce';
export { isValidEthereumAddress, checksumAddress, addressesEqual } from './address';
export type { SIWEMessage, SIWEMessageParams, SIWEVerifyParams, SIWEVerifyResult, NonceStore } from './types';

