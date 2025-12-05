/**
 * SDK Unit Tests
 * 
 * Tests for the unified EthosAuth class and EthosWalletAuth
 */

import { describe, it, expect, afterEach } from 'vitest';
import EthosAuth, {
  EthosWalletAuth,
  setGlobalConfig,
  getGlobalConfig,
  resetGlobalConfig,
  formatSIWEMessage,
  createSIWEMessage,
  DEFAULTS,
  type EthosAuthConfig,
  type WalletAuthConfig,
  type SocialProvider,
} from '../index';

// Reset global config before each test file
resetGlobalConfig();

// ============================================================================
// Global Config Tests
// ============================================================================

describe('Global Configuration', () => {
  afterEach(() => {
    resetGlobalConfig();
  });

  it('should set and get global config', () => {
    setGlobalConfig({ authServerUrl: 'https://custom.example.com' });
    expect(getGlobalConfig().authServerUrl).toBe('https://custom.example.com');
  });

  it('should merge multiple config calls', () => {
    setGlobalConfig({ authServerUrl: 'https://custom.example.com' });
    setGlobalConfig({ chainId: 137 });
    const config = getGlobalConfig();
    expect(config.authServerUrl).toBe('https://custom.example.com');
    expect(config.chainId).toBe(137);
  });

  it('should reset global config', () => {
    setGlobalConfig({ authServerUrl: 'https://custom.example.com' });
    resetGlobalConfig();
    expect(getGlobalConfig().authServerUrl).toBeUndefined();
  });
});

// ============================================================================
// SIWE Message Tests
// ============================================================================

describe('SIWE Message', () => {
  it('should create a valid SIWE message', () => {
    const message = createSIWEMessage({
      domain: 'example.com',
      address: '0x1234567890123456789012345678901234567890',
      uri: 'https://example.com',
      nonce: 'test-nonce-123',
      chainId: 1,
      statement: 'Sign in with Ethos',
    });

    expect(message.domain).toBe('example.com');
    expect(message.address).toBe('0x1234567890123456789012345678901234567890');
    expect(message.uri).toBe('https://example.com');
    expect(message.nonce).toBe('test-nonce-123');
    expect(message.chainId).toBe(1);
    expect(message.version).toBe('1');
    expect(message.issuedAt).toBeDefined();
  });

  it('should format SIWE message correctly', () => {
    const message = createSIWEMessage({
      domain: 'example.com',
      address: '0x1234567890123456789012345678901234567890',
      uri: 'https://example.com',
      nonce: 'test-nonce-123',
      chainId: 1,
      statement: 'Sign in with Ethos',
    });

    const formatted = formatSIWEMessage(message);
    
    expect(formatted).toContain('example.com wants you to sign in with your Ethereum account:');
    expect(formatted).toContain('0x1234567890123456789012345678901234567890');
    expect(formatted).toContain('Sign in with Ethos');
    expect(formatted).toContain('URI: https://example.com');
    expect(formatted).toContain('Nonce: test-nonce-123');
    expect(formatted).toContain('Chain ID: 1');
    expect(formatted).toContain('Version: 1');
  });

  it('should include resources in formatted message', () => {
    const message = createSIWEMessage({
      domain: 'example.com',
      address: '0x1234567890123456789012345678901234567890',
      uri: 'https://example.com',
      nonce: 'test-nonce-123',
      resources: ['https://ethos.network'],
    });

    const formatted = formatSIWEMessage(message);
    expect(formatted).toContain('Resources:');
    expect(formatted).toContain('- https://ethos.network');
  });
});

// ============================================================================
// EthosWalletAuth Tests
// ============================================================================

describe('EthosWalletAuth', () => {
  it('should use default config values', () => {
    const auth = EthosWalletAuth.init();
    const config = auth.getConfig();
    
    expect(config.authServerUrl).toBe(DEFAULTS.AUTH_SERVER_URL);
    expect(config.chainId).toBe(DEFAULTS.CHAIN_ID);
    expect(config.statement).toBe(DEFAULTS.STATEMENT);
    expect(config.expirationTime).toBe(DEFAULTS.EXPIRATION_TIME);
  });

  it('should override defaults with instance config', () => {
    const auth = EthosWalletAuth.init({
      authServerUrl: 'https://custom.example.com',
      chainId: 137,
    });
    const config = auth.getConfig();
    
    expect(config.authServerUrl).toBe('https://custom.example.com');
    expect(config.chainId).toBe(137);
  });

  it('should use global config when set', () => {
    setGlobalConfig({ authServerUrl: 'https://global.example.com' });
    const auth = EthosWalletAuth.init();
    const config = auth.getConfig();
    
    expect(config.authServerUrl).toBe('https://global.example.com');
    resetGlobalConfig();
  });

  it('should prioritize instance config over global', () => {
    setGlobalConfig({ authServerUrl: 'https://global.example.com' });
    const auth = EthosWalletAuth.init({ authServerUrl: 'https://instance.example.com' });
    const config = auth.getConfig();
    
    expect(config.authServerUrl).toBe('https://instance.example.com');
    resetGlobalConfig();
  });

  it('should create valid SIWE message with createMessage', () => {
    const auth = EthosWalletAuth.init();
    const { message, messageString } = auth.createMessage(
      '0x1234567890123456789012345678901234567890',
      'test-nonce'
    );

    expect(message.address).toBe('0x1234567890123456789012345678901234567890');
    expect(message.nonce).toBe('test-nonce');
    expect(messageString).toContain('Sign in with Ethos');
  });

  it('should reject invalid address', () => {
    const auth = EthosWalletAuth.init();
    expect(() => {
      auth.createMessage('invalid-address', 'test-nonce');
    }).toThrow('Invalid Ethereum address');
  });

  it('should generate correct connect URL', () => {
    const auth = EthosWalletAuth.init({ authServerUrl: 'https://auth.example.com' });
    const url = auth.getConnectUrl('https://callback.example.com', 'state-123');
    
    expect(url).toContain('https://auth.example.com/connect');
    expect(url).toContain('redirect_uri=https%3A%2F%2Fcallback.example.com');
    expect(url).toContain('state=state-123');
  });
});

// ============================================================================
// EthosAuth (Unified) Tests
// ============================================================================

describe('EthosAuth', () => {
  it('should initialize with default config', () => {
    const auth = EthosAuth.init();
    const config = auth.getConfig();
    
    expect(config.authServerUrl).toBe(DEFAULTS.AUTH_SERVER_URL);
    expect(config.minScore).toBeUndefined();
  });

  it('should accept minScore config', () => {
    const auth = EthosAuth.init({ minScore: 500 });
    const config = auth.getConfig();
    
    expect(config.minScore).toBe(500);
  });

  it('should generate correct social auth URL for Discord', () => {
    const auth = EthosAuth.init({ authServerUrl: 'https://auth.example.com' });
    const url = auth.getAuthUrl('discord', {
      redirectUri: 'https://myapp.com/callback',
      state: 'csrf-token',
    });

    expect(url).toBe('https://auth.example.com/auth/discord?redirect_uri=https%3A%2F%2Fmyapp.com%2Fcallback&state=csrf-token');
  });

  it('should generate correct social auth URL for Telegram', () => {
    const auth = EthosAuth.init({ authServerUrl: 'https://auth.example.com' });
    const url = auth.getAuthUrl('telegram', {
      redirectUri: 'https://myapp.com/callback',
    });

    expect(url).toBe('https://auth.example.com/auth/telegram?redirect_uri=https%3A%2F%2Fmyapp.com%2Fcallback');
  });

  it('should generate correct social auth URL for Farcaster', () => {
    const auth = EthosAuth.init({ authServerUrl: 'https://auth.example.com' });
    const url = auth.getAuthUrl('farcaster', {
      redirectUri: 'https://myapp.com/callback',
    });

    expect(url).toBe('https://auth.example.com/auth/farcaster?redirect_uri=https%3A%2F%2Fmyapp.com%2Fcallback');
  });

  it('should include minScore in auth URL when configured', () => {
    const auth = EthosAuth.init({ 
      authServerUrl: 'https://auth.example.com',
      minScore: 1000,
    });
    const url = auth.getAuthUrl('discord', {
      redirectUri: 'https://myapp.com/callback',
    });

    expect(url).toContain('min_score=1000');
  });

  it('should override config minScore with param minScore', () => {
    const auth = EthosAuth.init({ 
      authServerUrl: 'https://auth.example.com',
      minScore: 500,
    });
    const url = auth.getAuthUrl('discord', {
      redirectUri: 'https://myapp.com/callback',
      minScore: 1500, // Override
    });

    expect(url).toContain('min_score=1500');
    expect(url).not.toContain('min_score=500');
  });

  it('should return wallet auth instance with inherited config', () => {
    const auth = EthosAuth.init({
      authServerUrl: 'https://auth.example.com',
      minScore: 500,
    });
    
    const walletAuth = auth.wallet({ chainId: 137 });
    const walletConfig = walletAuth.getConfig();
    
    expect(walletConfig.authServerUrl).toBe('https://auth.example.com');
    expect(walletConfig.chainId).toBe(137);
    expect(walletConfig.minScore).toBe(500);
  });

  it('should be the default export', () => {
    expect(EthosAuth).toBeDefined();
    expect(typeof EthosAuth.init).toBe('function');
  });
});

// ============================================================================
// Type Tests (compile-time checks)
// ============================================================================

describe('TypeScript Types', () => {
  it('should have correct AuthMethod types', () => {
    // These are compile-time checks - if they compile, they pass
    const wallet: 'wallet' = 'wallet';
    const discord: 'discord' = 'discord';
    const telegram: 'telegram' = 'telegram';
    const farcaster: 'farcaster' = 'farcaster';
    
    expect(wallet).toBe('wallet');
    expect(discord).toBe('discord');
    expect(telegram).toBe('telegram');
    expect(farcaster).toBe('farcaster');
  });

  it('should have correct SocialProvider types', () => {
    const providers: SocialProvider[] = ['discord', 'telegram', 'farcaster'];
    expect(providers).toHaveLength(3);
  });

  it('should have correct config types', () => {
    const baseConfig: EthosAuthConfig = {
      authServerUrl: 'https://example.com',
      minScore: 500,
    };
    
    const walletConfig: WalletAuthConfig = {
      ...baseConfig,
      chainId: 1,
      statement: 'Test',
      expirationTime: 3600,
    };
    
    expect(baseConfig.minScore).toBe(500);
    expect(walletConfig.chainId).toBe(1);
  });
});
