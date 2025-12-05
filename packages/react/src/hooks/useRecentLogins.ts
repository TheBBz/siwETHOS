/**
 * Hook for managing recent login methods
 * Persists to localStorage for returning users
 */

import { useState, useEffect, useCallback } from 'react';
import type { RecentLogin, LoginMethodType, LoginMethodId } from '../types';

const STORAGE_KEY = 'ethos_recent_logins';
const MAX_RECENT = 5;

/**
 * Load recent logins from localStorage
 */
function loadRecentLogins(): RecentLogin[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored) as RecentLogin[];
    // Sort by last used, most recent first
    return parsed.sort((a, b) => b.lastUsed - a.lastUsed);
  } catch {
    return [];
  }
}

/**
 * Save recent logins to localStorage
 */
function saveRecentLogins(logins: RecentLogin[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logins));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Hook for managing recent login methods
 */
export function useRecentLogins() {
  const [recentLogins, setRecentLogins] = useState<RecentLogin[]>([]);

  // Load on mount
  useEffect(() => {
    setRecentLogins(loadRecentLogins());
  }, []);

  /**
   * Add or update a recent login
   */
  const addRecentLogin = useCallback((login: Omit<RecentLogin, 'lastUsed'>) => {
    setRecentLogins(prev => {
      // Remove existing entry for same method
      const filtered = prev.filter(
        r => !(r.type === login.type && r.id === login.id)
      );
      
      // Add new entry at the front
      const updated: RecentLogin[] = [
        { ...login, lastUsed: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT);
      
      saveRecentLogins(updated);
      return updated;
    });
  }, []);

  /**
   * Clear all recent logins
   */
  const clearRecentLogins = useCallback(() => {
    setRecentLogins([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /**
   * Get a specific recent login by type and id
   */
  const getRecentLogin = useCallback(
    (type: LoginMethodType, id: LoginMethodId): RecentLogin | undefined => {
      return recentLogins.find(r => r.type === type && r.id === id);
    },
    [recentLogins]
  );

  return {
    recentLogins,
    addRecentLogin,
    clearRecentLogins,
    getRecentLogin,
  };
}
