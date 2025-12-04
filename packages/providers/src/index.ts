/**
 * Sign in with Ethos - Provider Utilities
 *
 * This package provides SIWE (Sign-In with Ethereum) utilities
 * for the Sign in with Ethos authentication server.
 *
 * Users connect their Ethereum wallet, sign a message to prove ownership,
 * and are authenticated if their wallet address has an Ethos profile.
 */

// Main types
export type {
  // Wallet auth types
  WalletAuthParams,
  WalletAuthResult,
  // SIWE types
  SIWEMessage,
  SIWEMessageParams,
  SIWEVerifyParams,
  SIWEVerifyResult,
  NonceStore,
} from './types';

// SIWE message utilities
export {
  createSIWEMessage,
  formatSIWEMessage,
  parseSIWEMessage,
} from './siwe/message';

// SIWE verification
export {
  verifySIWEMessage,
  recoverAddress,
} from './siwe/verify';

// Nonce utilities
export {
  generateNonce,
  validateNonce,
  isValidNonceFormat,
  createTimedNonce,
  isNonceExpired,
} from './siwe/nonce';

// Address utilities
export {
  isValidEthereumAddress,
  checksumAddress,
  addressesEqual,
} from './siwe/address';
