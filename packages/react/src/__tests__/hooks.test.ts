/**
 * Tests for useWalletDetection hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWalletDetection, checkWalletInstalled, detectWallets } from '../hooks/useWalletDetection';

describe('checkWalletInstalled', () => {
  beforeEach(() => {
    // Reset window mocks
    (window as any).ethereum = undefined;
    (window as any).phantom = undefined;
    (window as any).zerionWallet = undefined;
  });

  describe('MetaMask detection', () => {
    it('should detect MetaMask when isMetaMask is true', () => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: vi.fn(),
      };
      expect(checkWalletInstalled('metamask')).toBe(true);
    });

    it('should not detect MetaMask when isRabby is also true', () => {
      (window as any).ethereum = {
        isMetaMask: true,
        isRabby: true,
        request: vi.fn(),
      };
      expect(checkWalletInstalled('metamask')).toBe(false);
    });

    it('should not detect MetaMask when isBraveWallet is true', () => {
      (window as any).ethereum = {
        isMetaMask: true,
        isBraveWallet: true,
        request: vi.fn(),
      };
      expect(checkWalletInstalled('metamask')).toBe(false);
    });

    it('should detect MetaMask in providers array', () => {
      (window as any).ethereum = {
        providers: [
          { isRabby: true },
          { isMetaMask: true },
        ],
        request: vi.fn(),
      };
      expect(checkWalletInstalled('metamask')).toBe(true);
    });
  });

  describe('Rabby detection', () => {
    it('should detect Rabby when isRabby is true', () => {
      (window as any).ethereum = {
        isRabby: true,
        request: vi.fn(),
      };
      expect(checkWalletInstalled('rabby')).toBe(true);
    });

    it('should detect Rabby in providers array', () => {
      (window as any).ethereum = {
        providers: [
          { isMetaMask: true },
          { isRabby: true },
        ],
        request: vi.fn(),
      };
      expect(checkWalletInstalled('rabby')).toBe(true);
    });
  });

  describe('Phantom detection', () => {
    it('should detect Phantom when phantom.ethereum exists', () => {
      (window as any).phantom = {
        ethereum: {
          request: vi.fn(),
        },
      };
      expect(checkWalletInstalled('phantom')).toBe(true);
    });

    it('should not detect Phantom when phantom is undefined', () => {
      expect(checkWalletInstalled('phantom')).toBe(false);
    });
  });

  describe('Zerion detection', () => {
    it('should detect Zerion when zerionWallet exists', () => {
      (window as any).zerionWallet = {
        request: vi.fn(),
      };
      expect(checkWalletInstalled('zerion')).toBe(true);
    });

    it('should not detect Zerion when zerionWallet is undefined', () => {
      expect(checkWalletInstalled('zerion')).toBe(false);
    });
  });

  describe('Coinbase detection', () => {
    it('should detect Coinbase when isCoinbaseWallet is true', () => {
      (window as any).ethereum = {
        isCoinbaseWallet: true,
        request: vi.fn(),
      };
      expect(checkWalletInstalled('coinbase')).toBe(true);
    });

    it('should detect Coinbase in providers array', () => {
      (window as any).ethereum = {
        providers: [
          { isMetaMask: true },
          { isCoinbaseWallet: true },
        ],
        request: vi.fn(),
      };
      expect(checkWalletInstalled('coinbase')).toBe(true);
    });
  });

  describe('Brave detection', () => {
    it('should detect Brave when isBraveWallet is true', () => {
      (window as any).ethereum = {
        isBraveWallet: true,
        request: vi.fn(),
      };
      expect(checkWalletInstalled('brave')).toBe(true);
    });

    it('should detect Brave in providers array', () => {
      (window as any).ethereum = {
        providers: [
          { isMetaMask: true },
          { isBraveWallet: true },
        ],
        request: vi.fn(),
      };
      expect(checkWalletInstalled('brave')).toBe(true);
    });
  });
});

describe('detectWallets', () => {
  beforeEach(() => {
    (window as any).ethereum = undefined;
    (window as any).phantom = undefined;
    (window as any).zerionWallet = undefined;
  });

  it('should return empty array when no wallets are detected', () => {
    expect(detectWallets()).toEqual([]);
  });

  it('should return all detected wallets', () => {
    (window as any).ethereum = {
      isMetaMask: true,
      request: vi.fn(),
    };
    (window as any).phantom = {
      ethereum: { request: vi.fn() },
    };
    
    const detected = detectWallets();
    expect(detected).toContain('metamask');
    expect(detected).toContain('phantom');
  });

  it('should detect multiple wallets from providers array', () => {
    (window as any).ethereum = {
      providers: [
        { isMetaMask: true, request: vi.fn() },
        { isRabby: true, request: vi.fn() },
        { isCoinbaseWallet: true, request: vi.fn() },
      ],
    };
    
    const detected = detectWallets();
    expect(detected).toContain('metamask');
    expect(detected).toContain('rabby');
    expect(detected).toContain('coinbase');
  });
});

describe('useWalletDetection hook', () => {
  beforeEach(() => {
    (window as any).ethereum = undefined;
    (window as any).phantom = undefined;
    (window as any).zerionWallet = undefined;
  });

  it('should return isReady as true after mount', () => {
    const { result } = renderHook(() => useWalletDetection());
    expect(result.current.isReady).toBe(true);
  });

  it('should return empty detectedWallets when no wallets installed', () => {
    const { result } = renderHook(() => useWalletDetection());
    expect(result.current.detectedWallets).toEqual([]);
  });

  it('should detect installed wallets', () => {
    (window as any).ethereum = {
      isMetaMask: true,
      request: vi.fn(),
    };
    
    const { result } = renderHook(() => useWalletDetection());
    expect(result.current.detectedWallets).toContain('metamask');
  });

  it('should provide isInstalled helper function', () => {
    (window as any).ethereum = {
      isMetaMask: true,
      request: vi.fn(),
    };
    
    const { result } = renderHook(() => useWalletDetection());
    expect(result.current.isInstalled('metamask')).toBe(true);
    expect(result.current.isInstalled('rabby')).toBe(false);
  });
});
