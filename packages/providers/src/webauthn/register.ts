/**
 * WebAuthn Registration (Credential Creation)
 *
 * Browser-side functions for creating new WebAuthn credentials.
 */

import type {
    PublicKeyCredentialCreationOptions,
    RegistrationCredential,
    RelyingParty,
    WebAuthnUser,
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    COSEAlgorithmIdentifier,
} from './types';
import { base64UrlDecode, base64UrlEncode } from './utils';

// ============================================================================
// Options Builders
// ============================================================================

/**
 * Configuration for building registration options
 */
export interface RegistrationOptionsConfig {
    /** Relying party (your app) */
    rp: RelyingParty;
    /** User to register */
    user: WebAuthnUser;
    /** Challenge (base64url encoded) */
    challenge: string;
    /** Existing credentials to exclude */
    excludeCredentials?: PublicKeyCredentialDescriptor[];
    /** Authenticator selection criteria */
    authenticatorSelection?: AuthenticatorSelectionCriteria;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Supported algorithms (default: ES256, RS256) */
    supportedAlgorithms?: COSEAlgorithmIdentifier[];
}

/**
 * Default supported algorithms in preference order
 */
export const DEFAULT_ALGORITHMS: COSEAlgorithmIdentifier[] = [-7, -257]; // ES256, RS256

/**
 * Build PublicKeyCredentialCreationOptions for navigator.credentials.create()
 */
export function buildRegistrationOptions(
    config: RegistrationOptionsConfig
): PublicKeyCredentialCreationOptions {
    const algorithms = config.supportedAlgorithms ?? DEFAULT_ALGORITHMS;

    return {
        rp: config.rp,
        user: config.user,
        challenge: config.challenge,
        pubKeyCredParams: algorithms.map((alg) => ({
            type: 'public-key' as const,
            alg,
        })),
        timeout: config.timeout ?? 60000,
        excludeCredentials: config.excludeCredentials,
        authenticatorSelection: config.authenticatorSelection ?? {
            residentKey: 'preferred',
            userVerification: 'preferred',
        },
        attestation: 'none', // We don't need attestation for most use cases
    };
}

// ============================================================================
// Browser API
// ============================================================================

/**
 * Create a new WebAuthn credential (browser-side)
 *
 * @param options - Credential creation options (from buildRegistrationOptions)
 * @returns Registration credential result
 * @throws If credential creation fails
 *
 * @example
 * ```ts
 * const options = buildRegistrationOptions({
 *   rp: { id: 'example.com', name: 'My App' },
 *   user: { id: 'user123', name: 'alice@example.com', displayName: 'Alice' },
 *   challenge: 'random-challenge-string',
 * });
 *
 * const credential = await createCredential(options);
 * // Send credential to server for verification
 * ```
 */
export async function createCredential(
    options: PublicKeyCredentialCreationOptions
): Promise<RegistrationCredential> {
    if (typeof navigator === 'undefined' || !navigator.credentials) {
        throw new Error('WebAuthn is not supported in this environment');
    }

    // Convert base64url strings to ArrayBuffer for the browser API
    const publicKeyOptions: CredentialCreationOptions = {
        publicKey: {
            rp: options.rp,
            user: {
                id: base64UrlDecode(options.user.id).buffer as ArrayBuffer,
                name: options.user.name,
                displayName: options.user.displayName,
            },
            challenge: base64UrlDecode(options.challenge).buffer as ArrayBuffer,
            pubKeyCredParams: options.pubKeyCredParams,
            timeout: options.timeout,
            excludeCredentials: options.excludeCredentials?.map((cred) => ({
                type: cred.type as 'public-key',
                id: base64UrlDecode(cred.id).buffer as ArrayBuffer,
                transports: cred.transports,
            })) as unknown as globalThis.PublicKeyCredentialDescriptor[],
            authenticatorSelection: options.authenticatorSelection,
            attestation: options.attestation,
        },
    };

    const credential = (await navigator.credentials.create(
        publicKeyOptions
    )) as PublicKeyCredential | null;

    if (!credential) {
        throw new Error('Credential creation was cancelled or failed');
    }

    // Convert the browser response to our format
    return formatRegistrationCredential(credential);
}

/**
 * Format browser PublicKeyCredential to our RegistrationCredential type
 */
export function formatRegistrationCredential(
    credential: PublicKeyCredential
): RegistrationCredential {
    const response = credential.response as AuthenticatorAttestationResponse;

    return {
        id: base64UrlEncode(credential.rawId),
        rawId: base64UrlEncode(credential.rawId),
        type: 'public-key',
        clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>,
        response: {
            clientDataJSON: base64UrlEncode(response.clientDataJSON),
            attestationObject: base64UrlEncode(response.attestationObject),
            // These are available on newer browsers
            publicKey: response.getPublicKey
                ? base64UrlEncode(response.getPublicKey()!)
                : undefined,
            publicKeyAlgorithm: response.getPublicKeyAlgorithm?.() as
                | COSEAlgorithmIdentifier
                | undefined,
            transports: response.getTransports?.() as any,
            authenticatorData: response.getAuthenticatorData
                ? base64UrlEncode(response.getAuthenticatorData())
                : undefined,
        },
        authenticatorAttachment: credential.authenticatorAttachment as any,
    };
}

/**
 * Prepare registration credential for sending to server
 * Converts to a plain object that can be JSON serialized
 */
export function serializeRegistrationCredential(
    credential: RegistrationCredential
): string {
    return JSON.stringify(credential);
}

/**
 * Parse a serialized registration credential
 */
export function parseRegistrationCredential(
    json: string
): RegistrationCredential {
    return JSON.parse(json) as RegistrationCredential;
}
