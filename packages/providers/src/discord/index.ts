/**
 * Discord OAuth2 Provider
 *
 * Handles Discord OAuth2 flow for Sign in with Ethos.
 * Returns Discord user ID for Ethos profile lookup.
 */

import type {
  DiscordConfig,
  DiscordUser,
  DiscordTokenResponse,
  DiscordCallbackResult,
  DiscordEthosLookup,
} from './types';

export * from './types';

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const DISCORD_OAUTH_BASE = 'https://discord.com/api/oauth2';

/**
 * Generate a cryptographically secure random state for CSRF protection
 */
function generateState(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(32);
  crypto.getRandomValues(randomValues);
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Discord OAuth2 Provider
 *
 * @example
 * ```ts
 * const discord = new DiscordProvider({
 *   clientId: process.env.DISCORD_CLIENT_ID!,
 *   clientSecret: process.env.DISCORD_CLIENT_SECRET!,
 *   redirectUri: 'https://myapp.com/auth/discord/callback',
 * });
 *
 * // Get authorization URL (state is auto-generated for CSRF protection)
 * const { url, state } = discord.getAuthorizationUrl();
 * // Store state in session for verification on callback
 *
 * // After callback, verify state and exchange code for user info
 * const result = await discord.handleCallback(code);
 * const lookup = discord.getEthosLookup(result);
 * // lookup = { provider: 'discord', userId: '123456789', username: 'user' }
 * ```
 */
export class DiscordProvider {
  private config: DiscordConfig;
  private scopes: string[];

  constructor(config: DiscordConfig) {
    this.config = config;
    this.scopes = config.scopes ?? ['identify'];
  }

  /**
   * Get the Discord OAuth2 authorization URL
   *
   * @param params - Authorization parameters
   * @returns Object containing the URL and the state parameter used
   */
  getAuthorizationUrl(params: { state?: string } = {}): { url: string; state: string } {
    const state = params.state ?? generateState();
    const url = new URL('/authorize', DISCORD_OAUTH_BASE);
    url.searchParams.set('client_id', this.config.clientId);
    url.searchParams.set('redirect_uri', this.config.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', this.scopes.join(' '));
    url.searchParams.set('state', state);
    return { url: url.toString(), state };
  }

  /**
   * Exchange authorization code for tokens and fetch user info
   *
   * @param code - The authorization code from Discord callback
   * @returns Discord user info and tokens
   */
  async handleCallback(code: string): Promise<DiscordCallbackResult> {
    // Exchange code for tokens
    const tokens = await this.exchangeCode(code);

    // Fetch user info
    const user = await this.fetchUser(tokens.access_token);

    return {
      user,
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in,
    };
  }

  /**
   * Exchange authorization code for tokens
   *
   * @param code - The authorization code
   * @returns Token response
   */
  async exchangeCode(code: string): Promise<DiscordTokenResponse> {
    const response = await fetch(`${DISCORD_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Discord token exchange failed: ${error.error_description || error.error || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Fetch Discord user info using access token
   *
   * @param accessToken - Discord access token
   * @returns Discord user
   */
  async fetchUser(accessToken: string): Promise<DiscordUser> {
    const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch Discord user: ${error.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get the Ethos lookup key from callback result
   *
   * @param result - Discord callback result
   * @returns Ethos lookup key (provider + userId)
   */
  getEthosLookup(result: DiscordCallbackResult): DiscordEthosLookup {
    return {
      provider: 'discord',
      userId: result.user.id,
      username: result.user.global_name || result.user.username,
    };
  }

  /**
   * Get avatar URL for a Discord user
   *
   * @param user - Discord user
   * @param size - Image size (default: 128)
   * @returns Avatar URL or default avatar URL
   */
  getAvatarUrl(user: DiscordUser, size = 128): string {
    if (user.avatar) {
      const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`;
    }
    // Default avatar based on discriminator or user ID
    const index = user.discriminator === '0' 
      ? Number(BigInt(user.id) >> BigInt(22)) % 6
      : parseInt(user.discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }
}
