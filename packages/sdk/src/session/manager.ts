/**
 * Sign in with Ethos SDK - Session Manager
 * 
 * Manages authentication session state with automatic token refresh.
 * 
 * @module session/manager
 */

import { ENDPOINTS } from '../constants';
import { EthosAuthError } from '../errors';
import type { 
  SessionState, 
  SessionStorage, 
  AuthResult, 
  EthosUser,
  AuthStateChangeCallback,
  EthosAuthConfig,
} from '../types';
import { 
  createStorage, 
  saveSession, 
  clearSession, 
  deserializeSession,
} from './storage';

/**
 * Session manager configuration
 */
export interface SessionManagerConfig extends EthosAuthConfig {
  /** Storage adapter (defaults to localStorage in browser, memory in SSR) */
  storage?: SessionStorage;
  /** Auto-refresh tokens before expiry (default: true) */
  autoRefresh?: boolean;
  /** Seconds before expiry to trigger refresh (default: 60) */
  refreshThreshold?: number;
  /** Storage key prefix (default: 'ethos_') */
  storagePrefix?: string;
}

/**
 * Session Manager
 * 
 * Handles session persistence, state management, and automatic token refresh.
 * 
 * @example
 * ```ts
 * const session = SessionManager.create({ 
 *   authServerUrl: 'https://ethos.thebbz.xyz',
 *   autoRefresh: true 
 * });
 * 
 * // Listen for auth state changes
 * session.onAuthStateChange((state) => {
 *   if (state.isAuthenticated) {
 *     console.log('User logged in:', state.user?.name);
 *   } else {
 *     console.log('User logged out');
 *   }
 * });
 * 
 * // After successful auth
 * session.setSession(authResult);
 * 
 * // Check current state
 * if (session.isAuthenticated()) {
 *   const user = session.getUser();
 * }
 * 
 * // Logout
 * session.logout();
 * ```
 */
export class SessionManager {
  private storage: SessionStorage;
  private config: Required<Omit<SessionManagerConfig, 'minScore' | 'storage'>> & { 
    minScore?: number;
    storage: SessionStorage;
  };
  private listeners: Set<AuthStateChangeCallback> = new Set();
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private currentState: SessionState;

  private constructor(config: SessionManagerConfig) {
    this.storage = config.storage ?? createStorage({ prefix: config.storagePrefix });
    this.config = {
      authServerUrl: config.authServerUrl ?? 'https://ethos.thebbz.xyz',
      autoRefresh: config.autoRefresh ?? true,
      refreshThreshold: config.refreshThreshold ?? 60,
      storagePrefix: config.storagePrefix ?? 'ethos_',
      minScore: config.minScore,
      storage: this.storage,
    };
    
    // Initialize state from storage
    this.currentState = deserializeSession(this.storage);
    
    // Start auto-refresh if authenticated
    if (this.currentState.isAuthenticated && this.config.autoRefresh) {
      this.scheduleRefresh();
    }
  }

  /**
   * Create a new session manager
   */
  static create(config: SessionManagerConfig = {}): SessionManager {
    return new SessionManager(config);
  }

  // --------------------------------------------------------------------------
  // State Accessors
  // --------------------------------------------------------------------------

  /**
   * Get current session state
   */
  getSession(): SessionState {
    return { ...this.currentState };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentState.isAuthenticated;
  }

  /**
   * Get current user (or null if not authenticated)
   */
  getUser(): EthosUser | null {
    return this.currentState.user;
  }

  /**
   * Get current access token (or null if not authenticated)
   */
  getAccessToken(): string | null {
    return this.currentState.accessToken;
  }

  /**
   * Check if token is expired or about to expire
   */
  isTokenExpired(thresholdSeconds: number = 0): boolean {
    if (!this.currentState.expiresAt) return true;
    return Date.now() >= this.currentState.expiresAt - (thresholdSeconds * 1000);
  }

  // --------------------------------------------------------------------------
  // Session Management
  // --------------------------------------------------------------------------

  /**
   * Set session from auth result
   * 
   * @param result - Authentication result from login
   */
  setSession(result: AuthResult): void {
    const expiresAt = Date.now() + (result.expiresIn * 1000);
    
    this.currentState = {
      isAuthenticated: true,
      user: result.user,
      accessToken: result.accessToken,
      expiresAt,
      refreshToken: result.refreshToken ?? null,
    };
    
    saveSession(this.storage, this.currentState);
    this.notifyListeners();
    
    if (this.config.autoRefresh) {
      this.scheduleRefresh();
    }
  }

  /**
   * Update user data without changing tokens
   */
  updateUser(user: Partial<EthosUser>): void {
    if (!this.currentState.user) return;
    
    this.currentState = {
      ...this.currentState,
      user: { ...this.currentState.user, ...user },
    };
    
    saveSession(this.storage, this.currentState);
    this.notifyListeners();
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    this.cancelRefresh();
    clearSession(this.storage);
    
    this.currentState = {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      expiresAt: null,
      refreshToken: null,
    };
    
    this.notifyListeners();
  }

  // --------------------------------------------------------------------------
  // Token Refresh
  // --------------------------------------------------------------------------

  /**
   * Refresh the access token using refresh token
   * 
   * @returns New auth result or throws on failure
   */
  async refreshToken(): Promise<AuthResult> {
    if (!this.currentState.refreshToken) {
      throw new EthosAuthError(
        'No refresh token available',
        'no_refresh_token'
      );
    }

    const url = new URL(ENDPOINTS.TOKEN_REFRESH, this.config.authServerUrl);
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: this.currentState.refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      // If refresh fails, logout
      this.logout();
      throw EthosAuthError.fromResponse(error, 'refresh_token_error');
    }

    const data = await response.json();
    const result: AuthResult = {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      user: this.currentState.user!, // Keep existing user
      refreshToken: data.refresh_token ?? this.currentState.refreshToken,
    };

    this.setSession(result);
    return result;
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleRefresh(): void {
    this.cancelRefresh();
    
    if (!this.currentState.expiresAt || !this.currentState.refreshToken) {
      return;
    }

    const refreshAt = this.currentState.expiresAt - (this.config.refreshThreshold * 1000);
    const delay = Math.max(0, refreshAt - Date.now());

    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('[SessionManager] Auto-refresh failed:', error);
        // Logout is already handled in refreshToken on failure
      }
    }, delay);
  }

  /**
   * Cancel scheduled refresh
   */
  private cancelRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // --------------------------------------------------------------------------
  // Event Listeners
  // --------------------------------------------------------------------------

  /**
   * Subscribe to auth state changes
   * 
   * @param callback - Function called when auth state changes
   * @returns Unsubscribe function
   */
  onAuthStateChange(callback: AuthStateChangeCallback): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current state (wrapped in try-catch)
    try {
      callback(this.getSession());
    } catch (error) {
      console.error('[SessionManager] Listener error on subscribe:', error);
    }
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getSession();
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('[SessionManager] Listener error:', error);
      }
    });
  }

  // --------------------------------------------------------------------------
  // Cleanup
  // --------------------------------------------------------------------------

  /**
   * Destroy the session manager and cleanup resources
   */
  destroy(): void {
    this.cancelRefresh();
    this.listeners.clear();
  }
}
