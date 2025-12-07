/**
 * Sign in with Ethos SDK - Address Utilities
 * 
 * Ethereum address validation and formatting.
 * 
 * @module utils/address
 */

/**
 * Validate an Ethereum address format
 * 
 * @param address - Address to validate
 * @returns True if valid hex address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Convert address to checksum format (EIP-55)
 * 
 * Note: This is a simplified version. For production,
 * the server handles proper checksumming, or use viem/ethers.
 * 
 * @param address - Address to checksum
 * @returns Address (passed through for now)
 */
export function checksumAddress(address: string): string {
  // Return as-is - the server handles checksumming
  // For client-side checksumming, use viem's getAddress()
  return address;
}
