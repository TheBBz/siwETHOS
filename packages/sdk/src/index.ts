/**
 * Sign in with Ethos - JavaScript SDK
 *
 * Framework-agnostic SDK for integrating "Sign in with Ethos"
 * authentication into any web application using wallet-based auth (SIWE).
 *
 * Users connect their Ethereum wallet, sign a message to prove ownership,
 * and are authenticated if their wallet address has an Ethos profile.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for wallet-based auth
 */
export interface WalletAuthConfig {
  /**
   * Base URL of the Ethos auth server
   * @default 'https://ethos.thebbz.xyz'
   */
  authServerUrl?: string;

  /**
   * Chain ID for the Ethereum network
   * @default 1 (Ethereum mainnet)
   */
  chainId?: number;

  /**
   * Statement to include in SIWE message
   * @default 'Sign in with Ethos'
   */
  statement?: string;

  /**
   * Session expiry time in seconds
   * @default 86400 (24 hours)
   */
  expirationTime?: number;
}

/**
 * SIWE Message structure (EIP-4361)
 */
export interface SIWEMessage {
  /** Domain making the request */
  domain: string;
  /** Ethereum address signing the message */
  address: string;
  /** Human-readable statement */
  statement?: string;
  /** URI of the resource */
  uri: string;
  /** EIP-155 Chain ID */
  chainId: number;
  /** Random nonce for replay protection */
  nonce: string;
  /** ISO timestamp when message was issued */
  issuedAt: string;
  /** ISO timestamp when message expires */
  expirationTime?: string;
  /** SIWE version (always '1') */
  version: '1';
  /** Request ID for tracking */
  requestId?: string;
  /** Resources the user is accessing */
  resources?: string[];
}

/**
 * Parameters for starting wallet auth
 */
export interface ConnectParams {
  /** Optional state parameter for CSRF protection */
  state?: string;
  /** Optional request ID for tracking */
  requestId?: string;
}

/**
 * Response from nonce endpoint
 */
export interface NonceResponse {
  /** Nonce to use in SIWE message */
  nonce: string;
  /** When the nonce expires */
  expiresAt: string;
}

/**
 * Parameters for verifying a signed SIWE message
 */
export interface VerifyParams {
  /** The formatted SIWE message that was signed */
  message: string;
  /** The signature from the wallet */
  signature: string;
  /** The wallet address */
  address: string;
}

/**
 * Result from successful wallet verification
 */
export interface WalletAuthResult {
  /** JWT access token */
  accessToken: string;
  /** Token type (always 'Bearer') */
  tokenType: 'Bearer';
  /** Token expiry in seconds */
  expiresIn: number;
  /** The authenticated user profile */
  user: EthosUser;
}

/**
 * User profile from authentication
 */
export interface EthosUser {
  /** Unique subject identifier (ethos:profileId) */
  sub: string;
  /** User's display name */
  name: string;
  /** User's avatar URL */
  picture: string | null;
  /** Ethos profile ID */
  ethosProfileId: number;
  /** Ethos username */
  ethosUsername: string | null;
  /** Ethos credibility score (0-2800) */
  ethosScore: number;
  /** Profile status */
  ethosStatus: string;
  /** List of verified attestations/userkeys */
  ethosAttestations: string[];
  /** Authentication method used */
  authMethod: 'wallet';
  /** Wallet address used for auth */
  walletAddress: string;
}

// ============================================================================
// Errors
// ============================================================================

/**
 * Error thrown by the SDK
 */
export class EthosAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EthosAuthError';
  }
}

// ============================================================================
// Constants & Global Configuration
// ============================================================================

/**
 * Default configuration values
 */
const DEFAULTS = {
  AUTH_SERVER_URL: 'https://ethos.thebbz.xyz',
  CHAIN_ID: 1,
  STATEMENT: 'Sign in with Ethos to verify your wallet ownership. This is a signature request, NOT a transaction. It will not cost any gas fees or move any funds.',
  EXPIRATION_TIME: 86400, // 24 hours in seconds
} as const;

/**
 * Global configuration store
 * Can be modified via setGlobalConfig() before creating instances
 */
let globalConfig: Partial<WalletAuthConfig> = {};

/**
 * Set global default configuration
 * 
 * Use this to set defaults that apply to all EthosWalletAuth instances.
 * Useful for setting your auth server URL once at app startup.
 * 
 * @param config - Partial configuration to merge with defaults
 * 
 * @example
 * ```js
 * // Set once at app initialization
 * import { setGlobalConfig } from '@thebbz/siwe-ethos';
 * 
 * setGlobalConfig({
 *   authServerUrl: process.env.NEXT_PUBLIC_ETHOS_AUTH_URL,
 *   chainId: 1,
 * });
 * 
 * // All instances will use these defaults
 * const auth = EthosWalletAuth.init(); // Uses global config
 * ```
 */
export function setGlobalConfig(config: Partial<WalletAuthConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Get the current global configuration
 */
export function getGlobalConfig(): Readonly<Partial<WalletAuthConfig>> {
  return { ...globalConfig };
}

/**
 * Reset global configuration to defaults
 */
export function resetGlobalConfig(): void {
  globalConfig = {};
}

/**
 * Resolve configuration with priority: instance > global > defaults
 */
function resolveConfig(instanceConfig: WalletAuthConfig = {}): Required<WalletAuthConfig> {
  return {
    authServerUrl: instanceConfig.authServerUrl 
      ?? globalConfig.authServerUrl 
      ?? DEFAULTS.AUTH_SERVER_URL,
    chainId: instanceConfig.chainId 
      ?? globalConfig.chainId 
      ?? DEFAULTS.CHAIN_ID,
    statement: instanceConfig.statement 
      ?? globalConfig.statement 
      ?? DEFAULTS.STATEMENT,
    expirationTime: instanceConfig.expirationTime 
      ?? globalConfig.expirationTime 
      ?? DEFAULTS.EXPIRATION_TIME,
  };
}

// ============================================================================
// SIWE Message Helpers
// ============================================================================

/**
 * Format a SIWE message for signing (EIP-4361 format)
 */
export function formatSIWEMessage(message: SIWEMessage): string {
  const lines: string[] = [
    `${message.domain} wants you to sign in with your Ethereum account:`,
    message.address,
    '',
  ];

  if (message.statement) {
    lines.push(message.statement);
    lines.push('');
  }

  lines.push(`URI: ${message.uri}`);
  lines.push(`Version: ${message.version}`);
  lines.push(`Chain ID: ${message.chainId}`);
  lines.push(`Nonce: ${message.nonce}`);
  lines.push(`Issued At: ${message.issuedAt}`);

  if (message.expirationTime) {
    lines.push(`Expiration Time: ${message.expirationTime}`);
  }

  if (message.requestId) {
    lines.push(`Request ID: ${message.requestId}`);
  }

  if (message.resources && message.resources.length > 0) {
    lines.push('Resources:');
    message.resources.forEach(resource => {
      lines.push(`- ${resource}`);
    });
  }

  return lines.join('\n');
}

/**
 * Create a SIWE message with the given parameters
 */
export function createSIWEMessage(params: {
  domain: string;
  address: string;
  uri: string;
  nonce: string;
  chainId?: number;
  statement?: string;
  expirationTime?: string;
  requestId?: string;
  resources?: string[];
}): SIWEMessage {
  return {
    domain: params.domain,
    address: params.address,
    uri: params.uri,
    version: '1',
    chainId: params.chainId ?? DEFAULTS.CHAIN_ID,
    nonce: params.nonce,
    issuedAt: new Date().toISOString(),
    statement: params.statement,
    expirationTime: params.expirationTime,
    requestId: params.requestId,
    resources: params.resources,
  };
}

// ============================================================================
// EthosWalletAuth - Wallet-based Authentication
// ============================================================================

/**
 * Ethos Wallet Authentication Client
 *
 * Handles SIWE (Sign-In with Ethereum) flow for Sign in with Ethos.
 */
export class EthosWalletAuth {
  private config: Required<WalletAuthConfig>;

  private constructor(config: WalletAuthConfig) {
    this.config = resolveConfig(config);
  }

  /**
   * Initialize the Ethos Wallet Auth client
   *
   * Configuration priority: instance config > global config > defaults
   *
   * @param config - Configuration options (optional if global config is set)
   * @returns Configured EthosWalletAuth instance
   *
   * @example
   * ```js
   * // Option 1: Pass config directly
   * const auth = EthosWalletAuth.init({
   *   authServerUrl: 'https://your-server.com',
   *   chainId: 1
   * });
   * 
   * // Option 2: Use global config (recommended for apps)
   * setGlobalConfig({ authServerUrl: process.env.NEXT_PUBLIC_AUTH_URL });
   * const auth = EthosWalletAuth.init(); // Uses global config
   * ```
   */
  static init(config: WalletAuthConfig = {}): EthosWalletAuth {
    return new EthosWalletAuth(config);
  }

  /**
   * Get a nonce for the SIWE message
   *
   * The nonce is used to prevent replay attacks and must be included
   * in the SIWE message before signing.
   *
   * @returns Nonce response with expiration
   *
   * @example
   * ```js
   * const { nonce, expiresAt } = await auth.getNonce();
   * ```
   */
  async getNonce(): Promise<NonceResponse> {
    const url = new URL('/api/auth/nonce', this.config.authServerUrl);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw new EthosAuthError(
        error.error_description || error.error || 'Failed to get nonce',
        error.error || 'nonce_error',
        error
      );
    }

    return response.json();
  }

  /**
   * Create a SIWE message to be signed by the user's wallet
   *
   * @param address - The user's Ethereum wallet address
   * @param nonce - The nonce from getNonce()
   * @param options - Additional options
   * @returns The SIWE message object and formatted string
   *
   * @example
   * ```js
   * const { nonce } = await auth.getNonce();
   * const { message, messageString } = auth.createMessage(address, nonce);
   * // Have user sign messageString with their wallet
   * ```
   */
  createMessage(
    address: string,
    nonce: string,
    options?: ConnectParams
  ): { message: SIWEMessage; messageString: string } {
    // Validate address format
    if (!isValidAddress(address)) {
      throw new EthosAuthError(
        'Invalid Ethereum address',
        'invalid_address',
        { address }
      );
    }

    const expirationTime = new Date(
      Date.now() + this.config.expirationTime * 1000
    ).toISOString();

    const message = createSIWEMessage({
      domain: typeof window !== 'undefined' ? window.location.host : 'localhost',
      address: checksumAddress(address),
      uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
      nonce,
      chainId: this.config.chainId,
      statement: this.config.statement,
      expirationTime,
      requestId: options?.requestId,
      resources: ['https://ethos.network'],
    });

    return {
      message,
      messageString: formatSIWEMessage(message),
    };
  }

  /**
   * Verify a signed SIWE message and authenticate the user
   *
   * @param params - Verification parameters
   * @returns Authentication result with token and user profile
   *
   * @example
   * ```js
   * const result = await auth.verify({
   *   message: messageString,
   *   signature: '0x...',
   *   address: '0x...'
   * });
   * console.log('Welcome,', result.user.name);
   * ```
   */
  async verify(params: VerifyParams): Promise<WalletAuthResult> {
    const url = new URL('/api/auth/wallet/verify', this.config.authServerUrl);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: params.message,
        signature: params.signature,
        address: params.address,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw new EthosAuthError(
        error.error_description || error.error || 'Verification failed',
        error.error || 'verify_error',
        error
      );
    }

    const data = await response.json() as {
      access_token: string;
      token_type: 'Bearer';
      expires_in: number;
      user: {
        sub: string;
        name: string;
        picture: string | null;
        ethos_profile_id: number;
        ethos_username: string | null;
        ethos_score: number;
        ethos_status: string;
        ethos_attestations: string[];
        wallet_address: string;
      };
    };

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      user: {
        sub: data.user.sub,
        name: data.user.name,
        picture: data.user.picture,
        ethosProfileId: data.user.ethos_profile_id,
        ethosUsername: data.user.ethos_username,
        ethosScore: data.user.ethos_score,
        ethosStatus: data.user.ethos_status,
        ethosAttestations: data.user.ethos_attestations,
        authMethod: 'wallet',
        walletAddress: data.user.wallet_address,
      },
    };
  }

  /**
   * Complete sign-in flow with a connected wallet
   *
   * This is a convenience method that combines getNonce, createMessage,
   * and verify into a single call. You need to provide a signMessage
   * function from your wallet provider (wagmi, ethers, etc.)
   *
   * @param address - The user's wallet address
   * @param signMessage - Function to sign the message with the wallet
   * @returns Authentication result
   *
   * @example
   * ```js
   * // With wagmi
   * import { useSignMessage } from 'wagmi';
   *
   * const { signMessageAsync } = useSignMessage();
   * const result = await auth.signIn(
   *   address,
   *   (message) => signMessageAsync({ message })
   * );
   * ```
   */
  async signIn(
    address: string,
    signMessage: (message: string) => Promise<string>
  ): Promise<WalletAuthResult> {
    // Step 1: Get nonce
    const { nonce } = await this.getNonce();

    // Step 2: Create message
    const { messageString } = this.createMessage(address, nonce);

    // Step 3: Sign message
    let signature: string;
    try {
      signature = await signMessage(messageString);
    } catch (error) {
      throw new EthosAuthError(
        'User rejected signature request',
        'signature_rejected',
        { originalError: error }
      );
    }

    // Step 4: Verify and authenticate
    return this.verify({
      message: messageString,
      signature,
      address,
    });
  }

  /**
   * Redirect to the hosted wallet connect page
   *
   * Use this if you don't want to implement wallet connection
   * in your app. The user will be redirected back with an auth code.
   *
   * @param redirectUri - URI to redirect back to after auth
   * @param state - Optional state parameter for CSRF protection
   */
  redirect(redirectUri: string, state?: string): void {
    const url = new URL('/connect', this.config.authServerUrl);
    url.searchParams.set('redirect_uri', redirectUri);
    if (state) {
      url.searchParams.set('state', state);
    }
    window.location.href = url.toString();
  }

  /**
   * Get the URL for the hosted wallet connect page
   *
   * @param redirectUri - URI to redirect back to after auth
   * @param state - Optional state parameter for CSRF protection
   * @returns The connect page URL
   */
  getConnectUrl(redirectUri: string, state?: string): string {
    const url = new URL('/connect', this.config.authServerUrl);
    url.searchParams.set('redirect_uri', redirectUri);
    if (state) {
      url.searchParams.set('state', state);
    }
    return url.toString();
  }

  /**
   * Get user profile using an access token
   *
   * @param accessToken - JWT access token
   * @returns User profile
   */
  async getUser(accessToken: string): Promise<EthosUser> {
    const url = new URL('/api/userinfo', this.config.authServerUrl);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw new EthosAuthError(
        error.error_description || error.error || 'Failed to fetch user info',
        error.error || 'userinfo_error',
        error
      );
    }

    const data = await response.json() as {
      sub: string;
      name: string;
      picture: string | null;
      ethos_profile_id: number;
      ethos_username: string | null;
      ethos_score: number;
      ethos_status: string;
      ethos_attestations: string[];
      wallet_address: string;
    };

    return {
      sub: data.sub,
      name: data.name,
      picture: data.picture,
      ethosProfileId: data.ethos_profile_id,
      ethosUsername: data.ethos_username,
      ethosScore: data.ethos_score,
      ethosStatus: data.ethos_status,
      ethosAttestations: data.ethos_attestations,
      authMethod: 'wallet',
      walletAddress: data.wallet_address,
    };
  }

  /**
   * Get the current configuration
   */
  getConfig(): Readonly<Required<WalletAuthConfig>> {
    return { ...this.config };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate an Ethereum address format
 */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Convert address to checksum format (EIP-55)
 * Simplified version - for production use viem or ethers
 */
function checksumAddress(address: string): string {
  // Return as-is for now - the server will handle checksumming
  return address;
}

// ============================================================================
// Exports
// ============================================================================

// Re-export defaults for advanced users
export { DEFAULTS };

// Default export
export default EthosWalletAuth;
