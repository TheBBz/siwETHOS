/**
 * Sign in with Ethos - React Context
 * 
 * @module context
 */

export { 
  EthosAuthProvider, 
  useEthosAuthContext,
  useIsInsideEthosProvider,
} from './EthosAuthProvider';

export {
  useEthosSession,
  useEthosUser,
  useEthosScore,
  useMinScore,
  useIsAuthenticated,
  useAccessToken,
} from './hooks';

export type { 
  EthosAuthContextValue, 
  EthosAuthProviderProps,
  ScoreTierInfo,
} from './types';
