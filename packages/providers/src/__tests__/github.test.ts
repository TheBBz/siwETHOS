/**
 * GitHub Provider Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GithubProvider } from '../github';
import type { GithubUser, GithubTokenResponse, GithubCallbackResult } from '../github/types';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as typeof fetch;

describe('GithubProvider', () => {
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
      const provider = new GithubProvider(config);
      const { url, state } = provider.getAuthorizationUrl();

      expect(url).toContain('github.com');
      expect(url).toContain('/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
      expect(url).toContain('scope=read%3Auser+user%3Aemail');
      expect(state).toBeDefined();
      expect(state.length).toBe(32);
    });

    it('should include state parameter when provided', () => {
      const provider = new GithubProvider(config);
      const { url, state } = provider.getAuthorizationUrl({ state: 'csrf-token' });

      expect(url).toContain('state=csrf-token');
      expect(state).toBe('csrf-token');
    });

    it('should auto-generate state when not provided', () => {
      const provider = new GithubProvider(config);
      const { url, state } = provider.getAuthorizationUrl();

      expect(url).toContain('state=');
      expect(state).toBeDefined();
      expect(state.length).toBe(32);
      expect(url).toContain(`state=${state}`);
    });

    it('should use custom scopes when provided', () => {
      const provider = new GithubProvider({
        ...config,
        scopes: ['user', 'repo', 'gist'],
      });
      const { url } = provider.getAuthorizationUrl();

      expect(url).toContain('scope=user+repo+gist');
    });

    it('should handle empty scopes', () => {
      const provider = new GithubProvider({
        ...config,
        scopes: [],
      });
      const { url } = provider.getAuthorizationUrl();

      // Empty scopes should not include scope parameter
      expect(url).not.toContain('scope=');
    });
  });

  describe('handleCallback', () => {
    const mockTokenResponse: GithubTokenResponse = {
      access_token: 'mock-access-token',
      token_type: 'bearer',
      scope: 'read:user,user:email',
    };

    const mockUser: GithubUser = {
      login: 'testuser',
      id: 12345678,
      node_id: 'MDQ6VXNlcjEyMzQ1Njc4',
      avatar_url: 'https://avatars.githubusercontent.com/u/12345678',
      gravatar_id: null,
      url: 'https://api.github.com/users/testuser',
      html_url: 'https://github.com/testuser',
      type: 'User',
      site_admin: false,
      name: 'Test User',
      company: 'Test Company',
      blog: 'https://example.com',
      location: 'San Francisco',
      email: 'test@example.com',
      hireable: true,
      bio: 'Test bio',
      twitter_username: 'testuser',
      public_repos: 42,
      public_gists: 10,
      followers: 100,
      following: 50,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
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

      const provider = new GithubProvider(config);
      const result = await provider.handleCallback('auth-code');

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should throw error on token exchange HTTP failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      const provider = new GithubProvider(config);
      await expect(provider.handleCallback('bad-code')).rejects.toThrow('Bad Request');
    });

    it('should throw error on token exchange error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          error: 'bad_verification_code',
          error_description: 'The code passed is incorrect or expired'
        }),
      });

      const provider = new GithubProvider(config);
      await expect(provider.handleCallback('expired-code')).rejects.toThrow('The code passed is incorrect or expired');
    });

    it('should throw error on token exchange error without description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: 'bad_verification_code' }),
      });

      const provider = new GithubProvider(config);
      await expect(provider.handleCallback('expired-code')).rejects.toThrow('bad_verification_code');
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
        });

      const provider = new GithubProvider(config);
      await expect(provider.handleCallback('auth-code')).rejects.toThrow('Unauthorized');
    });
  });

  describe('exchangeCode', () => {
    it('should send correct request to GitHub', async () => {
      const mockTokenResponse: GithubTokenResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        scope: 'read:user',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const provider = new GithubProvider(config);
      await provider.exchangeCode('test-code');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: 'test-client-id',
            client_secret: 'test-client-secret',
            code: 'test-code',
            redirect_uri: 'https://example.com/callback',
          }),
        })
      );
    });
  });

  describe('fetchUser', () => {
    it('should send correct request to GitHub API', async () => {
      const mockUser: Partial<GithubUser> = {
        id: 123,
        login: 'testuser',
        name: 'Test User',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const provider = new GithubProvider(config);
      await provider.fetchUser('test-access-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/user',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-access-token',
            Accept: 'application/vnd.github.v3+json',
          },
        })
      );
    });
  });

  describe('getEthosLookup', () => {
    it('should return correct lookup with name', () => {
      const provider = new GithubProvider(config);
      const result: GithubCallbackResult = {
        user: {
          id: 12345678,
          login: 'testuser',
          node_id: 'MDQ6VXNlcjEyMzQ1Njc4',
          avatar_url: 'https://avatars.githubusercontent.com/u/12345678',
          gravatar_id: null,
          url: 'https://api.github.com/users/testuser',
          html_url: 'https://github.com/testuser',
          type: 'User',
          site_admin: false,
          name: 'Test User',
          company: null,
          blog: null,
          location: null,
          email: null,
          hireable: null,
          bio: null,
          twitter_username: null,
          public_repos: 0,
          public_gists: 0,
          followers: 0,
          following: 0,
          created_at: '2020-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        accessToken: 'token',
      };

      const lookup = provider.getEthosLookup(result);

      expect(lookup.provider).toBe('github');
      expect(lookup.userId).toBe('12345678');
      expect(lookup.username).toBe('testuser');
    });

    it('should use login as username even when name is null', () => {
      const provider = new GithubProvider(config);
      const result: GithubCallbackResult = {
        user: {
          id: 12345678,
          login: 'testuser',
          node_id: 'MDQ6VXNlcjEyMzQ1Njc4',
          avatar_url: 'https://avatars.githubusercontent.com/u/12345678',
          gravatar_id: null,
          url: 'https://api.github.com/users/testuser',
          html_url: 'https://github.com/testuser',
          type: 'User',
          site_admin: false,
          name: null, // name is null
          company: null,
          blog: null,
          location: null,
          email: null,
          hireable: null,
          bio: null,
          twitter_username: null,
          public_repos: 0,
          public_gists: 0,
          followers: 0,
          following: 0,
          created_at: '2020-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        accessToken: 'token',
      };

      const lookup = provider.getEthosLookup(result);

      // Should use login (username) not name
      expect(lookup.username).toBe('testuser');
    });

    it('should convert numeric ID to string', () => {
      const provider = new GithubProvider(config);
      const result: GithubCallbackResult = {
        user: {
          id: 98765432,
          login: 'anotheruser',
          node_id: 'MDQ6VXNlcjk4NzY1NDMy',
          avatar_url: 'https://avatars.githubusercontent.com/u/98765432',
          gravatar_id: null,
          url: 'https://api.github.com/users/anotheruser',
          html_url: 'https://github.com/anotheruser',
          type: 'User',
          site_admin: false,
          name: 'Another User',
          company: null,
          blog: null,
          location: null,
          email: null,
          hireable: null,
          bio: null,
          twitter_username: null,
          public_repos: 0,
          public_gists: 0,
          followers: 0,
          following: 0,
          created_at: '2020-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        accessToken: 'token',
      };

      const lookup = provider.getEthosLookup(result);

      expect(typeof lookup.userId).toBe('string');
      expect(lookup.userId).toBe('98765432');
    });
  });
});
