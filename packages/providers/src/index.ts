/**
 * Sign in with Ethos - Provider Utilities
 *
 * This package provides authentication utilities for Sign in with Ethos:
 * - SIWE (Sign-In with Ethereum) for wallet authentication
 * - Discord OAuth2 provider
 * - Telegram Login provider
 * - Farcaster SIWF provider
 * - Score validation utilities
 */

// ============================================================================
// Main Types
// ============================================================================

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

// ============================================================================
// SIWE (Sign-In with Ethereum)
// ============================================================================

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

// ============================================================================
// Discord OAuth2 Provider
// ============================================================================

export { DiscordProvider } from './discord';
export type {
  DiscordConfig,
  DiscordUser,
  DiscordTokenResponse,
  DiscordCallbackResult,
  DiscordEthosLookup,
} from './discord';

// ============================================================================
// Telegram Login Provider
// ============================================================================

export { TelegramProvider, TelegramVerificationError } from './telegram';
export type {
  TelegramConfig,
  TelegramAuthData,
  TelegramUser,
  TelegramEthosLookup,
} from './telegram';

// ============================================================================
// Farcaster SIWF Provider
// ============================================================================

export { FarcasterProvider, FarcasterVerificationError } from './farcaster';
export type {
  FarcasterConfig,
  SIWFMessage,
  SIWFMessageParams,
  SIWFVerifyParams,
  FarcasterUser,
  FarcasterEthosLookup,
} from './farcaster';

// ============================================================================
// Score Validation
// ============================================================================

export {
  validateMinScore,
  meetsMinScore,
  getScoreTier,
  EthosScoreInsufficientError,
  SCORE_TIERS,
} from './score';
export type { UserWithScore } from './score';

// ============================================================================
// Ethos API Client
// ============================================================================

export {
  // Main fetch functions
  fetchEthosProfile,
  fetchEthosScore,
  // Convenience functions
  getProfileByAddress,
  getProfileByTwitter,
  getProfileByDiscord,
  getProfileByFarcaster,
  getProfileByTelegram,
  getProfileById,
  getScoreByAddress,
  // Errors
  EthosProfileNotFoundError,
  EthosApiError,
} from './ethos';

export type {
  EthosClientConfig,
  EthosLookupType,
  EthosAttestation,
  EthosProfile,
  EthosScoreResult,
} from './ethos';

// ============================================================================
// GitHub OAuth2 Provider
// ============================================================================

export { GithubProvider } from './github';
export type {
  GithubConfig,
  GithubUser,
  GithubTokenResponse,
  GithubCallbackResult,
  GithubEthosLookup,
} from './github';

// ============================================================================
// Profile Enrichment Utilities
// ============================================================================

export {
  // Account utilities
  getLinkedAccounts,
  hasAttestation,
  getAttestationByService,
  getAttestationsByService,
  getLinkedServices,
  countAccountsByService,
  // Profile utilities
  getProfileAge,
  getProfileStats,
  // Helper utilities
  weiToEth,
  formatDuration,
} from './ethos/enrichment';

export type {
  LinkedAccount,
  ProfileStats,
} from './ethos/enrichment';

// ============================================================================
// WebAuthn / Passkey Support
// ============================================================================

export {
  // Utilities
  generateChallenge,
  generateUserId,
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  isConditionalUISupported,
  // Challenge management
  createRegistrationChallenge,
  createAuthenticationChallenge,
  isChallengeExpired,
  MemoryChallengeStore,
  MemoryCredentialStore,
  // Registration (browser)
  buildRegistrationOptions,
  createCredential,
  // Authentication (browser)
  buildAuthenticationOptions,
  authenticate,
  authenticateConditional,
  // Verification (server)
  verifyRegistration,
  verifyAuthentication,
} from './webauthn';

export type {
  // Core types
  WebAuthnConfig,
  WebAuthnUser,
  RelyingParty,
  StoredCredential,
  StoredChallenge,
  ChallengeStore,
  CredentialStore,
  // Options
  PublicKeyCredentialCreationOptions,
  PublicKeyCredentialRequestOptions,
  RegistrationOptionsConfig,
  AuthenticationOptionsConfig,
  // Responses
  RegistrationCredential,
  AuthenticationCredential,
  // Results
  RegistrationVerificationResult,
  AuthenticationVerificationResult,
  VerificationFailure,
  WebAuthnErrorCode,
} from './webauthn';
