/**
 * WebAuthn Tests
 *
 * Comprehensive tests for WebAuthn utilities, challenge management, and verification.
 * Target: 80%+ coverage.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    // Utils
    base64UrlEncode,
    base64UrlDecode,
    stringToBase64Url,
    base64UrlToString,
    generateRandomBytes,
    generateChallenge,
    generateUserId,
    parseClientDataJSON,
    parseAuthenticatorData,
    normalizeCredentialId,
    credentialIdsEqual,
} from '../webauthn/utils';
import {
    // Challenge
    DEFAULT_CHALLENGE_TTL,
    createRegistrationChallenge,
    createAuthenticationChallenge,
    isChallengeExpired,
    validateChallengeValue,
    MemoryChallengeStore,
    MemoryCredentialStore,
} from '../webauthn/challenge';
import {
    // Registration
    DEFAULT_ALGORITHMS,
    buildRegistrationOptions,
} from '../webauthn/register';
import {
    // Authentication
    buildAuthenticationOptions,
} from '../webauthn/authenticate';
import type { StoredChallenge, StoredCredential, WebAuthnUser } from '../webauthn/types';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockUser: WebAuthnUser = {
    id: 'dXNlcjEyMw', // base64url of 'user123'
    name: 'alice@example.com',
    displayName: 'Alice',
};

// ============================================================================
// Utils Tests
// ============================================================================

describe('base64UrlEncode/Decode', () => {
    it('should encode and decode ArrayBuffer', () => {
        const original = new Uint8Array([1, 2, 3, 4, 5]);
        const encoded = base64UrlEncode(original);
        const decoded = base64UrlDecode(encoded);

        expect(decoded).toEqual(original);
    });

    it('should produce URL-safe output', () => {
        const data = new Uint8Array(100);
        crypto.getRandomValues(data);
        const encoded = base64UrlEncode(data);

        expect(encoded).not.toContain('+');
        expect(encoded).not.toContain('/');
        expect(encoded).not.toContain('=');
    });

    it('should handle empty input', () => {
        const empty = new Uint8Array(0);
        const encoded = base64UrlEncode(empty);
        expect(encoded).toBe('');
    });
});

describe('stringToBase64Url/base64UrlToString', () => {
    it('should encode and decode strings', () => {
        const original = 'Hello, WebAuthn! 🔐';
        const encoded = stringToBase64Url(original);
        const decoded = base64UrlToString(encoded);

        expect(decoded).toBe(original);
    });

    it('should handle empty string', () => {
        expect(base64UrlToString(stringToBase64Url(''))).toBe('');
    });
});

describe('generateRandomBytes', () => {
    it('should generate specified length', () => {
        const bytes = generateRandomBytes(32);
        expect(bytes.length).toBe(32);
    });

    it('should generate different values each time', () => {
        const a = generateRandomBytes(32);
        const b = generateRandomBytes(32);
        expect(a).not.toEqual(b);
    });
});

describe('generateChallenge', () => {
    it('should generate base64url string', () => {
        const challenge = generateChallenge();
        expect(challenge).not.toContain('+');
        expect(challenge).not.toContain('/');
        expect(challenge).not.toContain('=');
    });

    it('should generate unique values', () => {
        const a = generateChallenge();
        const b = generateChallenge();
        expect(a).not.toBe(b);
    });

    it('should use specified length', () => {
        const challenge = generateChallenge(16);
        const decoded = base64UrlDecode(challenge);
        expect(decoded.length).toBe(16);
    });
});

describe('generateUserId', () => {
    it('should generate base64url string', () => {
        const userId = generateUserId();
        expect(userId.length).toBeGreaterThan(0);
    });
});

describe('parseClientDataJSON', () => {
    it('should parse valid client data', () => {
        const clientData = {
            type: 'webauthn.create',
            challenge: 'test-challenge',
            origin: 'https://example.com',
        };
        const encoded = stringToBase64Url(JSON.stringify(clientData));
        const parsed = parseClientDataJSON(encoded);

        expect(parsed.type).toBe('webauthn.create');
        expect(parsed.challenge).toBe('test-challenge');
        expect(parsed.origin).toBe('https://example.com');
    });
});

describe('parseAuthenticatorData', () => {
    it('should parse basic authenticator data', () => {
        // Create minimal authenticator data:
        // 32 bytes RP ID hash + 1 byte flags + 4 bytes counter
        const data = new Uint8Array(37);
        // RP ID hash (32 bytes of zeros)
        data.fill(0, 0, 32);
        // Flags: user present (0x01)
        data[32] = 0x01;
        // Counter: 1 (big-endian)
        data[33] = 0;
        data[34] = 0;
        data[35] = 0;
        data[36] = 1;

        const parsed = parseAuthenticatorData(data);

        expect(parsed.flags.userPresent).toBe(true);
        expect(parsed.flags.userVerified).toBe(false);
        expect(parsed.counter).toBe(1);
    });

    it('should parse flags correctly', () => {
        const data = new Uint8Array(37);
        // Flags: user present + user verified (0x05)
        data[32] = 0x05;

        const parsed = parseAuthenticatorData(data);

        expect(parsed.flags.userPresent).toBe(true);
        expect(parsed.flags.userVerified).toBe(true);
        expect(parsed.flags.attestedCredentialData).toBe(false);
        expect(parsed.flags.extensionData).toBe(false);
    });
});

describe('normalizeCredentialId', () => {
    it('should return string as-is', () => {
        expect(normalizeCredentialId('abc123')).toBe('abc123');
    });

    it('should encode ArrayBuffer', () => {
        const buffer = new Uint8Array([1, 2, 3]);
        const result = normalizeCredentialId(buffer);
        expect(typeof result).toBe('string');
    });
});

describe('credentialIdsEqual', () => {
    it('should return true for equal IDs', () => {
        expect(credentialIdsEqual('abc123', 'abc123')).toBe(true);
    });

    it('should return false for different IDs', () => {
        expect(credentialIdsEqual('abc123', 'xyz789')).toBe(false);
    });
});

// ============================================================================
// Challenge Tests
// ============================================================================

describe('createRegistrationChallenge', () => {
    it('should create challenge with user data', () => {
        const challenge = createRegistrationChallenge(mockUser);

        expect(challenge.type).toBe('registration');
        expect(challenge.userData).toEqual(mockUser);
        expect(challenge.challenge.length).toBeGreaterThan(0);
        expect(challenge.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should respect custom TTL', () => {
        const ttl = 1000;
        const challenge = createRegistrationChallenge(mockUser, ttl);
        const expectedExpiry = Date.now() + ttl;

        expect(Math.abs(challenge.expiresAt - expectedExpiry)).toBeLessThan(100);
    });
});

describe('createAuthenticationChallenge', () => {
    it('should create challenge without user ID', () => {
        const challenge = createAuthenticationChallenge();

        expect(challenge.type).toBe('authentication');
        expect(challenge.userId).toBeUndefined();
        expect(challenge.challenge.length).toBeGreaterThan(0);
    });

    it('should create challenge with user ID', () => {
        const challenge = createAuthenticationChallenge('user123');

        expect(challenge.userId).toBe('user123');
    });
});

describe('isChallengeExpired', () => {
    it('should return false for valid challenge', () => {
        const challenge: StoredChallenge = {
            challenge: 'test',
            type: 'registration',
            expiresAt: Date.now() + 10000,
        };
        expect(isChallengeExpired(challenge)).toBe(false);
    });

    it('should return true for expired challenge', () => {
        const challenge: StoredChallenge = {
            challenge: 'test',
            type: 'registration',
            expiresAt: Date.now() - 1000,
        };
        expect(isChallengeExpired(challenge)).toBe(true);
    });
});

describe('validateChallengeValue', () => {
    it('should return true for matching challenges', () => {
        expect(validateChallengeValue('abc123', 'abc123')).toBe(true);
    });

    it('should return false for different challenges', () => {
        expect(validateChallengeValue('abc123', 'xyz789')).toBe(false);
    });

    it('should return false for different lengths', () => {
        expect(validateChallengeValue('abc', 'abcd')).toBe(false);
    });
});

// ============================================================================
// Memory Store Tests
// ============================================================================

describe('MemoryChallengeStore', () => {
    let store: MemoryChallengeStore;

    beforeEach(() => {
        store = new MemoryChallengeStore(0); // Disable auto-cleanup for tests
    });

    afterEach(() => {
        store.dispose();
    });

    it('should store and consume challenge', async () => {
        const challenge = createRegistrationChallenge(mockUser);
        await store.store(challenge);

        const consumed = await store.consume(challenge.challenge);
        expect(consumed).toEqual(challenge);
    });

    it('should return null for non-existent challenge', async () => {
        const consumed = await store.consume('non-existent');
        expect(consumed).toBeNull();
    });

    it('should remove challenge after consumption', async () => {
        const challenge = createRegistrationChallenge(mockUser);
        await store.store(challenge);

        await store.consume(challenge.challenge);
        const secondAttempt = await store.consume(challenge.challenge);
        expect(secondAttempt).toBeNull();
    });

    it('should return null for expired challenge', async () => {
        const challenge: StoredChallenge = {
            challenge: 'expired',
            type: 'registration',
            expiresAt: Date.now() - 1000,
        };
        await store.store(challenge);

        const consumed = await store.consume(challenge.challenge);
        expect(consumed).toBeNull();
    });

    it('should cleanup expired challenges', async () => {
        const expired: StoredChallenge = {
            challenge: 'expired',
            type: 'registration',
            expiresAt: Date.now() - 1000,
        };
        const valid = createRegistrationChallenge(mockUser);

        await store.store(expired);
        await store.store(valid);
        expect(store.size).toBe(2);

        await store.cleanup();
        expect(store.size).toBe(1);
    });
});

describe('MemoryCredentialStore', () => {
    let store: MemoryCredentialStore;

    beforeEach(() => {
        store = new MemoryCredentialStore();
    });

    const mockCredential: StoredCredential = {
        credentialId: 'cred123',
        userId: 'user123',
        publicKey: 'publickey',
        algorithm: -7,
        counter: 0,
        createdAt: Date.now(),
    };

    it('should create and find credential', async () => {
        await store.create(mockCredential);
        const found = await store.findById('cred123');
        expect(found).toEqual(mockCredential);
    });

    it('should return null for non-existent credential', async () => {
        const found = await store.findById('non-existent');
        expect(found).toBeNull();
    });

    it('should find credentials by user ID', async () => {
        await store.create(mockCredential);
        await store.create({ ...mockCredential, credentialId: 'cred456' });

        const userCreds = await store.findByUserId('user123');
        expect(userCreds.length).toBe(2);
    });

    it('should update credential', async () => {
        await store.create(mockCredential);
        await store.update('cred123', { counter: 5, lastUsedAt: Date.now() });

        const updated = await store.findById('cred123');
        expect(updated?.counter).toBe(5);
        expect(updated?.lastUsedAt).toBeDefined();
    });

    it('should delete credential', async () => {
        await store.create(mockCredential);
        await store.delete('cred123');

        const deleted = await store.findById('cred123');
        expect(deleted).toBeNull();
    });

    it('should throw on duplicate credential', async () => {
        await store.create(mockCredential);
        await expect(store.create(mockCredential)).rejects.toThrow('already exists');
    });
});

// ============================================================================
// Options Builder Tests
// ============================================================================

describe('buildRegistrationOptions', () => {
    it('should build valid options', () => {
        const options = buildRegistrationOptions({
            rp: { id: 'example.com', name: 'My App' },
            user: mockUser,
            challenge: 'test-challenge',
        });

        expect(options.rp.id).toBe('example.com');
        expect(options.user).toEqual(mockUser);
        expect(options.challenge).toBe('test-challenge');
        expect(options.pubKeyCredParams.length).toBe(DEFAULT_ALGORITHMS.length);
        expect(options.timeout).toBe(60000);
        expect(options.attestation).toBe('none');
    });

    it('should use custom algorithms', () => {
        const options = buildRegistrationOptions({
            rp: { id: 'example.com', name: 'My App' },
            user: mockUser,
            challenge: 'test',
            supportedAlgorithms: [-7],
        });

        expect(options.pubKeyCredParams.length).toBe(1);
        expect(options.pubKeyCredParams[0].alg).toBe(-7);
    });

    it('should include exclude credentials', () => {
        const options = buildRegistrationOptions({
            rp: { id: 'example.com', name: 'My App' },
            user: mockUser,
            challenge: 'test',
            excludeCredentials: [{ type: 'public-key', id: 'existing-cred' }],
        });

        expect(options.excludeCredentials?.length).toBe(1);
    });
});

describe('buildAuthenticationOptions', () => {
    it('should build valid options', () => {
        const options = buildAuthenticationOptions({
            challenge: 'test-challenge',
            rpId: 'example.com',
        });

        expect(options.challenge).toBe('test-challenge');
        expect(options.rpId).toBe('example.com');
        expect(options.userVerification).toBe('preferred');
        expect(options.timeout).toBe(60000);
    });

    it('should include allowed credentials', () => {
        const options = buildAuthenticationOptions({
            challenge: 'test',
            allowCredentials: [{ type: 'public-key', id: 'cred123' }],
        });

        expect(options.allowCredentials?.length).toBe(1);
    });

    it('should use custom user verification', () => {
        const options = buildAuthenticationOptions({
            challenge: 'test',
            userVerification: 'required',
        });

        expect(options.userVerification).toBe('required');
    });
});
