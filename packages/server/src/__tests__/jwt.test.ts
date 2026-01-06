/**
 * JWT Decoder and Verifier Tests
 *
 * Comprehensive tests for JWT utilities with 80%+ coverage target.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    base64UrlDecode,
    base64UrlEncode,
    decodeJWT,
    getJWTPayload,
    isJWTExpired,
    isJWTNotYetValid,
    getJWTTimeRemaining,
} from '../jwt/decoder';
import {
    verifyJWT,
    verifyJWTSync,
    createTestJWT,
} from '../jwt/verifier';
import type { EthosJWTPayload } from '../types';

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_SECRET = 'test-secret-key-for-hmac-256';

const createMockPayload = (
    overrides: Partial<EthosJWTPayload> = {}
): EthosJWTPayload => ({
    sub: 'user-123',
    iss: 'ethos-auth',
    aud: 'my-app',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
    ethosProfileId: 12345,
    ethosUsername: 'testuser',
    ethosScore: 1500,
    ethosLevel: 'established',
    authMethod: 'wallet',
    walletAddress: '0x1234567890123456789012345678901234567890',
    ...overrides,
});

// Create a simple JWT for testing (without proper signature)
function createTestToken(payload: EthosJWTPayload, header = { alg: 'HS256', typ: 'JWT' }): string {
    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    return `${headerB64}.${payloadB64}.fake-signature`;
}

// ============================================================================
// Base64URL Tests
// ============================================================================

describe('base64UrlEncode', () => {
    it('should encode simple strings', () => {
        const encoded = base64UrlEncode('hello world');
        expect(encoded).toBe('aGVsbG8gd29ybGQ');
    });

    it('should not contain + / = characters', () => {
        const encoded = base64UrlEncode('test with special chars ñ 你好');
        expect(encoded).not.toContain('+');
        expect(encoded).not.toContain('/');
        expect(encoded).not.toContain('=');
    });

    it('should encode JSON objects', () => {
        const obj = { foo: 'bar', num: 123 };
        const encoded = base64UrlEncode(JSON.stringify(obj));
        expect(encoded).toBeTruthy();
        expect(base64UrlDecode(encoded)).toBe(JSON.stringify(obj));
    });
});

describe('base64UrlDecode', () => {
    it('should decode base64url strings', () => {
        const decoded = base64UrlDecode('aGVsbG8gd29ybGQ');
        expect(decoded).toBe('hello world');
    });

    it('should handle strings with padding removed', () => {
        // 'a' encodes to 'YQ==' in base64, 'YQ' in base64url
        const decoded = base64UrlDecode('YQ');
        expect(decoded).toBe('a');
    });

    it('should decode URL-safe characters', () => {
        // Base64url uses - and _ instead of + and /
        const input = 'hello+world/test';
        const encoded = base64UrlEncode(input);
        const decoded = base64UrlDecode(encoded);
        expect(decoded).toBe(input);
    });
});

// ============================================================================
// JWT Decode Tests
// ============================================================================

describe('decodeJWT', () => {
    it('should decode a valid JWT', () => {
        const payload = createMockPayload();
        const token = createTestToken(payload);
        const result = decodeJWT(token);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.jwt.header.alg).toBe('HS256');
            expect(result.jwt.header.typ).toBe('JWT');
            expect(result.jwt.payload.sub).toBe('user-123');
            expect(result.jwt.payload.ethosProfileId).toBe(12345);
        }
    });

    it('should fail for invalid format (not 3 parts)', () => {
        const result = decodeJWT('invalid.token');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain('expected 3 parts');
        }
    });

    it('should fail for invalid format (no parts)', () => {
        const result = decodeJWT('invalidtoken');
        expect(result.success).toBe(false);
    });

    it('should fail for invalid header JSON', () => {
        const result = decodeJWT('not-valid-base64.eyJzdWIiOiIxMjMifQ.sig');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain('header');
        }
    });

    it('should fail for invalid payload JSON', () => {
        const headerB64 = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const result = decodeJWT(`${headerB64}.not-valid-json.sig`);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain('payload');
        }
    });

    it('should preserve signature string', () => {
        const payload = createMockPayload();
        const token = createTestToken(payload);
        const result = decodeJWT(token);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.jwt.signature).toBe('fake-signature');
        }
    });
});

describe('getJWTPayload', () => {
    it('should return payload for valid token', () => {
        const payload = createMockPayload();
        const token = createTestToken(payload);
        const result = getJWTPayload(token);

        expect(result).not.toBeNull();
        expect(result?.sub).toBe('user-123');
    });

    it('should return null for invalid token', () => {
        const result = getJWTPayload('invalid');
        expect(result).toBeNull();
    });
});

// ============================================================================
// JWT Expiration Tests
// ============================================================================

describe('isJWTExpired', () => {
    it('should return false for unexpired token', () => {
        const payload = createMockPayload({
            exp: Math.floor(Date.now() / 1000) + 3600,
        });
        expect(isJWTExpired(payload)).toBe(false);
    });

    it('should return true for expired token', () => {
        const payload = createMockPayload({
            exp: Math.floor(Date.now() / 1000) - 3600,
        });
        expect(isJWTExpired(payload)).toBe(true);
    });

    it('should return false if no exp claim', () => {
        const payload = createMockPayload();
        delete (payload as { exp?: number }).exp;
        expect(isJWTExpired(payload)).toBe(false);
    });

    it('should respect clock tolerance', () => {
        const payload = createMockPayload({
            exp: Math.floor(Date.now() / 1000) - 30, // 30 seconds ago
        });
        expect(isJWTExpired(payload, 0)).toBe(true);
        expect(isJWTExpired(payload, 60)).toBe(false); // 60s tolerance
    });
});

describe('isJWTNotYetValid', () => {
    it('should return false if nbf is in the past', () => {
        const payload = createMockPayload({
            nbf: Math.floor(Date.now() / 1000) - 3600,
        });
        expect(isJWTNotYetValid(payload)).toBe(false);
    });

    it('should return true if nbf is in the future', () => {
        const payload = createMockPayload({
            nbf: Math.floor(Date.now() / 1000) + 3600,
        });
        expect(isJWTNotYetValid(payload)).toBe(true);
    });

    it('should return false if no nbf claim', () => {
        const payload = createMockPayload();
        expect(isJWTNotYetValid(payload)).toBe(false);
    });

    it('should respect clock tolerance', () => {
        const payload = createMockPayload({
            nbf: Math.floor(Date.now() / 1000) + 30, // 30 seconds in future
        });
        expect(isJWTNotYetValid(payload, 0)).toBe(true);
        expect(isJWTNotYetValid(payload, 60)).toBe(false); // 60s tolerance
    });
});

describe('getJWTTimeRemaining', () => {
    it('should return seconds until expiration', () => {
        const futureExp = Math.floor(Date.now() / 1000) + 3600;
        const payload = createMockPayload({ exp: futureExp });
        const remaining = getJWTTimeRemaining(payload);

        expect(remaining).not.toBeNull();
        expect(remaining).toBeGreaterThan(3500);
        expect(remaining).toBeLessThanOrEqual(3600);
    });

    it('should return 0 for expired tokens', () => {
        const payload = createMockPayload({
            exp: Math.floor(Date.now() / 1000) - 100,
        });
        expect(getJWTTimeRemaining(payload)).toBe(0);
    });

    it('should return null if no exp claim', () => {
        const payload = createMockPayload();
        delete (payload as { exp?: number }).exp;
        expect(getJWTTimeRemaining(payload)).toBeNull();
    });
});

// ============================================================================
// JWT Verification Tests
// ============================================================================

describe('verifyJWTSync', () => {
    it('should verify valid token claims', () => {
        const payload = createMockPayload();
        const token = createTestToken(payload);
        const result = verifyJWTSync(token);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.payload.sub).toBe('user-123');
        }
    });

    it('should fail for expired token', () => {
        const payload = createMockPayload({
            exp: Math.floor(Date.now() / 1000) - 3600,
        });
        const token = createTestToken(payload);
        const result = verifyJWTSync(token);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain('expired');
        }
    });

    it('should skip expiration check with ignoreExpiration', () => {
        const payload = createMockPayload({
            exp: Math.floor(Date.now() / 1000) - 3600,
        });
        const token = createTestToken(payload);
        const result = verifyJWTSync(token, { ignoreExpiration: true });

        expect(result.success).toBe(true);
    });

    it('should validate issuer', () => {
        const payload = createMockPayload({ iss: 'wrong-issuer' });
        const token = createTestToken(payload);
        const result = verifyJWTSync(token, { issuer: 'ethos-auth' });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain('issuer');
        }
    });

    it('should validate audience', () => {
        const payload = createMockPayload({ aud: 'wrong-audience' });
        const token = createTestToken(payload);
        const result = verifyJWTSync(token, { audience: 'my-app' });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain('audience');
        }
    });

    it('should accept matching audience', () => {
        const payload = createMockPayload({ aud: 'my-app' });
        const token = createTestToken(payload);
        const result = verifyJWTSync(token, { audience: 'my-app' });

        expect(result.success).toBe(true);
    });

    it('should accept any of multiple audiences', () => {
        const payload = createMockPayload({ aud: 'app-2' });
        const token = createTestToken(payload);
        const result = verifyJWTSync(token, { audience: ['app-1', 'app-2', 'app-3'] });

        expect(result.success).toBe(true);
    });
});

describe('verifyJWT (async with signature)', () => {
    it('should verify token with correct secret', async () => {
        const payload = createMockPayload();
        const token = await createTestJWT(payload, TEST_SECRET);
        const result = await verifyJWT(token, TEST_SECRET);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.payload.sub).toBe('user-123');
            expect(result.payload.ethosScore).toBe(1500);
        }
    });

    it('should fail with wrong secret', async () => {
        const payload = createMockPayload();
        const token = await createTestJWT(payload, TEST_SECRET);
        const result = await verifyJWT(token, 'wrong-secret');

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain('Invalid signature');
        }
    });

    it('should fail with unsupported algorithm', async () => {
        const payload = createMockPayload();
        const headerB64 = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
        const payloadB64 = base64UrlEncode(JSON.stringify(payload));
        const token = `${headerB64}.${payloadB64}.sig`;

        const result = await verifyJWT(token, TEST_SECRET);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain('Unsupported algorithm');
        }
    });

    it('should verify all claims', async () => {
        const payload = createMockPayload({
            iss: 'ethos-auth',
            aud: 'my-app',
        });
        const token = await createTestJWT(payload, TEST_SECRET);
        const result = await verifyJWT(token, TEST_SECRET, {
            issuer: 'ethos-auth',
            audience: 'my-app',
        });

        expect(result.success).toBe(true);
    });
});

describe('createTestJWT', () => {
    it('should create a valid JWT', async () => {
        const payload = createMockPayload();
        const token = await createTestJWT(payload, TEST_SECRET);

        expect(token.split('.').length).toBe(3);
    });

    it('should create verifiable JWT', async () => {
        const payload = createMockPayload();
        const token = await createTestJWT(payload, TEST_SECRET);
        const result = await verifyJWT(token, TEST_SECRET);

        expect(result.success).toBe(true);
    });
});
