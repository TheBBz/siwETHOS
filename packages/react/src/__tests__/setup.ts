/**
 * Test setup file
 */

import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  writable: true,
  value: undefined,
});

// Mock window.phantom
Object.defineProperty(window, 'phantom', {
  writable: true,
  value: undefined,
});

// Mock window.zerionWallet
Object.defineProperty(window, 'zerionWallet', {
  writable: true,
  value: undefined,
});
