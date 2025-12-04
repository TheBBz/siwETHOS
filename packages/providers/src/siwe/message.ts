/**
 * SIWE Message Creation
 *
 * Creates and formats Sign-In with Ethereum messages following EIP-4361.
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4361
 */

import type { SIWEMessageParams, SIWEMessage } from './types';

/**
 * Format a SIWE message as a human-readable string
 * 
 * The message format follows EIP-4361 exactly:
 * 
 * ${domain} wants you to sign in with your Ethereum account:
 * ${address}
 *
 * ${statement}
 *
 * URI: ${uri}
 * Version: ${version}
 * Chain ID: ${chainId}
 * Nonce: ${nonce}
 * Issued At: ${issuedAt}
 * [Expiration Time: ${expirationTime}]
 * [Not Before: ${notBefore}]
 * [Request ID: ${requestId}]
 * [Resources:
 * - ${resources[0]}
 * - ${resources[1]}
 * ...]
 */
export function formatSIWEMessage(params: SIWEMessageParams): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`${params.domain} wants you to sign in with your Ethereum account:`);
  lines.push(params.address);
  
  // Statement (with blank line before and after)
  if (params.statement) {
    lines.push('');
    lines.push(params.statement);
  }
  
  // Required fields
  lines.push('');
  lines.push(`URI: ${params.uri}`);
  lines.push(`Version: ${params.version}`);
  lines.push(`Chain ID: ${params.chainId}`);
  lines.push(`Nonce: ${params.nonce}`);
  lines.push(`Issued At: ${params.issuedAt}`);
  
  // Optional fields
  if (params.expirationTime) {
    lines.push(`Expiration Time: ${params.expirationTime}`);
  }
  
  if (params.notBefore) {
    lines.push(`Not Before: ${params.notBefore}`);
  }
  
  if (params.requestId) {
    lines.push(`Request ID: ${params.requestId}`);
  }
  
  // Resources
  if (params.resources && params.resources.length > 0) {
    lines.push('Resources:');
    for (const resource of params.resources) {
      lines.push(`- ${resource}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Create a SIWE message with sensible defaults
 * 
 * @param params - Message parameters
 * @returns Formatted SIWE message object with raw string
 * 
 * @example
 * ```ts
 * const message = createSIWEMessage({
 *   domain: 'ethos.network',
 *   address: '0x1234...5678',
 *   uri: 'https://ethos.network',
 *   chainId: 1,
 *   nonce: await generateNonce(),
 * });
 * ```
 */
export function createSIWEMessage(
  params: Omit<SIWEMessageParams, 'version' | 'issuedAt'> & {
    version?: '1';
    issuedAt?: string;
  }
): SIWEMessage {
  const fullParams: SIWEMessageParams = {
    ...params,
    version: params.version ?? '1',
    issuedAt: params.issuedAt ?? new Date().toISOString(),
  };
  
  const raw = formatSIWEMessage(fullParams);
  
  return {
    ...fullParams,
    raw,
  };
}

/**
 * Parse a raw SIWE message string into structured format
 * 
 * @param message - Raw SIWE message string
 * @returns Parsed SIWE message object
 * @throws Error if message is malformed
 */
export function parseSIWEMessage(message: string): SIWEMessage {
  const lines = message.split('\n');
  
  // Parse header
  const headerMatch = lines[0]?.match(/^(.+) wants you to sign in with your Ethereum account:$/);
  if (!headerMatch) {
    throw new Error('Invalid SIWE message: missing or malformed header');
  }
  const domain = headerMatch[1];
  
  // Parse address
  const address = lines[1];
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error('Invalid SIWE message: missing or malformed address');
  }
  
  // Parse fields
  const params: Partial<SIWEMessageParams> = {
    domain,
    address,
  };
  
  let statement: string | undefined;
  const resources: string[] = [];
  let inResources = false;
  let statementStart = -1;
  let statementEnd = -1;
  
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    
    if (inResources) {
      if (line.startsWith('- ')) {
        resources.push(line.slice(2));
      }
      continue;
    }
    
    if (line.startsWith('URI: ')) {
      if (statementStart > 0 && statementEnd < 0) {
        statementEnd = i - 1;
      }
      params.uri = line.slice(5);
    } else if (line.startsWith('Version: ')) {
      params.version = line.slice(9) as '1';
    } else if (line.startsWith('Chain ID: ')) {
      params.chainId = parseInt(line.slice(10), 10);
    } else if (line.startsWith('Nonce: ')) {
      params.nonce = line.slice(7);
    } else if (line.startsWith('Issued At: ')) {
      params.issuedAt = line.slice(11);
    } else if (line.startsWith('Expiration Time: ')) {
      params.expirationTime = line.slice(17);
    } else if (line.startsWith('Not Before: ')) {
      params.notBefore = line.slice(12);
    } else if (line.startsWith('Request ID: ')) {
      params.requestId = line.slice(12);
    } else if (line === 'Resources:') {
      inResources = true;
    } else if (line !== '' && statementStart < 0) {
      statementStart = i;
    }
  }
  
  // Extract statement
  if (statementStart > 0 && statementEnd > statementStart) {
    statement = lines.slice(statementStart, statementEnd).join('\n').trim();
    if (statement) {
      params.statement = statement;
    }
  }
  
  if (resources.length > 0) {
    params.resources = resources;
  }
  
  // Validate required fields
  if (!params.uri || !params.version || !params.chainId || !params.nonce || !params.issuedAt) {
    throw new Error('Invalid SIWE message: missing required fields');
  }
  
  return {
    ...(params as SIWEMessageParams),
    raw: message,
  };
}
