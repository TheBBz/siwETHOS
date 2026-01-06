/**
 * JWT Decoder
 *
 * Utilities for decoding JWTs without cryptographic verification.
 * Useful for reading JWT claims before deciding whether to verify.
 */

import type { DecodedJWT, DecodeResult, JWTHeader, EthosJWTPayload } from '../types';

// ============================================================================
// Base64 URL Utilities
// ============================================================================

/**
 * Decode base64url string to UTF-8
 * @param input - Base64url encoded string
 */
export function base64UrlDecode(input: string): string {
    // Replace URL-safe characters with standard base64
    let base64 = input.replace(/-/g, '+').replace(/_/g, '/');

    // Pad with = to make it valid base64
    const padding = base64.length % 4;
    if (padding) {
        base64 += '='.repeat(4 - padding);
    }

    // Decode (works in both Node.js and browser)
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(base64, 'base64').toString('utf-8');
    }

    // Browser fallback using atob
    return decodeURIComponent(
        atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
}

/**
 * Encode string to base64url
 * @param input - UTF-8 string
 */
export function base64UrlEncode(input: string): string {
    let base64: string;

    if (typeof Buffer !== 'undefined') {
        base64 = Buffer.from(input, 'utf-8').toString('base64');
    } else {
        // Browser fallback
        base64 = btoa(
            encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, p1) =>
                String.fromCharCode(parseInt(p1, 16))
            )
        );
    }

    // Convert to base64url
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ============================================================================
// JWT Decoding
// ============================================================================

/**
 * Decode a JWT without verifying its signature
 *
 * @param token - JWT string
 * @returns Decoded JWT or error
 *
 * @example
 * ```ts
 * const result = decodeJWT(token);
 * if (result.success) {
 *   console.log(result.jwt.payload.sub);
 * }
 * ```
 */
export function decodeJWT(token: string): DecodeResult {
    try {
        const parts = token.split('.');

        if (parts.length !== 3) {
            return {
                success: false,
                error: 'Invalid JWT format: expected 3 parts',
            };
        }

        const [headerB64, payloadB64, signature] = parts;

        // Decode header
        let header: JWTHeader;
        try {
            header = JSON.parse(base64UrlDecode(headerB64)) as JWTHeader;
        } catch {
            return {
                success: false,
                error: 'Invalid JWT header: failed to parse JSON',
            };
        }

        // Decode payload
        let payload: EthosJWTPayload;
        try {
            payload = JSON.parse(base64UrlDecode(payloadB64)) as EthosJWTPayload;
        } catch {
            return {
                success: false,
                error: 'Invalid JWT payload: failed to parse JSON',
            };
        }

        return {
            success: true,
            jwt: {
                header,
                payload,
                signature,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: `Failed to decode JWT: ${error instanceof Error ? error.message : 'unknown error'}`,
        };
    }
}

/**
 * Get JWT payload without full decode result
 * Convenience function for simpler access
 *
 * @param token - JWT string
 * @returns Payload or null if invalid
 */
export function getJWTPayload(token: string): EthosJWTPayload | null {
    const result = decodeJWT(token);
    return result.success ? result.jwt.payload : null;
}

/**
 * Check if a JWT is expired
 *
 * @param payload - JWT payload
 * @param clockTolerance - Tolerance in seconds (default: 0)
 * @returns True if expired
 */
export function isJWTExpired(
    payload: EthosJWTPayload,
    clockTolerance = 0
): boolean {
    if (!payload.exp) {
        return false; // No expiration set
    }

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now - clockTolerance;
}

/**
 * Check if JWT is not yet valid (nbf claim)
 *
 * @param payload - JWT payload
 * @param clockTolerance - Tolerance in seconds (default: 0)
 * @returns True if not yet valid
 */
export function isJWTNotYetValid(
    payload: EthosJWTPayload,
    clockTolerance = 0
): boolean {
    if (!payload.nbf) {
        return false; // No nbf set
    }

    const now = Math.floor(Date.now() / 1000);
    return payload.nbf > now + clockTolerance;
}

/**
 * Get remaining validity time in seconds
 *
 * @param payload - JWT payload
 * @returns Seconds until expiration, or null if no exp
 */
export function getJWTTimeRemaining(payload: EthosJWTPayload): number | null {
    if (!payload.exp) {
        return null;
    }

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
}
