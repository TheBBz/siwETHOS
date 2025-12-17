/**
 * Ethos Score Validation Utilities
 *
 * Server-side utilities for enforcing minimum Ethos score requirements.
 */

/**
 * Error thrown when user's Ethos score is below the required minimum
 */
export class EthosScoreInsufficientError extends Error {
  /** User's actual Ethos score */
  public readonly actualScore: number;
  /** Required minimum score */
  public readonly requiredScore: number;
  /** Error code for API responses */
  public readonly code = 'insufficient_score';

  constructor(actualScore: number, requiredScore: number) {
    super(`Ethos score ${actualScore} is below minimum required score of ${requiredScore}`);
    this.name = 'EthosScoreInsufficientError';
    this.actualScore = actualScore;
    this.requiredScore = requiredScore;
  }

  /**
   * Convert to API error response format
   */
  toJSON(): {
    error: string;
    error_description: string;
    actual_score: number;
    required_score: number;
  } {
    return {
      error: this.code,
      error_description: this.message,
      actual_score: this.actualScore,
      required_score: this.requiredScore,
    };
  }
}

/**
 * User object with Ethos score (minimal interface)
 */
export interface UserWithScore {
  /** Ethos credibility score (0-2800) */
  score: number;
  /** Any other properties */
  [key: string]: unknown;
}

/**
 * Validate that a user's Ethos score meets the minimum requirement
 *
 * @param user - User object with score property
 * @param minScore - Minimum required score (0-2800)
 * @throws EthosScoreInsufficientError if score is below minimum
 *
 * @example
 * ```ts
 * // In your auth endpoint
 * const user = await getEthosProfile(address);
 *
 * // Throws if score is below 500
 * validateMinScore(user, 500);
 *
 * // User passed score check, continue with auth
 * ```
 */
export function validateMinScore(user: UserWithScore, minScore: number): void {
  if (minScore === undefined || minScore === null) {
    return; // No minimum score required
  }

  if (typeof user.score !== 'number') {
    throw new Error('User object must have a numeric score property');
  }

  if (user.score < minScore) {
    throw new EthosScoreInsufficientError(user.score, minScore);
  }
}

/**
 * Check if a score meets the minimum requirement (without throwing)
 *
 * @param score - User's Ethos score
 * @param minScore - Minimum required score
 * @returns True if score meets requirement, false otherwise
 *
 * @example
 * ```ts
 * if (!meetsMinScore(user.score, 500)) {
 *   return res.status(403).json({ error: 'insufficient_score' });
 * }
 * ```
 */
export function meetsMinScore(score: number, minScore?: number): boolean {
  if (minScore === undefined || minScore === null) {
    return true; // No minimum required
  }
  return score >= minScore;
}

/**
 * Get the score tier name based on Ethos score ranges
 *
 * @param score - Ethos score (0-2800)
 * @returns Tier name
 *
 * @example
 * ```ts
 * getScoreTier(1500); // 'trusted'
 * getScoreTier(2200); // 'exemplary'
 * ```
 */
export function getScoreTier(score: number): 'untrusted' | 'questionable' | 'neutral' | 'known' | 'established' | 'reputable' | 'exemplary' | 'distinguished' | 'revered' | 'renowned' {
  if (score < 400) return 'untrusted';
  if (score < 800) return 'questionable';
  if (score < 1200) return 'neutral';
  // Note: These ranges are approximations based on available data.
  // The 'level' field from the API should be favored over this helper where possible.
  if (score < 1400) return 'known';
  if (score < 1600) return 'established';
  if (score < 1800) return 'reputable';
  if (score < 2000) return 'exemplary';
  if (score < 2200) return 'distinguished';
  if (score < 2400) return 'revered';
  return 'renowned';
}

/**
 * Score tier thresholds for reference
 */
export const SCORE_TIERS = {
  untrusted: { min: 0, max: 399 },
  questionable: { min: 400, max: 799 },
  neutral: { min: 800, max: 1199 },
  known: { min: 1200, max: 1399 },
  established: { min: 1400, max: 1599 },
  reputable: { min: 1600, max: 1799 },
  exemplary: { min: 1800, max: 1999 },
  distinguished: { min: 2000, max: 2199 },
  revered: { min: 2200, max: 2399 },
  renowned: { min: 2400, max: 2800 },
} as const;
