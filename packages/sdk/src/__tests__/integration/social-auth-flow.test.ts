/**
 * SDK Social Auth Integration Tests
 *
 * Tests the social OAuth authentication flows:
 * - Discord OAuth: redirect → callback → exchangeCode()
 * - Telegram Login Widget: verify widget data
 * - Farcaster SIWF: sign message → verify
 *
 * These tests mock the auth server API but test the full SDK flow.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EthosAuth, {
  setGlobalConfig,
  resetGlobalConfig,
  EthosAuthError,
  type AuthResult,
  type SocialProvider,
} from '../../index';

// ============================================================================
// Test Constants
// ============================================================================

const TEST_AUTH_SERVER = 'https://test.ethos.example.com';
const TEST_REDIRECT_URI = 'https://myapp.example.com/callback';
const TEST_STATE = 'csrf-state-token-123';
const TEST_AUTH_CODE = 'auth-code-xyz789';

const MOCK_SOCIAL_USER_RESPONSE = {
  access_token: 'social-jwt-token-abc',
  token_type: 'Bearer' as const,
  expires_in: 3600,
  user: {
    sub: 'ethos:67890',
    name: 'Social User',
    picture: 'https://cdn.discord.com/avatars/123/abc.png',
    ethos_profile_id: 67890,
    ethos_username: 'socialuser',
    ethos_score: 2100,
    ethos_status: 'active',
    ethos_attestations: ['discord:123456789'],
    auth_method: 'discord',
    social_provider: 'discord',
    social_id: '123456789',
  },
};

const MOCK_TELEGRAM_DATA = {
  id: 987654321,
  first_name: 'Telegram',
  last_name: 'User',
  username: 'telegramuser',
  photo_url: 'https://t.me/photos/987654321.jpg',
  auth_date: Math.floor(Date.now() / 1000),
  hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
};

const MOCK_FARCASTER_DATA = {
  fid: 12345,
  custodyAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
  message: 'Sign in with Farcaster to test.example.com',
  signature: '0x1234567890abcdef',
};

// ============================================================================
// Mock Setup
// ============================================================================

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock window
const mockWindow = {
  location: {
    host: 'myapp.example.com',
    origin: 'https://myapp.example.com',
    href: '',
  },
};

vi.stubGlobal('window', mockWindow);

// ============================================================================
// Integration Tests
// ============================================================================

describe('Social Auth Integration Flow', () => {
  let auth: EthosAuth;

  beforeEach(() => {
    vi.resetAllMocks();
    resetGlobalConfig();
    mockWindow.location.href = '';
    auth = EthosAuth.init({ authServerUrl: TEST_AUTH_SERVER });
  });

  afterEach(() => {
    resetGlobalConfig();
  });

  // --------------------------------------------------------------------------
  // Auth URL Generation
  // --------------------------------------------------------------------------

  describe('getAuthUrl()', () => {
    const providers: SocialProvider[] = ['discord', 'telegram', 'farcaster'];

    it.each(providers)('should generate correct auth URL for %s', (provider) => {
      const url = auth.getAuthUrl(provider, {
        redirectUri: TEST_REDIRECT_URI,
        state: TEST_STATE,
      });

      expect(url).toBe(
        `${TEST_AUTH_SERVER}/auth/${provider}?redirect_uri=${encodeURIComponent(TEST_REDIRECT_URI)}&state=${TEST_STATE}`
      );
    });

    it('should include minScore when configured', () => {
      const authWithMinScore = EthosAuth.init({
        authServerUrl: TEST_AUTH_SERVER,
        minScore: 500,
      });

      const url = authWithMinScore.getAuthUrl('discord', {
        redirectUri: TEST_REDIRECT_URI,
      });

      expect(url).toContain('min_score=500');
    });

    it('should override config minScore with params minScore', () => {
      const authWithMinScore = EthosAuth.init({
        authServerUrl: TEST_AUTH_SERVER,
        minScore: 500,
      });

      const url = authWithMinScore.getAuthUrl('discord', {
        redirectUri: TEST_REDIRECT_URI,
        minScore: 1000, // Override
      });

      expect(url).toContain('min_score=1000');
      expect(url).not.toContain('min_score=500');
    });

    it('should work without optional state parameter', () => {
      const url = auth.getAuthUrl('discord', {
        redirectUri: TEST_REDIRECT_URI,
      });

      expect(url).toBe(
        `${TEST_AUTH_SERVER}/auth/discord?redirect_uri=${encodeURIComponent(TEST_REDIRECT_URI)}`
      );
    });
  });

  // --------------------------------------------------------------------------
  // Redirect Flow
  // --------------------------------------------------------------------------

  describe('redirect()', () => {
    it('should redirect to auth URL', () => {
      auth.redirect('discord', {
        redirectUri: TEST_REDIRECT_URI,
        state: TEST_STATE,
      });

      expect(mockWindow.location.href).toBe(
        `${TEST_AUTH_SERVER}/auth/discord?redirect_uri=${encodeURIComponent(TEST_REDIRECT_URI)}&state=${TEST_STATE}`
      );
    });
  });

  // --------------------------------------------------------------------------
  // Code Exchange Flow
  // --------------------------------------------------------------------------

  describe('exchangeCode()', () => {
    it('should exchange auth code for tokens', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_SOCIAL_USER_RESPONSE,
      });

      // Act
      const result = await auth.exchangeCode(TEST_AUTH_CODE);

      // Assert: Verify API was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_AUTH_SERVER}/api/auth/token`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grant_type: 'authorization_code', code: TEST_AUTH_CODE }),
        })
      );

      // Assert: Verify result structure
      expect(result).toEqual<AuthResult>({
        accessToken: 'social-jwt-token-abc',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          sub: 'ethos:67890',
          name: 'Social User',
          picture: 'https://cdn.discord.com/avatars/123/abc.png',
          ethosProfileId: 67890,
          ethosUsername: 'socialuser',
          ethosScore: 2100,
          ethosStatus: 'active',
          ethosAttestations: ['discord:123456789'],
          authMethod: 'discord',
          socialProvider: 'discord',
          socialId: '123456789',
        },
      });
    });

    it('should handle invalid code error', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'Authorization code expired or invalid',
        }),
      });

      // Act & Assert
      await expect(auth.exchangeCode('invalid-code')).rejects.toThrow(
        EthosAuthError
      );
    });

    it('should handle no Ethos profile linked', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'no_profile',
          error_description: 'No Ethos profile linked to this Discord account',
        }),
      });

      // Act & Assert
      await expect(auth.exchangeCode(TEST_AUTH_CODE)).rejects.toThrow(
        'No Ethos profile linked'
      );
    });
  });

  // --------------------------------------------------------------------------
  // Telegram Login Widget Flow
  // --------------------------------------------------------------------------

  describe('verifyTelegram()', () => {
    it('should verify Telegram login widget data', async () => {
      // Arrange
      const telegramResponse = {
        ...MOCK_SOCIAL_USER_RESPONSE,
        user: {
          ...MOCK_SOCIAL_USER_RESPONSE.user,
          auth_method: 'telegram',
          social_provider: 'telegram',
          social_id: MOCK_TELEGRAM_DATA.id.toString(),
          ethos_attestations: ['telegram:987654321'],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => telegramResponse,
      });

      // Act
      const result = await auth.verifyTelegram(MOCK_TELEGRAM_DATA);

      // Assert: Verify API was called with telegram data
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_AUTH_SERVER}/api/auth/telegram/verify`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(MOCK_TELEGRAM_DATA),
        })
      );

      // Assert: Verify result
      expect(result.user.authMethod).toBe('telegram');
      expect(result.user.socialProvider).toBe('telegram');
    });

    it('should handle expired Telegram auth', async () => {
      // Arrange: auth_date is too old (more than 1 day)
      const expiredData = {
        ...MOCK_TELEGRAM_DATA,
        auth_date: Math.floor(Date.now() / 1000) - 100000, // Old timestamp
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'invalid_auth',
          error_description: 'Telegram auth data has expired',
        }),
      });

      // Act & Assert
      await expect(auth.verifyTelegram(expiredData)).rejects.toThrow(
        'Telegram auth data has expired'
      );
    });

    it('should handle invalid Telegram hash', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'invalid_hash',
          error_description: 'Invalid Telegram verification hash',
        }),
      });

      // Act & Assert
      await expect(auth.verifyTelegram(MOCK_TELEGRAM_DATA)).rejects.toThrow(
        EthosAuthError
      );
    });
  });

  // --------------------------------------------------------------------------
  // Farcaster SIWF Flow
  // --------------------------------------------------------------------------

  describe('verifyFarcaster()', () => {
    it('should verify Farcaster SIWF signature', async () => {
      // Arrange
      const farcasterResponse = {
        ...MOCK_SOCIAL_USER_RESPONSE,
        user: {
          ...MOCK_SOCIAL_USER_RESPONSE.user,
          auth_method: 'farcaster',
          social_provider: 'farcaster',
          social_id: MOCK_FARCASTER_DATA.fid.toString(),
          ethos_attestations: ['farcaster:12345'],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => farcasterResponse,
      });

      // Act
      const result = await auth.verifyFarcaster(MOCK_FARCASTER_DATA);

      // Assert: Verify API was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_AUTH_SERVER}/api/auth/farcaster/verify`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(MOCK_FARCASTER_DATA),
        })
      );

      // Assert: Verify result
      expect(result.user.authMethod).toBe('farcaster');
      expect(result.user.socialProvider).toBe('farcaster');
    });

    it('should handle invalid Farcaster signature', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'invalid_signature',
          error_description: 'Farcaster signature verification failed',
        }),
      });

      // Act & Assert
      await expect(auth.verifyFarcaster(MOCK_FARCASTER_DATA)).rejects.toThrow(
        EthosAuthError
      );
    });
  });

  // --------------------------------------------------------------------------
  // Complete OAuth Flow Simulation
  // --------------------------------------------------------------------------

  describe('Complete OAuth redirect flow', () => {
    it('should complete Discord OAuth: url → redirect → callback → token', async () => {
      // Step 1: Generate auth URL
      const authUrl = auth.getAuthUrl('discord', {
        redirectUri: TEST_REDIRECT_URI,
        state: TEST_STATE,
      });
      expect(authUrl).toContain('/auth/discord');
      expect(authUrl).toContain(`state=${TEST_STATE}`);

      // Step 2: Simulate redirect (in real app, this navigates away)
      // auth.redirect('discord', { redirectUri: TEST_REDIRECT_URI, state: TEST_STATE });

      // Step 3: Simulate callback - user returns with code
      // In real app: const params = new URLSearchParams(window.location.search);
      const callbackCode = TEST_AUTH_CODE;
      const callbackState = TEST_STATE;

      // Step 4: Verify state matches (CSRF protection)
      expect(callbackState).toBe(TEST_STATE);

      // Step 5: Exchange code for token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_SOCIAL_USER_RESPONSE,
      });

      const result = await auth.exchangeCode(callbackCode);

      // Step 6: Verify authenticated user
      expect(result.accessToken).toBeDefined();
      expect(result.user.ethosScore).toBeGreaterThan(0);
      expect(result.user.socialProvider).toBe('discord');
    });
  });

  // --------------------------------------------------------------------------
  // Global Config Integration
  // --------------------------------------------------------------------------

  describe('Global config with social auth', () => {
    it('should use global config for auth URLs', () => {
      setGlobalConfig({
        authServerUrl: 'https://global.ethos.xyz',
        minScore: 750,
      });

      const globalAuth = EthosAuth.init();
      const url = globalAuth.getAuthUrl('discord', {
        redirectUri: TEST_REDIRECT_URI,
      });

      expect(url).toContain('https://global.ethos.xyz');
      expect(url).toContain('min_score=750');
    });
  });
});
