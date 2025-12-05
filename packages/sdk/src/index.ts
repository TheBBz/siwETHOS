/**
 * Sign in with Ethos - JavaScript SDK
 *
 * Framework-agnostic SDK for integrating "Sign in with Ethos"
 * authentication into any web application using wallet-based auth (SIWE)
 * or social logins (Discord, Telegram, Farcaster).
 *
 * Users can authenticate via:
 * - Ethereum wallet (SIWE) - sign a message to prove ownership
 * - Discord OAuth - link their Discord account
 * - Telegram Login - link their Telegram account
 * - Farcaster (SIWF) - sign with their Farcaster identity
 *
 * All methods require an Ethos profile linked to the authentication method.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Supported authentication methods
 */
export type AuthMethod = 'wallet' | 'twitter' | 'discord' | 'telegram' | 'farcaster';

/**
 * Social authentication providers
 */
export type SocialProvider = 'twitter' | 'discord' | 'telegram' | 'farcaster';

/**
 * Base configuration for all auth methods
 */
export interface EthosAuthConfig {
  /**
   * Base URL of the Ethos auth server
   * @default 'https://ethos.thebbz.xyz'
   */
  authServerUrl?: string;

  /**
   * Minimum Ethos score required to authenticate (0-2800)
   * If set, users with scores below this will be rejected
   * @default undefined (no minimum)
   */
  minScore?: number;
}

/**
 * Configuration for wallet-based auth
 */
export interface WalletAuthConfig extends EthosAuthConfig {
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
 * @deprecated Use AuthResult instead
 */
export interface WalletAuthResult extends AuthResult {}

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
  authMethod: AuthMethod;
  /** Wallet address used for auth (only for wallet auth) */
  walletAddress?: string;
  /** Social provider used for auth (only for social auth) */
  socialProvider?: SocialProvider;
  /** Social provider user ID (only for social auth) */
  socialId?: string;
  /** URL to Ethos profile */
  profileUrl?: string;
}

/**
 * Generic authentication result
 */
export interface AuthResult {
  /** JWT access token */
  accessToken: string;
  /** Token type (always 'Bearer') */
  tokenType: 'Bearer';
  /** Token expiry in seconds */
  expiresIn: number;
  /** The authenticated user profile */
  user: EthosUser;
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
function resolveConfig(instanceConfig: WalletAuthConfig = {}): Required<Omit<WalletAuthConfig, 'minScore'>> & { minScore?: number } {
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
    minScore: instanceConfig.minScore ?? globalConfig.minScore,
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
 * Resolved wallet config type
 */
type ResolvedWalletConfig = Required<Omit<WalletAuthConfig, 'minScore'>> & { minScore?: number };

/**
 * Ethos Wallet Authentication Client
 *
 * Handles SIWE (Sign-In with Ethereum) flow for Sign in with Ethos.
 */
export class EthosWalletAuth {
  private config: ResolvedWalletConfig;

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
  getConfig(): Readonly<ResolvedWalletConfig> {
    return { ...this.config };
  }
}

// ============================================================================
// EthosAuth - Unified Authentication (Wallet + Social)
// ============================================================================

/**
 * Resolved auth config type
 */
type ResolvedAuthConfig = Required<Omit<EthosAuthConfig, 'minScore'>> & { minScore?: number };

/**
 * Resolve base auth configuration
 */
function resolveAuthConfig(instanceConfig: EthosAuthConfig = {}): ResolvedAuthConfig {
  return {
    authServerUrl: instanceConfig.authServerUrl 
      ?? globalConfig.authServerUrl 
      ?? DEFAULTS.AUTH_SERVER_URL,
    minScore: instanceConfig.minScore ?? globalConfig.minScore,
  };
}

/**
 * Parameters for social auth redirect
 */
export interface SocialAuthParams {
  /** URI to redirect back to after authentication */
  redirectUri: string;
  /** Optional state parameter for CSRF protection */
  state?: string;
  /** Optional minimum score requirement (overrides config) */
  minScore?: number;
}

/**
 * Telegram auth data from Login Widget
 */
export interface TelegramAuthData {
  /** Telegram user ID */
  id: number;
  /** User's first name */
  first_name: string;
  /** User's last name (optional) */
  last_name?: string;
  /** Username (optional) */
  username?: string;
  /** Profile photo URL (optional) */
  photo_url?: string;
  /** Unix timestamp of auth */
  auth_date: number;
  /** Hash for verification */
  hash: string;
}

/**
 * Farcaster SIWF message params
 */
export interface FarcasterAuthParams {
  /** Farcaster FID */
  fid: number;
  /** Custody address that signed */
  custodyAddress: string;
  /** The message that was signed */
  message: string;
  /** The signature */
  signature: string;
}

/**
 * Unified Ethos Authentication Client
 *
 * Supports both wallet (SIWE) and social (Discord, Telegram, Farcaster) authentication.
 * All methods require the user to have an Ethos profile linked to their authentication method.
 *
 * @example
 * ```js
 * // Initialize
 * const auth = EthosAuth.init({ minScore: 500 });
 *
 * // Hosted social auth (redirect flow)
 * const url = auth.getAuthUrl('discord', {
 *   redirectUri: 'https://myapp.com/callback',
 *   state: 'random-csrf-token'
 * });
 * window.location.href = url;
 *
 * // After redirect, exchange code for tokens
 * const result = await auth.exchangeCode(code);
 * console.log('Welcome,', result.user.name);
 * ```
 */
export class EthosAuth {
  private config: ResolvedAuthConfig;

  private constructor(config: EthosAuthConfig) {
    this.config = resolveAuthConfig(config);
  }

  /**
   * Initialize the unified Ethos Auth client
   *
   * @param config - Configuration options
   * @returns Configured EthosAuth instance
   *
   * @example
   * ```js
   * const auth = EthosAuth.init({
   *   authServerUrl: 'https://ethos.thebbz.xyz',
   *   minScore: 500  // Require minimum score of 500
   * });
   * ```
   */
  static init(config: EthosAuthConfig = {}): EthosAuth {
    return new EthosAuth(config);
  }

  // --------------------------------------------------------------------------
  // Hosted Flow (Redirect-based)
  // --------------------------------------------------------------------------

  /**
   * Get the authorization URL for a social provider (hosted flow)
   *
   * Redirects user to the auth server which handles the OAuth flow.
   * After authentication, user is redirected back to your redirectUri with a code.
   *
   * @param provider - The social provider ('discord', 'telegram', 'farcaster')
   * @param params - Redirect parameters
   * @returns The authorization URL to redirect to
   *
   * @example
   * ```js
   * const url = auth.getAuthUrl('discord', {
   *   redirectUri: 'https://myapp.com/callback',
   *   state: crypto.randomUUID()
   * });
   * window.location.href = url;
   * ```
   */
  getAuthUrl(provider: SocialProvider, params: SocialAuthParams): string {
    const url = new URL(`/auth/${provider}`, this.config.authServerUrl);
    url.searchParams.set('redirect_uri', params.redirectUri);
    if (params.state) {
      url.searchParams.set('state', params.state);
    }
    const minScore = params.minScore ?? this.config.minScore;
    if (minScore !== undefined) {
      url.searchParams.set('min_score', minScore.toString());
    }
    return url.toString();
  }

  /**
   * Redirect to a social provider's authentication page (hosted flow)
   *
   * @param provider - The social provider
   * @param params - Redirect parameters
   */
  redirect(provider: SocialProvider, params: SocialAuthParams): void {
    if (typeof window === 'undefined') {
      throw new EthosAuthError(
        'redirect() can only be called in browser environment',
        'browser_required'
      );
    }
    window.location.href = this.getAuthUrl(provider, params);
  }

  /**
   * Exchange an authorization code for tokens (after redirect callback)
   *
   * @param code - The authorization code from the callback URL
   * @returns Authentication result with tokens and user profile
   *
   * @example
   * ```js
   * // In your callback page
   * const params = new URLSearchParams(window.location.search);
   * const code = params.get('code');
   * const state = params.get('state');
   *
   * // Verify state matches what you sent
   * if (state !== savedState) throw new Error('CSRF mismatch');
   *
   * const result = await auth.exchangeCode(code);
   * ```
   */
  async exchangeCode(code: string): Promise<AuthResult> {
    const url = new URL('/api/auth/token', this.config.authServerUrl);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw new EthosAuthError(
        error.error_description || error.error || 'Token exchange failed',
        error.error || 'token_error',
        error
      );
    }

    return this.parseAuthResponse(await response.json());
  }

  // --------------------------------------------------------------------------
  // Self-Hosted Flow (Direct API calls)
  // --------------------------------------------------------------------------

  /**
   * Verify Telegram auth data (for self-hosted flow)
   *
   * Send the auth data from Telegram Login Widget to the server for verification.
   * Server validates the hash using its bot token.
   *
   * @param authData - Auth data from Telegram Login Widget
   * @returns Authentication result
   *
   * @example
   * ```js
   * // After Telegram Login Widget callback
   * window.onTelegramAuth = async (user) => {
   *   const result = await auth.verifyTelegram(user);
   *   console.log('Logged in as', result.user.name);
   * };
   * ```
   */
  async verifyTelegram(authData: TelegramAuthData): Promise<AuthResult> {
    const url = new URL('/api/auth/telegram/verify', this.config.authServerUrl);
    
    const body: Record<string, unknown> = { ...authData };
    if (this.config.minScore !== undefined) {
      body.min_score = this.config.minScore;
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw new EthosAuthError(
        error.error_description || error.error || 'Telegram verification failed',
        error.error || 'telegram_verify_error',
        error
      );
    }

    return this.parseAuthResponse(await response.json());
  }

  /**
   * Verify Farcaster SIWF signature (for self-hosted flow)
   *
   * @param params - Farcaster auth parameters
   * @returns Authentication result
   *
   * @example
   * ```js
   * // After Sign-In with Farcaster
   * const result = await auth.verifyFarcaster({
   *   fid: 12345,
   *   custodyAddress: '0x...',
   *   message: 'Sign in with Farcaster...',
   *   signature: '0x...'
   * });
   * ```
   */
  async verifyFarcaster(params: FarcasterAuthParams): Promise<AuthResult> {
    const url = new URL('/api/auth/farcaster/verify', this.config.authServerUrl);
    
    const body: Record<string, unknown> = { ...params };
    if (this.config.minScore !== undefined) {
      body.min_score = this.config.minScore;
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw new EthosAuthError(
        error.error_description || error.error || 'Farcaster verification failed',
        error.error || 'farcaster_verify_error',
        error
      );
    }

    return this.parseAuthResponse(await response.json());
  }

  // --------------------------------------------------------------------------
  // Wallet Auth (delegates to EthosWalletAuth)
  // --------------------------------------------------------------------------

  /**
   * Get a wallet auth instance for SIWE authentication
   *
   * @param walletConfig - Additional wallet-specific config
   * @returns EthosWalletAuth instance
   *
   * @example
   * ```js
   * const walletAuth = auth.wallet({ chainId: 1 });
   * const result = await walletAuth.signIn(address, signMessage);
   * ```
   */
  wallet(walletConfig: Omit<WalletAuthConfig, 'authServerUrl' | 'minScore'> = {}): EthosWalletAuth {
    return EthosWalletAuth.init({
      ...walletConfig,
      authServerUrl: this.config.authServerUrl,
      minScore: this.config.minScore,
    });
  }

  // --------------------------------------------------------------------------
  // User Info
  // --------------------------------------------------------------------------

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

    return this.parseUserResponse(await response.json());
  }

  /**
   * Get the current configuration
   */
  getConfig(): Readonly<ResolvedAuthConfig> {
    return { ...this.config };
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private parseAuthResponse(data: Record<string, unknown>): AuthResult {
    const rawUser = data.user as Record<string, unknown>;
    return {
      accessToken: data.access_token as string,
      tokenType: data.token_type as 'Bearer',
      expiresIn: data.expires_in as number,
      user: this.parseUserResponse(rawUser),
    };
  }

  private parseUserResponse(data: Record<string, unknown>): EthosUser {
    const authMethod = (data.auth_method || data.authMethod || 'wallet') as AuthMethod;
    
    return {
      sub: data.sub as string,
      name: data.name as string,
      picture: (data.picture as string | null) ?? null,
      ethosProfileId: (data.ethos_profile_id ?? data.ethosProfileId) as number,
      ethosUsername: (data.ethos_username ?? data.ethosUsername ?? null) as string | null,
      ethosScore: (data.ethos_score ?? data.ethosScore) as number,
      ethosStatus: (data.ethos_status ?? data.ethosStatus) as string,
      ethosAttestations: (data.ethos_attestations ?? data.ethosAttestations ?? []) as string[],
      authMethod,
      walletAddress: (data.wallet_address ?? data.walletAddress) as string | undefined,
      socialProvider: (data.social_provider ?? data.socialProvider) as SocialProvider | undefined,
      socialId: (data.social_id ?? data.socialId) as string | undefined,
    };
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

// Default export (EthosAuth for new users, EthosWalletAuth still available as named export)
export default EthosAuth;
