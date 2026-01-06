/**
 * Profile Enrichment Utilities Tests
 *
 * Comprehensive tests for all profile enrichment functions.
 * Target: 80%+ coverage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getLinkedAccounts,
    hasAttestation,
    getAttestationByService,
    getAttestationsByService,
    getProfileAge,
    getProfileStats,
    countAccountsByService,
    getLinkedServices,
    weiToEth,
    formatDuration,
    type LinkedAccount,
    type ProfileStats,
} from '../ethos/enrichment';
import type { EthosProfile, EthosAttestation } from '../ethos';

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockAttestation = (
    overrides: Partial<EthosAttestation> = {}
): EthosAttestation => ({
    id: 1,
    hash: '0x123',
    profileId: 100,
    service: 'twitter',
    account: 'user123',
    createdAt: 1700000000,
    extra: {
        username: 'testuser',
        url: 'https://twitter.com/testuser',
    },
    ...overrides,
});

const createMockProfile = (
    overrides: Partial<EthosProfile> = {}
): EthosProfile => ({
    id: 1,
    profileId: 100,
    displayName: 'Test User',
    username: 'testuser',
    avatarUrl: 'https://example.com/avatar.png',
    description: 'Test description',
    score: 1500,
    level: 'established',
    status: 'ACTIVE',
    userkeys: ['addr:0x123'],
    xpTotal: 5000,
    xpStreakDays: 10,
    influenceFactor: 1.5,
    influenceFactorPercentile: 75,
    ...overrides,
});

// ============================================================================
// Unit Tests: Helper Functions
// ============================================================================

describe('weiToEth', () => {
    it('should convert Wei to ETH with default precision', () => {
        expect(weiToEth(1e18)).toBe(1);
        expect(weiToEth(0.5e18)).toBe(0.5);
        expect(weiToEth(1.5e18)).toBe(1.5);
    });

    it('should handle zero', () => {
        expect(weiToEth(0)).toBe(0);
    });

    it('should handle small amounts', () => {
        expect(weiToEth(1e14)).toBe(0.0001);
    });

    it('should respect custom precision', () => {
        expect(weiToEth(1.123456789e18, 2)).toBe(1.12);
        expect(weiToEth(1.123456789e18, 6)).toBe(1.123457);
    });

    it('should handle large amounts', () => {
        expect(weiToEth(1000e18)).toBe(1000);
    });
});

describe('formatDuration', () => {
    it('should format seconds less than a minute as "just now"', () => {
        expect(formatDuration(0)).toBe('just now');
        expect(formatDuration(30)).toBe('just now');
        expect(formatDuration(59)).toBe('just now');
    });

    it('should format minutes', () => {
        expect(formatDuration(60)).toBe('1 minute ago');
        expect(formatDuration(120)).toBe('2 minutes ago');
        expect(formatDuration(3599)).toBe('59 minutes ago');
    });

    it('should format hours', () => {
        expect(formatDuration(3600)).toBe('1 hour ago');
        expect(formatDuration(7200)).toBe('2 hours ago');
        expect(formatDuration(86399)).toBe('23 hours ago');
    });

    it('should format days', () => {
        expect(formatDuration(86400)).toBe('1 day ago');
        expect(formatDuration(172800)).toBe('2 days ago');
        expect(formatDuration(604799)).toBe('6 days ago');
    });

    it('should format weeks', () => {
        expect(formatDuration(604800)).toBe('1 week ago');
        expect(formatDuration(1209600)).toBe('2 weeks ago');
    });

    it('should format months', () => {
        expect(formatDuration(2592000)).toBe('1 month ago');
        expect(formatDuration(5184000)).toBe('2 months ago');
    });

    it('should format years', () => {
        expect(formatDuration(31536000)).toBe('1 year ago');
        expect(formatDuration(63072000)).toBe('2 years ago');
    });
});

// ============================================================================
// Unit Tests: getLinkedAccounts
// ============================================================================

describe('getLinkedAccounts', () => {
    it('should return empty array for profile without attestations', () => {
        const profile = createMockProfile({ attestations: [] });
        expect(getLinkedAccounts(profile)).toEqual([]);
    });

    it('should return empty array when attestations is undefined', () => {
        const profile = createMockProfile({ attestations: undefined });
        expect(getLinkedAccounts(profile)).toEqual([]);
    });

    it('should extract linked accounts from attestations', () => {
        const attestations = [
            createMockAttestation({
                service: 'twitter',
                account: 'user1',
                extra: { username: 'twitteruser', url: 'https://twitter.com/twitteruser' },
                createdAt: 1700000000,
            }),
            createMockAttestation({
                id: 2,
                service: 'discord',
                account: '123456789',
                extra: { username: 'discorduser' },
                createdAt: 1700001000,
            }),
        ];

        const profile = createMockProfile({ attestations });
        const accounts = getLinkedAccounts(profile);

        expect(accounts).toHaveLength(2);
        expect(accounts[0]).toEqual({
            service: 'twitter',
            accountId: 'user1',
            username: 'twitteruser',
            url: 'https://twitter.com/twitteruser',
            linkedAt: 1700000000,
        });
        expect(accounts[1]).toEqual({
            service: 'discord',
            accountId: '123456789',
            username: 'discorduser',
            url: null,
            linkedAt: 1700001000,
        });
    });

    it('should handle missing extra data', () => {
        const attestation = createMockAttestation({ extra: undefined });
        const profile = createMockProfile({ attestations: [attestation] });
        const accounts = getLinkedAccounts(profile);

        expect(accounts[0].username).toBeNull();
        expect(accounts[0].url).toBeNull();
    });
});

// ============================================================================
// Unit Tests: hasAttestation
// ============================================================================

describe('hasAttestation', () => {
    it('should return false for empty attestations', () => {
        const profile = createMockProfile({ attestations: [] });
        expect(hasAttestation(profile, 'twitter')).toBe(false);
    });

    it('should return false when attestations is undefined', () => {
        const profile = createMockProfile({ attestations: undefined });
        expect(hasAttestation(profile, 'twitter')).toBe(false);
    });

    it('should return true when attestation exists', () => {
        const attestation = createMockAttestation({ service: 'twitter' });
        const profile = createMockProfile({ attestations: [attestation] });
        expect(hasAttestation(profile, 'twitter')).toBe(true);
    });

    it('should return false when attestation does not exist', () => {
        const attestation = createMockAttestation({ service: 'twitter' });
        const profile = createMockProfile({ attestations: [attestation] });
        expect(hasAttestation(profile, 'discord')).toBe(false);
    });

    it('should be case-insensitive', () => {
        const attestation = createMockAttestation({ service: 'Twitter' });
        const profile = createMockProfile({ attestations: [attestation] });
        expect(hasAttestation(profile, 'twitter')).toBe(true);
        expect(hasAttestation(profile, 'TWITTER')).toBe(true);
        expect(hasAttestation(profile, 'TwItTeR')).toBe(true);
    });
});

// ============================================================================
// Unit Tests: getAttestationByService
// ============================================================================

describe('getAttestationByService', () => {
    it('should return undefined for empty attestations', () => {
        const profile = createMockProfile({ attestations: [] });
        expect(getAttestationByService(profile, 'twitter')).toBeUndefined();
    });

    it('should return undefined when attestations is undefined', () => {
        const profile = createMockProfile({ attestations: undefined });
        expect(getAttestationByService(profile, 'twitter')).toBeUndefined();
    });

    it('should return attestation when it exists', () => {
        const attestation = createMockAttestation({ service: 'twitter' });
        const profile = createMockProfile({ attestations: [attestation] });
        const result = getAttestationByService(profile, 'twitter');
        expect(result).toEqual(attestation);
    });

    it('should return first attestation when multiple exist for same service', () => {
        const attestations = [
            createMockAttestation({ id: 1, service: 'twitter', account: 'first' }),
            createMockAttestation({ id: 2, service: 'twitter', account: 'second' }),
        ];
        const profile = createMockProfile({ attestations });
        const result = getAttestationByService(profile, 'twitter');
        expect(result?.account).toBe('first');
    });

    it('should be case-insensitive', () => {
        const attestation = createMockAttestation({ service: 'Discord' });
        const profile = createMockProfile({ attestations: [attestation] });
        expect(getAttestationByService(profile, 'discord')).toEqual(attestation);
        expect(getAttestationByService(profile, 'DISCORD')).toEqual(attestation);
    });
});

// ============================================================================
// Unit Tests: getAttestationsByService
// ============================================================================

describe('getAttestationsByService', () => {
    it('should return empty array for empty attestations', () => {
        const profile = createMockProfile({ attestations: [] });
        expect(getAttestationsByService(profile, 'twitter')).toEqual([]);
    });

    it('should return all attestations for a service', () => {
        const attestations = [
            createMockAttestation({ id: 1, service: 'twitter', account: 'first' }),
            createMockAttestation({ id: 2, service: 'twitter', account: 'second' }),
            createMockAttestation({ id: 3, service: 'discord', account: 'other' }),
        ];
        const profile = createMockProfile({ attestations });
        const result = getAttestationsByService(profile, 'twitter');

        expect(result).toHaveLength(2);
        expect(result[0].account).toBe('first');
        expect(result[1].account).toBe('second');
    });

    it('should be case-insensitive', () => {
        const attestation = createMockAttestation({ service: 'Discord' });
        const profile = createMockProfile({ attestations: [attestation] });
        expect(getAttestationsByService(profile, 'discord')).toHaveLength(1);
    });
});

// ============================================================================
// Unit Tests: getProfileAge
// ============================================================================

describe('getProfileAge', () => {
    it('should return "unknown" for profile without attestations', () => {
        const profile = createMockProfile({ attestations: [] });
        expect(getProfileAge(profile)).toBe('unknown');
    });

    it('should return "unknown" when attestations is undefined', () => {
        const profile = createMockProfile({ attestations: undefined });
        expect(getProfileAge(profile)).toBe('unknown');
    });

    it('should calculate age based on earliest attestation', () => {
        const now = 1700100000000; // Reference time in ms
        const attestations = [
            createMockAttestation({ createdAt: 1700000000 }), // Earlier
            createMockAttestation({ id: 2, createdAt: 1700050000 }), // Later
        ];
        const profile = createMockProfile({ attestations });

        // Age should be ~100000 seconds = ~1 day
        const age = getProfileAge(profile, now);
        expect(age).toBe('1 day ago');
    });

    it('should use current time if referenceTime not provided', () => {
        // Create attestation from 1 hour ago
        const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
        const attestation = createMockAttestation({ createdAt: oneHourAgo });
        const profile = createMockProfile({ attestations: [attestation] });

        const age = getProfileAge(profile);
        expect(age).toBe('1 hour ago');
    });

    it('should handle very old profiles', () => {
        const now = Date.now();
        const twoYearsAgo = Math.floor((now - 2 * 365 * 24 * 60 * 60 * 1000) / 1000);
        const attestation = createMockAttestation({ createdAt: twoYearsAgo });
        const profile = createMockProfile({ attestations: [attestation] });

        const age = getProfileAge(profile, now);
        expect(age).toBe('2 years ago');
    });
});

// ============================================================================
// Unit Tests: getProfileStats
// ============================================================================

describe('getProfileStats', () => {
    it('should return default values for profile without stats', () => {
        const profile = createMockProfile({ stats: undefined });
        const stats = getProfileStats(profile);

        expect(stats.reviewsReceived.positive).toBe(0);
        expect(stats.reviewsReceived.neutral).toBe(0);
        expect(stats.reviewsReceived.negative).toBe(0);
        expect(stats.reviewsReceived.total).toBe(0);
        expect(stats.vouches.givenCount).toBe(0);
        expect(stats.vouches.receivedCount).toBe(0);
    });

    it('should extract review stats', () => {
        const profile = createMockProfile({
            stats: {
                review: {
                    received: { positive: 10, neutral: 5, negative: 2 },
                },
            },
        });
        const stats = getProfileStats(profile);

        expect(stats.reviewsReceived.positive).toBe(10);
        expect(stats.reviewsReceived.neutral).toBe(5);
        expect(stats.reviewsReceived.negative).toBe(2);
        expect(stats.reviewsReceived.total).toBe(17);
    });

    it('should convert vouch amounts from Wei to ETH', () => {
        const profile = createMockProfile({
            stats: {
                vouch: {
                    given: { amountWeiTotal: 1e18, count: 5 },
                    received: { amountWeiTotal: 2.5e18, count: 10 },
                },
            },
        });
        const stats = getProfileStats(profile);

        expect(stats.vouches.givenCount).toBe(5);
        expect(stats.vouches.givenAmountEth).toBe(1);
        expect(stats.vouches.receivedCount).toBe(10);
        expect(stats.vouches.receivedAmountEth).toBe(2.5);
    });

    it('should include XP and influence stats', () => {
        const profile = createMockProfile({
            xpTotal: 15000,
            xpStreakDays: 30,
            influenceFactor: 2.5,
            influenceFactorPercentile: 95,
        });
        const stats = getProfileStats(profile);

        expect(stats.xp.total).toBe(15000);
        expect(stats.xp.streakDays).toBe(30);
        expect(stats.influence.factor).toBe(2.5);
        expect(stats.influence.percentile).toBe(95);
    });

    it('should handle missing nested stats gracefully', () => {
        const profile = createMockProfile({
            stats: {
                review: {},
                vouch: {},
            },
        });
        const stats = getProfileStats(profile);

        expect(stats.reviewsReceived.total).toBe(0);
        expect(stats.vouches.givenCount).toBe(0);
    });
});

// ============================================================================
// Unit Tests: countAccountsByService
// ============================================================================

describe('countAccountsByService', () => {
    it('should return empty object for profile without attestations', () => {
        const profile = createMockProfile({ attestations: [] });
        expect(countAccountsByService(profile)).toEqual({});
    });

    it('should count accounts by service', () => {
        const attestations = [
            createMockAttestation({ service: 'twitter' }),
            createMockAttestation({ id: 2, service: 'twitter' }),
            createMockAttestation({ id: 3, service: 'discord' }),
            createMockAttestation({ id: 4, service: 'farcaster' }),
        ];
        const profile = createMockProfile({ attestations });
        const counts = countAccountsByService(profile);

        expect(counts).toEqual({
            twitter: 2,
            discord: 1,
            farcaster: 1,
        });
    });

    it('should normalize service names to lowercase', () => {
        const attestations = [
            createMockAttestation({ service: 'Twitter' }),
            createMockAttestation({ id: 2, service: 'TWITTER' }),
        ];
        const profile = createMockProfile({ attestations });
        const counts = countAccountsByService(profile);

        expect(counts).toEqual({ twitter: 2 });
    });
});

// ============================================================================
// Unit Tests: getLinkedServices
// ============================================================================

describe('getLinkedServices', () => {
    it('should return empty array for profile without attestations', () => {
        const profile = createMockProfile({ attestations: [] });
        expect(getLinkedServices(profile)).toEqual([]);
    });

    it('should return unique services', () => {
        const attestations = [
            createMockAttestation({ service: 'twitter' }),
            createMockAttestation({ id: 2, service: 'twitter' }),
            createMockAttestation({ id: 3, service: 'discord' }),
        ];
        const profile = createMockProfile({ attestations });
        const services = getLinkedServices(profile);

        expect(services).toHaveLength(2);
        expect(services).toContain('twitter');
        expect(services).toContain('discord');
    });

    it('should normalize service names to lowercase', () => {
        const attestations = [
            createMockAttestation({ service: 'Twitter' }),
            createMockAttestation({ id: 2, service: 'DISCORD' }),
        ];
        const profile = createMockProfile({ attestations });
        const services = getLinkedServices(profile);

        expect(services).toEqual(['twitter', 'discord']);
    });
});
