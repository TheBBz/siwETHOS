/**
 * Farcaster SIWF (Sign-In with Farcaster) Provider
 *
 * Handles Farcaster authentication via custody address signatures.
 * Similar to SIWE but uses Farcaster FID for identity.
 */

import type {
  FarcasterConfig,
  SIWFMessage,
  SIWFMessageParams,
  SIWFVerifyParams,
  FarcasterUser,
  FarcasterEthosLookup,
} from './types';
import { FarcasterVerificationError } from './types';

export * from './types';
export { FarcasterVerificationError } from './types';

// Import address utilities from siwe module
import { checksumAddress, isValidEthereumAddress } from '../siwe/address';
import { recoverAddress } from '../siwe/verify';

const DEFAULT_EXPIRATION = 86400; // 24 hours
const DEFAULT_STATEMENT = 'Sign in with Farcaster to verify your identity. This is a signature request, NOT a transaction.';

/**
 * Farcaster SIWF Provider
 *
 * Creates and verifies Sign-In with Farcaster messages.
 *
 * @example
 * ```ts
 * const farcaster = new FarcasterProvider({
 *   domain: 'myapp.com',
 *   uri: 'https://myapp.com',
 * });
 *
 * // Create SIWF message
 * const { message, messageString } = farcaster.createMessage({
 *   fid: 12345,
 *   custodyAddress: '0x...',
 *   nonce: 'random-nonce',
 * });
 *
 * // Have user sign messageString with their custody wallet
 * // Then verify
 * const user = await farcaster.verify({
 *   message: messageString,
 *   signature: '0x...',
 *   fid: 12345,
 *   custodyAddress: '0x...',
 * });
 *
 * const lookup = farcaster.getEthosLookup(user);
 * // lookup = { provider: 'farcaster', fid: '12345' }
 * ```
 */
export class FarcasterProvider {
  private config: FarcasterConfig;

  constructor(config: FarcasterConfig) {
    this.config = config;
  }

  /**
   * Create a SIWF message for signing
   *
   * @param params - Message parameters
   * @returns The message object and formatted string
   */
  createMessage(params: SIWFMessageParams): { message: SIWFMessage; messageString: string } {
    // Validate custody address
    if (!isValidEthereumAddress(params.custodyAddress)) {
      throw new FarcasterVerificationError(
        'Invalid custody address format',
        'invalid_message'
      );
    }

    const now = new Date();
    const expirationTime = params.expirationTime ?? DEFAULT_EXPIRATION;
    const expiration = new Date(now.getTime() + expirationTime * 1000);

    const message: SIWFMessage = {
      domain: params.domain ?? this.config.domain,
      fid: params.fid,
      custodyAddress: checksumAddress(params.custodyAddress),
      statement: params.statement ?? DEFAULT_STATEMENT,
      uri: params.uri ?? this.config.uri,
      nonce: params.nonce,
      issuedAt: now.toISOString(),
      expirationTime: expiration.toISOString(),
      resources: params.resources ?? ['https://ethos.network'],
    };

    return {
      message,
      messageString: this.formatMessage(message),
    };
  }

  /**
   * Format a SIWF message for signing
   * Format is similar to EIP-4361 (SIWE) but identifies Farcaster
   *
   * @param message - SIWF message object
   * @returns Formatted message string
   */
  formatMessage(message: SIWFMessage): string {
    const lines: string[] = [
      `${message.domain} wants you to sign in with your Farcaster account:`,
      `FID: ${message.fid}`,
      `Custody: ${message.custodyAddress}`,
      '',
    ];

    if (message.statement) {
      lines.push(message.statement);
      lines.push('');
    }

    lines.push(`URI: ${message.uri}`);
    lines.push(`Nonce: ${message.nonce}`);
    lines.push(`Issued At: ${message.issuedAt}`);

    if (message.expirationTime) {
      lines.push(`Expiration Time: ${message.expirationTime}`);
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
   * Parse a formatted SIWF message string
   *
   * @param messageString - Formatted message
   * @returns Parsed message object
   */
  parseMessage(messageString: string): SIWFMessage {
    const lines = messageString.split('\n');

    // Parse header: "domain wants you to sign in with your Farcaster account:"
    const headerMatch = lines[0]?.match(/^(.+) wants you to sign in with your Farcaster account:$/);
    if (!headerMatch) {
      throw new FarcasterVerificationError('Invalid SIWF message format', 'invalid_message');
    }

    const domain = headerMatch[1];

    // Parse FID
    const fidMatch = lines[1]?.match(/^FID: (\d+)$/);
    if (!fidMatch) {
      throw new FarcasterVerificationError('Missing FID in SIWF message', 'invalid_message');
    }
    const fid = parseInt(fidMatch[1], 10);

    // Parse custody address
    const custodyMatch = lines[2]?.match(/^Custody: (0x[a-fA-F0-9]{40})$/);
    if (!custodyMatch) {
      throw new FarcasterVerificationError('Missing custody address in SIWF message', 'invalid_message');
    }
    const custodyAddress = custodyMatch[1];

    // Parse remaining fields
    const message: SIWFMessage = {
      domain,
      fid,
      custodyAddress,
      uri: '',
      nonce: '',
      issuedAt: '',
    };

    // Find statement (between address and first field)
    let i = 3;
    const statementLines: string[] = [];
    while (i < lines.length && !lines[i].includes(':') && lines[i] !== '') {
      if (lines[i] !== '') {
        statementLines.push(lines[i]);
      }
      i++;
    }
    if (statementLines.length > 0) {
      message.statement = statementLines.join('\n');
    }

    // Skip empty line after statement
    if (lines[i] === '') i++;

    // Parse fields
    const resources: string[] = [];
    let inResources = false;

    for (; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('- ') && inResources) {
        resources.push(line.slice(2));
        continue;
      }
      
      inResources = false;
      
      if (line.startsWith('URI: ')) {
        message.uri = line.slice(5);
      } else if (line.startsWith('Nonce: ')) {
        message.nonce = line.slice(7);
      } else if (line.startsWith('Issued At: ')) {
        message.issuedAt = line.slice(11);
      } else if (line.startsWith('Expiration Time: ')) {
        message.expirationTime = line.slice(17);
      } else if (line === 'Resources:') {
        inResources = true;
      }
    }

    if (resources.length > 0) {
      message.resources = resources;
    }

    return message;
  }

  /**
   * Verify a SIWF signature
   *
   * @param params - Verification parameters
   * @returns Verified Farcaster user
   * @throws FarcasterVerificationError if verification fails
   */
  async verify(params: SIWFVerifyParams): Promise<FarcasterUser> {
    // Parse message
    const message = this.parseMessage(params.message);

    // Verify FID matches
    if (message.fid !== params.fid) {
      throw new FarcasterVerificationError(
        `FID mismatch: message has ${message.fid}, expected ${params.fid}`,
        'fid_mismatch'
      );
    }

    // Check expiration
    if (message.expirationTime) {
      const expiration = new Date(message.expirationTime);
      if (expiration < new Date()) {
        throw new FarcasterVerificationError(
          'SIWF message has expired',
          'expired'
        );
      }
    }

    // Recover signer address from signature
    const recoveredAddress = await recoverAddress(params.message, params.signature);

    // Verify recovered address matches custody address
    const expectedAddress = checksumAddress(params.custodyAddress);
    const actualAddress = checksumAddress(recoveredAddress);

    if (actualAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
      throw new FarcasterVerificationError(
        `Signature verification failed: expected ${expectedAddress}, got ${actualAddress}`,
        'invalid_signature'
      );
    }

    return {
      fid: message.fid,
      custodyAddress: actualAddress,
      nonce: message.nonce,
      domain: message.domain,
    };
  }

  /**
   * Get the Ethos lookup key from verified user
   *
   * @param user - Verified Farcaster user
   * @returns Ethos lookup key (provider + fid)
   */
  getEthosLookup(user: FarcasterUser): FarcasterEthosLookup {
    return {
      provider: 'farcaster',
      fid: user.fid.toString(),
    };
  }
}
