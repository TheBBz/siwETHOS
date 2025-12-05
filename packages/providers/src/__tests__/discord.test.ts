/**
 * Discord Provider Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscordProvider } from '../discord';
import type { DiscordUser, DiscordTokenResponse, DiscordCallbackResult } from '../discord/types';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as typeof fetch;

describe('DiscordProvider', () => {
  const config = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'https://example.com/callback',
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      const provider = new DiscordProvider(config);
      const url = provider.getAuthorizationUrl();

      expect(url).toContain('discord.com');
      expect(url).toContain('authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=identify');
    });

    it('should include state parameter when provided', () => {
      const provider = new DiscordProvider(config);
      const url = provider.getAuthorizationUrl({ state: 'csrf-token' });

      expect(url).toContain('state=csrf-token');
    });

    it('should use custom scopes when provided', () => {
      const provider = new DiscordProvider({
        ...config,
        scopes: ['identify', 'email', 'guilds'],
      });
      const url = provider.getAuthorizationUrl();

      expect(url).toContain('scope=identify+email+guilds');
    });
  });

  describe('handleCallback', () => {
    const mockTokenResponse: DiscordTokenResponse = {
      access_token: 'mock-access-token',
      token_type: 'Bearer',
      expires_in: 604800,
      refresh_token: 'mock-refresh-token',
      scope: 'identify',
    };

    const mockUser: DiscordUser = {
      id: '123456789012345678',
      username: 'testuser',
      discriminator: '1234',
      global_name: 'Test User',
      avatar: 'abc123',
      email: 'test@example.com',
    };

    it('should exchange code and fetch user', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUser),
        });

      const provider = new DiscordProvider(config);
      const result = await provider.handleCallback('auth-code');

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.expiresIn).toBe(604800);
    });

    it('should throw error on token exchange failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'invalid_grant', error_description: 'Invalid code' }),
      });

      const provider = new DiscordProvider(config);
      await expect(provider.handleCallback('bad-code')).rejects.toThrow('Invalid code');
    });

    it('should throw error on user fetch failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ message: 'Invalid token' }),
        });

      const provider = new DiscordProvider(config);
      await expect(provider.handleCallback('auth-code')).rejects.toThrow('Invalid token');
    });
  });

  describe('getEthosLookup', () => {
    it('should return correct lookup with global_name', () => {
      const provider = new DiscordProvider(config);
      const result: DiscordCallbackResult = {
        user: {
          id: '123456789012345678',
          username: 'testuser',
          discriminator: '0',
          global_name: 'Test User',
          avatar: null,
        },
        accessToken: 'token',
        expiresIn: 3600,
      };

      const lookup = provider.getEthosLookup(result);

      expect(lookup.provider).toBe('discord');
      expect(lookup.userId).toBe('123456789012345678');
      expect(lookup.username).toBe('Test User');
    });

    it('should fallback to username when global_name is null', () => {
      const provider = new DiscordProvider(config);
      const result: DiscordCallbackResult = {
        user: {
          id: '123456789012345678',
          username: 'testuser',
          discriminator: '0',
          global_name: null,
          avatar: null,
        },
        accessToken: 'token',
        expiresIn: 3600,
      };

      const lookup = provider.getEthosLookup(result);

      expect(lookup.username).toBe('testuser');
    });
  });

  describe('getAvatarUrl', () => {
    it('should return avatar URL for user with avatar', () => {
      const provider = new DiscordProvider(config);
      const user: DiscordUser = {
        id: '123456789012345678',
        username: 'testuser',
        discriminator: '0',
        global_name: 'Test User',
        avatar: 'abc123',
      };

      const url = provider.getAvatarUrl(user);

      expect(url).toBe('https://cdn.discordapp.com/avatars/123456789012345678/abc123.png?size=128');
    });

    it('should return gif URL for animated avatar', () => {
      const provider = new DiscordProvider(config);
      const user: DiscordUser = {
        id: '123456789012345678',
        username: 'testuser',
        discriminator: '0',
        global_name: 'Test User',
        avatar: 'a_animated123', // animated avatars start with 'a_'
      };

      const url = provider.getAvatarUrl(user);

      expect(url).toContain('.gif');
    });

    it('should return default avatar for user without avatar (discriminator 0)', () => {
      const provider = new DiscordProvider(config);
      const user: DiscordUser = {
        id: '123456789012345678',
        username: 'testuser',
        discriminator: '0',
        global_name: 'Test User',
        avatar: null,
      };

      const url = provider.getAvatarUrl(user);

      expect(url).toContain('https://cdn.discordapp.com/embed/avatars/');
      expect(url).toContain('.png');
    });

    it('should return default avatar based on discriminator', () => {
      const provider = new DiscordProvider(config);
      const user: DiscordUser = {
        id: '123456789012345678',
        username: 'testuser',
        discriminator: '1234',
        global_name: 'Test User',
        avatar: null,
      };

      const url = provider.getAvatarUrl(user);

      // 1234 % 5 = 4
      expect(url).toBe('https://cdn.discordapp.com/embed/avatars/4.png');
    });

    it('should support custom size parameter', () => {
      const provider = new DiscordProvider(config);
      const user: DiscordUser = {
        id: '123456789012345678',
        username: 'testuser',
        discriminator: '0',
        global_name: 'Test User',
        avatar: 'abc123',
      };

      const url = provider.getAvatarUrl(user, 256);

      expect(url).toContain('size=256');
    });
  });
});
