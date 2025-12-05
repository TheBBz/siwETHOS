/**
 * Discord OAuth Provider Types
 */

/**
 * Discord OAuth2 configuration
 */
export interface DiscordConfig {
  /** Discord application client ID */
  clientId: string;
  /** Discord application client secret */
  clientSecret: string;
  /** OAuth2 redirect URI */
  redirectUri: string;
  /** OAuth2 scopes (default: ['identify']) */
  scopes?: string[];
}

/**
 * Discord user from API
 */
export interface DiscordUser {
  /** Discord user ID (snowflake) */
  id: string;
  /** Username */
  username: string;
  /** User's display name */
  global_name: string | null;
  /** Discriminator (legacy, usually '0') */
  discriminator: string;
  /** Avatar hash */
  avatar: string | null;
  /** Whether user is a bot */
  bot?: boolean;
  /** Whether user is an official Discord system user */
  system?: boolean;
  /** Whether user has MFA enabled */
  mfa_enabled?: boolean;
  /** User's banner hash */
  banner?: string | null;
  /** User's accent color */
  accent_color?: number | null;
  /** User's locale */
  locale?: string;
  /** Whether user's email is verified */
  verified?: boolean;
  /** User's email (requires 'email' scope) */
  email?: string | null;
  /** User's flags */
  flags?: number;
  /** User's premium type */
  premium_type?: number;
  /** User's public flags */
  public_flags?: number;
}

/**
 * Discord OAuth2 token response
 */
export interface DiscordTokenResponse {
  /** Access token */
  access_token: string;
  /** Token type (Bearer) */
  token_type: string;
  /** Token expiry in seconds */
  expires_in: number;
  /** Refresh token */
  refresh_token: string;
  /** Granted scopes */
  scope: string;
}

/**
 * Result from Discord OAuth callback
 */
export interface DiscordCallbackResult {
  /** Discord user info */
  user: DiscordUser;
  /** Access token (for further API calls if needed) */
  accessToken: string;
  /** Token expiry in seconds */
  expiresIn: number;
}

/**
 * Ethos lookup key for Discord users
 */
export interface DiscordEthosLookup {
  /** Provider identifier */
  provider: 'discord';
  /** Discord user ID */
  userId: string;
  /** Discord username (for display) */
  username: string;
}
