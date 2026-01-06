/**
 * WebAuthn Module Index
 *
 * Complete WebAuthn/Passkey implementation for Sign in with Ethos.
 */

// Types
export type {
    // Core types
    COSEAlgorithmIdentifier,
    AuthenticatorAttachment,
    UserVerificationRequirement,
    ResidentKeyRequirement,
    AttestationConveyancePreference,
    AuthenticatorTransport,
    // Registration
    RelyingParty,
    WebAuthnUser,
    PublicKeyCredentialParameters,
    PublicKeyCredentialDescriptor,
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialCreationOptions,
    // Authentication
    PublicKeyCredentialRequestOptions,
    // Responses
    AuthenticatorAttestationResponse,
    AuthenticatorAssertionResponse,
    RegistrationCredential,
    AuthenticationCredential,
    // Storage
    StoredCredential,
    StoredChallenge,
    ChallengeStore,
    CredentialStore,
    // Verification
    RegistrationVerificationResult,
    AuthenticationVerificationResult,
    VerificationFailure,
    WebAuthnErrorCode,
    WebAuthnConfig,
} from './types';

// Utilities
export {
    base64UrlEncode,
    base64UrlDecode,
    stringToBase64Url,
    base64UrlToString,
    generateRandomBytes,
    generateChallenge,
    generateUserId,
    parseClientDataJSON,
    parseAuthenticatorData,
    sha256,
    sha256Base64Url,
    normalizeCredentialId,
    credentialIdsEqual,
    isWebAuthnSupported,
    isPlatformAuthenticatorAvailable,
    isConditionalUISupported,
} from './utils';

export type { ClientDataJSON, AuthenticatorData } from './utils';

// Challenge Management
export {
    DEFAULT_CHALLENGE_TTL,
    createRegistrationChallenge,
    createAuthenticationChallenge,
    isChallengeExpired,
    validateChallengeValue,
    MemoryChallengeStore,
    MemoryCredentialStore,
} from './challenge';

// Registration (Browser)
export {
    DEFAULT_ALGORITHMS,
    buildRegistrationOptions,
    createCredential,
    formatRegistrationCredential,
    serializeRegistrationCredential,
    parseRegistrationCredential,
} from './register';

export type { RegistrationOptionsConfig } from './register';

// Authentication (Browser)
export {
    buildAuthenticationOptions,
    authenticate,
    authenticateConditional,
    formatAuthenticationCredential,
    serializeAuthenticationCredential,
    parseAuthenticationCredential,
} from './authenticate';

export type { AuthenticationOptionsConfig } from './authenticate';

// Verification (Server)
export { verifyRegistration, verifyAuthentication } from './verify';
