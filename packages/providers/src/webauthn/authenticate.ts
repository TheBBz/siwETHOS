/**
 * WebAuthn Authentication (Credential Assertion)
 *
 * Browser-side functions for authenticating with existing WebAuthn credentials.
 */

import type {
    PublicKeyCredentialRequestOptions,
    AuthenticationCredential,
    PublicKeyCredentialDescriptor,
    UserVerificationRequirement,
} from './types';
import { base64UrlDecode, base64UrlEncode } from './utils';

// ============================================================================
// Options Builders
// ============================================================================

/**
 * Configuration for building authentication options
 */
export interface AuthenticationOptionsConfig {
    /** Challenge (base64url encoded) */
    challenge: string;
    /** Relying party ID (domain) */
    rpId?: string;
    /** Allowed credentials (empty for discoverable) */
    allowCredentials?: PublicKeyCredentialDescriptor[];
    /** User verification requirement */
    userVerification?: UserVerificationRequirement;
    /** Timeout in milliseconds */
    timeout?: number;
}

/**
 * Build PublicKeyCredentialRequestOptions for navigator.credentials.get()
 */
export function buildAuthenticationOptions(
    config: AuthenticationOptionsConfig
): PublicKeyCredentialRequestOptions {
    return {
        challenge: config.challenge,
        rpId: config.rpId,
        allowCredentials: config.allowCredentials,
        userVerification: config.userVerification ?? 'preferred',
        timeout: config.timeout ?? 60000,
    };
}

// ============================================================================
// Browser API
// ============================================================================

/**
 * Authenticate with an existing WebAuthn credential (browser-side)
 *
 * @param options - Credential request options
 * @returns Authentication credential result
 * @throws If authentication fails
 *
 * @example
 * ```ts
 * // Discoverable credentials (passkeys)
 * const options = buildAuthenticationOptions({
 *   challenge: 'server-generated-challenge',
 *   rpId: 'example.com',
 * });
 *
 * const credential = await authenticate(options);
 * // Send credential to server for verification
 * ```
 */
export async function authenticate(
    options: PublicKeyCredentialRequestOptions
): Promise<AuthenticationCredential> {
    if (typeof navigator === 'undefined' || !navigator.credentials) {
        throw new Error('WebAuthn is not supported in this environment');
    }

    // Convert base64url strings to ArrayBuffer for the browser API
    const publicKeyOptions: CredentialRequestOptions = {
        publicKey: {
            challenge: base64UrlDecode(options.challenge).buffer as ArrayBuffer,
            rpId: options.rpId,
            allowCredentials: options.allowCredentials?.map((cred) => ({
                type: cred.type as 'public-key',
                id: base64UrlDecode(cred.id).buffer as ArrayBuffer,
                transports: cred.transports,
            })) as unknown as globalThis.PublicKeyCredentialDescriptor[],
            userVerification: options.userVerification,
            timeout: options.timeout,
        },
    };

    const credential = (await navigator.credentials.get(
        publicKeyOptions
    )) as PublicKeyCredential | null;

    if (!credential) {
        throw new Error('Authentication was cancelled or failed');
    }

    return formatAuthenticationCredential(credential);
}

/**
 * Authenticate with conditional UI (autofill)
 * Requires: input with autocomplete="webauthn"
 *
 * @param options - Credential request options
 * @param abortController - Optional abort controller
 * @returns Authentication credential or null if aborted
 */
export async function authenticateConditional(
    options: PublicKeyCredentialRequestOptions,
    abortController?: AbortController
): Promise<AuthenticationCredential | null> {
    if (typeof navigator === 'undefined' || !navigator.credentials) {
        throw new Error('WebAuthn is not supported in this environment');
    }

    // Check if conditional UI is supported
    if (
        typeof (PublicKeyCredential as any).isConditionalMediationAvailable !==
        'function'
    ) {
        throw new Error('Conditional UI is not supported');
    }

    const isAvailable = await (
        PublicKeyCredential as any
    ).isConditionalMediationAvailable();
    if (!isAvailable) {
        throw new Error('Conditional UI is not available');
    }

    const publicKeyOptions: CredentialRequestOptions = {
        publicKey: {
            challenge: base64UrlDecode(options.challenge).buffer as ArrayBuffer,
            rpId: options.rpId,
            allowCredentials: [], // Must be empty for conditional UI
            userVerification: options.userVerification,
            timeout: options.timeout,
        },
        mediation: 'conditional' as CredentialMediationRequirement,
        signal: abortController?.signal,
    };

    try {
        const credential = (await navigator.credentials.get(
            publicKeyOptions
        )) as PublicKeyCredential | null;

        if (!credential) {
            return null;
        }

        return formatAuthenticationCredential(credential);
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            return null;
        }
        throw error;
    }
}

/**
 * Format browser PublicKeyCredential to our AuthenticationCredential type
 */
export function formatAuthenticationCredential(
    credential: PublicKeyCredential
): AuthenticationCredential {
    const response = credential.response as AuthenticatorAssertionResponse;

    return {
        id: base64UrlEncode(credential.rawId),
        rawId: base64UrlEncode(credential.rawId),
        type: 'public-key',
        clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>,
        response: {
            clientDataJSON: base64UrlEncode(response.clientDataJSON),
            authenticatorData: base64UrlEncode(response.authenticatorData),
            signature: base64UrlEncode(response.signature),
            userHandle: response.userHandle
                ? base64UrlEncode(response.userHandle)
                : null,
        },
        authenticatorAttachment: credential.authenticatorAttachment as any,
    };
}

/**
 * Prepare authentication credential for sending to server
 */
export function serializeAuthenticationCredential(
    credential: AuthenticationCredential
): string {
    return JSON.stringify(credential);
}

/**
 * Parse a serialized authentication credential
 */
export function parseAuthenticationCredential(
    json: string
): AuthenticationCredential {
    return JSON.parse(json) as AuthenticationCredential;
}
