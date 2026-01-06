/**
 * WebAuthn Types
 *
 * Type definitions for WebAuthn/Passkey authentication.
 * Based on Web Authentication API Level 2 specification.
 */

// ============================================================================
// Credential Types
// ============================================================================

/**
 * Supported public key credential algorithms
 */
export type COSEAlgorithmIdentifier = -7 | -257 | -8; // ES256, RS256, EdDSA

/**
 * Supported authenticator attachment modalities
 */
export type AuthenticatorAttachment = 'platform' | 'cross-platform';

/**
 * User verification requirements
 */
export type UserVerificationRequirement = 'required' | 'preferred' | 'discouraged';

/**
 * Resident key requirements
 */
export type ResidentKeyRequirement = 'required' | 'preferred' | 'discouraged';

/**
 * Attestation conveyance preference
 */
export type AttestationConveyancePreference = 'none' | 'indirect' | 'direct' | 'enterprise';

/**
 * Authenticator transport hints
 */
export type AuthenticatorTransport = 'usb' | 'nfc' | 'ble' | 'internal' | 'hybrid';

// ============================================================================
// Registration Types
// ============================================================================

/**
 * Relying Party (your application) information
 */
export interface RelyingParty {
    /** Relying party ID - typically the domain */
    id: string;
    /** Human-readable name */
    name: string;
}

/**
 * User information for registration
 */
export interface WebAuthnUser {
    /** Unique user identifier (opaque bytes, base64url encoded) */
    id: string;
    /** Human-readable username */
    name: string;
    /** Display name */
    displayName: string;
}

/**
 * Public key credential parameters
 */
export interface PublicKeyCredentialParameters {
    type: 'public-key';
    alg: COSEAlgorithmIdentifier;
}

/**
 * Credential descriptor (for excluding/allowing credentials)
 */
export interface PublicKeyCredentialDescriptor {
    type: 'public-key';
    id: string; // base64url encoded credential ID
    transports?: AuthenticatorTransport[];
}

/**
 * Authenticator selection criteria
 */
export interface AuthenticatorSelectionCriteria {
    /** Preferred authenticator attachment */
    authenticatorAttachment?: AuthenticatorAttachment;
    /** Resident key requirement */
    residentKey?: ResidentKeyRequirement;
    /** Require resident key (deprecated, use residentKey) */
    requireResidentKey?: boolean;
    /** User verification requirement */
    userVerification?: UserVerificationRequirement;
}

/**
 * Options for creating a new credential (registration)
 */
export interface PublicKeyCredentialCreationOptions {
    /** Relying party information */
    rp: RelyingParty;
    /** User information */
    user: WebAuthnUser;
    /** Challenge bytes (base64url encoded) */
    challenge: string;
    /** Supported algorithms in preference order */
    pubKeyCredParams: PublicKeyCredentialParameters[];
    /** Timeout in milliseconds */
    timeout?: number;
    /** Credentials to exclude (prevent duplicate registrations) */
    excludeCredentials?: PublicKeyCredentialDescriptor[];
    /** Authenticator selection criteria */
    authenticatorSelection?: AuthenticatorSelectionCriteria;
    /** Attestation preference */
    attestation?: AttestationConveyancePreference;
}

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * Options for authenticating with an existing credential
 */
export interface PublicKeyCredentialRequestOptions {
    /** Challenge bytes (base64url encoded) */
    challenge: string;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Relying party ID */
    rpId?: string;
    /** Allowed credentials (empty for discoverable credentials) */
    allowCredentials?: PublicKeyCredentialDescriptor[];
    /** User verification requirement */
    userVerification?: UserVerificationRequirement;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Authenticator attestation response (from registration)
 */
export interface AuthenticatorAttestationResponse {
    /** Client data JSON (base64url encoded) */
    clientDataJSON: string;
    /** Attestation object (base64url encoded) */
    attestationObject: string;
    /** Public key (base64url encoded, optional in some browsers) */
    publicKey?: string;
    /** Public key algorithm */
    publicKeyAlgorithm?: COSEAlgorithmIdentifier;
    /** Transports supported by authenticator */
    transports?: AuthenticatorTransport[];
    /** Authenticator data (base64url encoded) */
    authenticatorData?: string;
}

/**
 * Authenticator assertion response (from authentication)
 */
export interface AuthenticatorAssertionResponse {
    /** Client data JSON (base64url encoded) */
    clientDataJSON: string;
    /** Authenticator data (base64url encoded) */
    authenticatorData: string;
    /** Signature (base64url encoded) */
    signature: string;
    /** User handle (base64url encoded, optional) */
    userHandle?: string | null;
}

/**
 * Registration credential result
 */
export interface RegistrationCredential {
    /** Credential ID (base64url encoded) */
    id: string;
    /** Raw credential ID (base64url encoded) */
    rawId: string;
    /** Credential type */
    type: 'public-key';
    /** Client extension results */
    clientExtensionResults: Record<string, unknown>;
    /** Attestation response */
    response: AuthenticatorAttestationResponse;
    /** Authenticator attachment used */
    authenticatorAttachment?: AuthenticatorAttachment;
}

/**
 * Authentication credential result
 */
export interface AuthenticationCredential {
    /** Credential ID (base64url encoded) */
    id: string;
    /** Raw credential ID (base64url encoded) */
    rawId: string;
    /** Credential type */
    type: 'public-key';
    /** Client extension results */
    clientExtensionResults: Record<string, unknown>;
    /** Assertion response */
    response: AuthenticatorAssertionResponse;
    /** Authenticator attachment used */
    authenticatorAttachment?: AuthenticatorAttachment;
}

// ============================================================================
// Stored Credential Types
// ============================================================================

/**
 * Stored credential for server-side verification
 */
export interface StoredCredential {
    /** Credential ID (base64url encoded) */
    credentialId: string;
    /** User ID this credential belongs to */
    userId: string;
    /** Public key (base64url encoded) */
    publicKey: string;
    /** Public key algorithm */
    algorithm: COSEAlgorithmIdentifier;
    /** Signature counter for replay protection */
    counter: number;
    /** Supported transports */
    transports?: AuthenticatorTransport[];
    /** When the credential was created */
    createdAt: number;
    /** When the credential was last used */
    lastUsedAt?: number;
    /** Optional device/credential name */
    name?: string;
}

// ============================================================================
// Challenge Types
// ============================================================================

/**
 * Stored challenge for verification
 */
export interface StoredChallenge {
    /** Challenge value (base64url encoded) */
    challenge: string;
    /** Challenge type */
    type: 'registration' | 'authentication';
    /** User ID (for authentication) */
    userId?: string;
    /** Challenge expiration timestamp */
    expiresAt: number;
    /** Associated user data (for registration) */
    userData?: WebAuthnUser;
}

/**
 * Challenge store interface
 */
export interface ChallengeStore {
    /** Store a challenge */
    store(challenge: StoredChallenge): Promise<void>;
    /** Retrieve and consume a challenge */
    consume(value: string): Promise<StoredChallenge | null>;
    /** Clean expired challenges */
    cleanup?(): Promise<void>;
}

/**
 * Credential store interface
 */
export interface CredentialStore {
    /** Store a new credential */
    create(credential: StoredCredential): Promise<void>;
    /** Find credential by ID */
    findById(credentialId: string): Promise<StoredCredential | null>;
    /** Find all credentials for a user */
    findByUserId(userId: string): Promise<StoredCredential[]>;
    /** Update credential (e.g., counter) */
    update(credentialId: string, updates: Partial<StoredCredential>): Promise<void>;
    /** Delete a credential */
    delete(credentialId: string): Promise<void>;
}

// ============================================================================
// Verification Result Types
// ============================================================================

/**
 * Result of registration verification
 */
export interface RegistrationVerificationResult {
    verified: true;
    credential: StoredCredential;
}

/**
 * Result of authentication verification
 */
export interface AuthenticationVerificationResult {
    verified: true;
    credentialId: string;
    userId: string;
    newCounter: number;
}

/**
 * Verification failure
 */
export interface VerificationFailure {
    verified: false;
    error: string;
    code: WebAuthnErrorCode;
}

/**
 * WebAuthn error codes
 */
export type WebAuthnErrorCode =
    | 'challenge_mismatch'
    | 'origin_mismatch'
    | 'rp_id_mismatch'
    | 'user_not_present'
    | 'user_not_verified'
    | 'invalid_signature'
    | 'counter_invalid'
    | 'credential_not_found'
    | 'challenge_expired'
    | 'invalid_attestation'
    | 'unsupported_algorithm'
    | 'parse_error';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * WebAuthn configuration
 */
export interface WebAuthnConfig {
    /** Relying party ID (domain) */
    rpId: string;
    /** Relying party name */
    rpName: string;
    /** Expected origin(s) */
    origin: string | string[];
    /** Challenge timeout in milliseconds */
    challengeTimeout?: number;
    /** Supported algorithms */
    supportedAlgorithms?: COSEAlgorithmIdentifier[];
    /** User verification requirement */
    userVerification?: UserVerificationRequirement;
}
