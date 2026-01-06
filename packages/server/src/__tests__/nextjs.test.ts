/**
 * Next.js Middleware Tests
 *
 * Tests for Next.js authentication middleware with 80%+ coverage target.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    withEthosAuth,
    withOptionalEthosAuth,
    requireScore,
    extractBearerToken,
    extractTokenFromCookie,
} from '../middleware/nextjs';
import { createTestJWT } from '../jwt/verifier';
import { base64UrlEncode } from '../jwt/decoder';
import type { EthosJWTPayload, EthosAuthUser } from '../types';

// ============================================================================
// Mock Setup
// ============================================================================

const TEST_SECRET = 'test-secret-key';

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

function createMockRequest(headers: Record<string, string> = {}): Request {
    return new Request('http://localhost/api/test', {
        headers: new Headers(headers),
    });
}

// ============================================================================
// Token Extraction Tests
// ============================================================================

describe('extractBearerToken (Next.js)', () => {
    it('should extract token from Authorization header', () => {
        const req = createMockRequest({ authorization: 'Bearer abc123' });
        expect(extractBearerToken(req)).toBe('abc123');
    });

    it('should return null for missing header', () => {
        const req = createMockRequest();
        expect(extractBearerToken(req)).toBeNull();
    });

    it('should return null for non-Bearer auth', () => {
        const req = createMockRequest({ authorization: 'Basic abc123' });
        expect(extractBearerToken(req)).toBeNull();
    });
});

describe('extractTokenFromCookie (Next.js)', () => {
    it('should extract token from cookie header', () => {
        const extractor = extractTokenFromCookie('auth_token');
        const req = createMockRequest({ cookie: 'auth_token=cookie-value; other=xyz' });
        expect(extractor(req)).toBe('cookie-value');
    });

    it('should return null if cookie not found', () => {
        const extractor = extractTokenFromCookie('auth_token');
        const req = createMockRequest({ cookie: 'other=xyz' });
        expect(extractor(req)).toBeNull();
    });

    it('should return null if no cookie header', () => {
        const extractor = extractTokenFromCookie('auth_token');
        const req = createMockRequest();
        expect(extractor(req)).toBeNull();
    });
});

// ============================================================================
// withEthosAuth Tests
// ============================================================================

describe('withEthosAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 401 if no token provided', async () => {
        const handler = withEthosAuth(async (req, user) => {
            return Response.json({ user });
        });

        const response = await handler(createMockRequest());
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toBe('missing_token');
    });

    it('should return 401 for invalid token format', async () => {
        const handler = withEthosAuth(async (req, user) => {
            return Response.json({ user });
        });

        const response = await handler(
            createMockRequest({ authorization: 'Bearer invalid-token' })
        );
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toBe('invalid_token');
    });

    it('should return 401 for expired token', async () => {
        const payload = createMockPayload({
            exp: Math.floor(Date.now() / 1000) - 3600,
        });
        const token = createUnsignedToken(payload);
        const handler = withEthosAuth(async (req, user) => {
            return Response.json({ user });
        });

        const response = await handler(
            createMockRequest({ authorization: `Bearer ${token}` })
        );
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toBe('expired_token');
    });

    it('should call handler with user for valid token', async () => {
        const payload = createMockPayload();
        const token = createUnsignedToken(payload);
        const handler = withEthosAuth(async (req, user) => {
            return Response.json({ sub: user.sub, score: user.score });
        });

        const response = await handler(
            createMockRequest({ authorization: `Bearer ${token}` })
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.sub).toBe('user-123');
        expect(body.score).toBe(1500);
    });

    it('should verify signature when secret provided', async () => {
        const payload = createMockPayload();
        const token = await createTestJWT(payload, TEST_SECRET);
        const handler = withEthosAuth(
            async (req, user) => Response.json({ ok: true }),
            { secret: TEST_SECRET }
        );

        const response = await handler(
            createMockRequest({ authorization: `Bearer ${token}` })
        );

        expect(response.status).toBe(200);
    });

    it('should fail with wrong secret', async () => {
        const payload = createMockPayload();
        const token = await createTestJWT(payload, TEST_SECRET);
        const handler = withEthosAuth(
            async (req, user) => Response.json({ ok: true }),
            { secret: 'wrong-secret' }
        );

        const response = await handler(
            createMockRequest({ authorization: `Bearer ${token}` })
        );

        expect(response.status).toBe(401);
    });

    it('should enforce minimum score', async () => {
        const payload = createMockPayload({ ethosScore: 400 });
        const token = createUnsignedToken(payload);
        const handler = withEthosAuth(
            async (req, user) => Response.json({ ok: true }),
            { minScore: 500 }
        );

        const response = await handler(
            createMockRequest({ authorization: `Bearer ${token}` })
        );
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toBe('insufficient_score');
        expect(body.details.actualScore).toBe(400);
        expect(body.details.requiredScore).toBe(500);
    });

    it('should pass score check when score meets requirement', async () => {
        const payload = createMockPayload({ ethosScore: 1500 });
        const token = createUnsignedToken(payload);
        const handler = withEthosAuth(
            async (req, user) => Response.json({ ok: true }),
            { minScore: 1000 }
        );

        const response = await handler(
            createMockRequest({ authorization: `Bearer ${token}` })
        );

        expect(response.status).toBe(200);
    });

    it('should call onError callback', async () => {
        const onError = vi.fn();
        const handler = withEthosAuth(
            async (req, user) => Response.json({}),
            { onError }
        );

        await handler(createMockRequest());

        expect(onError).toHaveBeenCalledWith(
            expect.objectContaining({ code: 'missing_token' }),
            expect.any(Request)
        );
    });

    it('should pass context to handler', async () => {
        const payload = createMockPayload();
        const token = createUnsignedToken(payload);
        const handler = withEthosAuth(async (req, user, context) => {
            return Response.json({ userId: context?.params?.id });
        });

        const response = await handler(
            createMockRequest({ authorization: `Bearer ${token}` }),
            { params: { id: '123' } }
        );
        const body = await response.json();

        expect(body.userId).toBe('123');
    });
});

// ============================================================================
// withOptionalEthosAuth Tests
// ============================================================================

describe('withOptionalEthosAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call handler with null user if no token', async () => {
        const handler = withOptionalEthosAuth(async (req, user) => {
            return Response.json({ hasUser: user !== null });
        });

        const response = await handler(createMockRequest());
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.hasUser).toBe(false);
    });

    it('should call handler with user for valid token', async () => {
        const payload = createMockPayload();
        const token = createUnsignedToken(payload);
        const handler = withOptionalEthosAuth(async (req, user) => {
            return Response.json({ hasUser: user !== null, sub: user?.sub });
        });

        const response = await handler(
            createMockRequest({ authorization: `Bearer ${token}` })
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.hasUser).toBe(true);
        expect(body.sub).toBe('user-123');
    });

    it('should call handler with null for invalid token', async () => {
        const handler = withOptionalEthosAuth(async (req, user) => {
            return Response.json({ hasUser: user !== null });
        });

        const response = await handler(
            createMockRequest({ authorization: 'Bearer invalid-token' })
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.hasUser).toBe(false);
    });

    it('should call handler with null for expired token', async () => {
        const payload = createMockPayload({
            exp: Math.floor(Date.now() / 1000) - 3600,
        });
        const token = createUnsignedToken(payload);
        const handler = withOptionalEthosAuth(async (req, user) => {
            return Response.json({ hasUser: user !== null });
        });

        const response = await handler(
            createMockRequest({ authorization: `Bearer ${token}` })
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.hasUser).toBe(false);
    });
});

// ============================================================================
// requireScore Tests
// ============================================================================

describe('requireScore', () => {
    it('should return 403 if score too low', async () => {
        const innerHandler = vi.fn();
        const handler = requireScore(1000, innerHandler);
        const mockUser: EthosAuthUser = {
            sub: 'test',
            score: 500,
            profileId: null,
            username: null,
            level: null,
            authMethod: null,
            walletAddress: null,
            socialProvider: null,
            socialId: null,
            claims: {} as EthosJWTPayload,
            profile: null,
        };

        const response = await handler(createMockRequest(), mockUser);
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toBe('insufficient_score');
        expect(innerHandler).not.toHaveBeenCalled();
    });

    it('should call handler if score sufficient', async () => {
        const innerHandler = vi.fn().mockResolvedValue(Response.json({ ok: true }));
        const handler = requireScore(500, innerHandler);
        const mockUser: EthosAuthUser = {
            sub: 'test',
            score: 1000,
            profileId: null,
            username: null,
            level: null,
            authMethod: null,
            walletAddress: null,
            socialProvider: null,
            socialId: null,
            claims: {} as EthosJWTPayload,
            profile: null,
        };

        const response = await handler(createMockRequest(), mockUser);

        expect(response.status).toBe(200);
        expect(innerHandler).toHaveBeenCalled();
    });
});
