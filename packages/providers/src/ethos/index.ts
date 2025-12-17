/**
 * Ethos API Client
 *
 * Utilities for fetching Ethos Network profiles and scores.
 * Works in any JavaScript environment (Node.js, browser, edge).
 */

// ============================================================================
// Configuration
// ============================================================================

/** Default Ethos API URL */
const DEFAULT_API_URL = 'https://api.ethos.network';

/** Default client identifier */
const DEFAULT_CLIENT_NAME = '@thebbz/siwe-ethos-providers';

/**
 * Configuration options for the Ethos API client
 */
export interface EthosClientConfig {
  /**
   * Base URL for the Ethos API
   * @default 'https://api.ethos.network'
   */
  apiUrl?: string;

  /**
   * Client name sent in X-Ethos-Client header
   * @default '@thebbz/siwe-ethos-providers'
   */
  clientName?: string;

  /**
   * Custom fetch function (for testing or custom HTTP clients)
   */
  fetch?: typeof fetch;
}

// ============================================================================
// Types
// ============================================================================

/**
 * Supported lookup types for Ethos profiles
 */
export type EthosLookupType =
  | 'address'      // Ethereum address
  | 'x'            // Twitter/X username
  | 'twitter'      // Alias for 'x'
  | 'discord'      // Discord user ID
  | 'farcaster'    // Farcaster FID
  | 'telegram'     // Telegram user ID
  | 'profile-id';  // Ethos profile ID

/**
 * Ethos user attestation (linked account)
 */
export interface EthosAttestation {
  /** Attestation ID */
  id: number;
  /** Hash of the attestation */
  hash: string;
  /** Profile ID this attestation belongs to */
  profileId: number;
  /** Service name (e.g., 'twitter', 'discord') */
  service: string;
  /** Account identifier on the service */
  account: string;
  /** Unix timestamp when created */
  createdAt: number;
  /** Additional metadata */
  extra?: {
    username?: string;
    url?: string;
  };
}

/**
 * Ethos user profile from the API
 */
export interface EthosProfile {
  /** Internal ID */
  id: number;
  /** Public profile ID */
  profileId: number;
  /** Display name */
  displayName: string;
  /** Username (may be null) */
  username: string | null;
  /** Avatar URL (may be null) */
  avatarUrl: string | null;
  /** Profile description (may be null) */
  description: string | null;
  /** Ethos credibility score (0-2800) */
  score: number;
  /** Credibility level/tier */
  level: string;
  /** Profile status */
  status: 'ACTIVE' | 'INACTIVE' | 'MERGED';
  /** List of userkeys (identifiers) */
  userkeys: string[];
  /** Total XP earned */
  xpTotal: number;
  /** Current streak days */
  xpStreakDays: number;
  /** Influence factor */
  influenceFactor: number;
  /** Influence percentile (0-100) */
  influenceFactorPercentile: number;
  /** Profile links */
  links?: {
    profile?: string;
    scoreBreakdown?: string;
  };
  /** Profile statistics */
  stats?: {
    review?: {
      received?: {
        negative: number;
        neutral: number;
        positive: number;
      };
    };
    vouch?: {
      given?: {
        amountWeiTotal: number;
        count: number;
      };
      received?: {
        amountWeiTotal: number;
        count: number;
      };
    };
  };
  /** Linked attestations */
  attestations?: EthosAttestation[];
}

/**
 * Simple score response (lightweight alternative to full profile)
 */
export interface EthosScoreResult {
  /** Ethos credibility score (0-2800) */
  score: number;
  /** Whether the lookup was successful */
  ok: boolean;
  /** Profile ID if found */
  profileId?: number;
  /** Error message if not ok */
  error?: string;
}

// ============================================================================
// Errors
// ============================================================================

/**
 * Error thrown when an Ethos profile is not found
 */
export class EthosProfileNotFoundError extends Error {
  /** The lookup type used */
  public readonly lookupType: string;
  /** The identifier that was not found */
  public readonly identifier: string;
  /** Error code for API responses */
  public readonly code = 'profile_not_found';

  constructor(lookupType: string, identifier: string) {
    super(`No Ethos profile found for ${lookupType}:${identifier}`);
    this.name = 'EthosProfileNotFoundError';
    this.lookupType = lookupType;
    this.identifier = identifier;
  }
}

/**
 * Error thrown when the Ethos API returns an error
 */
export class EthosApiError extends Error {
  /** HTTP status code */
  public readonly statusCode: number;
  /** Error code for API responses */
  public readonly code = 'ethos_api_error';

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'EthosApiError';
    this.statusCode = statusCode;
  }
}

// ============================================================================
// API Client
// ============================================================================

/**
 * Normalize lookup type (handle aliases)
 */
function normalizeLookupType(type: EthosLookupType): string {
  if (type === 'twitter') return 'x';
  return type;
}

/**
 * Fetch an Ethos profile by lookup type and identifier
 *
 * @param type - The type of lookup (address, twitter, discord, etc.)
 * @param identifier - The identifier to look up
 * @param config - Optional client configuration
 * @returns The Ethos profile
 * @throws EthosProfileNotFoundError if no profile is found
 * @throws EthosApiError if the API returns an error
 *
 * @example
 * ```ts
 * // Fetch by Ethereum address
 * const profile = await fetchEthosProfile('address', '0x1234...');
 * console.log(profile.score); // 1850
 *
 * // Fetch by Twitter username
 * const profile = await fetchEthosProfile('twitter', 'vitalikbuterin');
 *
 * // Fetch by Discord ID
 * const profile = await fetchEthosProfile('discord', '123456789');
 * ```
 */
export async function fetchEthosProfile(
  type: EthosLookupType,
  identifier: string,
  config: EthosClientConfig = {}
): Promise<EthosProfile> {
  const apiUrl = config.apiUrl || DEFAULT_API_URL;
  const clientName = config.clientName || DEFAULT_CLIENT_NAME;
  const fetchFn = config.fetch || fetch;

  const normalizedType = normalizeLookupType(type);
  const url = `${apiUrl}/api/v2/user/by/${normalizedType}/${encodeURIComponent(identifier)}`;

  const response = await fetchFn(url, {
    headers: {
      'X-Ethos-Client': clientName,
      'Accept': 'application/json',
    },
  });

  if (response.status === 404) {
    throw new EthosProfileNotFoundError(type, identifier);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new EthosApiError(
      response.status,
      `Ethos API error: ${response.status} - ${errorText}`
    );
  }

  return (await response.json()) as EthosProfile;
}

/**
 * Fetch just the Ethos score for a given identifier
 *
 * This is a lightweight alternative to fetchEthosProfile when you only need the score.
 * Returns a result object instead of throwing on not found.
 *
 * @param type - The type of lookup (address, twitter, discord, etc.)
 * @param identifier - The identifier to look up
 * @param config - Optional client configuration
 * @returns Score result with ok status
 *
 * @example
 * ```ts
 * // Simple score check
 * const result = await fetchEthosScore('address', '0x1234...');
 * if (result.ok && result.score >= 500) {
 *   console.log('User has good reputation!');
 * }
 *
 * // With default score on not found
 * const { score, ok } = await fetchEthosScore('address', walletAddress);
 * const effectiveScore = ok ? score : 1000; // Default to 1000 if no profile
 * ```
 */
export async function fetchEthosScore(
  type: EthosLookupType,
  identifier: string,
  config: EthosClientConfig = {}
): Promise<EthosScoreResult> {
  try {
    const profile = await fetchEthosProfile(type, identifier, config);
    return {
      score: profile.score,
      ok: true,
      profileId: profile.profileId,
    };
  } catch (error) {
    if (error instanceof EthosProfileNotFoundError) {
      return {
        score: 0,
        ok: false,
        error: error.message,
      };
    }
    if (error instanceof EthosApiError) {
      return {
        score: 0,
        ok: false,
        error: error.message,
      };
    }
    throw error;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get Ethos profile by Ethereum address
 *
 * @example
 * ```ts
 * const profile = await getProfileByAddress('0x1234567890123456789012345678901234567890');
 * console.log(`${profile.displayName} has score ${profile.score}`);
 * ```
 */
export async function getProfileByAddress(
  address: string,
  config?: EthosClientConfig
): Promise<EthosProfile> {
  return fetchEthosProfile('address', address, config);
}

/**
 * Get Ethos profile by Twitter/X username
 *
 * @example
 * ```ts
 * const profile = await getProfileByTwitter('vitalikbuterin');
 * ```
 */
export async function getProfileByTwitter(
  username: string,
  config?: EthosClientConfig
): Promise<EthosProfile> {
  return fetchEthosProfile('x', username, config);
}

/**
 * Get Ethos profile by Discord user ID
 *
 * @example
 * ```ts
 * const profile = await getProfileByDiscord('123456789012345678');
 * ```
 */
export async function getProfileByDiscord(
  discordId: string,
  config?: EthosClientConfig
): Promise<EthosProfile> {
  return fetchEthosProfile('discord', discordId, config);
}

/**
 * Get Ethos profile by Farcaster FID
 *
 * @example
 * ```ts
 * const profile = await getProfileByFarcaster('3');
 * ```
 */
export async function getProfileByFarcaster(
  fid: string,
  config?: EthosClientConfig
): Promise<EthosProfile> {
  return fetchEthosProfile('farcaster', fid, config);
}

/**
 * Get Ethos profile by Telegram user ID
 *
 * @example
 * ```ts
 * const profile = await getProfileByTelegram('123456789');
 * ```
 */
export async function getProfileByTelegram(
  telegramId: string,
  config?: EthosClientConfig
): Promise<EthosProfile> {
  return fetchEthosProfile('telegram', telegramId, config);
}

/**
 * Get Ethos profile by profile ID
 *
 * @example
 * ```ts
 * const profile = await getProfileById(12345);
 * ```
 */
export async function getProfileById(
  profileId: number,
  config?: EthosClientConfig
): Promise<EthosProfile> {
  return fetchEthosProfile('profile-id', profileId.toString(), config);
}

/**
 * Get Ethos score by Ethereum address (convenience function)
 *
 * @example
 * ```ts
 * const { score, ok } = await getScoreByAddress('0x1234...');
 * if (ok && score >= 500) {
 *   // Allow access
 * }
 * ```
 */
export async function getScoreByAddress(
  address: string,
  config?: EthosClientConfig
): Promise<EthosScoreResult> {
  return fetchEthosScore('address', address, config);
}
