/**
 * Sign in with Ethos - React Auth Provider
 * 
 * Provides authentication context to React components.
 * 
 * @module context/EthosAuthProvider
 */

'use client';

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { 
  SessionManager, 
  createStorage,
  type AuthResult,
  type SessionState,
  type EthosUser,
} from '@thebbz/siwe-ethos';
import type { EthosAuthContextValue, EthosAuthProviderProps } from './types';

/**
 * Auth context (internal)
 */
const EthosAuthContext = createContext<EthosAuthContextValue | null>(null);

/**
 * Ethos Auth Provider
 * 
 * Wraps your app to provide authentication state and methods.
 * 
 * @example
 * ```tsx
 * import { EthosAuthProvider } from '@thebbz/siwe-ethos-react';
 * 
 * function App() {
 *   return (
 *     <EthosAuthProvider 
 *       config={{ authServerUrl: 'https://ethos.thebbz.xyz' }}
 *       onAuthStateChange={(state) => console.log('Auth state:', state)}
 *     >
 *       <YourApp />
 *     </EthosAuthProvider>
 *   );
 * }
 * ```
 */
export function EthosAuthProvider({
  children,
  config = {},
  storageType,
  storagePrefix,
  onAuthStateChange,
}: EthosAuthProviderProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<SessionState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    expiresAt: null,
    refreshToken: null,
  });
  
  // Store session manager in ref to avoid re-creating
  const sessionRef = useRef<SessionManager | null>(null);
  
  // Initialize session manager
  useEffect(() => {
    const storage = createStorage({ 
      type: storageType, 
      prefix: storagePrefix,
    });
    
    const session = SessionManager.create({
      ...config,
      storage,
    });
    
    sessionRef.current = session;
    
    // Subscribe to state changes
    const unsubscribe = session.onAuthStateChange((newState) => {
      setState(newState);
      setIsLoading(false);
      onAuthStateChange?.(newState);
    });
    
    return () => {
      unsubscribe();
      session.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Login handler
  const login = useCallback((result: AuthResult) => {
    sessionRef.current?.setSession(result);
  }, []);
  
  // Logout handler
  const logout = useCallback(() => {
    sessionRef.current?.logout();
  }, []);
  
  // Refresh token handler
  const refreshToken = useCallback(async (): Promise<AuthResult> => {
    if (!sessionRef.current) {
      throw new Error('Session manager not initialized');
    }
    return sessionRef.current.refreshToken();
  }, []);
  
  // Update user handler
  const updateUser = useCallback((user: Partial<EthosUser>) => {
    sessionRef.current?.updateUser(user);
  }, []);
  
  // Get session handler
  const getSession = useCallback((): SessionState => {
    return sessionRef.current?.getSession() ?? {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      expiresAt: null,
      refreshToken: null,
    };
  }, []);
  
  // Memoize context value
  const contextValue = useMemo<EthosAuthContextValue>(() => ({
    isAuthenticated: state.isAuthenticated,
    isLoading,
    user: state.user,
    accessToken: state.accessToken,
    login,
    logout,
    refreshToken,
    updateUser,
    getSession,
  }), [
    state.isAuthenticated,
    state.user,
    state.accessToken,
    isLoading,
    login,
    logout,
    refreshToken,
    updateUser,
    getSession,
  ]);
  
  return (
    <EthosAuthContext.Provider value={contextValue}>
      {children}
    </EthosAuthContext.Provider>
  );
}

/**
 * Hook to access the auth context
 * 
 * Must be used within an EthosAuthProvider.
 * 
 * @throws Error if used outside of EthosAuthProvider
 */
export function useEthosAuthContext(): EthosAuthContextValue {
  const context = useContext(EthosAuthContext);
  
  if (!context) {
    throw new Error(
      'useEthosAuthContext must be used within an EthosAuthProvider. ' +
      'Wrap your app with <EthosAuthProvider> to use Ethos auth hooks.'
    );
  }
  
  return context;
}

/**
 * Check if inside EthosAuthProvider
 */
export function useIsInsideEthosProvider(): boolean {
  return useContext(EthosAuthContext) !== null;
}
