/**
 * Sign in with Ethos SDK - Global Configuration
 * 
 * Manages global configuration that applies to all auth instances.
 * 
 * @module config
 */

import { DEFAULTS } from './constants';
import type { WalletAuthConfig, EthosAuthConfig } from './types';

/**
 * Global configuration store
 */
let globalConfig: Partial<WalletAuthConfig> = {};

/**
 * Set global configuration for all Ethos auth instances
 *
 * Use this to configure defaults that apply across your entire application.
 * Instance-level configuration will override these values.
 *
 * @param config - Configuration to set globally
 *
 * @example
 * ```js
 * // In your app's initialization
 * setGlobalConfig({
 *   authServerUrl: process.env.NEXT_PUBLIC_ETHOS_AUTH_URL,
 *   minScore: 500
 * });
 *
 * // Later, all instances use global config
 * const auth = EthosWalletAuth.init(); // Uses global authServerUrl
 * ```
 */
export function setGlobalConfig(config: Partial<WalletAuthConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Get current global configuration
 *
 * @returns Readonly copy of global config
 */
export function getGlobalConfig(): Readonly<Partial<WalletAuthConfig>> {
  return { ...globalConfig };
}

/**
 * Reset global configuration to defaults
 */
export function resetGlobalConfig(): void {
  globalConfig = {};
}

/**
 * Resolved wallet config type (all required fields resolved)
 */
export type ResolvedWalletConfig = Required<Omit<WalletAuthConfig, 'minScore'>> & { 
  minScore?: number;
};

/**
 * Resolved auth config type (all required fields resolved)
 */
export type ResolvedAuthConfig = Required<Omit<EthosAuthConfig, 'minScore'>> & { 
  minScore?: number;
};

/**
 * Resolve wallet configuration with priority: instance > global > defaults
 */
export function resolveWalletConfig(
  instanceConfig: WalletAuthConfig = {}
): ResolvedWalletConfig {
  return {
    authServerUrl: instanceConfig.authServerUrl 
      ?? globalConfig.authServerUrl 
      ?? DEFAULTS.AUTH_SERVER_URL,
    chainId: instanceConfig.chainId 
      ?? globalConfig.chainId 
      ?? DEFAULTS.CHAIN_ID,
    statement: instanceConfig.statement 
      ?? globalConfig.statement 
      ?? DEFAULTS.STATEMENT,
    expirationTime: instanceConfig.expirationTime 
      ?? globalConfig.expirationTime 
      ?? DEFAULTS.EXPIRATION_TIME,
    minScore: instanceConfig.minScore ?? globalConfig.minScore,
  };
}

/**
 * Resolve base auth configuration with priority: instance > global > defaults
 */
export function resolveAuthConfig(
  instanceConfig: EthosAuthConfig = {}
): ResolvedAuthConfig {
  return {
    authServerUrl: instanceConfig.authServerUrl 
      ?? globalConfig.authServerUrl 
      ?? DEFAULTS.AUTH_SERVER_URL,
    minScore: instanceConfig.minScore ?? globalConfig.minScore,
  };
}
