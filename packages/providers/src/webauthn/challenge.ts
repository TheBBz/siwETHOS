/**
 * WebAuthn Challenge Management
 *
 * Utilities for generating, storing, and validating WebAuthn challenges.
 */

import type { StoredChallenge, ChallengeStore, WebAuthnUser } from './types';
import { generateChallenge } from './utils';

// ============================================================================
// Challenge Generation
// ============================================================================

/**
 * Default challenge TTL in milliseconds (5 minutes)
 */
export const DEFAULT_CHALLENGE_TTL = 5 * 60 * 1000;

/**
 * Create a registration challenge
 *
 * @param user - User information for registration
 * @param ttl - Challenge TTL in milliseconds
 * @returns Stored challenge object
 */
export function createRegistrationChallenge(
    user: WebAuthnUser,
    ttl = DEFAULT_CHALLENGE_TTL
): StoredChallenge {
    return {
        challenge: generateChallenge(),
        type: 'registration',
        userData: user,
        expiresAt: Date.now() + ttl,
    };
}

/**
 * Create an authentication challenge
 *
 * @param userId - Optional user ID (for known user auth)
 * @param ttl - Challenge TTL in milliseconds
 * @returns Stored challenge object
 */
export function createAuthenticationChallenge(
    userId?: string,
    ttl = DEFAULT_CHALLENGE_TTL
): StoredChallenge {
    return {
        challenge: generateChallenge(),
        type: 'authentication',
        userId,
        expiresAt: Date.now() + ttl,
    };
}

/**
 * Check if a challenge has expired
 */
export function isChallengeExpired(challenge: StoredChallenge): boolean {
    return Date.now() > challenge.expiresAt;
}

/**
 * Validate challenge value matches
 * Uses timing-safe comparison
 */
export function validateChallengeValue(
    expected: string,
    received: string
): boolean {
    if (expected.length !== received.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < expected.length; i++) {
        result |= expected.charCodeAt(i) ^ received.charCodeAt(i);
    }
    return result === 0;
}

// ============================================================================
// In-Memory Challenge Store
// ============================================================================

/**
 * Simple in-memory challenge store
 * Good for development/testing, use Redis/DB in production
 */
export class MemoryChallengeStore implements ChallengeStore {
    private challenges = new Map<string, StoredChallenge>();
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;

    constructor(cleanupIntervalMs = 60000) {
        // Auto-cleanup expired challenges
        if (cleanupIntervalMs > 0) {
            this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
        }
    }

    async store(challenge: StoredChallenge): Promise<void> {
        this.challenges.set(challenge.challenge, challenge);
    }

    async consume(value: string): Promise<StoredChallenge | null> {
        const challenge = this.challenges.get(value);
        if (!challenge) {
            return null;
        }

        // Remove the challenge (one-time use)
        this.challenges.delete(value);

        // Check if expired
        if (isChallengeExpired(challenge)) {
            return null;
        }

        return challenge;
    }

    async cleanup(): Promise<void> {
        const now = Date.now();
        for (const [key, challenge] of this.challenges) {
            if (challenge.expiresAt < now) {
                this.challenges.delete(key);
            }
        }
    }

    /**
     * Stop the cleanup interval (for graceful shutdown)
     */
    dispose(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Get number of stored challenges (for testing)
     */
    get size(): number {
        return this.challenges.size;
    }

    /**
     * Clear all challenges (for testing)
     */
    clear(): void {
        this.challenges.clear();
    }
}

// ============================================================================
// In-Memory Credential Store
// ============================================================================

import type { StoredCredential, CredentialStore } from './types';

/**
 * Simple in-memory credential store
 * Good for development/testing, use a database in production
 */
export class MemoryCredentialStore implements CredentialStore {
    private credentials = new Map<string, StoredCredential>();

    async create(credential: StoredCredential): Promise<void> {
        if (this.credentials.has(credential.credentialId)) {
            throw new Error('Credential already exists');
        }
        this.credentials.set(credential.credentialId, { ...credential });
    }

    async findById(credentialId: string): Promise<StoredCredential | null> {
        return this.credentials.get(credentialId) ?? null;
    }

    async findByUserId(userId: string): Promise<StoredCredential[]> {
        return Array.from(this.credentials.values()).filter(
            (c) => c.userId === userId
        );
    }

    async update(
        credentialId: string,
        updates: Partial<StoredCredential>
    ): Promise<void> {
        const existing = this.credentials.get(credentialId);
        if (!existing) {
            throw new Error('Credential not found');
        }
        this.credentials.set(credentialId, { ...existing, ...updates });
    }

    async delete(credentialId: string): Promise<void> {
        this.credentials.delete(credentialId);
    }

    /**
     * Get number of stored credentials (for testing)
     */
    get size(): number {
        return this.credentials.size;
    }

    /**
     * Clear all credentials (for testing)
     */
    clear(): void {
        this.credentials.clear();
    }
}
