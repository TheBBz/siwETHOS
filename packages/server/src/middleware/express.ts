/**
 * Express Middleware for Ethos Authentication
 *
 * Composable middleware for Express.js applications.
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
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
// Type Augmentation
// ============================================================================

declare global {
    namespace Express {
        interface Request {
            ethosUser?: EthosAuthUser;
        }
    }
}

// ============================================================================
// Token Extraction
// ============================================================================

/**
 * Default token extractor from Authorization header
 */
export function extractBearerToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
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
        return req.cookies?.[cookieName] ?? null;
    };
}

/**
 * Extract token from query parameter
 */
export function extractTokenFromQuery(paramName: string) {
    return (req: Request): string | null => {
        const token = req.query?.[paramName];
        return typeof token === 'string' ? token : null;
    };
}

// ============================================================================
// Error Handling
// ============================================================================

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

/**
 * Default error response handler
 */
function handleError(
    res: Response,
    error: EthosAuthErrorInfo,
    customHandler?: EthosMiddlewareConfig['onError']
): void {
    res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
    });
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
// Middleware Factory
// ============================================================================

/**
 * Create Ethos authentication middleware for Express
 *
 * @param config - Middleware configuration
 * @returns Express middleware function
 *
 * @example
 * ```ts
 * // Basic usage
 * app.use('/api/protected', ethosAuthMiddleware());
 *
 * // With minimum score requirement
 * app.use('/api/premium', ethosAuthMiddleware({ minScore: 1500 }));
 *
 * // With JWT verification
 * app.use('/api/verified', ethosAuthMiddleware({
 *   secret: process.env.JWT_SECRET,
 *   minScore: 1000,
 * }));
 * ```
 */
export function ethosAuthMiddleware(
    config: EthosMiddlewareConfig = {}
): RequestHandler {
    const {
        minScore,
        secret,
        extractToken = extractBearerToken,
        fetchProfile = false,
        onError,
        skipPaths = [],
    } = config;

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Check if path should be skipped
            if (shouldSkipPath(req.path, skipPaths)) {
                return next();
            }

            // Extract token
            const token = extractToken(req);
            if (!token) {
                const error = createError(
                    'missing_token',
                    'Authorization token is required',
                    401
                );
                if (onError) onError(error, req);
                return handleError(res, error);
            }

            // Decode or verify token
            let payload: EthosJWTPayload;

            if (secret) {
                // Full verification with signature check
                const verifyResult = await verifyJWT(token, secret);
                if (!verifyResult.success) {
                    const error = createError(
                        'invalid_token',
                        verifyResult.error,
                        401
                    );
                    if (onError) onError(error, req);
                    return handleError(res, error);
                }
                payload = verifyResult.payload;
            } else {
                // WARNING: No secret provided - tokens are NOT cryptographically verified
                // This mode trusts the token content without signature validation
                // Only use this behind a trusted proxy that handles verification
                if (process.env.NODE_ENV !== 'test') {
                    console.warn(
                        '[ethosAuthMiddleware] WARNING: No secret provided. ' +
                        'JWT signatures are NOT being verified. ' +
                        'This is insecure unless behind a trusted proxy.'
                    );
                }
                // Decode only (no signature verification)
                const decodeResult = decodeJWT(token);
                if (!decodeResult.success) {
                    const error = createError(
                        'invalid_token',
                        decodeResult.error,
                        401
                    );
                    if (onError) onError(error, req);
                    return handleError(res, error);
                }

                // Check expiration manually when not verifying
                if (isJWTExpired(decodeResult.jwt.payload)) {
                    const error = createError(
                        'expired_token',
                        'Token has expired',
                        401
                    );
                    if (onError) onError(error, req);
                    return handleError(res, error);
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
                    // Profile fetch failure is not fatal
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
                return handleError(res, error);
            }

            // Attach user to request
            req.ethosUser = user;

            next();
        } catch (error) {
            const authError = createError(
                'internal_error',
                error instanceof Error ? error.message : 'Internal authentication error',
                500
            );
            if (onError) onError(authError, req);
            return handleError(res, authError);
        }
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a path should be skipped based on patterns
 */
function shouldSkipPath(path: string, patterns: string[]): boolean {
    return patterns.some((pattern) => {
        // Simple glob matching (* for any characters)
        const regex = new RegExp(
            '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
        );
        return regex.test(path);
    });
}

/**
 * Require authenticated user middleware
 * Use after ethosAuthMiddleware to ensure user exists
 */
export function requireEthosUser(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.ethosUser) {
            return res.status(401).json({
                error: 'unauthorized',
                message: 'Authentication required',
            });
        }
        next();
    };
}

/**
 * Require minimum score middleware
 * Use after ethosAuthMiddleware for route-specific score requirements
 */
export function requireMinScore(minScore: number): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.ethosUser) {
            return res.status(401).json({
                error: 'unauthorized',
                message: 'Authentication required',
            });
        }

        if (!meetsMinScore(req.ethosUser.score, minScore)) {
            return res.status(403).json({
                error: 'insufficient_score',
                message: `Ethos score ${req.ethosUser.score} is below minimum required score of ${minScore}`,
                actualScore: req.ethosUser.score,
                requiredScore: minScore,
            });
        }

        next();
    };
}

/**
 * Get the authenticated user from request (type-safe helper)
 */
export function getEthosUser(req: Request): EthosAuthUser | undefined {
    return req.ethosUser;
}
