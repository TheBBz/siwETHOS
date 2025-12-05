/**
 * Telegram Provider Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelegramProvider, TelegramVerificationError } from '../telegram';
import type { TelegramAuthData, TelegramUser } from '../telegram/types';

// Mock crypto.subtle for testing
const _mockSubtle = {
  digest: vi.fn(),
  importKey: vi.fn(),
  sign: vi.fn(),
};

// Store original for restoration
const _originalSubtle = globalThis.crypto?.subtle;

describe('TelegramProvider', () => {
  const config = {
    botToken: 'test-bot-token',
    botUsername: 'TestBot',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWidgetScriptUrl', () => {
    it('should return the correct widget script URL', () => {
      const provider = new TelegramProvider(config);
      const url = provider.getWidgetScriptUrl();

      expect(url).toBe('https://telegram.org/js/telegram-widget.js?22');
    });
  });

  describe('getWidgetHtml', () => {
    it('should generate correct widget HTML with defaults', () => {
      const provider = new TelegramProvider(config);
      const html = provider.getWidgetHtml('https://example.com/callback');

      expect(html).toContain('data-telegram-login="TestBot"');
      expect(html).toContain('data-size="medium"');
      expect(html).toContain('data-auth-url="https://example.com/callback"');
      expect(html).toContain('telegram-widget.js');
    });

    it('should include custom size', () => {
      const provider = new TelegramProvider(config);
      const html = provider.getWidgetHtml('https://example.com/callback', { size: 'large' });

      expect(html).toContain('data-size="large"');
    });

    it('should include corner radius when specified', () => {
      const provider = new TelegramProvider(config);
      const html = provider.getWidgetHtml('https://example.com/callback', { cornerRadius: 10 });

      expect(html).toContain('data-radius="10"');
    });

    it('should include request access when specified', () => {
      const provider = new TelegramProvider(config);
      const html = provider.getWidgetHtml('https://example.com/callback', { requestAccess: 'write' });

      expect(html).toContain('data-request-access="write"');
    });
  });

  describe('verifyAuthData', () => {
    it('should throw on missing required fields', async () => {
      const provider = new TelegramProvider(config);
      const invalidData: Partial<TelegramAuthData> = {
        id: 123456,
        // Missing first_name, auth_date, hash
      };

      await expect(
        provider.verifyAuthData(invalidData as TelegramAuthData)
      ).rejects.toThrow(TelegramVerificationError);
    });

    it('should throw on expired auth data', async () => {
      const provider = new TelegramProvider(config);
      const oldTimestamp = Math.floor(Date.now() / 1000) - 100000; // Very old
      const authData: TelegramAuthData = {
        id: 123456,
        first_name: 'Test',
        auth_date: oldTimestamp,
        hash: 'somehash',
      };

      await expect(
        provider.verifyAuthData(authData)
      ).rejects.toThrow('expired');
    });

    it('should throw TelegramVerificationError with correct code for missing fields', async () => {
      const provider = new TelegramProvider(config);
      const authData = {} as TelegramAuthData;

      try {
        await provider.verifyAuthData(authData);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TelegramVerificationError);
        expect((error as TelegramVerificationError).code).toBe('missing_fields');
      }
    });

    it('should throw TelegramVerificationError with correct code for expired data', async () => {
      const provider = new TelegramProvider(config);
      const oldTimestamp = Math.floor(Date.now() / 1000) - 100000;
      const authData: TelegramAuthData = {
        id: 123456,
        first_name: 'Test',
        auth_date: oldTimestamp,
        hash: 'somehash',
      };

      try {
        await provider.verifyAuthData(authData);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TelegramVerificationError);
        expect((error as TelegramVerificationError).code).toBe('expired');
      }
    });
  });

  describe('getEthosLookup', () => {
    it('should return correct lookup for user', () => {
      const provider = new TelegramProvider(config);
      const user: TelegramUser = {
        id: 123456789,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        authDate: new Date(),
      };

      const lookup = provider.getEthosLookup(user);

      expect(lookup.provider).toBe('telegram');
      expect(lookup.userId).toBe('123456789');
      expect(lookup.displayName).toBe('John Doe');
    });

    it('should convert numeric id to string', () => {
      const provider = new TelegramProvider(config);
      const user: TelegramUser = {
        id: 987654321,
        firstName: 'Jane',
        displayName: 'Jane',
        authDate: new Date(),
      };

      const lookup = provider.getEthosLookup(user);

      expect(typeof lookup.userId).toBe('string');
      expect(lookup.userId).toBe('987654321');
    });
  });

  describe('TelegramVerificationError', () => {
    it('should create error with message and code', () => {
      const error = new TelegramVerificationError('Test error', 'expired');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('expired');
      expect(error.name).toBe('TelegramVerificationError');
    });

    it('should extend Error class', () => {
      const error = new TelegramVerificationError('Test', 'invalid_hash');

      expect(error instanceof Error).toBe(true);
    });
  });
});
