/**
 * Sign in with Ethos - Server Middleware
 *
 * Server-side authentication utilities for Express and Next.js.
 *
 * @example Express
 * ```ts
 * import { ethosAuthMiddleware } from '@thebbz/siwe-ethos-server';
 *
 * app.use('/api/protected', ethosAuthMiddleware({ minScore: 500 }));
 * ```
 *
 * @example Next.js (App Router)
 * ```ts
 * import { withEthosAuth } from '@thebbz/siwe-ethos-server/nextjs';
 *
 * export const GET = withEthosAuth(async (req, user) => {
 *   return Response.json({ user });
 * }, { minScore: 500 });
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type {
    // JWT types
    JWTHeader,
    EthosJWTPayload,
    DecodedJWT,
    JWTVerifyOptions,
    DecodeResult,
    VerifyResult,
    // Middleware types
    EthosMiddlewareConfig,
    EthosAuthUser,
    EthosAuthErrorInfo,
    EthosAuthErrorCode,
    AuthResult,
} from './types';

// ============================================================================
// JWT Utilities
// ============================================================================

export {
    // Decoder
    decodeJWT,
    getJWTPayload,
    isJWTExpired,
    isJWTNotYetValid,
    getJWTTimeRemaining,
    base64UrlDecode,
    base64UrlEncode,
    // Verifier
    verifyJWT,
    verifyJWTSync,
    createTestJWT,
} from './jwt';

// ============================================================================
// Express Middleware
// ============================================================================

export {
    ethosAuthMiddleware,
    requireEthosUser,
    requireMinScore,
    getEthosUser,
    extractBearerTokenExpress,
    extractTokenFromCookieExpress,
    extractTokenFromQuery,
} from './middleware';

// ============================================================================
// Next.js Middleware
// ============================================================================

export {
    withEthosAuth,
    withOptionalEthosAuth,
    requireScore,
    extractBearerTokenNext,
    extractTokenFromCookieNext,
} from './middleware';

export type {
    NextAPIHandler,
    AuthenticatedHandler,
    NextEthosConfig,
} from './middleware';
