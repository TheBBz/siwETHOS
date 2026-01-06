/**
 * Server Middleware Types
 *
 * Shared types for Express and Next.js middleware.
 */

import type { EthosProfile, EthosScoreResult } from '@thebbz/siwe-ethos-providers';

// ============================================================================
// JWT Types
// ============================================================================

/**
 * Standard JWT header
 */
export interface JWTHeader {
    alg: string;
    typ: string;
}

/**
 * Ethos JWT payload structure
 */
export interface EthosJWTPayload {
    /** Subject - unique user identifier */
    sub: string;
    /** Issuer */
    iss?: string;
    /** Audience */
    aud?: string | string[];
    /** Expiration time (Unix timestamp) */
    exp: number;
    /** Issued at (Unix timestamp) */
    iat: number;
    /** Not before (Unix timestamp) */
    nbf?: number;
    /** JWT ID */
    jti?: string;

    // Ethos-specific claims
    /** Ethos profile ID */
    ethosProfileId?: number;
    /** Ethos username */
    ethosUsername?: string | null;
    /** Ethos credibility score */
    ethosScore?: number;
    /** Ethos credibility level/tier */
    ethosLevel?: string;
    /** Auth method used */
    authMethod?: string;
    /** Wallet address (for wallet auth) */
    walletAddress?: string;
    /** Social provider (for social auth) */
    socialProvider?: string;
    /** Social account ID */
    socialId?: string;
}

/**
 * Decoded JWT structure
 */
export interface DecodedJWT {
    header: JWTHeader;
    payload: EthosJWTPayload;
    signature: string;
}

// ============================================================================
// Middleware Configuration
// ============================================================================

/**
 * Base middleware configuration
 */
export interface EthosMiddlewareConfig {
    /**
     * Minimum Ethos score required to access the route
     * @default undefined (no minimum)
     */
    minScore?: number;

    /**
     * JWT secret or public key for verification
     * If not provided, tokens are decoded but not cryptographically verified
     */
    secret?: string;

    /**
     * Custom function to extract token from request
     * @default Extracts from Authorization: Bearer header
     */
    extractToken?: (req: unknown) => string | null;

    /**
     * Whether to fetch fresh profile data from Ethos API
     * @default false (uses JWT claims only)
     */
    fetchProfile?: boolean;

    /**
     * Custom error handler
     */
    onError?: (error: EthosAuthErrorInfo, req: unknown) => void;

    /**
     * Skip authentication for certain paths (glob patterns)
     */
    skipPaths?: string[];
}

/**
 * Error information passed to error handlers
 */
export interface EthosAuthErrorInfo {
    code: EthosAuthErrorCode;
    message: string;
    statusCode: number;
    details?: Record<string, unknown>;
}

/**
 * Possible auth error codes
 */
export type EthosAuthErrorCode =
    | 'missing_token'
    | 'invalid_token'
    | 'expired_token'
    | 'insufficient_score'
    | 'profile_not_found'
    | 'verification_failed'
    | 'internal_error';

// ============================================================================
// Authenticated User
// ============================================================================

/**
 * Authenticated user attached to request
 */
export interface EthosAuthUser {
    /** Subject from JWT */
    sub: string;
    /** Ethos profile ID */
    profileId: number | null;
    /** Ethos username */
    username: string | null;
    /** Ethos credibility score */
    score: number;
    /** Ethos credibility level */
    level: string | null;
    /** Auth method used */
    authMethod: string | null;
    /** Wallet address (for wallet auth) */
    walletAddress: string | null;
    /** Social provider (for social auth) */
    socialProvider: string | null;
    /** Social account ID */
    socialId: string | null;
    /** Raw JWT claims */
    claims: EthosJWTPayload;
    /** Full profile (if fetchProfile is enabled) */
    profile: EthosProfile | null;
}

// ============================================================================
// JWT Verification Options
// ============================================================================

/**
 * Options for JWT verification
 */
export interface JWTVerifyOptions {
    /** Expected issuer */
    issuer?: string;
    /** Expected audience */
    audience?: string | string[];
    /** Clock tolerance in seconds for exp/nbf checks */
    clockTolerance?: number;
    /** Skip expiration check */
    ignoreExpiration?: boolean;
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Result of authentication attempt
 */
export type AuthResult =
    | { success: true; user: EthosAuthUser }
    | { success: false; error: EthosAuthErrorInfo };

/**
 * Result of token decode (without verification)
 */
export type DecodeResult =
    | { success: true; jwt: DecodedJWT }
    | { success: false; error: string };

/**
 * Result of token verification
 */
export type VerifyResult =
    | { success: true; payload: EthosJWTPayload }
    | { success: false; error: string };
