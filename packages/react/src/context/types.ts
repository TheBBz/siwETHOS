/**
 * Sign in with Ethos - React Context Types
 * 
 * @module context/types
 */

import type { 
  SessionState, 
  EthosUser, 
  AuthResult,
  SessionManagerConfig,
} from '@thebbz/siwe-ethos';

/**
 * Ethos Auth Context value
 */
export interface EthosAuthContextValue {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether session is loading from storage */
  isLoading: boolean;
  /** Current user (null if not authenticated) */
  user: EthosUser | null;
  /** Current access token (null if not authenticated) */
  accessToken: string | null;
  /** Login with auth result */
  login: (result: AuthResult) => void;
  /** Logout and clear session */
  logout: () => void;
  /** Refresh the access token */
  refreshToken: () => Promise<AuthResult>;
  /** Update user data */
  updateUser: (user: Partial<EthosUser>) => void;
  /** Get full session state */
  getSession: () => SessionState;
}

/**
 * Ethos Auth Provider props
 */
export interface EthosAuthProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Session manager configuration */
  config?: Omit<SessionManagerConfig, 'storage'>;
  /** Storage type ('browser' or 'memory') */
  storageType?: 'browser' | 'memory';
  /** Storage key prefix */
  storagePrefix?: string;
  /** Called when auth state changes */
  onAuthStateChange?: (state: SessionState) => void;
}

/**
 * Score tier information
 */
export interface ScoreTierInfo {
  /** Tier name */
  tier: 'untrusted' | 'neutral' | 'trusted' | 'highly-trusted' | 'exemplary';
  /** Minimum score for this tier */
  minScore: number;
  /** Maximum score for this tier */
  maxScore: number;
  /** Tier color */
  color: string;
}
