/**
 * Sign in with Ethos - Session Hooks
 * 
 * React hooks for accessing authentication state.
 * 
 * @module context/hooks
 */

'use client';

import { useMemo } from 'react';
import { useEthosAuthContext } from './EthosAuthProvider';
import { getScoreTier } from '@thebbz/siwe-ethos';
import type { EthosUser } from '@thebbz/siwe-ethos';
import type { ScoreTierInfo } from './types';

/**
 * Score tier colors
 */
const TIER_COLORS: Record<string, string> = {
  untrusted: '#ef4444',      // red
  questionable: '#f97316',   // orange
  neutral: '#6b7280',        // gray
  trusted: '#22c55e',        // green
  reputable: '#3b82f6',      // blue
  exemplary: '#8b5cf6',      // purple
};

/**
 * Score tier ranges
 */
const TIER_RANGES: Record<string, { min: number; max: number }> = {
  untrusted: { min: 0, max: 399 },
  questionable: { min: 400, max: 799 },
  neutral: { min: 800, max: 1199 },
  trusted: { min: 1200, max: 1599 },
  reputable: { min: 1600, max: 1999 },
  exemplary: { min: 2000, max: 2800 },
};

/**
 * Main hook for Ethos session management
 * 
 * Provides all auth state and methods.
 * 
 * @example
 * ```tsx
 * function Profile() {
 *   const { isAuthenticated, user, logout, isLoading } = useEthosSession();
 * 
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!isAuthenticated) return <div>Please sign in</div>;
 * 
 *   return (
 *     <div>
 *       <p>Welcome, {user?.name}!</p>
 *       <p>Ethos Score: {user?.ethosScore}</p>
 *       <button onClick={logout}>Sign out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useEthosSession() {
  return useEthosAuthContext();
}

/**
 * Hook to get the current user
 * 
 * Returns null if not authenticated.
 * 
 * @example
 * ```tsx
 * function UserAvatar() {
 *   const user = useEthosUser();
 *   if (!user) return null;
 *   return <img src={user.picture || '/default.png'} alt={user.name} />;
 * }
 * ```
 */
export function useEthosUser(): EthosUser | null {
  const { user } = useEthosAuthContext();
  return user;
}

/**
 * Hook to get the user's Ethos score with tier info
 * 
 * @example
 * ```tsx
 * function ScoreBadge() {
 *   const { score, tier, color } = useEthosScore();
 *   if (score === null) return null;
 * 
 *   return (
 *     <div style={{ color }}>
 *       {tier}: {score}
 *     </div>
 *   );
 * }
 * ```
 */
export function useEthosScore(): {
  score: number | null;
  tier: ScoreTierInfo['tier'] | null;
  tierInfo: ScoreTierInfo | null;
  color: string | null;
} {
  const { user } = useEthosAuthContext();
  
  return useMemo(() => {
    if (!user) {
      return { score: null, tier: null, tierInfo: null, color: null };
    }
    
    const score = user.ethosScore;
    const tierName = getScoreTier(score);
    const tierRange = TIER_RANGES[tierName] ?? { min: 0, max: 2800 };
    const tierColor = TIER_COLORS[tierName] ?? '#6b7280';
    
    const tierInfo: ScoreTierInfo = {
      tier: tierName as ScoreTierInfo['tier'],
      minScore: tierRange.min,
      maxScore: tierRange.max,
      color: tierColor,
    };
    
    return {
      score,
      tier: tierInfo.tier,
      tierInfo,
      color: tierInfo.color,
    };
  }, [user]);
}

/**
 * Hook to check if user meets a minimum score requirement
 * 
 * @example
 * ```tsx
 * function PremiumFeature() {
 *   const { meetsRequirement, score, requiredScore } = useMinScore(700);
 * 
 *   if (!meetsRequirement) {
 *     return <div>Need score {requiredScore}, you have {score}</div>;
 *   }
 * 
 *   return <div>Premium content here!</div>;
 * }
 * ```
 */
export function useMinScore(minScore: number): {
  meetsRequirement: boolean;
  score: number | null;
  requiredScore: number;
} {
  const { user } = useEthosAuthContext();
  
  return useMemo(() => {
    const score = user?.ethosScore ?? null;
    return {
      meetsRequirement: score !== null && score >= minScore,
      score,
      requiredScore: minScore,
    };
  }, [user, minScore]);
}

/**
 * Hook to get authentication status only
 * 
 * Lighter than useEthosSession when you only need auth status.
 * 
 * @example
 * ```tsx
 * function NavBar() {
 *   const { isAuthenticated, isLoading } = useIsAuthenticated();
 *   
 *   return isAuthenticated ? <LogoutButton /> : <LoginButton />;
 * }
 * ```
 */
export function useIsAuthenticated(): {
  isAuthenticated: boolean;
  isLoading: boolean;
} {
  const { isAuthenticated, isLoading } = useEthosAuthContext();
  return { isAuthenticated, isLoading };
}

/**
 * Hook to get the access token
 * 
 * Useful for making authenticated API calls.
 * 
 * @example
 * ```tsx
 * function useAuthenticatedFetch() {
 *   const token = useAccessToken();
 *   
 *   return useCallback(async (url: string) => {
 *     return fetch(url, {
 *       headers: {
 *         Authorization: token ? `Bearer ${token}` : '',
 *       },
 *     });
 *   }, [token]);
 * }
 * ```
 */
export function useAccessToken(): string | null {
  const { accessToken } = useEthosAuthContext();
  return accessToken;
}
