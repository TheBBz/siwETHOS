/**
 * Telegram Login Provider
 *
 * Handles Telegram Login Widget verification for Sign in with Ethos.
 * Validates auth data hash using the bot token (server-side only).
 */

import type {
  TelegramConfig,
  TelegramAuthData,
  TelegramUser,
  TelegramEthosLookup,
} from './types';
import { TelegramVerificationError } from './types';

export * from './types';
export { TelegramVerificationError } from './types';

/** Maximum age of auth data in seconds (default: 5 minutes) */
const DEFAULT_MAX_AGE = 300;

/**
 * Compute SHA256 hash using Web Crypto API
 */
async function sha256(message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(message));
}

/**
 * Compute HMAC-SHA256 using Web Crypto API
 */
async function hmacSha256(key: ArrayBuffer, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Telegram Login Provider
 *
 * Validates auth data from Telegram Login Widget.
 * The hash is verified using HMAC-SHA256 with the bot token.
 *
 * @example
 * ```ts
 * const telegram = new TelegramProvider({
 *   botToken: process.env.TELEGRAM_BOT_TOKEN!,
 *   botUsername: 'MyAuthBot',
 * });
 *
 * // Verify auth data from widget
 * const user = await telegram.verifyAuthData(authData);
 * const lookup = telegram.getEthosLookup(user);
 * // lookup = { provider: 'telegram', userId: '123456789', displayName: 'John Doe' }
 * ```
 */
export class TelegramProvider {
  private config: TelegramConfig;
  private secretKeyPromise: Promise<ArrayBuffer>;

  constructor(config: TelegramConfig) {
    this.config = config;
    // Secret key is SHA256 hash of the bot token (computed lazily)
    this.secretKeyPromise = sha256(config.botToken);
  }

  /**
   * Get the Telegram Login Widget script URL
   */
  getWidgetScriptUrl(): string {
    return 'https://telegram.org/js/telegram-widget.js?22';
  }

  /**
   * Get HTML for embedding the Telegram Login Widget
   */
  getWidgetHtml(
    callbackUrl: string,
    options: {
      size?: 'small' | 'medium' | 'large';
      cornerRadius?: number;
      requestAccess?: 'write';
    } = {}
  ): string {
    const size = options.size ?? 'medium';
    const radiusAttr = options.cornerRadius !== undefined 
      ? ' data-radius="' + options.cornerRadius + '"' 
      : '';
    const accessAttr = options.requestAccess 
      ? ' data-request-access="' + options.requestAccess + '"' 
      : '';
    return '<script async src="' + this.getWidgetScriptUrl() + 
      '" data-telegram-login="' + this.config.botUsername + 
      '" data-size="' + size + '"' + 
      radiusAttr + accessAttr + 
      ' data-auth-url="' + callbackUrl + '"></script>';
  }

  /**
   * Verify Telegram auth data
   */
  async verifyAuthData(authData: TelegramAuthData, maxAge = DEFAULT_MAX_AGE): Promise<TelegramUser> {
    // Check required fields
    if (!authData.id || !authData.first_name || !authData.auth_date || !authData.hash) {
      throw new TelegramVerificationError(
        'Missing required fields in Telegram auth data',
        'missing_fields'
      );
    }

    // Check auth_date is not too old
    const authTimestamp = authData.auth_date;
    const now = Math.floor(Date.now() / 1000);
    if (now - authTimestamp > maxAge) {
      throw new TelegramVerificationError(
        'Telegram auth data expired (age: ' + (now - authTimestamp) + 's, max: ' + maxAge + 's)',
        'expired'
      );
    }

    // Build data check string (sorted alphabetically, excluding hash)
    const dataCheckString = this.buildDataCheckString(authData);

    // Get secret key (SHA256 of bot token)
    const secretKey = await this.secretKeyPromise;

    // Calculate expected hash using HMAC-SHA256
    const expectedHash = await hmacSha256(secretKey, dataCheckString);

    // Compare hashes
    if (authData.hash !== expectedHash) {
      throw new TelegramVerificationError(
        'Invalid Telegram auth hash - data may have been tampered with',
        'invalid_hash'
      );
    }

    // Return verified user
    const displayName = authData.last_name 
      ? authData.first_name + ' ' + authData.last_name
      : authData.first_name;

    return {
      id: authData.id,
      firstName: authData.first_name,
      lastName: authData.last_name,
      displayName,
      username: authData.username,
      photoUrl: authData.photo_url,
      authDate: new Date(authData.auth_date * 1000),
    };
  }

  /**
   * Get the Ethos lookup key from verified user
   */
  getEthosLookup(user: TelegramUser): TelegramEthosLookup {
    return {
      provider: 'telegram',
      userId: user.id.toString(),
      displayName: user.displayName,
    };
  }

  /**
   * Build the data check string for hash verification
   * Keys must be sorted alphabetically
   */
  private buildDataCheckString(authData: TelegramAuthData): string {
    const entries: [string, string | number][] = [];

    // Add all fields except hash, sorted alphabetically
    if (authData.auth_date) entries.push(['auth_date', authData.auth_date]);
    if (authData.first_name) entries.push(['first_name', authData.first_name]);
    if (authData.id) entries.push(['id', authData.id]);
    if (authData.last_name) entries.push(['last_name', authData.last_name]);
    if (authData.photo_url) entries.push(['photo_url', authData.photo_url]);
    if (authData.username) entries.push(['username', authData.username]);

    // Sort by key and join with newlines
    return entries
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => key + '=' + value)
      .join('\n');
  }
}
