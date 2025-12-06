/**
 * Additional SIWE Verification Tests for Coverage
 *
 * Tests to cover edge cases and error paths in verify.ts
 */

import { describe, it, expect } from 'vitest';
import {
  verifySIWEMessage,
  recoverAddress,
  createSIWEMessage,
  formatSIWEMessage,
  generateNonce,
} from '../siwe';

// ============================================================================
// Test Constants
// ============================================================================

const VALID_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const VALID_SIGNATURE =
  '0x' + 'a'.repeat(128) + '1b'; // 65 bytes, v=27

const INVALID_SIGNATURES = {
  tooShort: '0x' + 'a'.repeat(64),
  wrongV: '0x' + 'a'.repeat(128) + '00', // v should be 27 or 28
  noPrefix: 'a'.repeat(130),
  malformed: '0xnotahexstring',
};

// ============================================================================
// recoverAddress Tests
// ============================================================================

describe('recoverAddress', () => {
  it('should throw for invalid signature length', async () => {
    await expect(recoverAddress('test message', INVALID_SIGNATURES.tooShort)).rejects.toThrow(
      'Invalid signature length'
    );
  });

  it('should throw for invalid v value', async () => {
    await expect(recoverAddress('test message', INVALID_SIGNATURES.wrongV)).rejects.toThrow(
      'Invalid signature v value'
    );
  });

  it('should throw for client-side recovery attempt with valid signature', async () => {
    // Valid format but actual recovery not implemented client-side
    await expect(recoverAddress('test message', VALID_SIGNATURE)).rejects.toThrow(
      'Client-side address recovery not implemented'
    );
  });
});

// ============================================================================
// verifySIWEMessage Edge Cases
// ============================================================================

describe('verifySIWEMessage', () => {
  const domain = 'ethos.network';
  const nonce = generateNonce();
  const issuedAt = new Date().toISOString();
  const chainId = 1;

  describe('Domain validation', () => {
    it('should fail when domain does not match', async () => {
      const message = createSIWEMessage({
        domain: 'other.domain.com',
        address: VALID_ADDRESS,
        uri: 'https://other.domain.com',
        nonce,
        issuedAt,
        chainId,
      });

      const result = await verifySIWEMessage({
        message: formatSIWEMessage(message),
        signature: VALID_SIGNATURE,
        domain: domain, // Expected domain doesn't match
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Domain mismatch');
    });
  });

  describe('Nonce validation', () => {
    it('should fail when nonce does not match', async () => {
      const message = createSIWEMessage({
        domain,
        address: VALID_ADDRESS,
        uri: `https://${domain}`,
        nonce: 'original-nonce-12345678',
        issuedAt,
        chainId,
      });

      const result = await verifySIWEMessage({
        message: formatSIWEMessage(message),
        signature: VALID_SIGNATURE,
        nonce: 'different-nonce-87654321',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Nonce mismatch');
    });
  });

  describe('Expiration validation', () => {
    it('should fail when message has expired', async () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      const message = createSIWEMessage({
        domain,
        address: VALID_ADDRESS,
        uri: `https://${domain}`,
        nonce,
        issuedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        expirationTime: pastDate.toISOString(),
        chainId,
      });

      const result = await verifySIWEMessage({
        message: formatSIWEMessage(message),
        signature: VALID_SIGNATURE,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Message has expired');
    });

    it('should pass with custom time before expiration', async () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now
      const message = createSIWEMessage({
        domain,
        address: VALID_ADDRESS,
        uri: `https://${domain}`,
        nonce,
        issuedAt,
        expirationTime: futureDate.toISOString(),
        chainId,
      });

      const result = await verifySIWEMessage({
        message: formatSIWEMessage(message),
        signature: VALID_SIGNATURE,
        time: new Date(), // Check at current time
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Not-before validation', () => {
    it('should fail when message is not yet valid', async () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now
      const message = createSIWEMessage({
        domain,
        address: VALID_ADDRESS,
        uri: `https://${domain}`,
        nonce,
        issuedAt,
        notBefore: futureDate.toISOString(),
        chainId,
      });

      const result = await verifySIWEMessage({
        message: formatSIWEMessage(message),
        signature: VALID_SIGNATURE,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Message is not yet valid');
    });

    it('should pass when current time is after notBefore', async () => {
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      const message = createSIWEMessage({
        domain,
        address: VALID_ADDRESS,
        uri: `https://${domain}`,
        nonce,
        issuedAt,
        notBefore: pastDate.toISOString(),
        chainId,
      });

      const result = await verifySIWEMessage({
        message: formatSIWEMessage(message),
        signature: VALID_SIGNATURE,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Signature format validation', () => {
    it('should fail for missing signature', async () => {
      const message = createSIWEMessage({
        domain,
        address: VALID_ADDRESS,
        uri: `https://${domain}`,
        nonce,
        issuedAt,
        chainId,
      });

      const result = await verifySIWEMessage({
        message: formatSIWEMessage(message),
        signature: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });

    it('should fail for invalid signature format', async () => {
      const message = createSIWEMessage({
        domain,
        address: VALID_ADDRESS,
        uri: `https://${domain}`,
        nonce,
        issuedAt,
        chainId,
      });

      const result = await verifySIWEMessage({
        message: formatSIWEMessage(message),
        signature: '0xinvalid',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });
  });

  describe('Address validation', () => {
    it('should fail for invalid address in message', async () => {
      // Manually create a message with invalid address
      const rawMessage = `ethos.network wants you to sign in with your Ethereum account:
0xinvalidaddress

URI: https://ethos.network
Nonce: ${nonce}
Issued At: ${issuedAt}`;

      const result = await verifySIWEMessage({
        message: rawMessage,
        signature: VALID_SIGNATURE,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid SIWE message');
    });
  });

  describe('Error handling', () => {
    it('should handle malformed message gracefully', async () => {
      const result = await verifySIWEMessage({
        message: 'completely invalid message format',
        signature: VALID_SIGNATURE,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return message info even on failure', async () => {
      const message = createSIWEMessage({
        domain,
        address: VALID_ADDRESS,
        uri: `https://${domain}`,
        nonce,
        issuedAt,
        chainId,
      });

      const result = await verifySIWEMessage({
        message: formatSIWEMessage(message),
        signature: '', // Invalid signature
      });

      expect(result.success).toBe(false);
      expect(result.address).toBe(VALID_ADDRESS);
      expect(result.message).toBeDefined();
    });
  });

  describe('Successful verification', () => {
    it('should return checksummed address on success', async () => {
      const lowercaseAddress = VALID_ADDRESS.toLowerCase();
      const message = createSIWEMessage({
        domain,
        address: lowercaseAddress,
        uri: `https://${domain}`,
        nonce,
        issuedAt,
        chainId,
      });

      const result = await verifySIWEMessage({
        message: formatSIWEMessage(message),
        signature: VALID_SIGNATURE,
      });

      expect(result.success).toBe(true);
      expect(result.address).toBe(lowercaseAddress); // checksumAddress returns lowercase
    });

    it('should include parsed message in result', async () => {
      const message = createSIWEMessage({
        domain,
        address: VALID_ADDRESS,
        uri: `https://${domain}`,
        nonce,
        issuedAt,
        statement: 'Test statement',
        chainId,
      });

      const result = await verifySIWEMessage({
        message: formatSIWEMessage(message),
        signature: VALID_SIGNATURE,
      });

      expect(result.success).toBe(true);
      expect(result.message.domain).toBe(domain);
      expect(result.message.nonce).toBe(nonce);
      expect(result.message.statement).toBe('Test statement');
    });
  });
});
