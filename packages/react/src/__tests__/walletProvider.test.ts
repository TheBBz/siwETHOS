/**
 * Tests for walletProvider utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getWalletProvider, connectWallet, signMessage } from '../utils/walletProvider';
import type { EthereumProvider } from '../globals.d';

describe('walletProvider utilities', () => {
  beforeEach(() => {
    // Reset window.ethereum before each test
    vi.stubGlobal('window', {
      ethereum: undefined,
      phantom: undefined,
      zerionWallet: undefined,
    });
  });

  describe('getWalletProvider', () => {
    describe('when window is undefined (SSR)', () => {
      it('returns null', () => {
        const originalWindow = global.window;
        // @ts-expect-error - testing SSR
        delete global.window;
        
        expect(getWalletProvider('metamask')).toBeNull();
        
        global.window = originalWindow;
      });
    });

    describe('MetaMask detection', () => {
      it('returns MetaMask from providers array', () => {
        const metamaskProvider = { 
          isMetaMask: true, 
          isRabby: false, 
          isBraveWallet: false,
          request: vi.fn() 
        };
        
        vi.stubGlobal('window', {
          ethereum: {
            providers: [metamaskProvider],
          },
        });

        const result = getWalletProvider('metamask');
        expect(result).toBe(metamaskProvider);
      });

      it('returns MetaMask from direct ethereum object', () => {
        const ethereum = { 
          isMetaMask: true, 
          isRabby: false, 
          isBraveWallet: false,
          request: vi.fn() 
        };
        
        vi.stubGlobal('window', { ethereum });

        const result = getWalletProvider('metamask');
        expect(result).toBe(ethereum);
      });

      it('excludes Rabby from MetaMask detection', () => {
        const rabbyProvider = { 
          isMetaMask: true, 
          isRabby: true, 
          request: vi.fn() 
        };
        
        vi.stubGlobal('window', {
          ethereum: {
            providers: [rabbyProvider],
          },
        });

        expect(getWalletProvider('metamask')).toBeNull();
      });

      it('excludes Brave from MetaMask detection', () => {
        const braveProvider = { 
          isMetaMask: true, 
          isBraveWallet: true, 
          request: vi.fn() 
        };
        
        vi.stubGlobal('window', {
          ethereum: {
            providers: [braveProvider],
          },
        });

        expect(getWalletProvider('metamask')).toBeNull();
      });

      it('returns null when MetaMask not found', () => {
        vi.stubGlobal('window', {
          ethereum: {
            isMetaMask: false,
          },
        });

        expect(getWalletProvider('metamask')).toBeNull();
      });
    });

    describe('Rabby detection', () => {
      it('returns Rabby from providers array', () => {
        const rabbyProvider = { isRabby: true, request: vi.fn() };
        
        vi.stubGlobal('window', {
          ethereum: {
            providers: [rabbyProvider],
          },
        });

        expect(getWalletProvider('rabby')).toBe(rabbyProvider);
      });

      it('returns Rabby from direct ethereum object', () => {
        const ethereum = { isRabby: true, request: vi.fn() };
        vi.stubGlobal('window', { ethereum });

        expect(getWalletProvider('rabby')).toBe(ethereum);
      });

      it('returns null when Rabby not found', () => {
        vi.stubGlobal('window', {
          ethereum: { isRabby: false },
        });

        expect(getWalletProvider('rabby')).toBeNull();
      });
    });

    describe('Phantom detection', () => {
      it('returns Phantom ethereum provider', () => {
        const phantomProvider = { request: vi.fn() };
        
        vi.stubGlobal('window', {
          phantom: {
            ethereum: phantomProvider,
          },
        });

        expect(getWalletProvider('phantom')).toBe(phantomProvider);
      });

      it('returns null when Phantom not installed', () => {
        vi.stubGlobal('window', {
          phantom: undefined,
        });

        expect(getWalletProvider('phantom')).toBeNull();
      });
    });

    describe('Zerion detection', () => {
      it('returns Zerion provider', () => {
        const zerionProvider = { request: vi.fn() };
        
        vi.stubGlobal('window', {
          zerionWallet: zerionProvider,
        });

        expect(getWalletProvider('zerion')).toBe(zerionProvider);
      });

      it('returns null when Zerion not installed', () => {
        vi.stubGlobal('window', {
          zerionWallet: undefined,
        });

        expect(getWalletProvider('zerion')).toBeNull();
      });
    });

    describe('Coinbase detection', () => {
      it('returns Coinbase from providers array', () => {
        const coinbaseProvider = { isCoinbaseWallet: true, request: vi.fn() };
        
        vi.stubGlobal('window', {
          ethereum: {
            providers: [coinbaseProvider],
          },
        });

        expect(getWalletProvider('coinbase')).toBe(coinbaseProvider);
      });

      it('returns Coinbase from direct ethereum object', () => {
        const ethereum = { isCoinbaseWallet: true, request: vi.fn() };
        vi.stubGlobal('window', { ethereum });

        expect(getWalletProvider('coinbase')).toBe(ethereum);
      });

      it('returns null when Coinbase not found', () => {
        vi.stubGlobal('window', {
          ethereum: { isCoinbaseWallet: false },
        });

        expect(getWalletProvider('coinbase')).toBeNull();
      });
    });

    describe('Brave detection', () => {
      it('returns Brave from providers array', () => {
        const braveProvider = { isBraveWallet: true, request: vi.fn() };
        
        vi.stubGlobal('window', {
          ethereum: {
            providers: [braveProvider],
          },
        });

        expect(getWalletProvider('brave')).toBe(braveProvider);
      });

      it('returns Brave from direct ethereum object', () => {
        const ethereum = { isBraveWallet: true, request: vi.fn() };
        vi.stubGlobal('window', { ethereum });

        expect(getWalletProvider('brave')).toBe(ethereum);
      });

      it('returns null when Brave not found', () => {
        vi.stubGlobal('window', {
          ethereum: { isBraveWallet: false },
        });

        expect(getWalletProvider('brave')).toBeNull();
      });
    });

    describe('unknown wallet', () => {
      it('returns null for unknown wallet id', () => {
        vi.stubGlobal('window', {
          ethereum: { request: vi.fn() },
        });

        // @ts-expect-error - testing unknown wallet
        expect(getWalletProvider('unknown-wallet')).toBeNull();
      });
    });

    describe('multi-wallet environment', () => {
      it('correctly identifies wallets in multi-wallet setup', () => {
        const metamaskProvider = { 
          isMetaMask: true, 
          isRabby: false, 
          isBraveWallet: false,
          request: vi.fn() 
        };
        const rabbyProvider = { isRabby: true, request: vi.fn() };
        const coinbaseProvider = { isCoinbaseWallet: true, request: vi.fn() };
        
        vi.stubGlobal('window', {
          ethereum: {
            providers: [metamaskProvider, rabbyProvider, coinbaseProvider],
          },
        });

        expect(getWalletProvider('metamask')).toBe(metamaskProvider);
        expect(getWalletProvider('rabby')).toBe(rabbyProvider);
        expect(getWalletProvider('coinbase')).toBe(coinbaseProvider);
      });
    });
  });

  describe('connectWallet', () => {
    it('returns the first account address', async () => {
      const mockProvider = {
        request: vi.fn().mockResolvedValue(['0x1234567890abcdef']),
      } as unknown as EthereumProvider;

      const result = await connectWallet(mockProvider);
      
      expect(mockProvider.request).toHaveBeenCalledWith({ 
        method: 'eth_requestAccounts' 
      });
      expect(result).toBe('0x1234567890abcdef');
    });

    it('throws error when no accounts returned', async () => {
      const mockProvider = {
        request: vi.fn().mockResolvedValue([]),
      } as unknown as EthereumProvider;

      await expect(connectWallet(mockProvider))
        .rejects.toThrow('No accounts returned from wallet');
    });

    it('throws error when accounts is null', async () => {
      const mockProvider = {
        request: vi.fn().mockResolvedValue(null),
      } as unknown as EthereumProvider;

      await expect(connectWallet(mockProvider))
        .rejects.toThrow('No accounts returned from wallet');
    });

    it('propagates provider errors', async () => {
      const mockProvider = {
        request: vi.fn().mockRejectedValue(new Error('User rejected')),
      } as unknown as EthereumProvider;

      await expect(connectWallet(mockProvider))
        .rejects.toThrow('User rejected');
    });
  });

  describe('signMessage', () => {
    it('signs message with personal_sign', async () => {
      const mockProvider = {
        request: vi.fn().mockResolvedValue('0xsignature'),
      } as unknown as EthereumProvider;

      const result = await signMessage(
        mockProvider,
        '0xaddress',
        'Hello World'
      );
      
      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'personal_sign',
        params: ['Hello World', '0xaddress'],
      });
      expect(result).toBe('0xsignature');
    });

    it('propagates signing errors', async () => {
      const mockProvider = {
        request: vi.fn().mockRejectedValue(new Error('User denied signing')),
      } as unknown as EthereumProvider;

      await expect(signMessage(mockProvider, '0xaddr', 'msg'))
        .rejects.toThrow('User denied signing');
    });
  });
});
