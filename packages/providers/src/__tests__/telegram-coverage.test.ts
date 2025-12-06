/**
 * Additional Telegram Provider Tests for Coverage
 *
 * Tests to cover edge cases in telegram/index.ts
 */

import { describe, it, expect } from 'vitest';
import { TelegramProvider, TelegramVerificationError } from '../telegram';
import type { TelegramAuthData } from '../telegram';

// ============================================================================
// Test Constants
// ============================================================================

const TEST_CONFIG = {
  botToken: 'test-bot-token-12345',
  botUsername: 'TestAuthBot',
};

// ============================================================================
// TelegramProvider Tests
// ============================================================================

describe('TelegramProvider', () => {
  const provider = new TelegramProvider(TEST_CONFIG);

  describe('getWidgetScriptUrl', () => {
    it('should return the Telegram widget script URL', () => {
      const url = provider.getWidgetScriptUrl();
      expect(url).toBe('https://telegram.org/js/telegram-widget.js?22');
    });
  });

  describe('getWidgetHtml', () => {
    it('should generate basic widget HTML', () => {
      const html = provider.getWidgetHtml('https://example.com/callback');
      
      expect(html).toContain('telegram-widget.js');
      expect(html).toContain(`data-telegram-login="${TEST_CONFIG.botUsername}"`);
      expect(html).toContain('data-auth-url="https://example.com/callback"');
      expect(html).toContain('data-size="medium"'); // default size
    });

    it('should include custom size', () => {
      const html = provider.getWidgetHtml('https://example.com/callback', {
        size: 'large',
      });
      
      expect(html).toContain('data-size="large"');
    });

    it('should include corner radius when specified', () => {
      const html = provider.getWidgetHtml('https://example.com/callback', {
        cornerRadius: 10,
      });
      
      expect(html).toContain('data-radius="10"');
    });

    it('should include request access when specified', () => {
      const html = provider.getWidgetHtml('https://example.com/callback', {
        requestAccess: 'write',
      });
      
      expect(html).toContain('data-request-access="write"');
    });

    it('should combine all options', () => {
      const html = provider.getWidgetHtml('https://example.com/callback', {
        size: 'small',
        cornerRadius: 5,
        requestAccess: 'write',
      });
      
      expect(html).toContain('data-size="small"');
      expect(html).toContain('data-radius="5"');
      expect(html).toContain('data-request-access="write"');
    });
  });

  describe('verifyAuthData', () => {
    it('should throw for missing id', async () => {
      const authData = {
        first_name: 'John',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'somehash',
      } as TelegramAuthData;

      await expect(provider.verifyAuthData(authData)).rejects.toThrow(
        TelegramVerificationError
      );
      await expect(provider.verifyAuthData(authData)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should throw for missing first_name', async () => {
      const authData = {
        id: 12345,
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'somehash',
      } as TelegramAuthData;

      await expect(provider.verifyAuthData(authData)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should throw for missing auth_date', async () => {
      const authData = {
        id: 12345,
        first_name: 'John',
        hash: 'somehash',
      } as TelegramAuthData;

      await expect(provider.verifyAuthData(authData)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should throw for missing hash', async () => {
      const authData = {
        id: 12345,
        first_name: 'John',
        auth_date: Math.floor(Date.now() / 1000),
      } as TelegramAuthData;

      await expect(provider.verifyAuthData(authData)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should throw for expired auth data with default max age', async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 90000; // 25 hours ago
      const authData: TelegramAuthData = {
        id: 12345,
        first_name: 'John',
        auth_date: oldTimestamp,
        hash: 'somehash',
      };

      await expect(provider.verifyAuthData(authData)).rejects.toThrow(
        TelegramVerificationError
      );
      await expect(provider.verifyAuthData(authData)).rejects.toThrow(
        'expired'
      );
    });

    it('should throw for expired auth data with custom max age', async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 120; // 2 minutes ago
      const authData: TelegramAuthData = {
        id: 12345,
        first_name: 'John',
        auth_date: oldTimestamp,
        hash: 'somehash',
      };

      // With 60 second max age
      await expect(provider.verifyAuthData(authData, 60)).rejects.toThrow(
        'expired'
      );
    });

    it('should throw for invalid hash', async () => {
      const authData: TelegramAuthData = {
        id: 12345,
        first_name: 'John',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'invalidhash',
      };

      await expect(provider.verifyAuthData(authData)).rejects.toThrow(
        TelegramVerificationError
      );
      await expect(provider.verifyAuthData(authData)).rejects.toThrow(
        'Invalid Telegram auth hash'
      );
    });
  });

  describe('getEthosLookup', () => {
    it('should return correct lookup key', () => {
      const user = {
        id: 12345,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        username: 'johndoe',
        authDate: new Date(),
      };

      const lookup = provider.getEthosLookup(user);

      expect(lookup.provider).toBe('telegram');
      expect(lookup.userId).toBe('12345');
      expect(lookup.displayName).toBe('John Doe');
    });
  });

  describe('TelegramVerificationError', () => {
    it('should have correct properties', () => {
      const error = new TelegramVerificationError('Test message', 'expired');
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('expired');
      expect(error.name).toBe('TelegramVerificationError');
    });
  });
});
