/**
 * Tests for types and utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  WALLETS,
  SCORE_COLORS,
  getScoreColor,
  getScoreLabel,
} from '../types';

describe('WALLETS', () => {
  it('should contain all supported wallets', () => {
    expect(WALLETS.metamask).toBeDefined();
    expect(WALLETS.rabby).toBeDefined();
    expect(WALLETS.phantom).toBeDefined();
    expect(WALLETS.zerion).toBeDefined();
    expect(WALLETS.coinbase).toBeDefined();
    expect(WALLETS.brave).toBeDefined();
  });

  it('should have correct wallet names', () => {
    expect(WALLETS.metamask.name).toBe('MetaMask');
    expect(WALLETS.rabby.name).toBe('Rabby');
    expect(WALLETS.phantom.name).toBe('Phantom');
    expect(WALLETS.zerion.name).toBe('Zerion');
    expect(WALLETS.coinbase.name).toBe('Coinbase Wallet');
    expect(WALLETS.brave.name).toBe('Brave Wallet');
  });

  it('should have deep links for mobile wallets', () => {
    expect(WALLETS.metamask.deepLink).toBeDefined();
    expect(WALLETS.phantom.deepLink).toBeDefined();
    expect(WALLETS.zerion.deepLink).toBeDefined();
    expect(WALLETS.coinbase.deepLink).toBeDefined();
  });
});

describe('SCORE_COLORS', () => {
  it('should have all score ranges defined', () => {
    expect(SCORE_COLORS).toHaveLength(7);
  });

  it('should cover the full score range 0-2800', () => {
    const ranges = SCORE_COLORS.map(r => ({ min: r.min, max: r.max }));
    
    // Check lowest starts at 0
    expect(ranges[0].min).toBe(0);
    
    // Check highest ends at 2800
    expect(ranges[ranges.length - 1].max).toBe(2800);
    
    // Check ranges are contiguous
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i].min).toBe(ranges[i - 1].max + 1);
    }
  });

  it('should have colors and labels for each range', () => {
    SCORE_COLORS.forEach(range => {
      expect(range.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(range.label).toBeTruthy();
    });
  });
});

describe('getScoreColor', () => {
  it('should return correct color for very low score', () => {
    expect(getScoreColor(0)).toBe('#ef4444');
    expect(getScoreColor(500)).toBe('#ef4444');
    expect(getScoreColor(699)).toBe('#ef4444');
  });

  it('should return correct color for low score', () => {
    expect(getScoreColor(700)).toBe('#f97316');
    expect(getScoreColor(850)).toBe('#f97316');
    expect(getScoreColor(999)).toBe('#f97316');
  });

  it('should return correct color for moderate score', () => {
    expect(getScoreColor(1000)).toBe('#eab308');
    expect(getScoreColor(1150)).toBe('#eab308');
    expect(getScoreColor(1299)).toBe('#eab308');
  });

  it('should return correct color for good score', () => {
    expect(getScoreColor(1300)).toBe('#84cc16');
    expect(getScoreColor(1450)).toBe('#84cc16');
    expect(getScoreColor(1599)).toBe('#84cc16');
  });

  it('should return correct color for great score', () => {
    expect(getScoreColor(1600)).toBe('#22c55e');
    expect(getScoreColor(1750)).toBe('#22c55e');
    expect(getScoreColor(1899)).toBe('#22c55e');
  });

  it('should return correct color for excellent score', () => {
    expect(getScoreColor(1900)).toBe('#14b8a6');
    expect(getScoreColor(2050)).toBe('#14b8a6');
    expect(getScoreColor(2199)).toBe('#14b8a6');
  });

  it('should return correct color for exemplary score', () => {
    expect(getScoreColor(2200)).toBe('#0ea5e9');
    expect(getScoreColor(2500)).toBe('#0ea5e9');
    expect(getScoreColor(2800)).toBe('#0ea5e9');
  });

  it('should return fallback color for out of range scores', () => {
    expect(getScoreColor(-100)).toBe('#6b7280');
    expect(getScoreColor(3000)).toBe('#6b7280');
  });
});

describe('getScoreLabel', () => {
  it('should return correct label for each range', () => {
    expect(getScoreLabel(500)).toBe('Very Low');
    expect(getScoreLabel(850)).toBe('Low');
    expect(getScoreLabel(1150)).toBe('Moderate');
    expect(getScoreLabel(1450)).toBe('Good');
    expect(getScoreLabel(1750)).toBe('Great');
    expect(getScoreLabel(2050)).toBe('Excellent');
    expect(getScoreLabel(2500)).toBe('Exemplary');
  });

  it('should return Unknown for out of range scores', () => {
    expect(getScoreLabel(-100)).toBe('Unknown');
    expect(getScoreLabel(3000)).toBe('Unknown');
  });
});
