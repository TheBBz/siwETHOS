/**
 * WebAuthn Utility Functions
 *
 * Base64url encoding/decoding and other helpers for WebAuthn operations.
 */

// ============================================================================
// Base64URL Encoding/Decoding
// ============================================================================

/**
 * Encode ArrayBuffer or Uint8Array to base64url string
 */
export function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    // Use btoa for base64 encoding, then convert to base64url
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode base64url string to Uint8Array
 */
export function base64UrlDecode(input: string): Uint8Array {
    // Convert base64url to base64
    let base64 = input.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding
    const padding = base64.length % 4;
    if (padding) {
        base64 += '='.repeat(4 - padding);
    }

    // Decode
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Encode string to base64url
 */
export function stringToBase64Url(input: string): string {
    const encoder = new TextEncoder();
    return base64UrlEncode(encoder.encode(input));
}

/**
 * Decode base64url to string
 */
export function base64UrlToString(input: string): string {
    const bytes = base64UrlDecode(input);
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
}

// ============================================================================
// Random Generation
// ============================================================================

/**
 * Generate cryptographically secure random bytes
 * @param length - Number of bytes to generate
 */
export function generateRandomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
}

/**
 * Generate a random challenge for WebAuthn
 * @param length - Challenge length in bytes (default: 32)
 */
export function generateChallenge(length = 32): string {
    return base64UrlEncode(generateRandomBytes(length));
}

/**
 * Generate a random user ID
 * @param length - User ID length in bytes (default: 32)
 */
export function generateUserId(length = 32): string {
    return base64UrlEncode(generateRandomBytes(length));
}

// ============================================================================
// Data Parsing
// ============================================================================

/**
 * Parse client data JSON from base64url
 */
export function parseClientDataJSON(clientDataJSON: string): ClientDataJSON {
    const json = base64UrlToString(clientDataJSON);
    return JSON.parse(json) as ClientDataJSON;
}

/**
 * Client data JSON structure
 */
export interface ClientDataJSON {
    type: 'webauthn.create' | 'webauthn.get';
    challenge: string;
    origin: string;
    crossOrigin?: boolean;
    tokenBinding?: {
        status: 'present' | 'supported';
        id?: string;
    };
}

/**
 * Parse authenticator data
 * See: https://www.w3.org/TR/webauthn-2/#sctn-authenticator-data
 */
export function parseAuthenticatorData(data: Uint8Array): AuthenticatorData {
    let offset = 0;

    // RP ID hash (32 bytes)
    const rpIdHash = base64UrlEncode(data.slice(0, 32));
    offset += 32;

    // Flags (1 byte)
    const flags = data[offset];
    offset += 1;

    const userPresent = !!(flags & 0x01);
    const userVerified = !!(flags & 0x04);
    const attestedCredentialData = !!(flags & 0x40);
    const extensionData = !!(flags & 0x80);

    // Signature counter (4 bytes, big-endian)
    const counter = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(
        0,
        false
    );
    offset += 4;

    const result: AuthenticatorData = {
        rpIdHash,
        flags: {
            userPresent,
            userVerified,
            attestedCredentialData,
            extensionData,
        },
        counter,
    };

    // Parse attested credential data if present
    if (attestedCredentialData && offset < data.length) {
        // AAGUID (16 bytes)
        const aaguid = base64UrlEncode(data.slice(offset, offset + 16));
        offset += 16;

        // Credential ID length (2 bytes, big-endian)
        const credIdLength = new DataView(
            data.buffer,
            data.byteOffset + offset,
            2
        ).getUint16(0, false);
        offset += 2;

        // Credential ID
        const credentialId = base64UrlEncode(data.slice(offset, offset + credIdLength));
        offset += credIdLength;

        // Public key (CBOR encoded, remaining bytes before extensions)
        // Note: Full CBOR parsing would require a library, we'll store raw bytes
        const publicKeyData = data.slice(offset);

        result.attestedCredentialData = {
            aaguid,
            credentialId,
            publicKeyData: base64UrlEncode(publicKeyData),
        };
    }

    return result;
}

/**
 * Parsed authenticator data structure
 */
export interface AuthenticatorData {
    rpIdHash: string;
    flags: {
        userPresent: boolean;
        userVerified: boolean;
        attestedCredentialData: boolean;
        extensionData: boolean;
    };
    counter: number;
    attestedCredentialData?: {
        aaguid: string;
        credentialId: string;
        publicKeyData: string;
    };
}

// ============================================================================
// Hash Functions
// ============================================================================

/**
 * Compute SHA-256 hash
 */
export async function sha256(data: Uint8Array | string): Promise<Uint8Array> {
    let bytes: Uint8Array;
    if (typeof data === 'string') {
        bytes = new TextEncoder().encode(data);
    } else {
        bytes = data;
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes.buffer as ArrayBuffer);
    return new Uint8Array(hashBuffer);
}

/**
 * Compute SHA-256 hash and return as base64url
 */
export async function sha256Base64Url(
    data: Uint8Array | string
): Promise<string> {
    const hash = await sha256(data);
    return base64UrlEncode(hash);
}

// ============================================================================
// Credential ID Utilities
// ============================================================================

/**
 * Convert credential ID from different formats
 */
export function normalizeCredentialId(
    credentialId: ArrayBuffer | Uint8Array | string
): string {
    if (typeof credentialId === 'string') {
        return credentialId;
    }
    return base64UrlEncode(credentialId);
}

/**
 * Compare two credential IDs
 */
export function credentialIdsEqual(a: string, b: string): boolean {
    return a === b;
}

// ============================================================================
// Browser Feature Detection
// ============================================================================

/**
 * Check if WebAuthn is supported in the current environment
 */
export function isWebAuthnSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof window.PublicKeyCredential !== 'undefined' &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
        'function'
    );
}

/**
 * Check if platform authenticator is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!isWebAuthnSupported()) {
        return false;
    }
    return window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

/**
 * Check if conditional UI (autofill) is supported
 */
export async function isConditionalUISupported(): Promise<boolean> {
    if (!isWebAuthnSupported()) {
        return false;
    }
    if (
        typeof (PublicKeyCredential as any).isConditionalMediationAvailable !==
        'function'
    ) {
        return false;
    }
    return (
        PublicKeyCredential as any
    ).isConditionalMediationAvailable() as Promise<boolean>;
}
