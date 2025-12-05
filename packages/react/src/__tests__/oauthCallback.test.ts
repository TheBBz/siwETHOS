/**
 * Tests for oauthCallback utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  decodeBase64Url,
  parseOAuthError,
  formatOAuthError,
  clearOAuthParams,
  parseOAuthCode,
  hasOAuthCallback,
  getOAuthParams,
} from '../utils/oauthCallback';

describe('oauthCallback utilities', () => {
  describe('decodeBase64Url', () => {
    it('decodes a simple base64url string', () => {
      // "hello" in base64url
      const encoded = btoa('hello').replace(/\+/g, '-').replace(/\//g, '_');
      expect(decodeBase64Url(encoded)).toBe('hello');
    });

    it('handles standard base64 (with + and /)', () => {
      // Create a string that would have + and / in regular base64
      const input = '{"test": "value+slash/end"}';
      const base64 = btoa(input);
      const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_');
      
      expect(decodeBase64Url(base64url)).toBe(input);
    });

    it('decodes UTF-8 characters correctly', () => {
      // Encode a string with UTF-8 characters
      const input = '{"name": "José 日本語"}';
      const bytes = new TextEncoder().encode(input);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64url = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_');
      
      expect(decodeBase64Url(base64url)).toBe(input);
    });

    it('decodes JSON payload correctly', () => {
      const payload = { sub: 'user123', name: 'Test User' };
      const base64url = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_');
      
      const result = decodeBase64Url(base64url);
      expect(JSON.parse(result)).toEqual(payload);
    });
  });

  describe('parseOAuthError', () => {
    it('returns null when no error param', () => {
      const url = new URL('https://example.com/callback?code=abc123');
      expect(parseOAuthError(url)).toBeNull();
    });

    it('returns error without description', () => {
      const url = new URL('https://example.com/callback?error=access_denied');
      
      const result = parseOAuthError(url);
      expect(result).toEqual({
        error: 'access_denied',
        description: undefined,
      });
    });

    it('returns error with description', () => {
      const url = new URL('https://example.com/callback?error=access_denied&error_description=User%20cancelled');
      
      const result = parseOAuthError(url);
      expect(result).toEqual({
        error: 'access_denied',
        description: 'User cancelled',
      });
    });
  });

  describe('formatOAuthError', () => {
    it('returns description when provided', () => {
      expect(formatOAuthError('error', 'Custom description')).toBe('Custom description');
    });

    it('returns special message for no_ethos_profile', () => {
      expect(formatOAuthError('no_ethos_profile')).toBe(
        'No Ethos profile found. Please connect your account on ethos.network first.'
      );
    });

    it('returns formatted message for other errors', () => {
      expect(formatOAuthError('invalid_grant')).toBe('Authentication failed: invalid_grant');
    });

    it('handles null description', () => {
      expect(formatOAuthError('error', null)).toBe('Authentication failed: error');
    });
  });

  describe('clearOAuthParams', () => {
    beforeEach(() => {
      // Mock window.history.replaceState
      vi.stubGlobal('window', {
        history: {
          replaceState: vi.fn(),
        },
      });
    });

    it('clears all OAuth params from URL', () => {
      const url = new URL('https://example.com/callback?code=abc&state=xyz&error=test&error_description=desc&other=keep');
      
      clearOAuthParams(url);
      
      expect(url.searchParams.has('code')).toBe(false);
      expect(url.searchParams.has('state')).toBe(false);
      expect(url.searchParams.has('error')).toBe(false);
      expect(url.searchParams.has('error_description')).toBe(false);
      expect(url.searchParams.get('other')).toBe('keep');
    });

    it('calls history.replaceState with cleaned URL', () => {
      const url = new URL('https://example.com/callback?code=abc');
      
      clearOAuthParams(url);
      
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringMatching(/^\/callback/)
      );
    });
  });

  describe('parseOAuthCode', () => {
    it('parses wrapped user format', () => {
      const userData = {
        user: {
          sub: 'ethos:12345',
          name: 'Test User',
          ethosProfileId: 12345,
          ethosUsername: 'testuser',
          ethosScore: 850,
          ethosStatus: 'ACTIVE',
          socialProvider: 'discord',
          socialId: 'discord-123',
        },
      };
      const code = btoa(JSON.stringify(userData)).replace(/\+/g, '-').replace(/\//g, '_');

      const result = parseOAuthCode(code);
      
      expect(result.success).toBe(true);
      expect(result.user?.sub).toBe('ethos:12345');
      expect(result.user?.name).toBe('Test User');
      expect(result.user?.ethosProfileId).toBe(12345);
      expect(result.user?.ethosUsername).toBe('testuser');
      expect(result.user?.socialProvider).toBe('discord');
    });

    it('parses accessToken format', () => {
      // Create a JWT-like structure with payload
      const jwtPayload = {
        sub: 'ethos:67890',
        name: 'JWT User',
        ethosProfileId: 67890,
        ethosScore: 900,
        authMethod: 'twitter',
      };
      const payloadB64 = btoa(JSON.stringify(jwtPayload)).replace(/\+/g, '-').replace(/\//g, '_');
      const fakeJwt = `header.${payloadB64}.signature`;
      
      const wrapper = { accessToken: fakeJwt };
      const code = btoa(JSON.stringify(wrapper)).replace(/\+/g, '-').replace(/\//g, '_');

      const result = parseOAuthCode(code);
      
      expect(result.success).toBe(true);
      expect(result.user?.ethosProfileId).toBe(67890);
      expect(result.user?.authMethod).toBe('twitter');
    });

    it('parses direct JWT format', () => {
      const jwtPayload = {
        sub: 'ethos:11111',
        name: 'Direct JWT',
        ethosProfileId: 11111,
        socialProvider: 'farcaster',
      };
      const payloadB64 = btoa(JSON.stringify(jwtPayload)).replace(/\+/g, '-').replace(/\//g, '_');
      const code = `header.${payloadB64}.signature`;

      const result = parseOAuthCode(code);
      
      expect(result.success).toBe(true);
      expect(result.user?.ethosProfileId).toBe(11111);
      expect(result.user?.socialProvider).toBe('farcaster');
    });

    it('generates default profile URL when not provided', () => {
      const userData = {
        user: {
          ethosProfileId: 99999,
          ethosUsername: 'myuser',
          socialProvider: 'twitter',
        },
      };
      const code = btoa(JSON.stringify(userData)).replace(/\+/g, '-').replace(/\//g, '_');

      const result = parseOAuthCode(code);
      
      expect(result.user?.profileUrl).toBe('https://app.ethos.network/profile/twitter/myuser');
    });

    it('uses provided profile URL', () => {
      const userData = {
        user: {
          ethosProfileId: 99999,
          profileUrl: 'https://custom.url/profile',
        },
      };
      const code = btoa(JSON.stringify(userData)).replace(/\+/g, '-').replace(/\//g, '_');

      const result = parseOAuthCode(code);
      
      expect(result.user?.profileUrl).toBe('https://custom.url/profile');
    });

    it('calculates expiresIn from exp claim', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
      const userData = {
        user: {
          ethosProfileId: 12345,
          exp: futureExp,
        },
      };
      const code = btoa(JSON.stringify(userData)).replace(/\+/g, '-').replace(/\//g, '_');

      const result = parseOAuthCode(code);
      
      expect(result.success).toBe(true);
      // Should be approximately 7200 seconds (2 hours)
      expect(result.expiresIn).toBeGreaterThan(7100);
      expect(result.expiresIn).toBeLessThanOrEqual(7200);
    });

    it('defaults to 3600 when no exp', () => {
      const userData = {
        user: { ethosProfileId: 12345 },
      };
      const code = btoa(JSON.stringify(userData)).replace(/\+/g, '-').replace(/\//g, '_');

      const result = parseOAuthCode(code);
      
      expect(result.expiresIn).toBe(3600);
    });

    it('handles default values for missing fields', () => {
      const userData = { user: {} };
      const code = btoa(JSON.stringify(userData)).replace(/\+/g, '-').replace(/\//g, '_');

      const result = parseOAuthCode(code);
      
      expect(result.success).toBe(true);
      expect(result.user?.sub).toBe('ethos:0');
      expect(result.user?.name).toBe('');
      expect(result.user?.picture).toBeNull();
      expect(result.user?.ethosProfileId).toBe(0);
      expect(result.user?.ethosUsername).toBeNull();
      expect(result.user?.ethosScore).toBe(0);
      expect(result.user?.ethosStatus).toBe('UNKNOWN');
      expect(result.user?.ethosAttestations).toEqual([]);
      expect(result.user?.authMethod).toBe('discord');
    });

    it('returns error for invalid JWT without payload', () => {
      const code = 'invalidcode'; // Not base64, not JWT

      const result = parseOAuthCode(code);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid authorization code format');
    });

    it('returns error for malformed base64', () => {
      // Create code that will fail JSON.parse
      const code = 'not-valid-jwt-format.abc123';

      const result = parseOAuthCode(code);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns accessToken in result', () => {
      const userData = { user: { ethosProfileId: 12345 } };
      const code = btoa(JSON.stringify(userData)).replace(/\+/g, '-').replace(/\//g, '_');

      const result = parseOAuthCode(code);
      
      expect(result.accessToken).toBe(code);
    });
  });

  describe('hasOAuthCallback', () => {
    it('returns true when code param present', () => {
      const url = new URL('https://example.com/callback?code=abc123');
      expect(hasOAuthCallback(url)).toBe(true);
    });

    it('returns true when error param present', () => {
      const url = new URL('https://example.com/callback?error=access_denied');
      expect(hasOAuthCallback(url)).toBe(true);
    });

    it('returns false when no OAuth params', () => {
      const url = new URL('https://example.com/callback?other=value');
      expect(hasOAuthCallback(url)).toBe(false);
    });

    it('returns false for empty query string', () => {
      const url = new URL('https://example.com/callback');
      expect(hasOAuthCallback(url)).toBe(false);
    });
  });

  describe('getOAuthParams', () => {
    it('extracts all OAuth params', () => {
      const url = new URL('https://example.com/callback?code=abc&state=xyz&error=err&error_description=desc');
      
      const result = getOAuthParams(url);
      
      expect(result).toEqual({
        code: 'abc',
        state: 'xyz',
        error: 'err',
        errorDescription: 'desc',
      });
    });

    it('returns undefined for missing params', () => {
      const url = new URL('https://example.com/callback');
      
      const result = getOAuthParams(url);
      
      expect(result).toEqual({
        code: undefined,
        state: undefined,
        error: undefined,
        errorDescription: undefined,
      });
    });

    it('handles partial params', () => {
      const url = new URL('https://example.com/callback?code=abc');
      
      const result = getOAuthParams(url);
      
      expect(result.code).toBe('abc');
      expect(result.state).toBeUndefined();
      expect(result.error).toBeUndefined();
    });
  });
});
