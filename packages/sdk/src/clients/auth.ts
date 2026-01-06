/**
 * Sign in with Ethos SDK - Unified Authentication Client
 * 
 * Supports both wallet (SIWE) and social (Discord, Telegram, Farcaster) authentication.
 * 
 * @module clients/auth
 */

import { ENDPOINTS } from '../constants';
import { EthosAuthError } from '../errors';
import { resolveAuthConfig } from '../config';
import type { ResolvedAuthConfig } from '../config';
import { EthosWalletAuth } from './wallet-auth';
import type {
  EthosAuthConfig,
  WalletAuthConfig,
  AuthResult,
  EthosUser,
  SocialProvider,
  SocialAuthParams,
  TelegramAuthData,
  FarcasterAuthParams,
  AuthMethod,
  WebAuthnRegistrationOptions,
  WebAuthnAuthenticationOptions,
  WebAuthnRegistrationCredential,
  WebAuthnAuthenticationCredential,
} from '../types';

/**
 * Unified Ethos Authentication Client
 *
 * Supports both wallet (SIWE) and social (Discord, Telegram, Farcaster) authentication.
 * All methods require the user to have an Ethos profile linked to their authentication method.
 *
 * @example
 * ```js
 * import { EthosAuth } from '@thebbz/siwe-ethos';
 * 
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
   * @param provider - The social provider ('discord', 'telegram', 'farcaster', 'twitter')
   * @param params - Redirect parameters
   * @returns The authorization URL to redirect to
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
   */
  async exchangeCode(code: string): Promise<AuthResult> {
    const url = new URL(ENDPOINTS.TOKEN, this.config.authServerUrl);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw EthosAuthError.fromResponse(error, 'token_error');
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
   *
   * @param authData - Auth data from Telegram Login Widget
   * @returns Authentication result
   */
  async verifyTelegram(authData: TelegramAuthData): Promise<AuthResult> {
    const url = new URL(ENDPOINTS.TELEGRAM_VERIFY, this.config.authServerUrl);
    
    const body: Record<string, unknown> = { ...authData };
    if (this.config.minScore !== undefined) {
      body.min_score = this.config.minScore;
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw EthosAuthError.fromResponse(error, 'telegram_verify_error');
    }

    return this.parseAuthResponse(await response.json());
  }

  /**
   * Verify Farcaster SIWF signature (for self-hosted flow)
   *
   * @param params - Farcaster auth parameters
   * @returns Authentication result
   */
  async verifyFarcaster(params: FarcasterAuthParams): Promise<AuthResult> {
    const url = new URL(ENDPOINTS.FARCASTER_VERIFY, this.config.authServerUrl);

    const body: Record<string, unknown> = { ...params };
    if (this.config.minScore !== undefined) {
      body.min_score = this.config.minScore;
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw EthosAuthError.fromResponse(error, 'farcaster_verify_error');
    }

    return this.parseAuthResponse(await response.json());
  }

  // --------------------------------------------------------------------------
  // WebAuthn/Passkey Flow
  // --------------------------------------------------------------------------

  /**
   * Get WebAuthn registration options from the server
   *
   * Call this to start the passkey registration flow.
   *
   * @param username - Display name for the credential
   * @returns Registration options to pass to WebAuthn API
   */
  async getWebAuthnRegistrationOptions(username: string): Promise<WebAuthnRegistrationOptions> {
    const url = new URL(ENDPOINTS.WEBAUTHN_REGISTER_OPTIONS, this.config.authServerUrl);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw EthosAuthError.fromResponse(error, 'webauthn_options_error');
    }

    return response.json();
  }

  /**
   * Verify WebAuthn registration credential
   *
   * Call this after the user creates a credential with navigator.credentials.create()
   *
   * @param credential - Serialized credential from WebAuthn API
   * @returns Authentication result
   */
  async verifyWebAuthnRegistration(credential: WebAuthnRegistrationCredential): Promise<AuthResult> {
    const url = new URL(ENDPOINTS.WEBAUTHN_REGISTER_VERIFY, this.config.authServerUrl);

    const body: Record<string, unknown> = { credential };
    if (this.config.minScore !== undefined) {
      body.min_score = this.config.minScore;
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw EthosAuthError.fromResponse(error, 'webauthn_register_error');
    }

    return this.parseAuthResponse(await response.json());
  }

  /**
   * Get WebAuthn authentication options from the server
   *
   * Call this to start the passkey authentication flow.
   *
   * @returns Authentication options to pass to WebAuthn API
   */
  async getWebAuthnAuthenticationOptions(): Promise<WebAuthnAuthenticationOptions> {
    const url = new URL(ENDPOINTS.WEBAUTHN_AUTH_OPTIONS, this.config.authServerUrl);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw EthosAuthError.fromResponse(error, 'webauthn_options_error');
    }

    return response.json();
  }

  /**
   * Verify WebAuthn authentication credential
   *
   * Call this after the user authenticates with navigator.credentials.get()
   *
   * @param credential - Serialized credential from WebAuthn API
   * @returns Authentication result
   */
  async verifyWebAuthnAuthentication(credential: WebAuthnAuthenticationCredential): Promise<AuthResult> {
    const url = new URL(ENDPOINTS.WEBAUTHN_AUTH_VERIFY, this.config.authServerUrl);

    const body: Record<string, unknown> = { credential };
    if (this.config.minScore !== undefined) {
      body.min_score = this.config.minScore;
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw EthosAuthError.fromResponse(error, 'webauthn_auth_error');
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
    const url = new URL(ENDPOINTS.USERINFO, this.config.authServerUrl);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw EthosAuthError.fromResponse(error, 'userinfo_error');
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
      refreshToken: data.refresh_token as string | undefined,
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
