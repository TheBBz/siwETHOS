/**
 * JWT Verifier
 *
 * JWT verification using HMAC (HS256) or public key (RS256).
 * Uses Node.js crypto module for verification.
 */

import type {
    EthosJWTPayload,
    JWTVerifyOptions,
    VerifyResult,
} from '../types';
import {
    decodeJWT,
    isJWTExpired,
    isJWTNotYetValid,
    base64UrlDecode,
} from './decoder';

// ============================================================================
// Crypto Utilities
// ============================================================================

/**
 * Create HMAC signature using Web Crypto API (works in Node.js 18+ and browsers)
 */
async function createHmacSignature(
    data: string,
    secret: string
): Promise<string> {
    // Use Node.js crypto if available
    if (typeof globalThis.crypto?.subtle !== 'undefined') {
        const encoder = new TextEncoder();
        const key = await globalThis.crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await globalThis.crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(data)
        );

        // Convert to base64url
        const bytes = new Uint8Array(signature);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    // Fallback to Node.js crypto module
    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    return hmac.digest('base64url');
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

// ============================================================================
// JWT Verification
// ============================================================================

/**
 * Verify a JWT with HMAC (HS256) signature
 *
 * @param token - JWT string
 * @param secret - HMAC secret
 * @param options - Verification options
 * @returns Verification result
 *
 * @example
 * ```ts
 * const result = await verifyJWT(token, process.env.JWT_SECRET);
 * if (result.success) {
 *   console.log('User:', result.payload.sub);
 * }
 * ```
 */
export async function verifyJWT(
    token: string,
    secret: string,
    options: JWTVerifyOptions = {}
): Promise<VerifyResult> {
    const {
        clockTolerance = 0,
        ignoreExpiration = false,
        issuer,
        audience,
    } = options;

    // Decode the token first
    const decodeResult = decodeJWT(token);
    if (!decodeResult.success) {
        return { success: false, error: decodeResult.error };
    }

    const { header, payload, signature } = decodeResult.jwt;

    // Verify algorithm
    if (header.alg !== 'HS256') {
        return {
            success: false,
            error: `Unsupported algorithm: ${header.alg}. Only HS256 is supported.`,
        };
    }

    // Verify signature
    const parts = token.split('.');
    const signedData = `${parts[0]}.${parts[1]}`;

    try {
        const expectedSignature = await createHmacSignature(signedData, secret);

        if (!timingSafeEqual(signature, expectedSignature)) {
            return { success: false, error: 'Invalid signature' };
        }
    } catch (error) {
        return {
            success: false,
            error: `Signature verification failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        };
    }

    // Check expiration
    if (!ignoreExpiration && isJWTExpired(payload, clockTolerance)) {
        return { success: false, error: 'Token has expired' };
    }

    // Check not before
    if (isJWTNotYetValid(payload, clockTolerance)) {
        return { success: false, error: 'Token is not yet valid' };
    }

    // Check issuer
    if (issuer && payload.iss !== issuer) {
        return {
            success: false,
            error: `Invalid issuer: expected ${issuer}, got ${payload.iss}`,
        };
    }

    // Check audience
    if (audience) {
        const payloadAud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
        const expectedAud = Array.isArray(audience) ? audience : [audience];

        const hasValidAudience = expectedAud.some((aud) =>
            payloadAud.includes(aud)
        );

        if (!hasValidAudience) {
            return {
                success: false,
                error: `Invalid audience: expected one of ${expectedAud.join(', ')}`,
            };
        }
    }

    return { success: true, payload };
}

/**
 * Verify JWT without async (decode + check claims only, no signature verification)
 * Useful when you trust the token source (e.g., from a trusted proxy)
 *
 * @param token - JWT string
 * @param options - Verification options (without signature check)
 * @returns Verification result
 */
export function verifyJWTSync(
    token: string,
    options: Omit<JWTVerifyOptions, 'secret'> = {}
): VerifyResult {
    const { clockTolerance = 0, ignoreExpiration = false, issuer, audience } = options;

    const decodeResult = decodeJWT(token);
    if (!decodeResult.success) {
        return { success: false, error: decodeResult.error };
    }

    const { payload } = decodeResult.jwt;

    // Check expiration
    if (!ignoreExpiration && isJWTExpired(payload, clockTolerance)) {
        return { success: false, error: 'Token has expired' };
    }

    // Check not before
    if (isJWTNotYetValid(payload, clockTolerance)) {
        return { success: false, error: 'Token is not yet valid' };
    }

    // Check issuer
    if (issuer && payload.iss !== issuer) {
        return {
            success: false,
            error: `Invalid issuer: expected ${issuer}, got ${payload.iss}`,
        };
    }

    // Check audience
    if (audience) {
        const payloadAud = Array.isArray(payload.aud)
            ? payload.aud
            : payload.aud
                ? [payload.aud]
                : [];
        const expectedAud = Array.isArray(audience) ? audience : [audience];

        const hasValidAudience = expectedAud.some((aud) =>
            payloadAud.includes(aud)
        );

        if (!hasValidAudience) {
            return {
                success: false,
                error: `Invalid audience: expected one of ${expectedAud.join(', ')}`,
            };
        }
    }

    return { success: true, payload };
}

/**
 * Create a simple HS256 JWT (for testing purposes)
 * 
 * @param payload - JWT payload
 * @param secret - HMAC secret
 * @returns JWT string
 */
export async function createTestJWT(
    payload: EthosJWTPayload,
    secret: string
): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };

    const headerB64 = btoa(JSON.stringify(header))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const payloadB64 = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const signedData = `${headerB64}.${payloadB64}`;
    const signature = await createHmacSignature(signedData, secret);

    return `${signedData}.${signature}`;
}
