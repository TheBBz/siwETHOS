/**
 * Session Management Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  SessionManager,
  MemoryStorage,
  BrowserStorage,
  createStorage,
  saveSession,
  clearSession,
  deserializeSession,
  serializeSession,
} from '../session';
import { STORAGE_KEYS } from '../constants';
import type { SessionState, AuthResult, EthosUser } from '../types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock user
const mockUser: EthosUser = {
  sub: 'ethos:12345',
  name: 'Test User',
  picture: 'https://example.com/pic.jpg',
  ethosProfileId: 12345,
  ethosUsername: 'testuser',
  ethosScore: 750,
  ethosStatus: 'active',
  ethosAttestations: ['twitter', 'discord'],
  authMethod: 'wallet',
  walletAddress: '0x1234567890123456789012345678901234567890',
};

// Mock auth result
const mockAuthResult: AuthResult = {
  accessToken: 'test-access-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
  user: mockUser,
  refreshToken: 'test-refresh-token',
};

describe('MemoryStorage', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('should store and retrieve values', () => {
    storage.set('key', 'value');
    expect(storage.get('key')).toBe('value');
  });

  it('should return null for non-existent keys', () => {
    expect(storage.get('nonexistent')).toBeNull();
  });

  it('should remove values', () => {
    storage.set('key', 'value');
    storage.remove('key');
    expect(storage.get('key')).toBeNull();
  });

  it('should clear all values', () => {
    storage.set('key1', 'value1');
    storage.set('key2', 'value2');
    storage.clear();
    expect(storage.get('key1')).toBeNull();
    expect(storage.get('key2')).toBeNull();
  });
});

describe('BrowserStorage', () => {
  let storage: BrowserStorage;
  let mockStore: Record<string, string>;

  beforeEach(() => {
    mockStore = {};
    
    // Mock window and localStorage
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem(key: string) {
        return mockStore[key] ?? null;
      },
      setItem(key: string, value: string) {
        mockStore[key] = value;
      },
      removeItem(key: string) {
        delete mockStore[key];
      },
      key(index: number) {
        return Object.keys(mockStore)[index] ?? null;
      },
      get length() {
        return Object.keys(mockStore).length;
      },
      clear() {
        mockStore = {};
      },
    });
    
    storage = new BrowserStorage('test_');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should store values with prefix', () => {
    storage.set('key', 'value');
    expect(localStorage.getItem('test_key')).toBe('value');
  });

  it('should retrieve values with prefix', () => {
    localStorage.setItem('test_key', 'value');
    expect(storage.get('key')).toBe('value');
  });

  it('should remove values with prefix', () => {
    localStorage.setItem('test_key', 'value');
    storage.remove('key');
    expect(localStorage.getItem('test_key')).toBeNull();
  });

  it('should handle localStorage errors gracefully', () => {
    // Create a storage that will throw
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('localStorage disabled');
      },
      setItem() {
        throw new Error('localStorage disabled');
      },
      removeItem() {
        throw new Error('localStorage disabled');
      },
    });
    
    const errorStorage = new BrowserStorage();
    expect(errorStorage.get('key')).toBeNull();
    expect(() => errorStorage.set('key', 'value')).not.toThrow();
    expect(() => errorStorage.remove('key')).not.toThrow();
  });
});

describe('createStorage', () => {
  it('should create MemoryStorage when type is memory', () => {
    const storage = createStorage({ type: 'memory' });
    expect(storage).toBeInstanceOf(MemoryStorage);
  });

  it('should create BrowserStorage when type is browser', () => {
    // Mock window
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      key: vi.fn(),
      length: 0,
    });
    
    const storage = createStorage({ type: 'browser' });
    expect(storage).toBeInstanceOf(BrowserStorage);
    
    vi.unstubAllGlobals();
  });

  it('should default to MemoryStorage in non-browser environment', () => {
    // Temporarily remove window
    const hasWindow = typeof window !== 'undefined';
    if (hasWindow) {
      vi.stubGlobal('window', undefined);
    }
    
    const storage = createStorage();
    expect(storage).toBeInstanceOf(MemoryStorage);
    
    if (hasWindow) {
      vi.unstubAllGlobals();
    }
  });
});

describe('serializeSession / deserializeSession', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('should serialize session state to storage format', () => {
    const state: SessionState = {
      isAuthenticated: true,
      user: mockUser,
      accessToken: 'token123',
      expiresAt: 1234567890,
      refreshToken: 'refresh123',
    };

    const serialized = serializeSession(state);
    
    expect(serialized[STORAGE_KEYS.ACCESS_TOKEN]).toBe('token123');
    expect(serialized[STORAGE_KEYS.REFRESH_TOKEN]).toBe('refresh123');
    expect(serialized[STORAGE_KEYS.EXPIRES_AT]).toBe('1234567890');
    expect(JSON.parse(serialized[STORAGE_KEYS.USER])).toEqual(mockUser);
  });

  it('should deserialize session state from storage', () => {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, 'token123');
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, 'refresh123');
    storage.set(STORAGE_KEYS.USER, JSON.stringify(mockUser));
    storage.set(STORAGE_KEYS.EXPIRES_AT, (Date.now() + 3600000).toString());

    const state = deserializeSession(storage);
    
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('token123');
    expect(state.refreshToken).toBe('refresh123');
    expect(state.user).toEqual(mockUser);
  });

  it('should return unauthenticated state when token expired', () => {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, 'token123');
    storage.set(STORAGE_KEYS.USER, JSON.stringify(mockUser));
    storage.set(STORAGE_KEYS.EXPIRES_AT, (Date.now() - 1000).toString()); // Expired

    const state = deserializeSession(storage);
    
    expect(state.isAuthenticated).toBe(false);
  });

  it('should return unauthenticated state when no token', () => {
    const state = deserializeSession(storage);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});

describe('saveSession / clearSession', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('should save session to storage', () => {
    const state: SessionState = {
      isAuthenticated: true,
      user: mockUser,
      accessToken: 'token123',
      expiresAt: 1234567890,
      refreshToken: 'refresh123',
    };

    saveSession(storage, state);
    
    expect(storage.get(STORAGE_KEYS.ACCESS_TOKEN)).toBe('token123');
    expect(storage.get(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh123');
  });

  it('should clear session from storage', () => {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, 'token123');
    storage.set(STORAGE_KEYS.USER, JSON.stringify(mockUser));
    
    clearSession(storage);
    
    expect(storage.get(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(storage.get(STORAGE_KEYS.USER)).toBeNull();
  });
});

describe('SessionManager', () => {
  let session: SessionManager;
  let storage: MemoryStorage;

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
    storage = new MemoryStorage();
    session = SessionManager.create({
      storage,
      authServerUrl: 'https://test.example.com',
      autoRefresh: false,
    });
  });

  afterEach(() => {
    session.destroy();
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should start with unauthenticated state', () => {
      expect(session.isAuthenticated()).toBe(false);
      expect(session.getUser()).toBeNull();
      expect(session.getAccessToken()).toBeNull();
    });

    it('should restore session from storage', () => {
      // Pre-populate storage
      storage.set(STORAGE_KEYS.ACCESS_TOKEN, 'existing-token');
      storage.set(STORAGE_KEYS.USER, JSON.stringify(mockUser));
      storage.set(STORAGE_KEYS.EXPIRES_AT, (Date.now() + 3600000).toString());
      
      // Create new session manager
      const restoredSession = SessionManager.create({
        storage,
        autoRefresh: false,
      });
      
      expect(restoredSession.isAuthenticated()).toBe(true);
      expect(restoredSession.getUser()).toEqual(mockUser);
      expect(restoredSession.getAccessToken()).toBe('existing-token');
      
      restoredSession.destroy();
    });
  });

  describe('setSession', () => {
    it('should set session from auth result', () => {
      session.setSession(mockAuthResult);
      
      expect(session.isAuthenticated()).toBe(true);
      expect(session.getUser()).toEqual(mockUser);
      expect(session.getAccessToken()).toBe('test-access-token');
    });

    it('should persist session to storage', () => {
      session.setSession(mockAuthResult);
      
      expect(storage.get(STORAGE_KEYS.ACCESS_TOKEN)).toBe('test-access-token');
      expect(storage.get(STORAGE_KEYS.REFRESH_TOKEN)).toBe('test-refresh-token');
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      session.onAuthStateChange(listener);
      
      // First call is immediate with initial state
      expect(listener).toHaveBeenCalledTimes(1);
      
      session.setSession(mockAuthResult);
      
      // Second call after setSession
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({
        isAuthenticated: true,
        user: mockUser,
      }));
    });
  });

  describe('updateUser', () => {
    it('should update user data', () => {
      session.setSession(mockAuthResult);
      session.updateUser({ ethosScore: 800 });
      
      expect(session.getUser()?.ethosScore).toBe(800);
    });

    it('should not update if not authenticated', () => {
      session.updateUser({ ethosScore: 800 });
      expect(session.getUser()).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear session', () => {
      session.setSession(mockAuthResult);
      session.logout();
      
      expect(session.isAuthenticated()).toBe(false);
      expect(session.getUser()).toBeNull();
      expect(session.getAccessToken()).toBeNull();
    });

    it('should clear storage', () => {
      session.setSession(mockAuthResult);
      session.logout();
      
      expect(storage.get(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
      expect(storage.get(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
    });

    it('should notify listeners', () => {
      session.setSession(mockAuthResult);
      
      const listener = vi.fn();
      session.onAuthStateChange(listener);
      
      session.logout();
      
      expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({
        isAuthenticated: false,
        user: null,
      }));
    });
  });

  describe('isTokenExpired', () => {
    it('should return true when no expiry set', () => {
      expect(session.isTokenExpired()).toBe(true);
    });

    it('should return false when token is valid', () => {
      session.setSession(mockAuthResult);
      expect(session.isTokenExpired()).toBe(false);
    });

    it('should return true when token expired', () => {
      session.setSession(mockAuthResult);
      // Advance time past expiry
      vi.advanceTimersByTime(4000 * 1000);
      expect(session.isTokenExpired()).toBe(true);
    });

    it('should respect threshold parameter', () => {
      session.setSession({ ...mockAuthResult, expiresIn: 100 });
      expect(session.isTokenExpired(50)).toBe(false);
      expect(session.isTokenExpired(150)).toBe(true);
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      session.setSession(mockAuthResult);
    });

    it('should refresh token successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-access-token',
          token_type: 'Bearer',
          expires_in: 7200,
          refresh_token: 'new-refresh-token',
        }),
      });

      const result = await session.refreshToken();
      
      expect(result.accessToken).toBe('new-access-token');
      expect(session.getAccessToken()).toBe('new-access-token');
    });

    it('should throw and logout on refresh failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'invalid_grant',
          error_description: 'Refresh token expired',
        }),
      });

      await expect(session.refreshToken()).rejects.toThrow('Refresh token expired');
      expect(session.isAuthenticated()).toBe(false);
    });

    it('should throw when no refresh token', async () => {
      session.setSession({ ...mockAuthResult, refreshToken: undefined });
      
      await expect(session.refreshToken()).rejects.toThrow('No refresh token available');
    });
  });

  describe('onAuthStateChange', () => {
    it('should call listener immediately with current state', () => {
      const listener = vi.fn();
      session.onAuthStateChange(listener);
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        isAuthenticated: false,
      }));
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = session.onAuthStateChange(listener);
      
      listener.mockClear();
      unsubscribe();
      
      session.setSession(mockAuthResult);
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      // First set session before adding error listener
      session.setSession(mockAuthResult);
      
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();
      
      // Add listeners - errorListener will throw on initial call
      try {
        session.onAuthStateChange(errorListener);
      } catch {
        // Expected to throw on initial call
      }
      session.onAuthStateChange(goodListener);
      
      // Clear and trigger a state change
      goodListener.mockClear();
      
      // This should not throw even though errorListener throws
      expect(() => session.logout()).not.toThrow();
      
      // Good listener should still be called
      expect(goodListener).toHaveBeenCalled();
    });
  });

  describe('auto-refresh', () => {
    it('should schedule refresh when autoRefresh is enabled', async () => {
      const autoRefreshSession = SessionManager.create({
        storage,
        autoRefresh: true,
        refreshThreshold: 60,
      });

      // Set up fetch mock to return success ONCE then fail
      let refreshCount = 0;
      mockFetch.mockImplementation(() => {
        refreshCount++;
        if (refreshCount > 1) {
          // After first refresh, return expired/invalid to stop the loop
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'invalid_grant' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'refreshed-token',
            token_type: 'Bearer',
            expires_in: 3600,
            // No refresh token to prevent rescheduling
          }),
        });
      });

      autoRefreshSession.setSession({
        ...mockAuthResult,
        expiresIn: 120, // 2 minutes
      });

      // Advance to just before refresh threshold (120 - 60 = 60 seconds)
      vi.advanceTimersByTime(55 * 1000);
      expect(mockFetch).not.toHaveBeenCalled();

      // Advance past refresh threshold
      vi.advanceTimersByTime(10 * 1000);
      
      // Let the setTimeout execute
      await vi.advanceTimersByTimeAsync(1);
      
      expect(mockFetch).toHaveBeenCalled();
      
      autoRefreshSession.destroy();
    });
  });

  describe('destroy', () => {
    it('should cleanup resources', () => {
      const listener = vi.fn();
      session.onAuthStateChange(listener);
      
      listener.mockClear();
      session.destroy();
      
      // Listeners should be cleared (no way to verify directly, but destroy should not throw)
      expect(() => session.destroy()).not.toThrow();
    });
  });
});
