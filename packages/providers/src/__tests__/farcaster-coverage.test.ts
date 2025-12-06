/**
 * Additional Farcaster Provider Tests for Coverage
 *
 * Tests to cover edge cases in farcaster/index.ts
 */

import { describe, it, expect } from 'vitest';
import { FarcasterProvider, FarcasterVerificationError } from '../farcaster';

// ============================================================================
// Test Constants
// ============================================================================

const VALID_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const TEST_CONFIG = {
  domain: 'ethos.network',
  uri: 'https://ethos.network',
};

// ============================================================================
// FarcasterProvider Tests
// ============================================================================

describe('FarcasterProvider', () => {
  const provider = new FarcasterProvider(TEST_CONFIG);

  describe('createMessage', () => {
    it('should create a valid SIWF message', () => {
      const { message, messageString } = provider.createMessage({
        fid: 12345,
        custodyAddress: VALID_ADDRESS,
        nonce: 'test-nonce-123',
      });

      expect(message.domain).toBe('ethos.network');
      expect(message.fid).toBe(12345);
      expect(message.custodyAddress).toBe(VALID_ADDRESS.toLowerCase());
      expect(message.nonce).toBe('test-nonce-123');
      expect(messageString).toContain('ethos.network');
      expect(messageString).toContain('FID: 12345');
    });

    it('should include custom statement when provided', () => {
      const { message, messageString } = provider.createMessage({
        fid: 12345,
        custodyAddress: VALID_ADDRESS,
        nonce: 'test-nonce-123',
        statement: 'Custom sign in statement',
      });

      expect(message.statement).toBe('Custom sign in statement');
      expect(messageString).toContain('Custom sign in statement');
    });

    it('should include resources when provided', () => {
      const { message, messageString } = provider.createMessage({
        fid: 12345,
        custodyAddress: VALID_ADDRESS,
        nonce: 'test-nonce-123',
        resources: ['https://api.ethos.network', 'https://ethos.network/profile'],
      });

      expect(message.resources).toContain('https://api.ethos.network');
      expect(messageString).toContain('Resources:');
      expect(messageString).toContain('- https://api.ethos.network');
    });

    it('should use custom domain and uri when provided', () => {
      const { message } = provider.createMessage({
        fid: 12345,
        custodyAddress: VALID_ADDRESS,
        nonce: 'test-nonce-123',
        domain: 'custom.domain.com',
        uri: 'https://custom.domain.com',
      });

      expect(message.domain).toBe('custom.domain.com');
      expect(message.uri).toBe('https://custom.domain.com');
    });

    it('should throw for invalid custody address', () => {
      expect(() =>
        provider.createMessage({
          fid: 12345,
          custodyAddress: 'invalid-address',
          nonce: 'test-nonce',
        })
      ).toThrow(FarcasterVerificationError);
    });

    it('should include expiration time', () => {
      const { message, messageString } = provider.createMessage({
        fid: 12345,
        custodyAddress: VALID_ADDRESS,
        nonce: 'test-nonce-123',
        expirationTime: 3600, // 1 hour
      });

      expect(message.expirationTime).toBeDefined();
      expect(messageString).toContain('Expiration Time:');
    });
  });

  describe('formatMessage', () => {
    it('should format message correctly', () => {
      const message = {
        domain: 'ethos.network',
        fid: 12345,
        custodyAddress: VALID_ADDRESS,
        statement: 'Test statement',
        uri: 'https://ethos.network',
        nonce: 'test-nonce',
        issuedAt: '2024-01-01T00:00:00.000Z',
        expirationTime: '2024-01-02T00:00:00.000Z',
        resources: ['https://resource.com'],
      };

      const formatted = provider.formatMessage(message);

      expect(formatted).toContain('ethos.network wants you to sign in with your Farcaster account:');
      expect(formatted).toContain('FID: 12345');
      expect(formatted).toContain(`Custody: ${VALID_ADDRESS}`);
      expect(formatted).toContain('Test statement');
      expect(formatted).toContain('URI: https://ethos.network');
      expect(formatted).toContain('Nonce: test-nonce');
      expect(formatted).toContain('Issued At: 2024-01-01T00:00:00.000Z');
      expect(formatted).toContain('Expiration Time: 2024-01-02T00:00:00.000Z');
      expect(formatted).toContain('Resources:');
      expect(formatted).toContain('- https://resource.com');
    });
  });

  describe('parseMessage', () => {
    it('should parse a valid SIWF message', () => {
      const messageString = `ethos.network wants you to sign in with your Farcaster account:
FID: 12345
Custody: ${VALID_ADDRESS}

Test statement

URI: https://ethos.network
Nonce: test-nonce-123
Issued At: 2024-01-01T00:00:00.000Z`;

      const parsed = provider.parseMessage(messageString);

      expect(parsed.domain).toBe('ethos.network');
      expect(parsed.fid).toBe(12345);
      expect(parsed.nonce).toBe('test-nonce-123');
    });

    it('should parse message with expiration time', () => {
      const messageString = `ethos.network wants you to sign in with your Farcaster account:
FID: 12345
Custody: ${VALID_ADDRESS}

URI: https://ethos.network
Nonce: test-nonce-123
Issued At: 2024-01-01T00:00:00.000Z
Expiration Time: 2024-12-31T23:59:59.000Z`;

      const parsed = provider.parseMessage(messageString);

      expect(parsed.expirationTime).toBe('2024-12-31T23:59:59.000Z');
    });

    it('should parse message with resources', () => {
      const messageString = `ethos.network wants you to sign in with your Farcaster account:
FID: 12345
Custody: ${VALID_ADDRESS}

URI: https://ethos.network
Nonce: test-nonce-123
Issued At: 2024-01-01T00:00:00.000Z
Resources:
- https://resource1.com
- https://resource2.com`;

      const parsed = provider.parseMessage(messageString);

      expect(parsed.resources).toBeDefined();
      expect(parsed.resources).toContain('https://resource1.com');
      expect(parsed.resources).toContain('https://resource2.com');
    });

    it('should throw for invalid message format', () => {
      expect(() => provider.parseMessage('invalid message')).toThrow(
        FarcasterVerificationError
      );
    });

    it('should throw for missing FID', () => {
      const messageString = `ethos.network wants you to sign in with your Farcaster account:
Missing FID line`;

      expect(() => provider.parseMessage(messageString)).toThrow('Missing FID');
    });

    it('should throw for missing custody address', () => {
      const messageString = `ethos.network wants you to sign in with your Farcaster account:
FID: 12345
Missing custody`;

      expect(() => provider.parseMessage(messageString)).toThrow('Missing custody');
    });
  });

  describe('verify', () => {
    it('should throw for FID mismatch', async () => {
      const messageString = `ethos.network wants you to sign in with your Farcaster account:
FID: 12345
Custody: ${VALID_ADDRESS}

URI: https://ethos.network
Nonce: test-nonce-123
Issued At: 2024-01-01T00:00:00.000Z`;

      await expect(
        provider.verify({
          message: messageString,
          signature: '0x' + 'a'.repeat(128) + '1b',
          fid: 99999, // Different FID
          custodyAddress: VALID_ADDRESS,
        })
      ).rejects.toThrow('FID mismatch');
    });

    it('should throw for expired message', async () => {
      const pastExpiration = new Date(Date.now() - 86400000).toISOString();
      const messageString = `ethos.network wants you to sign in with your Farcaster account:
FID: 12345
Custody: ${VALID_ADDRESS}

URI: https://ethos.network
Nonce: test-nonce-123
Issued At: 2024-01-01T00:00:00.000Z
Expiration Time: ${pastExpiration}`;

      await expect(
        provider.verify({
          message: messageString,
          signature: '0x' + 'a'.repeat(128) + '1b',
          fid: 12345,
          custodyAddress: VALID_ADDRESS,
        })
      ).rejects.toThrow('expired');
    });
  });

  describe('getEthosLookup', () => {
    it('should return correct lookup key', () => {
      const user = {
        fid: 12345,
        custodyAddress: VALID_ADDRESS,
        nonce: 'test-nonce',
        domain: 'ethos.network',
      };

      const lookup = provider.getEthosLookup(user);

      expect(lookup.provider).toBe('farcaster');
      expect(lookup.fid).toBe('12345');
    });
  });

  describe('FarcasterVerificationError', () => {
    it('should have correct properties', () => {
      const error = new FarcasterVerificationError('Test message', 'expired');
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('expired');
      expect(error.name).toBe('FarcasterVerificationError');
    });

    it('should work with all error codes', () => {
      const codes = ['fid_mismatch', 'expired', 'invalid_signature', 'invalid_message'] as const;
      
      for (const code of codes) {
        const error = new FarcasterVerificationError('Error', code);
        expect(error.code).toBe(code);
      }
    });
  });
});
