/**
 * Ethereum Address Utilities
 *
 * Validation and formatting for Ethereum addresses
 */

/**
 * Check if a string is a valid Ethereum address
 *
 * @param address - The address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Convert an Ethereum address to checksum format (EIP-55)
 *
 * This is a simplified implementation that lowercases the address.
 * For full EIP-55 checksum, use viem's getAddress on the server.
 *
 * @param address - The address to checksum
 * @returns The checksummed address
 */
export function checksumAddress(address: string): string {
  if (!isValidEthereumAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }

  // For client-side, just normalize to lowercase
  // Server-side will use viem's getAddress for proper checksum
  return address.toLowerCase();
}

/**
 * Compare two addresses for equality (case-insensitive)
 *
 * @param a - First address
 * @param b - Second address
 * @returns true if addresses are equal
 */
export function addressesEqual(a: string, b: string): boolean {
  if (!isValidEthereumAddress(a) || !isValidEthereumAddress(b)) {
    return false;
  }
  return a.toLowerCase() === b.toLowerCase();
}
