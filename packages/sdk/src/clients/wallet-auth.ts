/**
 * Sign in with Ethos SDK - Wallet Authentication Client
 * 
 * Handles SIWE (Sign-In with Ethereum) flow for wallet-based authentication.
 * 
 * @module clients/wallet-auth
 */

import { ENDPOINTS } from '../constants';
import { EthosAuthError } from '../errors';
import { resolveWalletConfig } from '../config';
import type { ResolvedWalletConfig } from '../config';
import { isValidAddress, checksumAddress, createSIWEMessage, formatSIWEMessage } from '../utils';
import type {
  WalletAuthConfig,
  WalletAuthResult,
  NonceResponse,
  SIWEMessage,
  ConnectParams,
  VerifyParams,
  EthosUser,
} from '../types';

/**
 * Ethos Wallet Authentication Client
 *
 * Handles SIWE (Sign-In with Ethereum) flow for Sign in with Ethos.
 * 
 * @example
 * ```js
 * import { EthosWalletAuth } from '@thebbz/siwe-ethos';
 * 
 * const auth = EthosWalletAuth.init({ chainId: 1 });
 * 
 * // Option 1: Full flow with your own wallet provider
 * const result = await auth.signIn(address, signMessageAsync);
 * 
 * // Option 2: Step-by-step for more control
 * const { nonce } = await auth.getNonce();
 * const { messageString } = auth.createMessage(address, nonce);
 * const signature = await signMessageAsync({ message: messageString });
 * const result = await auth.verify({ message: messageString, signature, address });
 * ```
 */
export class EthosWalletAuth {
  private config: ResolvedWalletConfig;

  private constructor(config: WalletAuthConfig) {
    this.config = resolveWalletConfig(config);
  }

  /**
   * Initialize the Ethos Wallet Auth client
   *
   * Configuration priority: instance config > global config > defaults
   *
   * @param config - Configuration options (optional if global config is set)
   * @returns Configured EthosWalletAuth instance
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
   */
  async getNonce(): Promise<NonceResponse> {
    const url = new URL(ENDPOINTS.NONCE, this.config.authServerUrl);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw EthosAuthError.fromResponse(error, 'nonce_error');
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
   */
  createMessage(
    address: string,
    nonce: string,
    options?: ConnectParams
  ): { message: SIWEMessage; messageString: string } {
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
   */
  async verify(params: VerifyParams): Promise<WalletAuthResult> {
    const url = new URL(ENDPOINTS.WALLET_VERIFY, this.config.authServerUrl);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: params.message,
        signature: params.signature,
        address: params.address,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw EthosAuthError.fromResponse(error, 'verify_error');
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
   * Convenience method that combines getNonce, createMessage, and verify.
   *
   * @param address - The user's wallet address
   * @param signMessage - Function to sign the message with the wallet
   * @returns Authentication result
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
    const url = new URL(ENDPOINTS.USERINFO, this.config.authServerUrl);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw EthosAuthError.fromResponse(error, 'userinfo_error');
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
