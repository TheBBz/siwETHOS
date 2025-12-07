/**
 * Sign in with Ethos SDK - SIWE Message Utilities
 * 
 * Helpers for creating and formatting SIWE (EIP-4361) messages.
 * 
 * @module utils/siwe
 */

import { DEFAULTS } from '../constants';
import type { SIWEMessage } from '../types';

/**
 * Format a SIWE message for signing (EIP-4361 format)
 * 
 * @param message - SIWE message object
 * @returns Formatted message string for wallet signing
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
 * 
 * @param params - Message parameters
 * @returns Complete SIWE message object
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
