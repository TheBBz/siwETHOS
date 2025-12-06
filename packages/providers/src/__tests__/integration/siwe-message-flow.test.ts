/**
 * Providers SIWE Flow Integration Tests
 *
 * Tests the complete SIWE message lifecycle:
 * generateNonce() → createSIWEMessage() → formatSIWEMessage() → parseSIWEMessage()
 *
 * These tests verify the full flow of SIWE message creation and parsing.
 */

import { describe, it, expect } from 'vitest';
import {
  generateNonce,
  isValidNonceFormat,
  createTimedNonce,
  isNonceExpired,
  createSIWEMessage,
  parseSIWEMessage,
  isValidEthereumAddress,
  checksumAddress,
  addressesEqual,
  validateMinScore,
  meetsMinScore,
  getScoreTier,
  EthosScoreInsufficientError,
  SCORE_TIERS,
} from '../../index';

// ============================================================================
// Test Constants
// ============================================================================

const TEST_ADDRESS = '0x1234567890123456789012345678901234567890';
const TEST_DOMAIN = 'test.ethos.example.com';
const TEST_URI = 'https://test.ethos.example.com';

// ============================================================================
// Integration Tests
// ============================================================================

describe('SIWE Message Flow Integration', () => {
  describe('Complete nonce → message → parse flow', () => {
    it('should create valid nonce that passes validation', () => {
      // Step 1: Generate nonce
      const nonce = generateNonce();

      // Step 2: Validate nonce format
      expect(isValidNonceFormat(nonce)).toBe(true);
      expect(nonce.length).toBeGreaterThanOrEqual(8);
    });

    it('should generate unique nonces across multiple calls', () => {
      const nonces = new Set<string>();

      // Generate 100 nonces
      for (let i = 0; i < 100; i++) {
        nonces.add(generateNonce());
      }

      // All should be unique
      expect(nonces.size).toBe(100);
    });

    it('should create SIWE message → format → parse round trip', () => {
      // Step 1: Generate nonce
      const nonce = generateNonce();

      // Step 2: Create SIWE message
      const message = createSIWEMessage({
        domain: TEST_DOMAIN,
        address: TEST_ADDRESS,
        uri: TEST_URI,
        chainId: 1,
        nonce,
        statement: 'Sign in with Ethos to verify your wallet.',
      });

      // Step 3: Verify message structure
      expect(message.domain).toBe(TEST_DOMAIN);
      expect(message.address).toBe(TEST_ADDRESS);
      expect(message.uri).toBe(TEST_URI);
      expect(message.chainId).toBe(1);
      expect(message.nonce).toBe(nonce);
      expect(message.version).toBe('1');
      expect(message.issuedAt).toBeDefined();
      expect(message.raw).toBeDefined();

      // Step 4: Parse the raw message back
      const parsed = parseSIWEMessage(message.raw);

      // Step 5: Verify parsed matches original
      expect(parsed.domain).toBe(message.domain);
      expect(parsed.address).toBe(message.address);
      expect(parsed.uri).toBe(message.uri);
      expect(parsed.chainId).toBe(message.chainId);
      expect(parsed.nonce).toBe(message.nonce);
      expect(parsed.version).toBe(message.version);
    });

    it('should handle optional fields in round trip', () => {
      const nonce = generateNonce();
      const expirationTime = new Date(Date.now() + 300000).toISOString();

      const message = createSIWEMessage({
        domain: TEST_DOMAIN,
        address: TEST_ADDRESS,
        uri: TEST_URI,
        chainId: 137, // Polygon
        nonce,
        statement: 'Custom statement for testing.',
        expirationTime,
        requestId: 'req-123',
        resources: ['https://ethos.network', 'https://api.ethos.network'],
      });

      // Parse and verify all fields
      const parsed = parseSIWEMessage(message.raw);

      expect(parsed.chainId).toBe(137);
      expect(parsed.statement).toBe('Custom statement for testing.');
      expect(parsed.expirationTime).toBe(expirationTime);
      expect(parsed.requestId).toBe('req-123');
      expect(parsed.resources).toEqual(['https://ethos.network', 'https://api.ethos.network']);
    });

    it('should format message following EIP-4361 spec', () => {
      const nonce = 'test-nonce-abc123';
      const issuedAt = '2025-01-01T12:00:00.000Z';

      const message = createSIWEMessage({
        domain: TEST_DOMAIN,
        address: TEST_ADDRESS,
        uri: TEST_URI,
        chainId: 1,
        nonce,
        statement: 'Test statement.',
        issuedAt,
      });

      // Verify EIP-4361 format
      const lines = message.raw.split('\n');

      expect(lines[0]).toBe(`${TEST_DOMAIN} wants you to sign in with your Ethereum account:`);
      expect(lines[1]).toBe(TEST_ADDRESS);
      expect(lines[2]).toBe(''); // Blank line before statement
      expect(lines[3]).toBe('Test statement.');
      expect(lines[4]).toBe(''); // Blank line after statement
      expect(lines[5]).toBe(`URI: ${TEST_URI}`);
      expect(lines[6]).toBe('Version: 1');
      expect(lines[7]).toBe('Chain ID: 1');
      expect(lines[8]).toBe(`Nonce: ${nonce}`);
      expect(lines[9]).toBe(`Issued At: ${issuedAt}`);
    });
  });

  describe('Timed nonce expiration flow', () => {
    it('should create timed nonce with embedded expiration', () => {
      const ttlSeconds = 300; // 5 minutes
      const timedNonce = createTimedNonce(ttlSeconds);

      // Should return object with nonce and expiresAt
      expect(timedNonce).toHaveProperty('nonce');
      expect(timedNonce).toHaveProperty('expiresAt');

      // Nonce should be valid format
      expect(isValidNonceFormat(timedNonce.nonce)).toBe(true);

      // Should not be expired immediately
      expect(isNonceExpired(timedNonce.expiresAt)).toBe(false);

      // Expiration should be in the future
      expect(timedNonce.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should detect expired timed nonce', () => {
      // Create a past expiration timestamp (already expired)
      const pastTimestamp = Date.now() - 1000; // 1 second ago

      // isNonceExpired checks if current time is past expiration
      expect(isNonceExpired(pastTimestamp)).toBe(true);

      // Future timestamp should not be expired
      const futureTimestamp = Date.now() + 60000; // 1 minute from now
      expect(isNonceExpired(futureTimestamp)).toBe(false);
    });
  });

  describe('Address utilities integration', () => {
    it('should validate and checksum addresses in message flow', () => {
      // Start with lowercase address
      const lowercaseAddress = '0xabcdef1234567890abcdef1234567890abcdef12';

      // Validate it's a valid address
      expect(isValidEthereumAddress(lowercaseAddress)).toBe(true);

      // Get checksummed version
      const checksummed = checksumAddress(lowercaseAddress);

      // Checksummed should still be valid
      expect(isValidEthereumAddress(checksummed)).toBe(true);

      // Both should be considered equal
      expect(addressesEqual(lowercaseAddress, checksummed)).toBe(true);

      // Create message with checksummed address
      const nonce = generateNonce();
      const message = createSIWEMessage({
        domain: TEST_DOMAIN,
        address: checksummed,
        uri: TEST_URI,
        chainId: 1,
        nonce,
      });

      // Parse and verify address is preserved
      const parsed = parseSIWEMessage(message.raw);
      expect(addressesEqual(parsed.address, lowercaseAddress)).toBe(true);
    });

    it('should reject invalid addresses', () => {
      const invalidAddresses = [
        '0x123', // Too short
        'not-an-address',
        '1234567890abcdef1234567890abcdef12345678', // Missing 0x
        '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // Invalid hex
        '',
        '0x',
      ];

      for (const address of invalidAddresses) {
        expect(isValidEthereumAddress(address)).toBe(false);
      }
    });
  });
});

describe('Score Validation Integration', () => {
  const mockUser = (score: number) => ({
    score, // Use 'score' not 'ethosScore' - matches UserWithScore interface
    name: 'Test User',
    sub: 'ethos:123',
  });

  describe('Score tier progression', () => {
    it('should identify correct tier for each score range', () => {
      // Test boundary conditions for each tier
      // Actual tier boundaries from score.ts:
      // untrusted: 0-399, questionable: 400-799, neutral: 800-1199
      // trusted: 1200-1599, reputable: 1600-1999, exemplary: 2000-2800
      const testCases = [
        { score: 0, expectedTier: 'untrusted' },
        { score: 399, expectedTier: 'untrusted' },
        { score: 400, expectedTier: 'questionable' },
        { score: 799, expectedTier: 'questionable' },
        { score: 800, expectedTier: 'neutral' },
        { score: 1199, expectedTier: 'neutral' },
        { score: 1200, expectedTier: 'trusted' },
        { score: 1599, expectedTier: 'trusted' },
        { score: 1600, expectedTier: 'reputable' },
        { score: 1999, expectedTier: 'reputable' },
        { score: 2000, expectedTier: 'exemplary' },
        { score: 2800, expectedTier: 'exemplary' },
      ];

      for (const { score, expectedTier } of testCases) {
        const tier = getScoreTier(score);
        expect(tier).toBe(expectedTier);
      }
    });

    it('should verify SCORE_TIERS constant is properly defined', () => {
      expect(SCORE_TIERS).toBeDefined();
      // SCORE_TIERS uses lowercase keys
      expect(SCORE_TIERS.untrusted).toBeDefined();
      expect(SCORE_TIERS.questionable).toBeDefined();
      expect(SCORE_TIERS.neutral).toBeDefined();
      expect(SCORE_TIERS.trusted).toBeDefined();
      expect(SCORE_TIERS.reputable).toBeDefined();
      expect(SCORE_TIERS.exemplary).toBeDefined();
    });
  });

  describe('Minimum score validation flow', () => {
    it('should allow users meeting minimum score', () => {
      const user = mockUser(1500);

      // meetsMinScore takes a score number, not a user object
      expect(meetsMinScore(user.score, 1000)).toBe(true);

      // validateMinScore takes a UserWithScore object
      expect(() => validateMinScore(user, 1000)).not.toThrow();
    });

    it('should reject users below minimum score', () => {
      const user = mockUser(500);

      // Should not meet 1000 minimum
      expect(meetsMinScore(user.score, 1000)).toBe(false);

      // Should throw specific error
      expect(() => validateMinScore(user, 1000)).toThrow(EthosScoreInsufficientError);
    });

    it('should handle undefined minScore (allow all)', () => {
      // meetsMinScore takes score as first arg
      expect(meetsMinScore(0, undefined)).toBe(true);
    });

    it('should include score info in error', () => {
      const user = mockUser(300);

      try {
        validateMinScore(user, 800);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(EthosScoreInsufficientError);
        if (error instanceof EthosScoreInsufficientError) {
          expect(error.actualScore).toBe(300);
          expect(error.requiredScore).toBe(800);
          expect(error.message).toContain('300');
          expect(error.message).toContain('800');
        }
      }
    });
  });

  describe('Complete auth with score check', () => {
    it('should simulate auth flow with score requirement', () => {
      // Simulate user auth result
      const authResult = {
        accessToken: 'jwt-token',
        user: mockUser(1500),
      };

      const minScoreRequirement = 1000;

      // Step 1: User authenticates (simulated)
      expect(authResult.accessToken).toBeDefined();

      // Step 2: Check if user meets score requirement
      const meetsRequirement = meetsMinScore(authResult.user.score, minScoreRequirement);
      expect(meetsRequirement).toBe(true);

      // Step 3: Get user's tier
      const tier = getScoreTier(authResult.user.score);
      expect(tier).toBe('trusted'); // 1500 is in trusted tier (1200-1599)
    });
  });
});
