/**
 * Sign in with Ethos SDK - Session Storage
 * 
 * Storage adapters for persisting session data.
 * Supports localStorage (browser) and memory (SSR/testing).
 * 
 * @module session/storage
 */

import { STORAGE_KEYS } from '../constants';
import type { SessionStorage, SessionState, EthosUser } from '../types';

/**
 * In-memory storage adapter
 * 
 * Use for SSR environments or testing where localStorage is not available.
 */
export class MemoryStorage implements SessionStorage {
  private store = new Map<string, string>();

  get(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.store.set(key, value);
  }

  remove(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * localStorage adapter for browser environments
 */
export class BrowserStorage implements SessionStorage {
  private prefix: string;

  constructor(prefix: string = 'ethos_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(this.getKey(key));
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getKey(key), value);
    } catch {
      // localStorage might be full or disabled
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.getKey(key));
    } catch {
      // Ignore errors
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      // Only clear keys with our prefix
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Serialize session state to storage
 */
export function serializeSession(state: SessionState): Record<string, string> {
  const data: Record<string, string> = {};
  
  if (state.accessToken) {
    data[STORAGE_KEYS.ACCESS_TOKEN] = state.accessToken;
  }
  if (state.refreshToken) {
    data[STORAGE_KEYS.REFRESH_TOKEN] = state.refreshToken;
  }
  if (state.user) {
    data[STORAGE_KEYS.USER] = JSON.stringify(state.user);
  }
  if (state.expiresAt) {
    data[STORAGE_KEYS.EXPIRES_AT] = state.expiresAt.toString();
  }
  
  return data;
}

/**
 * Deserialize session state from storage
 */
export function deserializeSession(storage: SessionStorage): SessionState {
  const accessToken = storage.get(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = storage.get(STORAGE_KEYS.REFRESH_TOKEN);
  const userJson = storage.get(STORAGE_KEYS.USER);
  const expiresAtStr = storage.get(STORAGE_KEYS.EXPIRES_AT);
  
  let user: EthosUser | null = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson) as EthosUser;
    } catch {
      user = null;
    }
  }
  
  const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null;
  const isAuthenticated = !!accessToken && !!user && (!expiresAt || expiresAt > Date.now());
  
  return {
    isAuthenticated,
    user,
    accessToken,
    expiresAt,
    refreshToken,
  };
}

/**
 * Save session state to storage
 */
export function saveSession(storage: SessionStorage, state: SessionState): void {
  const data = serializeSession(state);
  Object.entries(data).forEach(([key, value]) => {
    storage.set(key, value);
  });
}

/**
 * Clear session from storage
 */
export function clearSession(storage: SessionStorage): void {
  storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
  storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
  storage.remove(STORAGE_KEYS.USER);
  storage.remove(STORAGE_KEYS.EXPIRES_AT);
}

/**
 * Create a storage adapter based on environment
 */
export function createStorage(options?: { 
  type?: 'browser' | 'memory';
  prefix?: string;
}): SessionStorage {
  const type = options?.type ?? (typeof window !== 'undefined' ? 'browser' : 'memory');
  
  if (type === 'memory') {
    return new MemoryStorage();
  }
  
  return new BrowserStorage(options?.prefix);
}
