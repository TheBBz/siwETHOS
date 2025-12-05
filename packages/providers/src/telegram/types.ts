/**
 * Telegram Login Provider Types
 */

/**
 * Telegram provider configuration
 */
export interface TelegramConfig {
  /** Telegram bot token (from @BotFather) */
  botToken: string;
  /** Bot username (without @) */
  botUsername: string;
}

/**
 * Auth data from Telegram Login Widget
 */
export interface TelegramAuthData {
  /** Telegram user ID */
  id: number;
  /** User's first name */
  first_name: string;
  /** User's last name (optional) */
  last_name?: string;
  /** Username without @ (optional) */
  username?: string;
  /** Profile photo URL (optional) */
  photo_url?: string;
  /** Unix timestamp of authentication */
  auth_date: number;
  /** HMAC-SHA256 hash for verification */
  hash: string;
}

/**
 * Verified Telegram user (after hash validation)
 */
export interface TelegramUser {
  /** Telegram user ID */
  id: number;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName?: string;
  /** Full display name */
  displayName: string;
  /** Username without @ */
  username?: string;
  /** Profile photo URL */
  photoUrl?: string;
  /** When the auth data was created */
  authDate: Date;
}

/**
 * Ethos lookup key for Telegram users
 */
export interface TelegramEthosLookup {
  /** Provider identifier */
  provider: 'telegram';
  /** Telegram user ID */
  userId: string;
  /** Display name */
  displayName: string;
}

/**
 * Telegram verification error
 */
export class TelegramVerificationError extends Error {
  constructor(
    message: string,
    public code: 'invalid_hash' | 'expired' | 'missing_fields'
  ) {
    super(message);
    this.name = 'TelegramVerificationError';
  }
}
