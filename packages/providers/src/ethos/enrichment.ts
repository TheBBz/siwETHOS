/**
 * Profile Enrichment Utilities
 *
 * Modular utility functions for working with Ethos profiles.
 * Each function is pure and testable.
 */

import type { EthosProfile, EthosAttestation } from './index';

// ============================================================================
// Types
// ============================================================================

/**
 * Normalized linked account representation
 */
export interface LinkedAccount {
    /** Service name (e.g., 'twitter', 'discord', 'farcaster') */
    service: string;
    /** Account identifier on the service */
    accountId: string;
    /** Username if available */
    username: string | null;
    /** URL to the account if available */
    url: string | null;
    /** When the account was linked (unix timestamp) */
    linkedAt: number;
}

/**
 * Profile statistics summary
 */
export interface ProfileStats {
    /** Total reviews received */
    reviewsReceived: {
        positive: number;
        neutral: number;
        negative: number;
        total: number;
    };
    /** Vouch statistics in ETH */
    vouches: {
        givenCount: number;
        givenAmountEth: number;
        receivedCount: number;
        receivedAmountEth: number;
    };
    /** XP and streak info */
    xp: {
        total: number;
        streakDays: number;
    };
    /** Influence metrics */
    influence: {
        factor: number;
        percentile: number;
    };
}

/**
 * Time unit configuration for human-readable durations
 */
interface TimeUnit {
    unit: string;
    seconds: number;
}

// ============================================================================
// Constants
// ============================================================================

const TIME_UNITS: TimeUnit[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
];

const WEI_PER_ETH = 1e18;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert Wei to ETH with specified precision
 * @param wei - Amount in Wei
 * @param precision - Decimal places (default: 4)
 */
export function weiToEth(wei: number, precision = 4): number {
    return Number((wei / WEI_PER_ETH).toFixed(precision));
}

/**
 * Format duration from seconds to human-readable string
 * @param seconds - Duration in seconds
 */
export function formatDuration(seconds: number): string {
    if (seconds < 60) {
        return 'just now';
    }

    for (const { unit, seconds: unitSeconds } of TIME_UNITS) {
        const value = Math.floor(seconds / unitSeconds);
        if (value >= 1) {
            return `${value} ${unit}${value > 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
}

// ============================================================================
// Profile Enrichment Functions
// ============================================================================

/**
 * Get all linked accounts from a profile's attestations
 *
 * @param profile - Ethos profile
 * @returns Array of normalized linked accounts
 *
 * @example
 * ```ts
 * const accounts = getLinkedAccounts(profile);
 * // [{ service: 'twitter', accountId: 'vitalik', username: 'vitalik.eth', ... }]
 * ```
 */
export function getLinkedAccounts(profile: EthosProfile): LinkedAccount[] {
    const attestations = profile.attestations ?? [];

    return attestations.map((attestation: EthosAttestation) => ({
        service: attestation.service,
        accountId: attestation.account,
        username: attestation.extra?.username ?? null,
        url: attestation.extra?.url ?? null,
        linkedAt: attestation.createdAt,
    }));
}

/**
 * Check if a profile has an attestation for a specific service
 *
 * @param profile - Ethos profile
 * @param service - Service name to check (e.g., 'twitter', 'discord')
 * @returns True if the profile has an attestation for the service
 *
 * @example
 * ```ts
 * if (hasAttestation(profile, 'twitter')) {
 *   console.log('User has verified Twitter');
 * }
 * ```
 */
export function hasAttestation(profile: EthosProfile, service: string): boolean {
    const attestations = profile.attestations ?? [];
    const normalizedService = service.toLowerCase();

    return attestations.some(
        (a: EthosAttestation) => a.service.toLowerCase() === normalizedService
    );
}

/**
 * Get a specific attestation by service name
 *
 * @param profile - Ethos profile
 * @param service - Service name to find
 * @returns The attestation if found, undefined otherwise
 *
 * @example
 * ```ts
 * const twitter = getAttestationByService(profile, 'twitter');
 * if (twitter) {
 *   console.log(`Twitter: @${twitter.extra?.username}`);
 * }
 * ```
 */
export function getAttestationByService(
    profile: EthosProfile,
    service: string
): EthosAttestation | undefined {
    const attestations = profile.attestations ?? [];
    const normalizedService = service.toLowerCase();

    return attestations.find(
        (a: EthosAttestation) => a.service.toLowerCase() === normalizedService
    );
}

/**
 * Get all attestations for a specific service (handles multiple accounts)
 *
 * @param profile - Ethos profile
 * @param service - Service name to filter by
 * @returns Array of matching attestations
 */
export function getAttestationsByService(
    profile: EthosProfile,
    service: string
): EthosAttestation[] {
    const attestations = profile.attestations ?? [];
    const normalizedService = service.toLowerCase();

    return attestations.filter(
        (a: EthosAttestation) => a.service.toLowerCase() === normalizedService
    );
}

/**
 * Get a human-readable profile age
 *
 * @param profile - Ethos profile
 * @param referenceTime - Reference time in ms (default: now)
 * @returns Human-readable age string
 *
 * @example
 * ```ts
 * const age = getProfileAge(profile);
 * // "2 years ago" or "3 months ago"
 * ```
 */
export function getProfileAge(
    profile: EthosProfile,
    referenceTime?: number
): string {
    // Find the earliest attestation as profile creation proxy
    const attestations = profile.attestations ?? [];

    if (attestations.length === 0) {
        return 'unknown';
    }

    const earliestTimestamp = Math.min(
        ...attestations.map((a: EthosAttestation) => a.createdAt)
    );

    const now = referenceTime ?? Date.now();
    const ageSeconds = Math.floor((now - earliestTimestamp * 1000) / 1000);

    return formatDuration(ageSeconds);
}

/**
 * Get formatted profile statistics
 *
 * @param profile - Ethos profile
 * @returns Formatted profile stats object
 *
 * @example
 * ```ts
 * const stats = getProfileStats(profile);
 * console.log(`Received ${stats.vouches.receivedAmountEth} ETH in vouches`);
 * console.log(`${stats.reviewsReceived.positive} positive reviews`);
 * ```
 */
export function getProfileStats(profile: EthosProfile): ProfileStats {
    const reviewReceived = profile.stats?.review?.received ?? {
        positive: 0,
        neutral: 0,
        negative: 0,
    };

    const vouchGiven = profile.stats?.vouch?.given ?? {
        amountWeiTotal: 0,
        count: 0,
    };

    const vouchReceived = profile.stats?.vouch?.received ?? {
        amountWeiTotal: 0,
        count: 0,
    };

    return {
        reviewsReceived: {
            positive: reviewReceived.positive,
            neutral: reviewReceived.neutral,
            negative: reviewReceived.negative,
            total:
                reviewReceived.positive +
                reviewReceived.neutral +
                reviewReceived.negative,
        },
        vouches: {
            givenCount: vouchGiven.count,
            givenAmountEth: weiToEth(vouchGiven.amountWeiTotal),
            receivedCount: vouchReceived.count,
            receivedAmountEth: weiToEth(vouchReceived.amountWeiTotal),
        },
        xp: {
            total: profile.xpTotal ?? 0,
            streakDays: profile.xpStreakDays ?? 0,
        },
        influence: {
            factor: profile.influenceFactor ?? 0,
            percentile: profile.influenceFactorPercentile ?? 0,
        },
    };
}

/**
 * Count total linked accounts by service
 *
 * @param profile - Ethos profile
 * @returns Map of service name to count
 *
 * @example
 * ```ts
 * const counts = countAccountsByService(profile);
 * // { twitter: 1, discord: 2, farcaster: 1 }
 * ```
 */
export function countAccountsByService(
    profile: EthosProfile
): Record<string, number> {
    const attestations = profile.attestations ?? [];
    const counts: Record<string, number> = {};

    for (const attestation of attestations) {
        const service = attestation.service.toLowerCase();
        counts[service] = (counts[service] ?? 0) + 1;
    }

    return counts;
}

/**
 * Get list of unique services the profile has attestations for
 *
 * @param profile - Ethos profile
 * @returns Array of unique service names
 */
export function getLinkedServices(profile: EthosProfile): string[] {
    const attestations = profile.attestations ?? [];
    const services = new Set(
        attestations.map((a: EthosAttestation) => a.service.toLowerCase())
    );
    return Array.from(services);
}
