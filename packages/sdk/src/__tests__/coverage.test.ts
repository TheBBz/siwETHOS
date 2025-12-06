/**
 * SDK Coverage Tests
 *
 * Additional tests to improve branch coverage for error paths
 * and edge cases in the EthosAuth class.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EthosAuth, { EthosAuthError } from '../index';

// ============================================================================
// Mock Setup
// ============================================================================

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ============================================================================
// EthosAuth Error Path Coverage
// ============================================================================

describe('EthosAuth Error Paths', () => {
  const authServerUrl = 'https://test.ethos.example.com';
  let auth: ReturnType<typeof EthosAuth.init>;

  beforeEach(() => {
    vi.clearAllMocks();
    auth = EthosAuth.init({ authServerUrl });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // verifyTelegram error paths
  // --------------------------------------------------------------------------

  describe('verifyTelegram', () => {
    const telegramAuthData = {
      id: 123456789,
      first_name: 'Test',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'test-hash-12345',
    };

    it('should handle successful verification', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'jwt-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            sub: 'ethos:123',
            name: 'Test User',
            ethos_profile_id: 123,
            ethos_score: 1500,
            ethos_status: 'active',
            auth_method: 'telegram',
          },
        }),
      });

      const result = await auth.verifyTelegram(telegramAuthData);

      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.authMethod).toBe('telegram');
    });

    it('should throw EthosAuthError on API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'invalid_hash',
          error_description: 'Telegram auth hash is invalid',
        }),
      });

      await expect(auth.verifyTelegram(telegramAuthData)).rejects.toThrow(
        EthosAuthError
      );
    });

    it('should handle JSON parse failure in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      // When JSON parsing fails, the code catches and uses default error
      await expect(auth.verifyTelegram(telegramAuthData)).rejects.toThrow(
        'unknown_error'
      );
    });

    it('should include min_score when configured', async () => {
      const authWithMinScore = EthosAuth.init({ authServerUrl, minScore: 1000 });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'jwt-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            sub: 'ethos:123',
            name: 'Test User',
            ethos_profile_id: 123,
            ethos_score: 1500,
            ethos_status: 'active',
            auth_method: 'telegram',
          },
        }),
      });

      await authWithMinScore.verifyTelegram(telegramAuthData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"min_score":1000'),
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // verifyFarcaster error paths
  // --------------------------------------------------------------------------

  describe('verifyFarcaster', () => {
    const farcasterParams = {
      fid: 12345,
      custodyAddress: '0x1234567890123456789012345678901234567890',
      message: 'Sign in with Farcaster...',
      signature: '0xsignature...',
    };

    it('should handle successful verification', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'jwt-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            sub: 'ethos:456',
            name: 'Farcaster User',
            ethos_profile_id: 456,
            ethos_score: 1600,
            ethos_status: 'active',
            auth_method: 'farcaster',
          },
        }),
      });

      const result = await auth.verifyFarcaster(farcasterParams);

      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.authMethod).toBe('farcaster');
    });

    it('should throw EthosAuthError on API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'invalid_signature',
          error_description: 'Farcaster signature verification failed',
        }),
      });

      await expect(auth.verifyFarcaster(farcasterParams)).rejects.toThrow(
        EthosAuthError
      );
    });

    it('should handle JSON parse failure in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      // When JSON parsing fails, the code catches and uses default error
      await expect(auth.verifyFarcaster(farcasterParams)).rejects.toThrow(
        'unknown_error'
      );
    });

    it('should include min_score when configured', async () => {
      const authWithMinScore = EthosAuth.init({ authServerUrl, minScore: 1200 });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'jwt-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            sub: 'ethos:456',
            name: 'Farcaster User',
            ethos_profile_id: 456,
            ethos_score: 1600,
            ethos_status: 'active',
            auth_method: 'farcaster',
          },
        }),
      });

      await authWithMinScore.verifyFarcaster(farcasterParams);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"min_score":1200'),
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // getUser error paths
  // --------------------------------------------------------------------------

  describe('getUser', () => {
    it('should handle successful user fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sub: 'ethos:789',
          name: 'Test User',
          ethos_profile_id: 789,
          ethos_score: 1400,
          ethos_status: 'active',
          auth_method: 'wallet',
          wallet_address: '0x9876543210987654321098765432109876543210',
        }),
      });

      const user = await auth.getUser('valid-jwt-token');

      expect(user.sub).toBe('ethos:789');
      expect(user.ethosProfileId).toBe(789);
    });

    it('should throw EthosAuthError on API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'invalid_token',
          error_description: 'Access token is expired',
        }),
      });

      await expect(auth.getUser('expired-token')).rejects.toThrow(EthosAuthError);
    });

    it('should handle JSON parse failure in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      // When JSON parsing fails, the code catches and uses default error
      await expect(auth.getUser('bad-token')).rejects.toThrow(
        'unknown_error'
      );
    });

    it('should send Authorization header with token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sub: 'ethos:789',
          name: 'Test User',
          ethos_profile_id: 789,
          ethos_score: 1400,
          ethos_status: 'active',
          auth_method: 'wallet',
        }),
      });

      await auth.getUser('my-access-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/userinfo'),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer my-access-token',
          },
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // exchangeCode error paths
  // --------------------------------------------------------------------------

  describe('exchangeCode', () => {
    it('should handle successful token exchange', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-jwt-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            sub: 'ethos:111',
            name: 'OAuth User',
            ethos_profile_id: 111,
            ethos_score: 1300,
            ethos_status: 'active',
            auth_method: 'discord',
          },
        }),
      });

      const result = await auth.exchangeCode('auth-code-xyz');

      expect(result.accessToken).toBe('new-jwt-token');
    });

    it('should throw EthosAuthError on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'invalid_grant',
          error_description: 'Authorization code expired',
        }),
      });

      await expect(auth.exchangeCode('expired-code')).rejects.toThrow(
        EthosAuthError
      );
    });

    it('should handle JSON parse failure in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      // When JSON parsing fails, the code catches and uses default error
      await expect(auth.exchangeCode('bad-code')).rejects.toThrow(
        'unknown_error'
      );
    });
  });

  // --------------------------------------------------------------------------
  // redirect browser check
  // --------------------------------------------------------------------------

  describe('redirect', () => {
    it('should throw error when called in non-browser environment', () => {
      // Save original window
      const originalWindow = globalThis.window;

      // Simulate non-browser environment
      delete (globalThis as Record<string, unknown>).window;

      const authInstance = EthosAuth.init({ authServerUrl });

      expect(() => {
        authInstance.redirect('discord', { redirectUri: 'https://example.com/callback' });
      }).toThrow('redirect() can only be called in browser environment');

      // Restore window
      (globalThis as Record<string, unknown>).window = originalWindow;
    });
  });

  // --------------------------------------------------------------------------
  // parseUserResponse edge cases
  // --------------------------------------------------------------------------

  describe('parseUserResponse variations', () => {
    it('should handle camelCase field names from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sub: 'ethos:100',
          name: 'CamelCase User',
          picture: 'https://example.com/pic.jpg',
          ethosProfileId: 100,
          ethosUsername: 'cameluser',
          ethosScore: 1500,
          ethosStatus: 'active',
          ethosAttestations: ['twitter:123'],
          authMethod: 'twitter',
          socialProvider: 'twitter',
          socialId: '123456',
        }),
      });

      const user = await auth.getUser('token');

      expect(user.ethosProfileId).toBe(100);
      expect(user.ethosUsername).toBe('cameluser');
      expect(user.authMethod).toBe('twitter');
      expect(user.socialProvider).toBe('twitter');
      expect(user.socialId).toBe('123456');
    });

    it('should handle snake_case field names from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sub: 'ethos:200',
          name: 'SnakeCase User',
          picture: null,
          ethos_profile_id: 200,
          ethos_username: 'snakeuser',
          ethos_score: 1600,
          ethos_status: 'verified',
          ethos_attestations: ['discord:456'],
          auth_method: 'discord',
          social_provider: 'discord',
          social_id: '654321',
        }),
      });

      const user = await auth.getUser('token');

      expect(user.ethosProfileId).toBe(200);
      expect(user.ethosUsername).toBe('snakeuser');
      expect(user.authMethod).toBe('discord');
      expect(user.socialProvider).toBe('discord');
      expect(user.socialId).toBe('654321');
    });

    it('should handle wallet auth method with wallet_address', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sub: 'ethos:300',
          name: 'Wallet User',
          ethos_profile_id: 300,
          ethos_score: 1700,
          ethos_status: 'active',
          auth_method: 'wallet',
          wallet_address: '0xabcdef1234567890abcdef1234567890abcdef12',
        }),
      });

      const user = await auth.getUser('token');

      expect(user.authMethod).toBe('wallet');
      expect(user.walletAddress).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
    });

    it('should default auth_method to wallet if not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sub: 'ethos:400',
          name: 'Default Method User',
          ethos_profile_id: 400,
          ethos_score: 1400,
          ethos_status: 'active',
          // No auth_method field
        }),
      });

      const user = await auth.getUser('token');

      expect(user.authMethod).toBe('wallet');
    });

    it('should handle null/undefined optional fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sub: 'ethos:500',
          name: 'Minimal User',
          ethos_profile_id: 500,
          ethos_score: 1300,
          ethos_status: 'active',
          // All optional fields missing
        }),
      });

      const user = await auth.getUser('token');

      expect(user.picture).toBeNull();
      expect(user.ethosUsername).toBeNull();
      expect(user.ethosAttestations).toEqual([]);
      expect(user.walletAddress).toBeUndefined();
      expect(user.socialProvider).toBeUndefined();
      expect(user.socialId).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // wallet() method coverage
  // --------------------------------------------------------------------------

  describe('wallet()', () => {
    it('should create wallet auth instance with config passthrough', () => {
      const authWithMinScore = EthosAuth.init({ authServerUrl, minScore: 900 });
      const walletAuth = authWithMinScore.wallet({ chainId: 137 });

      // Get config to verify passthrough
      const config = walletAuth.getConfig();
      expect(config.authServerUrl).toBe(authServerUrl);
      expect(config.chainId).toBe(137);
    });

    it('should create wallet auth instance without extra config', () => {
      const walletAuth = auth.wallet();

      const config = walletAuth.getConfig();
      expect(config.authServerUrl).toBe(authServerUrl);
    });
  });

  // --------------------------------------------------------------------------
  // getConfig() coverage
  // --------------------------------------------------------------------------

  describe('getConfig()', () => {
    it('should return readonly copy of config', () => {
      const authWithOptions = EthosAuth.init({
        authServerUrl,
        minScore: 800,
      });

      const config = authWithOptions.getConfig();

      expect(config.authServerUrl).toBe(authServerUrl);
      expect(config.minScore).toBe(800);
    });
  });
});
