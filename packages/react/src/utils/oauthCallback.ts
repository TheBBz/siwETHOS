/**
 * OAuth Callback Processing Utilities
 * 
 * Helper functions for handling OAuth callback responses
 */

import type { EthosUser } from '../types';

export interface OAuthCallbackResult {
  success: boolean;
  user?: EthosUser;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
}

/**
 * Decode a base64url encoded string with proper UTF-8 support
 */
export function decodeBase64Url(str: string): string {
  // Convert base64url to base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Decode base64 to binary string
  const binary = atob(base64);
  // Convert binary string to UTF-8
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Parse OAuth error from URL parameters
 */
export function parseOAuthError(url: URL): { error: string; description?: string } | null {
  const errorParam = url.searchParams.get('error');
  if (!errorParam) return null;
  
  const errorDescription = url.searchParams.get('error_description');
  
  return {
    error: errorParam,
    description: errorDescription || undefined,
  };
}

/**
 * Format OAuth error message for display
 */
export function formatOAuthError(errorParam: string, errorDescription?: string | null): string {
  if (errorDescription) return errorDescription;
  
  if (errorParam === 'no_ethos_profile') {
    return 'No Ethos profile found. Please connect your account on ethos.network first.';
  }
  
  return `Authentication failed: ${errorParam}`;
}

/**
 * Clear OAuth parameters from URL without page reload
 */
export function clearOAuthParams(url: URL): void {
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  window.history.replaceState({}, '', url.pathname + (url.search || ''));
}

/**
 * Parse OAuth authorization code and extract user data
 */
export function parseOAuthCode(code: string): OAuthCallbackResult {
  try {
    // The code could be a JSON object encoded as base64url
    let payload: Record<string, unknown>;
    
    try {
      const decoded = decodeBase64Url(code);
      const parsed = JSON.parse(decoded);
      
      // If it's our wrapper format with user data
      if (parsed.user) {
        payload = parsed.user;
      } else if (parsed.accessToken) {
        // Decode the inner JWT
        const [, innerPayloadB64] = parsed.accessToken.split('.');
        if (innerPayloadB64) {
          payload = JSON.parse(decodeBase64Url(innerPayloadB64));
        } else {
          payload = parsed;
        }
      } else {
        payload = parsed;
      }
    } catch {
      // Try parsing as JWT directly
      const [, payloadB64] = code.split('.');
      if (!payloadB64) {
        return { success: false, error: 'Invalid authorization code format' };
      }
      payload = JSON.parse(decodeBase64Url(payloadB64));
    }

    // Extract user data from the token (matching EthosUser type)
    const authMethod = (payload.authMethod || payload.socialProvider || 'discord') as 'wallet' | 'twitter' | 'discord' | 'telegram' | 'farcaster';
    const socialProvider = (payload.socialProvider || payload.authMethod) as 'twitter' | 'discord' | 'telegram' | 'farcaster' | undefined;
    
    // Generate profile URL if not provided in payload
    const provider = (payload.socialProvider as string) || (payload.authMethod as string) || 'eth';
    const profileUrl = (payload.profileUrl as string) || 
      `https://app.ethos.network/profile/${provider}/${(payload.ethosUsername as string) || (payload.ethosProfileId as number)}`;
    
    const user: EthosUser = {
      sub: (payload.sub as string) || `ethos:${(payload as Record<string, unknown>).ethosProfileId || 0}`,
      name: (payload.name as string) || '',
      picture: (payload.picture as string) || null,
      ethosProfileId: (payload.ethosProfileId as number) || 0,
      ethosUsername: (payload.ethosUsername as string) || null,
      ethosScore: (payload.ethosScore as number) || 0,
      ethosStatus: (payload.ethosStatus as string) || 'UNKNOWN',
      ethosAttestations: (payload.ethosAttestations as string[]) || [],
      authMethod,
      socialProvider,
      socialId: (payload.socialId as string) || (payload.sub as string),
      profileUrl,
    };

    const expiresIn = (payload.exp as number) 
      ? (payload.exp as number) - Math.floor(Date.now() / 1000) 
      : 3600;

    return {
      success: true,
      user,
      accessToken: code,
      expiresIn,
    };
  } catch (e) {
    console.error('[parseOAuthCode] Failed to parse OAuth callback:', e);
    return { success: false, error: 'Failed to verify authentication' };
  }
}

/**
 * Check if current URL has OAuth callback parameters
 */
export function hasOAuthCallback(url: URL): boolean {
  return url.searchParams.has('code') || url.searchParams.has('error');
}

/**
 * Extract OAuth parameters from URL
 */
export function getOAuthParams(url: URL): { code?: string; state?: string; error?: string; errorDescription?: string } {
  return {
    code: url.searchParams.get('code') || undefined,
    state: url.searchParams.get('state') || undefined,
    error: url.searchParams.get('error') || undefined,
    errorDescription: url.searchParams.get('error_description') || undefined,
  };
}
