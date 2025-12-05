/**
 * useRecentLogins Hook Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecentLogins } from '../hooks/useRecentLogins';
import type { RecentLogin } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});

const STORAGE_KEY = 'ethos_recent_logins';

describe('useRecentLogins', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return empty array when localStorage is empty', () => {
      const { result } = renderHook(() => useRecentLogins());
      expect(result.current.recentLogins).toEqual([]);
    });

    it('should load existing logins from localStorage', () => {
      const existingLogins: RecentLogin[] = [
        { type: 'wallet', id: 'metamask', lastUsed: Date.now() - 1000, name: 'MetaMask' },
        { type: 'social', id: 'discord', lastUsed: Date.now() - 2000, name: 'Discord' },
      ];
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(existingLogins));

      const { result } = renderHook(() => useRecentLogins());
      
      // Should be sorted by lastUsed, most recent first
      expect(result.current.recentLogins).toHaveLength(2);
      expect(result.current.recentLogins[0].id).toBe('metamask');
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.setItem(STORAGE_KEY, 'invalid-json');

      const { result } = renderHook(() => useRecentLogins());
      expect(result.current.recentLogins).toEqual([]);
    });
  });

  describe('addRecentLogin', () => {
    it('should add a new login', () => {
      const { result } = renderHook(() => useRecentLogins());

      act(() => {
        result.current.addRecentLogin({
          type: 'wallet',
          id: 'metamask',
          name: 'MetaMask',
        });
      });

      expect(result.current.recentLogins).toHaveLength(1);
      expect(result.current.recentLogins[0].type).toBe('wallet');
      expect(result.current.recentLogins[0].id).toBe('metamask');
      expect(result.current.recentLogins[0].name).toBe('MetaMask');
      expect(result.current.recentLogins[0].lastUsed).toBeGreaterThan(0);
    });

    it('should update existing login and move to front', () => {
      const { result } = renderHook(() => useRecentLogins());

      act(() => {
        result.current.addRecentLogin({
          type: 'wallet',
          id: 'metamask',
          name: 'MetaMask',
        });
      });

      act(() => {
        result.current.addRecentLogin({
          type: 'social',
          id: 'discord',
          name: 'Discord',
        });
      });

      // Add metamask again - should move to front
      act(() => {
        result.current.addRecentLogin({
          type: 'wallet',
          id: 'metamask',
          name: 'MetaMask Updated',
        });
      });

      expect(result.current.recentLogins).toHaveLength(2);
      expect(result.current.recentLogins[0].id).toBe('metamask');
      expect(result.current.recentLogins[0].name).toBe('MetaMask Updated');
    });

    it('should limit to 5 recent logins', () => {
      const { result } = renderHook(() => useRecentLogins());

      // Add 7 different logins
      const ids = ['metamask', 'rabby', 'coinbase', 'phantom', 'zerion', 'discord', 'telegram'];
      
      for (const id of ids) {
        act(() => {
          result.current.addRecentLogin({
            type: 'wallet',
            id: id as RecentLogin['id'],
            name: id,
          });
        });
      }

      expect(result.current.recentLogins).toHaveLength(5);
      // Most recent (telegram) should be first
      expect(result.current.recentLogins[0].id).toBe('telegram');
      // Oldest ones should be removed
      expect(result.current.recentLogins.find(l => l.id === 'metamask')).toBeUndefined();
    });

    it('should persist to localStorage', () => {
      const { result } = renderHook(() => useRecentLogins());

      act(() => {
        result.current.addRecentLogin({
          type: 'wallet',
          id: 'metamask',
          name: 'MetaMask',
        });
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.any(String)
      );

      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved).toHaveLength(1);
      expect(saved[0].id).toBe('metamask');
    });
  });

  describe('clearRecentLogins', () => {
    it('should clear all logins', () => {
      const { result } = renderHook(() => useRecentLogins());

      act(() => {
        result.current.addRecentLogin({
          type: 'wallet',
          id: 'metamask',
          name: 'MetaMask',
        });
        result.current.addRecentLogin({
          type: 'social',
          id: 'discord',
          name: 'Discord',
        });
      });

      expect(result.current.recentLogins).toHaveLength(2);

      act(() => {
        result.current.clearRecentLogins();
      });

      expect(result.current.recentLogins).toEqual([]);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });
  });

  describe('getRecentLogin', () => {
    it('should find a specific login by type and id', () => {
      const { result } = renderHook(() => useRecentLogins());

      act(() => {
        result.current.addRecentLogin({
          type: 'wallet',
          id: 'metamask',
          name: 'MetaMask',
        });
        result.current.addRecentLogin({
          type: 'social',
          id: 'discord',
          name: 'Discord',
        });
      });

      const found = result.current.getRecentLogin('wallet', 'metamask');
      expect(found).toBeDefined();
      expect(found?.id).toBe('metamask');
    });

    it('should return undefined for non-existent login', () => {
      const { result } = renderHook(() => useRecentLogins());

      const found = result.current.getRecentLogin('wallet', 'metamask');
      expect(found).toBeUndefined();
    });
  });

  describe('sorting', () => {
    it('should sort by lastUsed, most recent first', () => {
      const now = Date.now();
      const existingLogins: RecentLogin[] = [
        { type: 'wallet', id: 'metamask', lastUsed: now - 3000, name: 'MetaMask' },
        { type: 'social', id: 'discord', lastUsed: now - 1000, name: 'Discord' },
        { type: 'wallet', id: 'coinbase', lastUsed: now - 2000, name: 'Coinbase' },
      ];
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(existingLogins));

      const { result } = renderHook(() => useRecentLogins());
      
      expect(result.current.recentLogins[0].id).toBe('discord');
      expect(result.current.recentLogins[1].id).toBe('coinbase');
      expect(result.current.recentLogins[2].id).toBe('metamask');
    });
  });
});
