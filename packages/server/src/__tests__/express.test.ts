/**
 * Express Middleware Tests
 *
 * Tests for Express authentication middleware with 80%+ coverage target.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
    ethosAuthMiddleware,
    requireEthosUser,
    requireMinScore,
    getEthosUser,
    extractBearerToken,
    extractTokenFromCookie,
    extractTokenFromQuery,
} from '../middleware/express';
import { createTestJWT } from '../jwt/verifier';
import { base64UrlEncode } from '../jwt/decoder';
import type { EthosJWTPayload } from '../types';

// ============================================================================
// Mock Setup
// ============================================================================

const TEST_SECRET = 'test-secret-key';

// Mock the providers package
vi.mock('@thebbz/siwe-ethos-providers', () => ({
    meetsMinScore: vi.fn((score: number, minScore: number) => score >= minScore),
    fetchEthosProfile: vi.fn(),
}));

import { meetsMinScore, fetchEthosProfile } from '@thebbz/siwe-ethos-providers';

const createMockPayload = (
    overrides: Partial<EthosJWTPayload> = {}
): EthosJWTPayload => ({
    sub: 'user-123',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    ethosProfileId: 12345,
    ethosUsername: 'testuser',
    ethosScore: 1500,
    ethosLevel: 'established',
    authMethod: 'wallet',
    walletAddress: '0x1234567890123456789012345678901234567890',
    ...overrides,
});

function createUnsignedToken(payload: EthosJWTPayload): string {
    const headerB64 = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    return `${headerB64}.${payloadB64}.fake-sig`;
}

function createMockRequest(overrides: Partial<Request> = {}): Request {
    return {
        headers: {},
        cookies: {},
        query: {},
        path: '/api/test',
        ...overrides,
    } as Request;
}

function createMockResponse(): Response {
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    return res as unknown as Response;
}

// ============================================================================
// Token Extraction Tests
// ============================================================================

describe('extractBearerToken', () => {
    it('should extract token from Authorization header', () => {
        const req = createMockRequest({
            headers: { authorization: 'Bearer abc123' },
        });
        expect(extractBearerToken(req)).toBe('abc123');
    });

    it('should return null for missing header', () => {
        const req = createMockRequest();
        expect(extractBearerToken(req)).toBeNull();
    });

    it('should return null for non-Bearer auth', () => {
        const req = createMockRequest({
            headers: { authorization: 'Basic abc123' },
        });
        expect(extractBearerToken(req)).toBeNull();
    });

    it('should return null for malformed header', () => {
        const req = createMockRequest({
            headers: { authorization: 'Bearer' },
        });
        expect(extractBearerToken(req)).toBeNull();
    });

    it('should be case-insensitive for Bearer', () => {
        const req = createMockRequest({
            headers: { authorization: 'bearer abc123' },
        });
        expect(extractBearerToken(req)).toBe('abc123');
    });
});

describe('extractTokenFromCookie', () => {
    it('should extract token from cookie', () => {
        const extractor = extractTokenFromCookie('auth_token');
        const req = createMockRequest({
            cookies: { auth_token: 'cookie-token' },
        });
        expect(extractor(req)).toBe('cookie-token');
    });

    it('should return null if cookie missing', () => {
        const extractor = extractTokenFromCookie('auth_token');
        const req = createMockRequest();
        expect(extractor(req)).toBeNull();
    });
});

describe('extractTokenFromQuery', () => {
    it('should extract token from query parameter', () => {
        const extractor = extractTokenFromQuery('token');
        const req = createMockRequest({
            query: { token: 'query-token' },
        });
        expect(extractor(req)).toBe('query-token');
    });

    it('should return null if query param missing', () => {
        const extractor = extractTokenFromQuery('token');
        const req = createMockRequest();
        expect(extractor(req)).toBeNull();
    });

    it('should return null for non-string values', () => {
        const extractor = extractTokenFromQuery('token');
        const req = createMockRequest({
            query: { token: ['array'] as unknown as string },
        });
        expect(extractor(req)).toBeNull();
    });
});

// ============================================================================
// Middleware Tests
// ============================================================================

describe('ethosAuthMiddleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 401 if no token provided', async () => {
        const middleware = ethosAuthMiddleware();
        const req = createMockRequest();
        const res = createMockResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'missing_token' })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token format', async () => {
        const middleware = ethosAuthMiddleware();
        const req = createMockRequest({
            headers: { authorization: 'Bearer invalid-token' },
        });
        const res = createMockResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'invalid_token' })
        );
    });

    it('should return 401 for expired token', async () => {
        const payload = createMockPayload({
            exp: Math.floor(Date.now() / 1000) - 3600, // Expired
        });
        const token = createUnsignedToken(payload);
        const middleware = ethosAuthMiddleware();
        const req = createMockRequest({
            headers: { authorization: `Bearer ${token}` },
        });
        const res = createMockResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'expired_token' })
        );
    });

    it('should attach user to request for valid token', async () => {
        const payload = createMockPayload();
        const token = createUnsignedToken(payload);
        const middleware = ethosAuthMiddleware();
        const req = createMockRequest({
            headers: { authorization: `Bearer ${token}` },
        });
        const res = createMockResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.ethosUser).toBeDefined();
        expect(req.ethosUser?.sub).toBe('user-123');
        expect(req.ethosUser?.score).toBe(1500);
    });

    it('should verify signature when secret is provided', async () => {
        const payload = createMockPayload();
        const token = await createTestJWT(payload, TEST_SECRET);
        const middleware = ethosAuthMiddleware({ secret: TEST_SECRET });
        const req = createMockRequest({
            headers: { authorization: `Bearer ${token}` },
        });
        const res = createMockResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.ethosUser).toBeDefined();
    });

    it('should fail verification with wrong secret', async () => {
        const payload = createMockPayload();
        const token = await createTestJWT(payload, TEST_SECRET);
        const middleware = ethosAuthMiddleware({ secret: 'wrong-secret' });
        const req = createMockRequest({
            headers: { authorization: `Bearer ${token}` },
        });
        const res = createMockResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('should enforce minimum score', async () => {
        const payload = createMockPayload({ ethosScore: 400 });
        const token = createUnsignedToken(payload);
        const middleware = ethosAuthMiddleware({ minScore: 500 });
        const req = createMockRequest({
            headers: { authorization: `Bearer ${token}` },
        });
        const res = createMockResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: 'insufficient_score',
                details: expect.objectContaining({
                    actualScore: 400,
                    requiredScore: 500,
                }),
            })
        );
    });

    it('should pass score check when score meets requirement', async () => {
        const payload = createMockPayload({ ethosScore: 1500 });
        const token = createUnsignedToken(payload);
        const middleware = ethosAuthMiddleware({ minScore: 1000 });
        const req = createMockRequest({
            headers: { authorization: `Bearer ${token}` },
        });
        const res = createMockResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should skip paths in skipPaths', async () => {
        const middleware = ethosAuthMiddleware({ skipPaths: ['/api/public/*'] });
        const req = createMockRequest({ path: '/api/public/health' });
        const res = createMockResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.ethosUser).toBeUndefined();
    });

    it('should call onError callback', async () => {
        const onError = vi.fn();
        const middleware = ethosAuthMiddleware({ onError });
        const req = createMockRequest();
        const res = createMockResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(onError).toHaveBeenCalledWith(
            expect.objectContaining({ code: 'missing_token' }),
            req
        );
    });

    it('should use custom token extractor', async () => {
        const customExtractor = vi.fn().mockReturnValue('custom-token');
        const middleware = ethosAuthMiddleware({ extractToken: customExtractor });
        const req = createMockRequest();
        const res = createMockResponse();

        await middleware(req, res, vi.fn());

        expect(customExtractor).toHaveBeenCalledWith(req);
    });
});

// ============================================================================
// Helper Middleware Tests
// ============================================================================

describe('requireEthosUser', () => {
    it('should return 401 if no user', () => {
        const middleware = requireEthosUser();
        const req = createMockRequest();
        const res = createMockResponse();
        const next = vi.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user exists', () => {
        const middleware = requireEthosUser();
        const req = createMockRequest();
        req.ethosUser = { sub: 'test' } as any;
        const res = createMockResponse();
        const next = vi.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

describe('requireMinScore', () => {
    it('should return 401 if no user', () => {
        const middleware = requireMinScore(500);
        const req = createMockRequest();
        const res = createMockResponse();
        const next = vi.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 if score too low', () => {
        const middleware = requireMinScore(1000);
        const req = createMockRequest();
        req.ethosUser = { sub: 'test', score: 500 } as any;
        const res = createMockResponse();
        const next = vi.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should call next if score sufficient', () => {
        const middleware = requireMinScore(500);
        const req = createMockRequest();
        req.ethosUser = { sub: 'test', score: 1000 } as any;
        const res = createMockResponse();
        const next = vi.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

describe('getEthosUser', () => {
    it('should return user from request', () => {
        const req = createMockRequest();
        const mockUser = { sub: 'test' } as any;
        req.ethosUser = mockUser;

        expect(getEthosUser(req)).toBe(mockUser);
    });

    it('should return undefined if no user', () => {
        const req = createMockRequest();
        expect(getEthosUser(req)).toBeUndefined();
    });
});
