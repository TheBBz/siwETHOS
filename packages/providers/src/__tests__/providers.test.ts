/**
 * Provider Unit Tests
 * 
 * Tests for Discord, Telegram, and Farcaster providers
 * as well as score validation utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  // Discord
  DiscordProvider,
  // Telegram
  TelegramProvider,
  TelegramVerificationError,
  // Farcaster
  FarcasterProvider,
  FarcasterVerificationError,
  // Score
  validateMinScore,
  meetsMinScore,
  getScoreTier,
  EthosScoreInsufficientError,
  SCORE_TIERS,
} from '../index';

// ============================================================================
// Discord Provider Tests
// ============================================================================

describe('DiscordProvider', () => {
  const discord = new DiscordProvider({
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'https://example.com/callback',
  });

  it('should generate correct authorization URL', () => {
    const url = discord.getAuthorizationUrl();
    expect(url).toContain('https://discord.com');
    expect(url).toContain('authorize');
    expect(url).toContain('client_id=test-client-id');
    expect(url).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
    expect(url).toContain('response_type=code');
    expect(url).toContain('scope=identify');
  });

  it('should include state in authorization URL when provided', () => {
    const url = discord.getAuthorizationUrl({ state: 'csrf-token-123' });
    expect(url).toContain('state=csrf-token-123');
  });

  it('should support custom scopes', () => {
    const customDiscord = new DiscordProvider({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'https://example.com/callback',
      scopes: ['identify', 'email'],
    });
    const url = customDiscord.getAuthorizationUrl();
    expect(url).toContain('scope=identify+email');
  });

  it('should generate correct Ethos lookup from callback result', () => {
    const lookup = discord.getEthosLookup({
      user: {
        id: '123456789',
        username: 'testuser',
        global_name: 'Test User',
        discriminator: '0',
        avatar: null,
      },
      accessToken: 'test-token',
      expiresIn: 604800,
    });

    expect(lookup).toEqual({
      provider: 'discord',
      userId: '123456789',
      username: 'Test User',
    });
  });

  it('should fall back to username when global_name is null', () => {
    const lookup = discord.getEthosLookup({
      user: {
        id: '123456789',
        username: 'testuser',
        global_name: null,
        discriminator: '0',
        avatar: null,
      },
      accessToken: 'test-token',
      expiresIn: 604800,
    });

    expect(lookup.username).toBe('testuser');
  });

  it('should generate correct avatar URL for user with avatar', () => {
    const user = {
      id: '123456789',
      username: 'testuser',
      global_name: 'Test User',
      discriminator: '0',
      avatar: 'abc123',
    };
    const avatarUrl = discord.getAvatarUrl(user);
    expect(avatarUrl).toBe('https://cdn.discordapp.com/avatars/123456789/abc123.png?size=128');
  });

  it('should generate animated avatar URL for animated avatars', () => {
    const user = {
      id: '123456789',
      username: 'testuser',
      global_name: 'Test User',
      discriminator: '0',
      avatar: 'a_abc123',
    };
    const avatarUrl = discord.getAvatarUrl(user);
    expect(avatarUrl).toBe('https://cdn.discordapp.com/avatars/123456789/a_abc123.gif?size=128');
  });

  it('should generate default avatar URL for user without avatar', () => {
    const user = {
      id: '123456789',
      username: 'testuser',
      global_name: 'Test User',
      discriminator: '0',
      avatar: null,
    };
    const avatarUrl = discord.getAvatarUrl(user);
    expect(avatarUrl).toMatch(/^https:\/\/cdn\.discordapp\.com\/embed\/avatars\/\d\.png$/);
  });
});

// ============================================================================
// Telegram Provider Tests
// ============================================================================

describe('TelegramProvider', () => {
  const telegram = new TelegramProvider({
    botToken: 'test-bot-token',
    botUsername: 'TestBot',
  });

  it('should return correct widget script URL', () => {
    expect(telegram.getWidgetScriptUrl()).toBe('https://telegram.org/js/telegram-widget.js?22');
  });

  it('should generate widget HTML correctly', () => {
    const html = telegram.getWidgetHtml('https://example.com/auth/telegram/callback');
    expect(html).toContain('data-telegram-login="TestBot"');
    expect(html).toContain('data-size="medium"');
    expect(html).toContain('data-auth-url="https://example.com/auth/telegram/callback"');
  });

  it('should include custom options in widget HTML', () => {
    const html = telegram.getWidgetHtml('https://example.com/callback', {
      size: 'large',
      cornerRadius: 10,
      requestAccess: 'write',
    });
    expect(html).toContain('data-size="large"');
    expect(html).toContain('data-radius="10"');
    expect(html).toContain('data-request-access="write"');
  });

  it('should reject auth data with missing fields', async () => {
    const invalidData = {
      id: 123,
      first_name: 'Test',
      auth_date: Math.floor(Date.now() / 1000),
      // missing hash
    } as any;

    await expect(telegram.verifyAuthData(invalidData)).rejects.toThrow(TelegramVerificationError);
    await expect(telegram.verifyAuthData(invalidData)).rejects.toThrow('Missing required fields');
  });

  it('should reject expired auth data', async () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 100000; // Way in the past
    const expiredData = {
      id: 123,
      first_name: 'Test',
      auth_date: oldTimestamp,
      hash: 'somehash',
    };

    await expect(telegram.verifyAuthData(expiredData, 86400)).rejects.toThrow(TelegramVerificationError);
    await expect(telegram.verifyAuthData(expiredData, 86400)).rejects.toThrow('expired');
  });

  it('should generate correct Ethos lookup from verified user', () => {
    const lookup = telegram.getEthosLookup({
      id: 123456789,
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      username: 'johndoe',
      authDate: new Date(),
    });

    expect(lookup).toEqual({
      provider: 'telegram',
      userId: '123456789',
      displayName: 'John Doe',
    });
  });
});

// ============================================================================
// Farcaster Provider Tests
// ============================================================================

describe('FarcasterProvider', () => {
  const farcaster = new FarcasterProvider({
    domain: 'example.com',
    uri: 'https://example.com',
  });

  it('should create SIWF message with correct format', () => {
    const { message, messageString } = farcaster.createMessage({
      fid: 12345,
      custodyAddress: '0x1234567890123456789012345678901234567890',
      nonce: 'test-nonce-123',
    });

    expect(message.fid).toBe(12345);
    expect(message.domain).toBe('example.com');
    expect(message.uri).toBe('https://example.com');
    expect(message.nonce).toBe('test-nonce-123');
    expect(message.issuedAt).toBeDefined();
    expect(message.expirationTime).toBeDefined();

    expect(messageString).toContain('example.com wants you to sign in with your Farcaster account:');
    expect(messageString).toContain('FID: 12345');
    expect(messageString).toContain('Custody: 0x1234567890123456789012345678901234567890');
    expect(messageString).toContain('Nonce: test-nonce-123');
  });

  it('should reject invalid custody address', () => {
    expect(() => {
      farcaster.createMessage({
        fid: 12345,
        custodyAddress: 'invalid-address',
        nonce: 'test-nonce',
      });
    }).toThrow(FarcasterVerificationError);
  });

  it('should parse SIWF message correctly', () => {
    const { messageString } = farcaster.createMessage({
      fid: 12345,
      custodyAddress: '0x1234567890123456789012345678901234567890',
      nonce: 'test-nonce-123',
    });

    const parsed = farcaster.parseMessage(messageString);
    expect(parsed.fid).toBe(12345);
    expect(parsed.domain).toBe('example.com');
    expect(parsed.nonce).toBe('test-nonce-123');
  });

  it('should reject invalid message format', () => {
    expect(() => {
      farcaster.parseMessage('This is not a valid SIWF message');
    }).toThrow(FarcasterVerificationError);
  });

  it('should generate correct Ethos lookup', () => {
    const lookup = farcaster.getEthosLookup({
      fid: 12345,
      custodyAddress: '0x1234567890123456789012345678901234567890',
      nonce: 'test-nonce',
      domain: 'example.com',
    });

    expect(lookup).toEqual({
      provider: 'farcaster',
      fid: '12345',
    });
  });
});

// ============================================================================
// Score Validation Tests
// ============================================================================

describe('Score Validation', () => {
  describe('validateMinScore', () => {
    it('should pass when score meets minimum', () => {
      expect(() => validateMinScore({ score: 1500 }, 1000)).not.toThrow();
      expect(() => validateMinScore({ score: 1000 }, 1000)).not.toThrow();
    });

    it('should throw when score is below minimum', () => {
      expect(() => validateMinScore({ score: 500 }, 1000)).toThrow(EthosScoreInsufficientError);
    });

    it('should not throw when minScore is undefined', () => {
      expect(() => validateMinScore({ score: 100 }, undefined as any)).not.toThrow();
    });

    it('should provide correct error details', () => {
      try {
        validateMinScore({ score: 300 }, 500);
        expect.fail('Should have thrown');
      } catch (error) {
        const e = error as EthosScoreInsufficientError;
        expect(e.actualScore).toBe(300);
        expect(e.requiredScore).toBe(500);
        expect(e.code).toBe('insufficient_score');
      }
    });

    it('should serialize error to JSON correctly', () => {
      const error = new EthosScoreInsufficientError(300, 500);
      const json = error.toJSON();
      expect(json.error).toBe('insufficient_score');
      expect(json.actual_score).toBe(300);
      expect(json.required_score).toBe(500);
    });
  });

  describe('meetsMinScore', () => {
    it('should return true when score meets minimum', () => {
      expect(meetsMinScore(1500, 1000)).toBe(true);
      expect(meetsMinScore(1000, 1000)).toBe(true);
    });

    it('should return false when score is below minimum', () => {
      expect(meetsMinScore(500, 1000)).toBe(false);
    });

    it('should return true when minScore is undefined', () => {
      expect(meetsMinScore(0, undefined)).toBe(true);
    });
  });

  describe('getScoreTier', () => {
    it('should return correct tier for each range', () => {
      expect(getScoreTier(0)).toBe('untrusted');
      expect(getScoreTier(399)).toBe('untrusted');
      expect(getScoreTier(400)).toBe('questionable');
      expect(getScoreTier(799)).toBe('questionable');
      expect(getScoreTier(800)).toBe('neutral');
      expect(getScoreTier(1199)).toBe('neutral');
      expect(getScoreTier(1200)).toBe('trusted');
      expect(getScoreTier(1599)).toBe('trusted');
      expect(getScoreTier(1600)).toBe('reputable');
      expect(getScoreTier(1999)).toBe('reputable');
      expect(getScoreTier(2000)).toBe('exemplary');
      expect(getScoreTier(2800)).toBe('exemplary');
    });
  });

  describe('SCORE_TIERS', () => {
    it('should have correct tier boundaries', () => {
      expect(SCORE_TIERS.untrusted).toEqual({ min: 0, max: 399 });
      expect(SCORE_TIERS.questionable).toEqual({ min: 400, max: 799 });
      expect(SCORE_TIERS.neutral).toEqual({ min: 800, max: 1199 });
      expect(SCORE_TIERS.trusted).toEqual({ min: 1200, max: 1599 });
      expect(SCORE_TIERS.reputable).toEqual({ min: 1600, max: 1999 });
      expect(SCORE_TIERS.exemplary).toEqual({ min: 2000, max: 2800 });
    });
  });
});
