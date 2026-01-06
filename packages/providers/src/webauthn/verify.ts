/**
 * WebAuthn Server-Side Verification
 *
 * Server-side verification of WebAuthn registration and authentication responses.
 */

import type {
    RegistrationCredential,
    AuthenticationCredential,
    StoredCredential,
    StoredChallenge,
    RegistrationVerificationResult,
    AuthenticationVerificationResult,
    VerificationFailure,
    WebAuthnConfig,
    COSEAlgorithmIdentifier,
} from './types';
import {
    base64UrlDecode,
    base64UrlEncode,
    parseClientDataJSON,
    parseAuthenticatorData,
    sha256,
} from './utils';
import { isChallengeExpired, validateChallengeValue } from './challenge';

// ============================================================================
// Registration Verification
// ============================================================================

/**
 * Verify a WebAuthn registration response
 *
 * @param credential - Registration credential from browser
 * @param challenge - The stored challenge
 * @param config - WebAuthn configuration
 * @returns Verification result with stored credential or error
 *
 * @example
 * ```ts
 * const result = await verifyRegistration(credential, storedChallenge, {
 *   rpId: 'example.com',
 *   rpName: 'My App',
 *   origin: 'https://example.com',
 * });
 *
 * if (result.verified) {
 *   await credentialStore.create(result.credential);
 * }
 * ```
 */
export async function verifyRegistration(
    credential: RegistrationCredential,
    challenge: StoredChallenge,
    config: WebAuthnConfig
): Promise<RegistrationVerificationResult | VerificationFailure> {
    try {
        // 1. Check challenge type
        if (challenge.type !== 'registration') {
            return fail('challenge_mismatch', 'Challenge is not for registration');
        }

        // 2. Check challenge expiration
        if (isChallengeExpired(challenge)) {
            return fail('challenge_expired', 'Challenge has expired');
        }

        // 3. Parse and verify client data
        const clientData = parseClientDataJSON(credential.response.clientDataJSON);

        // 3a. Verify type
        if (clientData.type !== 'webauthn.create') {
            return fail('challenge_mismatch', 'Invalid client data type');
        }

        // 3b. Verify challenge
        if (!validateChallengeValue(challenge.challenge, clientData.challenge)) {
            return fail('challenge_mismatch', 'Challenge does not match');
        }

        // 3c. Verify origin
        const origins = Array.isArray(config.origin) ? config.origin : [config.origin];
        if (!origins.includes(clientData.origin)) {
            return fail('origin_mismatch', `Invalid origin: ${clientData.origin}`);
        }

        // 4. Parse authenticator data (from attestationObject or directly)
        let authenticatorData;
        if (credential.response.authenticatorData) {
            authenticatorData = parseAuthenticatorData(
                base64UrlDecode(credential.response.authenticatorData)
            );
        } else {
            // Need to parse from attestationObject (CBOR encoded)
            // For simplicity, we require the direct authenticatorData
            return fail(
                'parse_error',
                'authenticatorData not provided - CBOR parsing not implemented'
            );
        }

        // 5. Verify RP ID hash
        const expectedRpIdHash = await sha256(config.rpId);
        const actualRpIdHash = base64UrlDecode(authenticatorData.rpIdHash);
        if (!arraysEqual(expectedRpIdHash, actualRpIdHash)) {
            return fail('rp_id_mismatch', 'RP ID hash does not match');
        }

        // 6. Verify user presence
        if (!authenticatorData.flags.userPresent) {
            return fail('user_not_present', 'User presence flag not set');
        }

        // 7. Verify user verification if required
        if (
            config.userVerification === 'required' &&
            !authenticatorData.flags.userVerified
        ) {
            return fail('user_not_verified', 'User verification required but not performed');
        }

        // 8. Get credential data
        if (!authenticatorData.attestedCredentialData) {
            return fail('parse_error', 'No attested credential data');
        }

        // 9. Determine algorithm
        const algorithm =
            credential.response.publicKeyAlgorithm ??
            config.supportedAlgorithms?.[0] ??
            -7; // Default to ES256

        // 10. Build stored credential
        const storedCredential: StoredCredential = {
            credentialId: credential.id,
            userId: challenge.userData!.id,
            publicKey:
                credential.response.publicKey ??
                authenticatorData.attestedCredentialData.publicKeyData,
            algorithm: algorithm as COSEAlgorithmIdentifier,
            counter: authenticatorData.counter,
            transports: credential.response.transports,
            createdAt: Date.now(),
            name: challenge.userData?.displayName,
        };

        return {
            verified: true,
            credential: storedCredential,
        };
    } catch (error) {
        return fail(
            'parse_error',
            `Verification failed: ${error instanceof Error ? error.message : 'unknown error'}`
        );
    }
}

// ============================================================================
// Authentication Verification
// ============================================================================

/**
 * Verify a WebAuthn authentication response
 *
 * @param credential - Authentication credential from browser
 * @param challenge - The stored challenge
 * @param storedCredential - The stored credential to verify against
 * @param config - WebAuthn configuration
 * @returns Verification result with new counter or error
 */
export async function verifyAuthentication(
    credential: AuthenticationCredential,
    challenge: StoredChallenge,
    storedCredential: StoredCredential,
    config: WebAuthnConfig
): Promise<AuthenticationVerificationResult | VerificationFailure> {
    try {
        // 1. Check challenge type
        if (challenge.type !== 'authentication') {
            return fail('challenge_mismatch', 'Challenge is not for authentication');
        }

        // 2. Check challenge expiration
        if (isChallengeExpired(challenge)) {
            return fail('challenge_expired', 'Challenge has expired');
        }

        // 3. Verify credential ID matches
        if (credential.id !== storedCredential.credentialId) {
            return fail('credential_not_found', 'Credential ID does not match');
        }

        // 4. Parse and verify client data
        const clientData = parseClientDataJSON(credential.response.clientDataJSON);

        // 4a. Verify type
        if (clientData.type !== 'webauthn.get') {
            return fail('challenge_mismatch', 'Invalid client data type');
        }

        // 4b. Verify challenge
        if (!validateChallengeValue(challenge.challenge, clientData.challenge)) {
            return fail('challenge_mismatch', 'Challenge does not match');
        }

        // 4c. Verify origin
        const origins = Array.isArray(config.origin) ? config.origin : [config.origin];
        if (!origins.includes(clientData.origin)) {
            return fail('origin_mismatch', `Invalid origin: ${clientData.origin}`);
        }

        // 5. Parse authenticator data
        const authenticatorData = parseAuthenticatorData(
            base64UrlDecode(credential.response.authenticatorData)
        );

        // 6. Verify RP ID hash
        const expectedRpIdHash = await sha256(config.rpId);
        const actualRpIdHash = base64UrlDecode(authenticatorData.rpIdHash);
        if (!arraysEqual(expectedRpIdHash, actualRpIdHash)) {
            return fail('rp_id_mismatch', 'RP ID hash does not match');
        }

        // 7. Verify user presence
        if (!authenticatorData.flags.userPresent) {
            return fail('user_not_present', 'User presence flag not set');
        }

        // 8. Verify user verification if required
        if (
            config.userVerification === 'required' &&
            !authenticatorData.flags.userVerified
        ) {
            return fail('user_not_verified', 'User verification required but not performed');
        }

        // 9. Verify counter (replay protection)
        if (authenticatorData.counter <= storedCredential.counter) {
            // Counter should be strictly greater (or both zero for some authenticators)
            if (!(storedCredential.counter === 0 && authenticatorData.counter === 0)) {
                return fail(
                    'counter_invalid',
                    `Counter ${authenticatorData.counter} is not greater than ${storedCredential.counter}`
                );
            }
        }

        // 10. Verify signature
        const signatureValid = await verifySignature(
            credential,
            storedCredential,
            config
        );
        if (!signatureValid) {
            return fail('invalid_signature', 'Signature verification failed');
        }

        // 11. Get user ID from user handle if provided
        const userId = credential.response.userHandle ?? storedCredential.userId;

        return {
            verified: true,
            credentialId: credential.id,
            userId,
            newCounter: authenticatorData.counter,
        };
    } catch (error) {
        return fail(
            'parse_error',
            `Verification failed: ${error instanceof Error ? error.message : 'unknown error'}`
        );
    }
}

// ============================================================================
// Signature Verification
// ============================================================================

/**
 * Convert ASN.1 DER encoded ECDSA signature to raw format (r || s)
 * WebAuthn returns signatures in DER format, but Web Crypto expects raw format
 */
function derToRaw(derSignature: Uint8Array): Uint8Array {
    // DER structure: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]
    let offset = 0;

    // Check SEQUENCE tag
    if (derSignature[offset++] !== 0x30) {
        throw new Error('Invalid DER signature: missing SEQUENCE tag');
    }

    // Skip length byte(s)
    let length = derSignature[offset++];
    if (length & 0x80) {
        // Long form length
        const numLengthBytes = length & 0x7f;
        offset += numLengthBytes;
    }

    // Parse r
    if (derSignature[offset++] !== 0x02) {
        throw new Error('Invalid DER signature: missing INTEGER tag for r');
    }
    let rLength = derSignature[offset++];
    let rStart = offset;
    offset += rLength;

    // Parse s
    if (derSignature[offset++] !== 0x02) {
        throw new Error('Invalid DER signature: missing INTEGER tag for s');
    }
    let sLength = derSignature[offset++];
    let sStart = offset;

    // Extract r and s, removing any leading zero padding
    let r = derSignature.slice(rStart, rStart + rLength);
    let s = derSignature.slice(sStart, sStart + sLength);

    // Remove leading zeros (DER adds them for positive numbers with high bit set)
    while (r.length > 32 && r[0] === 0) {
        r = r.slice(1);
    }
    while (s.length > 32 && s[0] === 0) {
        s = s.slice(1);
    }

    // Pad to 32 bytes each (P-256 uses 32-byte integers)
    const raw = new Uint8Array(64);
    raw.set(r, 32 - r.length);
    raw.set(s, 64 - s.length);

    return raw;
}

/**
 * Verify the signature in an authentication response
 */
async function verifySignature(
    credential: AuthenticationCredential,
    storedCredential: StoredCredential,
    _config: WebAuthnConfig
): Promise<boolean> {
    try {
        // The signature is computed over authenticatorData + hash(clientDataJSON)
        const authData = base64UrlDecode(credential.response.authenticatorData);
        const clientDataHash = await sha256(
            base64UrlDecode(credential.response.clientDataJSON)
        );

        // Concatenate authData and clientDataHash
        const signedData = new Uint8Array(authData.length + clientDataHash.length);
        signedData.set(authData);
        signedData.set(clientDataHash, authData.length);

        let signature = base64UrlDecode(credential.response.signature);
        const publicKey = base64UrlDecode(storedCredential.publicKey);

        // Import the public key
        const algorithm = getAlgorithmParams(storedCredential.algorithm);
        if (!algorithm) {
            throw new Error(`Unsupported algorithm: ${storedCredential.algorithm}`);
        }

        // For ECDSA, convert DER signature to raw format
        if (storedCredential.algorithm === -7) {
            // ES256 - convert DER to raw (r || s)
            signature = derToRaw(signature);
        }

        const cryptoKey = await crypto.subtle.importKey(
            'spki',
            publicKey.buffer as ArrayBuffer,
            algorithm.import,
            false,
            ['verify']
        );

        // Verify the signature
        const result = await crypto.subtle.verify(
            algorithm.verify,
            cryptoKey,
            signature.buffer as ArrayBuffer,
            signedData.buffer as ArrayBuffer
        );
        return result;
    } catch {
        return false;
    }
}

/**
 * Get algorithm parameters for Web Crypto API
 */
function getAlgorithmParams(alg: COSEAlgorithmIdentifier): {
    import: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams;
    verify: AlgorithmIdentifier | RsaPssParams | EcdsaParams;
} | null {
    switch (alg) {
        case -7: // ES256
            return {
                import: { name: 'ECDSA', namedCurve: 'P-256' },
                verify: { name: 'ECDSA', hash: 'SHA-256' },
            };
        case -257: // RS256
            return {
                import: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
                verify: { name: 'RSASSA-PKCS1-v1_5' },
            };
        default:
            return null;
    }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Create a verification failure
 */
function fail(
    code: VerificationFailure['code'],
    error: string
): VerificationFailure {
    return { verified: false, code, error };
}

/**
 * Compare two Uint8Arrays for equality
 */
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}
