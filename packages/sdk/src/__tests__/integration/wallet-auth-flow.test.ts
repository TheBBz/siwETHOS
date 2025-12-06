/**
 * SDK Wallet Auth Integration Tests
 *
 * Tests the complete wallet authentication flow:
 * getNonce() → createMessage() → sign → verify() → AuthResult
 *
 * These tests mock the auth server API but test the full SDK flow.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  EthosWalletAuth,
  setGlobalConfig,
  resetGlobalConfig,
  EthosAuthError,
  type AuthResult,
} from '../../index';

// ============================================================================
// Test Constants
// ============================================================================

const TEST_ADDRESS = '0x1234567890123456789012345678901234567890';
const TEST_NONCE = 'test-nonce-abc123def456';
const TEST_SIGNATURE = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';
const TEST_AUTH_SERVER = 'https://test.ethos.example.com';

const MOCK_USER_RESPONSE = {
  access_token: 'jwt-token-xyz123',
  token_type: 'Bearer' as const,
  expires_in: 3600,
  user: {
    sub: 'ethos:12345',
    name: 'Test User',
    picture: 'https://ethos.network/avatar/12345.png',
    ethos_profile_id: 12345,
    ethos_username: 'testuser',
    ethos_score: 1500,
    ethos_status: 'active',
    ethos_attestations: ['twitter:123456', 'discord:789012'],
    wallet_address: TEST_ADDRESS,
  },
};

// ============================================================================
// Mock Setup
// ============================================================================

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock window for browser-like environment
const mockWindow = {
  location: {
    host: 'test.example.com',
    origin: 'https://test.example.com',
  },
};

vi.stubGlobal('window', mockWindow);

// ============================================================================
// Integration Tests
// ============================================================================

describe('Wallet Auth Integration Flow', () => {
  let auth: EthosWalletAuth;

  beforeEach(() => {
    vi.resetAllMocks();
    resetGlobalConfig();
    auth = EthosWalletAuth.init({ authServerUrl: TEST_AUTH_SERVER });
  });

  afterEach(() => {
    resetGlobalConfig();
  });

  describe('Complete signIn() flow', () => {
    it('should complete full auth flow: nonce → message → sign → verify', async () => {
      // Arrange: Mock API responses
      mockFetch
        // Step 1: getNonce response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            nonce: TEST_NONCE,
            expiresAt: new Date(Date.now() + 300000).toISOString(),
          }),
        })
        // Step 2: verify response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => MOCK_USER_RESPONSE,
        });

      // Mock wallet signature function
      const mockSignMessage = vi.fn().mockResolvedValue(TEST_SIGNATURE);

      // Act: Execute complete flow
      const result = await auth.signIn(TEST_ADDRESS, mockSignMessage);

      // Assert: Verify the flow completed correctly
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify nonce was fetched
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('/api/auth/nonce'),
        expect.objectContaining({ method: 'GET' })
      );

      // Verify signature was requested with SIWE message
      expect(mockSignMessage).toHaveBeenCalledTimes(1);
      const signedMessage = mockSignMessage.mock.calls[0][0];
      expect(signedMessage).toContain('test.example.com wants you to sign in');
      expect(signedMessage).toContain(TEST_ADDRESS);
      expect(signedMessage).toContain(TEST_NONCE);

      // Verify verification was called with correct params
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('/api/auth/wallet/verify'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(TEST_SIGNATURE),
        })
      );

      // Verify result structure
      expect(result).toEqual<AuthResult>({
        accessToken: 'jwt-token-xyz123',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          sub: 'ethos:12345',
          name: 'Test User',
          picture: 'https://ethos.network/avatar/12345.png',
          ethosProfileId: 12345,
          ethosUsername: 'testuser',
          ethosScore: 1500,
          ethosStatus: 'active',
          ethosAttestations: ['twitter:123456', 'discord:789012'],
          authMethod: 'wallet',
          walletAddress: TEST_ADDRESS,
        },
      });
    });

    it('should use global config when instance config not provided', async () => {
      // Arrange: Set global config
      setGlobalConfig({ authServerUrl: 'https://global.ethos.example.com' });
      const globalAuth = EthosWalletAuth.init(); // No instance config

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nonce: TEST_NONCE, expiresAt: new Date().toISOString() }),
      });

      // Act
      await globalAuth.getNonce();

      // Assert: Should use global config URL
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://global.ethos.example.com/api/auth/nonce'),
        expect.any(Object)
      );
    });

    it('should prefer instance config over global config', async () => {
      // Arrange
      setGlobalConfig({ authServerUrl: 'https://global.example.com' });
      const instanceAuth = EthosWalletAuth.init({
        authServerUrl: 'https://instance.example.com',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nonce: TEST_NONCE, expiresAt: new Date().toISOString() }),
      });

      // Act
      await instanceAuth.getNonce();

      // Assert: Should use instance config URL
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://instance.example.com/api/auth/nonce'),
        expect.any(Object)
      );
    });
  });

  describe('Error handling across flow', () => {
    it('should handle nonce fetch failure', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'server_error',
          error_description: 'Nonce service unavailable',
        }),
      });

      const mockSignMessage = vi.fn();

      // Act & Assert
      await expect(auth.signIn(TEST_ADDRESS, mockSignMessage)).rejects.toThrow(
        EthosAuthError
      );
      expect(mockSignMessage).not.toHaveBeenCalled();
    });

    it('should handle user rejecting signature', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nonce: TEST_NONCE, expiresAt: new Date().toISOString() }),
      });

      const mockSignMessage = vi.fn().mockRejectedValue(new Error('User rejected'));

      // Act & Assert
      await expect(auth.signIn(TEST_ADDRESS, mockSignMessage)).rejects.toThrow(
        'User rejected'
      );

      // Verify fetch was called for nonce but not for verify
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle verification failure', async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nonce: TEST_NONCE, expiresAt: new Date().toISOString() }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: 'invalid_signature',
            error_description: 'Signature verification failed',
          }),
        });

      const mockSignMessage = vi.fn().mockResolvedValue(TEST_SIGNATURE);

      // Act & Assert
      await expect(auth.signIn(TEST_ADDRESS, mockSignMessage)).rejects.toThrow(
        EthosAuthError
      );
    });

    it('should handle no Ethos profile found', async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nonce: TEST_NONCE, expiresAt: new Date().toISOString() }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: 'no_profile',
            error_description: 'No Ethos profile found for this wallet',
          }),
        });

      const mockSignMessage = vi.fn().mockResolvedValue(TEST_SIGNATURE);

      // Act & Assert
      await expect(auth.signIn(TEST_ADDRESS, mockSignMessage)).rejects.toThrow(
        'No Ethos profile found'
      );
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const mockSignMessage = vi.fn();

      // Act & Assert
      await expect(auth.signIn(TEST_ADDRESS, mockSignMessage)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('Step-by-step flow', () => {
    it('should allow manual step-by-step authentication', async () => {
      // Step 1: Get nonce
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          nonce: TEST_NONCE,
          expiresAt: new Date(Date.now() + 300000).toISOString(),
        }),
      });

      const { nonce, expiresAt } = await auth.getNonce();
      expect(nonce).toBe(TEST_NONCE);
      expect(expiresAt).toBeDefined();

      // Step 2: Create message
      const { message, messageString } = auth.createMessage(TEST_ADDRESS, nonce);
      expect(message.nonce).toBe(TEST_NONCE);
      expect(message.address).toBe(TEST_ADDRESS);
      expect(message.domain).toBe('test.example.com');
      expect(messageString).toContain(TEST_NONCE);

      // Step 3: Verify (simulating wallet signature)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_USER_RESPONSE,
      });

      const result = await auth.verify({
        message: messageString,
        signature: TEST_SIGNATURE,
        address: TEST_ADDRESS,
      });

      expect(result.accessToken).toBe('jwt-token-xyz123');
      expect(result.user.ethosScore).toBe(1500);
    });

    it('should reject invalid address format', () => {
      const invalidAddresses = [
        '0x123', // Too short
        'not-an-address',
        '1234567890123456789012345678901234567890', // Missing 0x
        '',
      ];

      for (const address of invalidAddresses) {
        expect(() => auth.createMessage(address, TEST_NONCE)).toThrow(
          EthosAuthError
        );
      }
    });
  });

  describe('SIWE message format', () => {
    it('should create properly formatted SIWE message', () => {
      const { messageString } = auth.createMessage(TEST_ADDRESS, TEST_NONCE);

      // Verify EIP-4361 format
      expect(messageString).toMatch(/^test\.example\.com wants you to sign in with your Ethereum account:/);
      expect(messageString).toContain(TEST_ADDRESS);
      expect(messageString).toContain('Sign in with Ethos');
      expect(messageString).toContain(`Nonce: ${TEST_NONCE}`);
      expect(messageString).toContain('Chain ID: 1');
      expect(messageString).toContain('Version: 1');
      expect(messageString).toMatch(/Issued At: \d{4}-\d{2}-\d{2}T/);
      expect(messageString).toMatch(/Expiration Time: \d{4}-\d{2}-\d{2}T/);
    });

    it('should use custom chain ID from config', () => {
      const polygonAuth = EthosWalletAuth.init({
        authServerUrl: TEST_AUTH_SERVER,
        chainId: 137,
      });

      const { messageString } = polygonAuth.createMessage(TEST_ADDRESS, TEST_NONCE);
      expect(messageString).toContain('Chain ID: 137');
    });

    it('should use custom statement from config', () => {
      const customAuth = EthosWalletAuth.init({
        authServerUrl: TEST_AUTH_SERVER,
        statement: 'Custom sign-in statement',
      });

      const { messageString } = customAuth.createMessage(TEST_ADDRESS, TEST_NONCE);
      expect(messageString).toContain('Custom sign-in statement');
    });
  });
});
