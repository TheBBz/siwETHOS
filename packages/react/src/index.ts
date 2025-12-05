/**
 * Sign in with Ethos - React Components
 * 
 * Framework-specific React components for "Sign in with Ethos" authentication.
 * 
 * @example
 * ```tsx
 * // Simple usage with pre-built button
 * import { SignInWithEthosButton } from '@thebbz/siwe-ethos-react';
 * 
 * function App() {
 *   return (
 *     <SignInWithEthosButton
 *       onSuccess={(result) => {
 *         console.log('Welcome,', result.user.name);
 *       }}
 *     />
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Custom implementation with modal
 * import { EthosAuthModal } from '@thebbz/siwe-ethos-react/modal';
 * import { useEthosAuth } from '@thebbz/siwe-ethos-react/hooks';
 * 
 * function App() {
 *   const [isOpen, setIsOpen] = useState(false);
 * 
 *   return (
 *     <>
 *       <button onClick={() => setIsOpen(true)}>
 *         Connect Wallet
 *       </button>
 *       <EthosAuthModal
 *         isOpen={isOpen}
 *         onClose={() => setIsOpen(false)}
 *         onSuccess={(result) => setIsOpen(false)}
 *       />
 *     </>
 *   );
 * }
 * ```
 */

// Main components
export { SignInWithEthosButton } from './SignInButton';
export { EthosAuthModal } from './modal/EthosAuthModal';

// Atomic components
export {
  WalletButton,
  WalletList,
  ProgressView,
  SuccessView,
  ErrorView,
} from './components';

// Hooks
export {
  useEthosAuth,
  useEthosModal,
  useWalletDetection,
  checkWalletInstalled,
  detectWallets,
} from './hooks';

// Types
export type {
  // Wallet types
  WalletId,
  WalletConfig,
  
  // Score types
  ScoreColor,
  
  // Modal types
  ModalView,
  ConnectionStatus,
  ModalState,
  ModalActions,
  
  // Component props
  ModalStyleProps,
  EthosAuthModalProps,
  SignInButtonProps,
  WalletButtonProps,
  WalletListProps,
  ProgressViewProps,
  SuccessViewProps,
  ErrorViewProps,
  
  // Hook types
  UseEthosAuthReturn,
  UseEthosAuthOptions,
  UseWalletDetectionReturn,
  
  // Re-exported SDK types
  AuthResult,
  EthosUser,
} from './types';

// Utilities
export {
  WALLETS,
  SCORE_COLORS,
  getScoreColor,
  getScoreLabel,
} from './types';

// Wallet/OAuth utilities
export {
  getWalletProvider,
  connectWallet,
  signMessage,
  decodeBase64Url,
  parseOAuthError,
  formatOAuthError,
  clearOAuthParams,
  parseOAuthCode,
  hasOAuthCallback,
  getOAuthParams,
} from './utils';
export type { OAuthCallbackResult } from './utils';
