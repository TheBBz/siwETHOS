/**
 * Ethos API Client Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchEthosProfile,
  fetchEthosScore,
  getProfileByAddress,
  getProfileByTwitter,
  getProfileByDiscord,
  getProfileByFarcaster,
  getProfileByTelegram,
  getProfileById,
  getScoreByAddress,
  EthosProfileNotFoundError,
  EthosApiError,
} from '../ethos';

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_PROFILE = {
  id: 1,
  profileId: 12345,
  displayName: 'Test User',
  username: 'testuser',
  avatarUrl: 'https://ethos.network/avatar/12345.png',
  description: 'A test user',
  score: 1850,
  status: 'ACTIVE' as const,
  userkeys: ['address:0x1234567890123456789012345678901234567890'],
  xpTotal: 5000,
  xpStreakDays: 10,
  influenceFactor: 1.5,
  influenceFactorPercentile: 75,
  links: {
    profile: 'https://ethos.network/profile/12345',
    scoreBreakdown: 'https://ethos.network/profile/12345/score',
  },
  attestations: [
    {
      id: 1,
      hash: '0xabc123',
      profileId: 12345,
      service: 'twitter',
      account: 'testuser',
      createdAt: Date.now(),
      extra: { username: 'testuser' },
    },
  ],
};

// ============================================================================
// Tests
// ============================================================================

describe('Ethos API Client', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  describe('fetchEthosProfile', () => {
    it('should fetch a profile by address', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_PROFILE,
      });

      const profile = await fetchEthosProfile(
        'address',
        '0x1234567890123456789012345678901234567890',
        { fetch: mockFetch }
      );

      expect(profile).toEqual(MOCK_PROFILE);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.ethos.network/api/v2/user/by/address/0x1234567890123456789012345678901234567890',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
          }),
        })
      );
    });

    it('should normalize twitter to x', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_PROFILE,
      });

      await fetchEthosProfile('twitter', 'testuser', { fetch: mockFetch });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.ethos.network/api/v2/user/by/x/testuser',
        expect.any(Object)
      );
    });

    it('should throw EthosProfileNotFoundError on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        fetchEthosProfile('address', '0xnotfound', { fetch: mockFetch })
      ).rejects.toThrow(EthosProfileNotFoundError);
    });

    it('should throw EthosApiError on other errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(
        fetchEthosProfile('address', '0x1234', { fetch: mockFetch })
      ).rejects.toThrow(EthosApiError);
    });

    it('should use custom API URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_PROFILE,
      });

      await fetchEthosProfile('address', '0x1234', {
        fetch: mockFetch,
        apiUrl: 'https://custom.api.com',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api.com/api/v2/user/by/address/0x1234',
        expect.any(Object)
      );
    });

    it('should encode identifier in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_PROFILE,
      });

      await fetchEthosProfile('x', 'user@special', { fetch: mockFetch });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.ethos.network/api/v2/user/by/x/user%40special',
        expect.any(Object)
      );
    });
  });

  describe('fetchEthosScore', () => {
    it('should return score result on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_PROFILE,
      });

      const result = await fetchEthosScore('address', '0x1234', { fetch: mockFetch });

      expect(result).toEqual({
        score: 1850,
        ok: true,
        profileId: 12345,
      });
    });

    it('should return ok: false on profile not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchEthosScore('address', '0xnotfound', { fetch: mockFetch });

      expect(result.ok).toBe(false);
      expect(result.score).toBe(0);
      expect(result.error).toContain('No Ethos profile found');
    });

    it('should return ok: false on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server Error',
      });

      const result = await fetchEthosScore('address', '0x1234', { fetch: mockFetch });

      expect(result.ok).toBe(false);
      expect(result.score).toBe(0);
      expect(result.error).toContain('Ethos API error');
    });

    it('should rethrow unexpected errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      await expect(
        fetchEthosScore('address', '0x1234', { fetch: mockFetch })
      ).rejects.toThrow('Network Error');
    });
  });

  describe('convenience functions', () => {
    it('getProfileByAddress should call fetchEthosProfile with address type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_PROFILE,
      });

      const profile = await getProfileByAddress('0x1234', { fetch: mockFetch });
      expect(profile).toEqual(MOCK_PROFILE);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/by/address/'),
        expect.any(Object)
      );
    });

    it('getProfileByTwitter should call fetchEthosProfile with x type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_PROFILE,
      });

      const profile = await getProfileByTwitter('testuser', { fetch: mockFetch });
      expect(profile).toEqual(MOCK_PROFILE);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/by/x/'),
        expect.any(Object)
      );
    });

    it('getProfileByDiscord should call fetchEthosProfile with discord type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_PROFILE,
      });

      const profile = await getProfileByDiscord('123456789', { fetch: mockFetch });
      expect(profile).toEqual(MOCK_PROFILE);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/by/discord/'),
        expect.any(Object)
      );
    });

    it('getProfileByFarcaster should call fetchEthosProfile with farcaster type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_PROFILE,
      });

      const profile = await getProfileByFarcaster('3', { fetch: mockFetch });
      expect(profile).toEqual(MOCK_PROFILE);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/by/farcaster/'),
        expect.any(Object)
      );
    });

    it('getProfileByTelegram should call fetchEthosProfile with telegram type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_PROFILE,
      });

      const profile = await getProfileByTelegram('987654321', { fetch: mockFetch });
      expect(profile).toEqual(MOCK_PROFILE);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/by/telegram/'),
        expect.any(Object)
      );
    });

    it('getProfileById should call fetchEthosProfile with profile-id type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_PROFILE,
      });

      const profile = await getProfileById(12345, { fetch: mockFetch });
      expect(profile).toEqual(MOCK_PROFILE);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/by/profile-id/12345'),
        expect.any(Object)
      );
    });

    it('getScoreByAddress should return score result', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_PROFILE,
      });

      const result = await getScoreByAddress('0x1234', { fetch: mockFetch });
      expect(result).toEqual({
        score: 1850,
        ok: true,
        profileId: 12345,
      });
    });
  });

  describe('Error classes', () => {
    it('EthosProfileNotFoundError should have correct properties', () => {
      const error = new EthosProfileNotFoundError('address', '0x1234');

      expect(error.name).toBe('EthosProfileNotFoundError');
      expect(error.lookupType).toBe('address');
      expect(error.identifier).toBe('0x1234');
      expect(error.code).toBe('profile_not_found');
      expect(error.message).toContain('No Ethos profile found');
    });

    it('EthosApiError should have correct properties', () => {
      const error = new EthosApiError(500, 'Server Error');

      expect(error.name).toBe('EthosApiError');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('ethos_api_error');
      expect(error.message).toBe('Server Error');
    });
  });
});
