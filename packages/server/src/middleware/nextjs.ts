/**
 * Next.js Middleware for Ethos Authentication
 *
 * Works with both App Router (middleware.ts) and API routes.
 */

import type {
    EthosMiddlewareConfig,
    EthosAuthUser,
    EthosAuthErrorInfo,
    EthosJWTPayload,
} from '../types';
import { decodeJWT, isJWTExpired } from '../jwt/decoder';
import { verifyJWT } from '../jwt/verifier';
import { meetsMinScore, fetchEthosProfile } from '@thebbz/siwe-ethos-providers';

// ============================================================================
// Types
// ============================================================================

/**
 * Next.js API Route handler signature (App Router)
 */
export type NextAPIHandler<T = unknown> = (
    req: Request,
    context?: { params?: Record<string, string> }
) => Response | Promise<Response>;

/**
 * Authenticated API handler with user parameter
 */
export type AuthenticatedHandler<T = unknown> = (
    req: Request,
    user: EthosAuthUser,
    context?: { params?: Record<string, string> }
) => Response | Promise<Response>;

/**
 * Next.js middleware config for route-level settings
 */
export interface NextEthosConfig extends EthosMiddlewareConfig {
    /**
     * Matcher patterns for paths to protect
     * Uses Next.js middleware matcher syntax
     */
    matcher?: string[];
}

// ============================================================================
// Token Extraction
// ============================================================================

/**
 * Extract bearer token from Request headers
 */
export function extractBearerToken(req: Request): string | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        return null;
    }

    return parts[1];
}

/**
 * Extract token from cookie
 */
export function extractTokenFromCookie(cookieName: string) {
    return (req: Request): string | null => {
        const cookies = req.headers.get('cookie');
        if (!cookies) return null;

        const match = cookies.match(new RegExp(`${cookieName}=([^;]+)`));
        return match ? match[1] : null;
    };
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create JSON error response
 */
function jsonError(error: EthosAuthErrorInfo): Response {
    return Response.json(
        {
            error: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
        },
        { status: error.statusCode }
    );
}

/**
 * Create error info object
 */
function createError(
    code: EthosAuthErrorInfo['code'],
    message: string,
    statusCode: number,
    details?: Record<string, unknown>
): EthosAuthErrorInfo {
    return { code, message, statusCode, details };
}

// ============================================================================
// User Construction
// ============================================================================

/**
 * Build EthosAuthUser from JWT payload
 */
function buildAuthUser(
    payload: EthosJWTPayload,
    profile: EthosAuthUser['profile'] = null
): EthosAuthUser {
    return {
        sub: payload.sub,
        profileId: payload.ethosProfileId ?? null,
        username: payload.ethosUsername ?? null,
        score: payload.ethosScore ?? 0,
        level: payload.ethosLevel ?? null,
        authMethod: payload.authMethod ?? null,
        walletAddress: payload.walletAddress ?? null,
        socialProvider: payload.socialProvider ?? null,
        socialId: payload.socialId ?? null,
        claims: payload,
        profile,
    };
}

// ============================================================================
// API Route Wrapper (App Router)
// ============================================================================

/**
 * Wrap an API route handler with Ethos authentication
 *
 * @param handler - Authenticated handler function
 * @param config - Middleware configuration
 * @returns Wrapped API handler
 *
 * @example
 * ```ts
 * // app/api/protected/route.ts
 * export const GET = withEthosAuth(async (req, user) => {
 *   return Response.json({ message: `Hello ${user.username}` });
 * }, { minScore: 500 });
 * ```
 */
export function withEthosAuth<T = unknown>(
    handler: AuthenticatedHandler<T>,
    config: EthosMiddlewareConfig = {}
): NextAPIHandler<T> {
    const {
        minScore,
        secret,
        extractToken = extractBearerToken,
        fetchProfile = false,
        onError,
    } = config;

    return async (req: Request, context?: { params?: Record<string, string> }) => {
        try {
            // Extract token
            const token = extractToken(req);
            if (!token) {
                const error = createError(
                    'missing_token',
                    'Authorization token is required',
                    401
                );
                if (onError) onError(error, req);
                return jsonError(error);
            }

            // Decode or verify token
            let payload: EthosJWTPayload;

            if (secret) {
                const verifyResult = await verifyJWT(token, secret);
                if (!verifyResult.success) {
                    const error = createError('invalid_token', verifyResult.error, 401);
                    if (onError) onError(error, req);
                    return jsonError(error);
                }
                payload = verifyResult.payload;
            } else {
                // WARNING: No secret provided - tokens are NOT cryptographically verified
                // This mode trusts the token content without signature validation
                // Only use this behind a trusted proxy that handles verification
                if (process.env.NODE_ENV !== 'test') {
                    console.warn(
                        '[withEthosAuth] WARNING: No secret provided. ' +
                        'JWT signatures are NOT being verified. ' +
                        'This is insecure unless behind a trusted proxy.'
                    );
                }
                const decodeResult = decodeJWT(token);
                if (!decodeResult.success) {
                    const error = createError('invalid_token', decodeResult.error, 401);
                    if (onError) onError(error, req);
                    return jsonError(error);
                }

                if (isJWTExpired(decodeResult.jwt.payload)) {
                    const error = createError('expired_token', 'Token has expired', 401);
                    if (onError) onError(error, req);
                    return jsonError(error);
                }

                payload = decodeResult.jwt.payload;
            }

            // Optionally fetch fresh profile
            let profile: EthosAuthUser['profile'] = null;
            if (fetchProfile && payload.ethosProfileId) {
                try {
                    profile = await fetchEthosProfile(
                        'profile-id',
                        payload.ethosProfileId.toString()
                    );
                } catch {
                    console.warn('Failed to fetch Ethos profile:', payload.ethosProfileId);
                }
            }

            // Build user object
            const user = buildAuthUser(payload, profile);

            // Check minimum score
            const effectiveScore = profile?.score ?? user.score;
            if (minScore !== undefined && !meetsMinScore(effectiveScore, minScore)) {
                const error = createError(
                    'insufficient_score',
                    `Ethos score ${effectiveScore} is below minimum required score of ${minScore}`,
                    403,
                    { actualScore: effectiveScore, requiredScore: minScore }
                );
                if (onError) onError(error, req);
                return jsonError(error);
            }

            // Call the handler with authenticated user
            return handler(req, user, context);
        } catch (error) {
            const authError = createError(
                'internal_error',
                error instanceof Error ? error.message : 'Internal authentication error',
                500
            );
            if (onError) onError(authError, req);
            return jsonError(authError);
        }
    };
}

// ============================================================================
// Optional Authentication Wrapper
// ============================================================================

/**
 * Optional authentication - attaches user if token is valid, continues if not
 *
 * @example
 * ```ts
 * export const GET = withOptionalEthosAuth(async (req, user) => {
 *   if (user) {
 *     return Response.json({ message: `Hello ${user.username}` });
 *   }
 *   return Response.json({ message: 'Hello anonymous' });
 * });
 * ```
 */
export function withOptionalEthosAuth<T = unknown>(
    handler: (
        req: Request,
        user: EthosAuthUser | null,
        context?: { params?: Record<string, string> }
    ) => Response | Promise<Response>,
    config: Omit<EthosMiddlewareConfig, 'minScore'> = {}
): NextAPIHandler<T> {
    const { secret, extractToken = extractBearerToken, fetchProfile = false } = config;

    return async (req: Request, context?: { params?: Record<string, string> }) => {
        try {
            const token = extractToken(req);
            if (!token) {
                return handler(req, null, context);
            }

            let payload: EthosJWTPayload;

            if (secret) {
                const verifyResult = await verifyJWT(token, secret);
                if (!verifyResult.success) {
                    return handler(req, null, context);
                }
                payload = verifyResult.payload;
            } else {
                // WARNING: No secret provided - tokens are NOT cryptographically verified
                if (process.env.NODE_ENV !== 'test') {
                    console.warn(
                        '[withOptionalEthosAuth] WARNING: No secret provided. ' +
                        'JWT signatures are NOT being verified. ' +
                        'This is insecure unless behind a trusted proxy.'
                    );
                }
                const decodeResult = decodeJWT(token);
                if (!decodeResult.success || isJWTExpired(decodeResult.jwt.payload)) {
                    return handler(req, null, context);
                }
                payload = decodeResult.jwt.payload;
            }

            let profile: EthosAuthUser['profile'] = null;
            if (fetchProfile && payload.ethosProfileId) {
                try {
                    profile = await fetchEthosProfile(
                        'profile-id',
                        payload.ethosProfileId.toString()
                    );
                } catch {
                    // Ignore profile fetch errors for optional auth
                }
            }

            const user = buildAuthUser(payload, profile);
            return handler(req, user, context);
        } catch {
            return handler(req, null, context);
        }
    };
}

// ============================================================================
// Score Requirement Wrapper
// ============================================================================

/**
 * Require minimum score for an already authenticated handler
 *
 * @example
 * ```ts
 * const premiumHandler = requireScore(1500, async (req, user) => {
 *   return Response.json({ premium: true });
 * });
 *
 * export const GET = withEthosAuth(premiumHandler);
 * ```
 */
export function requireScore<T = unknown>(
    minScore: number,
    handler: AuthenticatedHandler<T>
): AuthenticatedHandler<T> {
    return async (req, user, context) => {
        if (!meetsMinScore(user.score, minScore)) {
            return Response.json(
                {
                    error: 'insufficient_score',
                    message: `Ethos score ${user.score} is below minimum required score of ${minScore}`,
                    actualScore: user.score,
                    requiredScore: minScore,
                },
                { status: 403 }
            );
        }
        return handler(req, user, context);
    };
}
