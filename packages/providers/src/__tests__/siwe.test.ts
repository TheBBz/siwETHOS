/**
 * SIWE (Sign-In with Ethereum) Tests
 * 
 * Tests for message creation, formatting, parsing, and verification
 */

import { describe, it, expect } from 'vitest';
import {
  createSIWEMessage,
  formatSIWEMessage,
  parseSIWEMessage,
  verifySIWEMessage,
  recoverAddress,
  generateNonce,
  isValidNonceFormat,
  validateNonce,
  isValidEthereumAddress,
  checksumAddress,
} from '../siwe';
import type { SIWEMessage as _SIWEMessage } from '../siwe/types';

// ============================================================================
// Test Constants
// ============================================================================

const VALID_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const INVALID_ADDRESS = '0xinvalid';
const LOWERCASE_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';

// ============================================================================
// Address Utilities
// ============================================================================

describe('Address Utilities', () => {
  describe('isValidEthereumAddress', () => {
    it('should validate correct addresses', () => {
      expect(isValidEthereumAddress(VALID_ADDRESS)).toBe(true);
      expect(isValidEthereumAddress(LOWERCASE_ADDRESS)).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidEthereumAddress(INVALID_ADDRESS)).toBe(false);
      expect(isValidEthereumAddress('')).toBe(false);
      expect(isValidEthereumAddress('0x123')).toBe(false);
      expect(isValidEthereumAddress('not-an-address')).toBe(false);
    });

    it('should reject addresses with wrong length', () => {
      expect(isValidEthereumAddress('0x123456789')).toBe(false);
      expect(isValidEthereumAddress('0x' + 'a'.repeat(41))).toBe(false);
    });
  });

  describe('checksumAddress', () => {
    it('should normalize to lowercase', () => {
      const result = checksumAddress(LOWERCASE_ADDRESS);
      expect(result).toBe(LOWERCASE_ADDRESS);
    });

    it('should convert mixed case to lowercase', () => {
      const result = checksumAddress(VALID_ADDRESS);
      expect(result).toBe(LOWERCASE_ADDRESS);
    });

    it('should throw on invalid address', () => {
      expect(() => checksumAddress('invalid')).toThrow('Invalid Ethereum address');
    });
  });
});

// ============================================================================
// Nonce Generation & Validation
// ============================================================================

describe('Nonce', () => {
  describe('generateNonce', () => {
    it('should generate a nonce of correct length', () => {
      const nonce = generateNonce();
      expect(nonce.length).toBe(32);
    });

    it('should generate nonce with custom length', () => {
      const nonce = generateNonce(16);
      expect(nonce.length).toBe(16);
    });

    it('should generate unique nonces', () => {
      const nonces = new Set<string>();
      for (let i = 0; i < 100; i++) {
        nonces.add(generateNonce());
      }
      expect(nonces.size).toBe(100);
    });

    it('should generate alphanumeric nonces', () => {
      const nonce = generateNonce();
      expect(/^[a-zA-Z0-9]+$/.test(nonce)).toBe(true);
    });
  });

  describe('isValidNonceFormat', () => {
    it('should validate correct nonces', () => {
      const nonce = generateNonce();
      expect(isValidNonceFormat(nonce)).toBe(true);
    });

    it('should reject empty nonces', () => {
      expect(isValidNonceFormat('')).toBe(false);
    });

    it('should reject short nonces', () => {
      expect(isValidNonceFormat('abc')).toBe(false);
      expect(isValidNonceFormat('abc', 3)).toBe(true);
    });

    it('should reject nonces with special characters', () => {
      expect(isValidNonceFormat('nonce-with-dash')).toBe(false);
      expect(isValidNonceFormat('nonce with space')).toBe(false);
    });
  });

  describe('validateNonce', () => {
    it('should validate matching nonces', () => {
      const nonce = generateNonce();
      expect(validateNonce(nonce, nonce)).toBe(true);
    });

    it('should reject mismatched nonces', () => {
      expect(validateNonce('nonce1', 'nonce2')).toBe(false);
    });

    it('should reject empty nonces', () => {
      expect(validateNonce('', 'stored')).toBe(false);
      expect(validateNonce('nonce', '')).toBe(false);
    });

    it('should reject expired nonces', () => {
      const nonce = generateNonce();
      const expiredAt = Date.now() - 1000; // 1 second ago
      expect(validateNonce(nonce, nonce, expiredAt)).toBe(false);
    });

    it('should accept non-expired nonces', () => {
      const nonce = generateNonce();
      const futureExpiry = Date.now() + 60000; // 1 minute from now
      expect(validateNonce(nonce, nonce, futureExpiry)).toBe(true);
    });
  });
});

// ============================================================================
// SIWE Message Creation
// ============================================================================

describe('SIWE Message', () => {
  describe('createSIWEMessage', () => {
    it('should create a valid message with required fields', () => {
      const message = createSIWEMessage({
        domain: 'example.com',
        address: VALID_ADDRESS,
        uri: 'https://example.com',
        nonce: 'abc123def456',
        chainId: 1,
      });

      expect(message.domain).toBe('example.com');
      expect(message.address).toBe(VALID_ADDRESS);
      expect(message.uri).toBe('https://example.com');
      expect(message.nonce).toBe('abc123def456');
      expect(message.chainId).toBe(1);
      expect(message.version).toBe('1');
    });

    it('should include optional statement', () => {
      const message = createSIWEMessage({
        domain: 'example.com',
        address: VALID_ADDRESS,
        uri: 'https://example.com',
        nonce: 'abc123def456',
        chainId: 1,
        statement: 'Sign in with Ethos',
      });

      expect(message.statement).toBe('Sign in with Ethos');
    });

    it('should set issuedAt to current time', () => {
      const before = new Date().toISOString();
      const message = createSIWEMessage({
        domain: 'example.com',
        address: VALID_ADDRESS,
        uri: 'https://example.com',
        nonce: 'abc123def456',
        chainId: 1,
      });
      const after = new Date().toISOString();

      expect(message.issuedAt).toBeDefined();
      expect(message.issuedAt! >= before).toBe(true);
      expect(message.issuedAt! <= after).toBe(true);
    });

    it('should include resources when provided', () => {
      const message = createSIWEMessage({
        domain: 'example.com',
        address: VALID_ADDRESS,
        uri: 'https://example.com',
        nonce: 'abc123def456',
        chainId: 1,
        resources: ['https://ethos.network'],
      });

      expect(message.resources).toEqual(['https://ethos.network']);
    });
  });

  describe('formatSIWEMessage', () => {
    it('should format message with required fields', () => {
      const message = createSIWEMessage({
        domain: 'example.com',
        address: VALID_ADDRESS,
        uri: 'https://example.com',
        nonce: 'abc123def456',
        chainId: 1,
      });
      const formatted = formatSIWEMessage(message);

      expect(formatted).toContain('example.com wants you to sign in with your Ethereum account:');
      expect(formatted).toContain(VALID_ADDRESS);
      expect(formatted).toContain('URI: https://example.com');
      expect(formatted).toContain('Version: 1');
      expect(formatted).toContain('Chain ID: 1');
      expect(formatted).toContain('Nonce: abc123def456');
    });

    it('should include statement when present', () => {
      const message = createSIWEMessage({
        domain: 'example.com',
        address: VALID_ADDRESS,
        uri: 'https://example.com',
        nonce: 'abc123def456',
        chainId: 1,
        statement: 'Custom statement',
      });
      const formatted = formatSIWEMessage(message);

      expect(formatted).toContain('Custom statement');
    });

    it('should include resources when present', () => {
      const message = createSIWEMessage({
        domain: 'example.com',
        address: VALID_ADDRESS,
        uri: 'https://example.com',
        nonce: 'abc123def456',
        chainId: 1,
        resources: ['https://ethos.network', 'https://app.example.com'],
      });
      const formatted = formatSIWEMessage(message);

      expect(formatted).toContain('Resources:');
      expect(formatted).toContain('- https://ethos.network');
      expect(formatted).toContain('- https://app.example.com');
    });
  });

  describe('parseSIWEMessage', () => {
    it('should parse a formatted message back to object', () => {
      const original = createSIWEMessage({
        domain: 'example.com',
        address: VALID_ADDRESS,
        uri: 'https://example.com',
        nonce: 'abc123def456',
        chainId: 1,
        statement: 'Sign in with Ethos',
      });

      const formatted = formatSIWEMessage(original);
      const parsed = parseSIWEMessage(formatted);

      expect(parsed.domain).toBe('example.com');
      expect(parsed.address).toBe(VALID_ADDRESS);
      expect(parsed.uri).toBe('https://example.com');
      expect(parsed.nonce).toBe('abc123def456');
      expect(parsed.chainId).toBe(1);
      expect(parsed.statement).toBe('Sign in with Ethos');
    });

    it('should throw on invalid message format', () => {
      expect(() => parseSIWEMessage('invalid message')).toThrow();
    });
  });
});

// ============================================================================
// Signature Verification
// ============================================================================

describe('Signature Verification', () => {
  describe('verifySIWEMessage', () => {
    it('should reject expired messages', async () => {
      const message = createSIWEMessage({
        domain: 'example.com',
        address: VALID_ADDRESS,
        uri: 'https://example.com',
        nonce: 'abc123def456',
        chainId: 1,
        expirationTime: '2020-01-01T00:05:00.000Z',
      });
      const expiredMessage = formatSIWEMessage(message);

      const result = await verifySIWEMessage({
        message: expiredMessage,
        signature: '0x' + '00'.repeat(65),
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should reject mismatched domain', async () => {
      const message = createSIWEMessage({
        domain: 'example.com',
        address: VALID_ADDRESS,
        uri: 'https://example.com',
        nonce: 'abc123def456',
        chainId: 1,
      });
      const formatted = formatSIWEMessage(message);

      const result = await verifySIWEMessage({
        message: formatted,
        signature: '0x' + '00'.repeat(65),
        domain: 'different.com',
      });

      expect(result.success).toBe(false);
      expect(result.error?.toLowerCase()).toContain('domain');
    });

    it('should reject invalid signature format', async () => {
      const message = createSIWEMessage({
        domain: 'example.com',
        address: VALID_ADDRESS,
        uri: 'https://example.com',
        nonce: 'abc123def456',
        chainId: 1,
      });
      const formatted = formatSIWEMessage(message);

      const result = await verifySIWEMessage({
        message: formatted,
        signature: 'invalid-signature',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('recoverAddress', () => {
    it('should throw on invalid signature format', async () => {
      await expect(
        recoverAddress('message', 'invalid-sig')
      ).rejects.toThrow();
    });

    it('should throw on signature with wrong length', async () => {
      await expect(
        recoverAddress('message', '0x1234')
      ).rejects.toThrow();
    });
  });
});

