/**
 * EthosAuthProvider and Context Hooks Tests
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import {
  EthosAuthProvider,
  useEthosSession,
  useEthosUser,
  useEthosScore,
  useMinScore,
  useIsAuthenticated,
  useAccessToken,
  useEthosAuthContext,
  useIsInsideEthosProvider,
} from '../context';
import type { AuthResult, EthosUser } from '@thebbz/siwe-ethos';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock user
const mockUser: EthosUser = {
  sub: 'ethos:12345',
  name: 'Test User',
  picture: 'https://example.com/pic.jpg',
  ethosProfileId: 12345,
  ethosUsername: 'testuser',
  ethosScore: 1250, // trusted tier
  ethosStatus: 'active',
  ethosAttestations: ['twitter', 'discord'],
  authMethod: 'wallet',
  walletAddress: '0x1234567890123456789012345678901234567890',
};

// Mock auth result
const mockAuthResult: AuthResult = {
  accessToken: 'test-access-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
  user: mockUser,
  refreshToken: 'test-refresh-token',
};

// Test component that uses session
function TestComponent() {
  const { isAuthenticated, isLoading, user, login, logout } = useEthosSession();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user">{user?.name ?? 'none'}</div>
      <button onClick={() => login(mockAuthResult)}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// Test component for useEthosUser
function UserComponent() {
  const user = useEthosUser();
  return <div data-testid="user-name">{user?.name ?? 'none'}</div>;
}

// Test component for useEthosScore
function ScoreComponent() {
  const { score, tier, color } = useEthosScore();
  return (
    <div>
      <div data-testid="score">{score ?? 'none'}</div>
      <div data-testid="tier">{tier ?? 'none'}</div>
      <div data-testid="color">{color ?? 'none'}</div>
    </div>
  );
}

// Test component for useMinScore
function MinScoreComponent({ minScore }: { minScore: number }) {
  const { meetsRequirement, score, requiredScore } = useMinScore(minScore);
  return (
    <div>
      <div data-testid="meets">{meetsRequirement ? 'yes' : 'no'}</div>
      <div data-testid="score">{score ?? 'none'}</div>
      <div data-testid="required">{requiredScore}</div>
    </div>
  );
}

// Test component for useIsAuthenticated
function AuthStatusComponent() {
  const { isAuthenticated, isLoading } = useIsAuthenticated();
  return (
    <div>
      <div data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="loading">{isLoading ? 'yes' : 'no'}</div>
    </div>
  );
}

// Test component for useAccessToken
function TokenComponent() {
  const token = useAccessToken();
  return <div data-testid="token">{token ?? 'none'}</div>;
}

// Test component for useIsInsideEthosProvider
function InsideProviderComponent() {
  const isInside = useIsInsideEthosProvider();
  return <div data-testid="inside">{isInside ? 'yes' : 'no'}</div>;
}

describe('EthosAuthProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render children', () => {
    render(
      <EthosAuthProvider storageType="memory">
        <div data-testid="child">Hello</div>
      </EthosAuthProvider>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('should start with loading state then become loaded', async () => {
    render(
      <EthosAuthProvider storageType="memory">
        <TestComponent />
      </EthosAuthProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('should allow login and update state', async () => {
    render(
      <EthosAuthProvider storageType="memory">
        <TestComponent />
      </EthosAuthProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Login
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });
  });

  it('should allow logout and clear state', async () => {
    render(
      <EthosAuthProvider storageType="memory">
        <TestComponent />
      </EthosAuthProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Login first
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    // Then logout
    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      expect(screen.getByTestId('user')).toHaveTextContent('none');
    });
  });

  it('should call onAuthStateChange callback', async () => {
    const onAuthStateChange = vi.fn();

    render(
      <EthosAuthProvider
        storageType="memory"
        onAuthStateChange={onAuthStateChange}
      >
        <TestComponent />
      </EthosAuthProvider>
    );

    // Wait for initial callback (unauthenticated)
    await waitFor(() => {
      expect(onAuthStateChange).toHaveBeenCalledWith(
        expect.objectContaining({ isAuthenticated: false })
      );
    });

    // Login and check callback
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(onAuthStateChange).toHaveBeenCalledWith(
        expect.objectContaining({ isAuthenticated: true })
      );
    });
  });
});

describe('useEthosSession', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => { });

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useEthosAuthContext must be used within an EthosAuthProvider');

    spy.mockRestore();
  });
});

describe('useEthosUser', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null when not authenticated', async () => {
    render(
      <EthosAuthProvider storageType="memory">
        <UserComponent />
      </EthosAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('none');
    });
  });

  it('should return user when authenticated', async () => {
    render(
      <EthosAuthProvider storageType="memory">
        <UserComponent />
        <TestComponent />
      </EthosAuthProvider>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
  });
});

describe('useEthosScore', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null values when not authenticated', async () => {
    render(
      <EthosAuthProvider storageType="memory">
        <ScoreComponent />
      </EthosAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('score')).toHaveTextContent('none');
      expect(screen.getByTestId('tier')).toHaveTextContent('none');
      expect(screen.getByTestId('color')).toHaveTextContent('none');
    });
  });

  it('should return score and tier when authenticated', async () => {
    render(
      <EthosAuthProvider storageType="memory">
        <ScoreComponent />
        <TestComponent />
      </EthosAuthProvider>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('score')).toHaveTextContent('1250');
      expect(screen.getByTestId('tier')).toHaveTextContent('known'); // 1250 is in known tier (1200-1399)
      expect(screen.getByTestId('color')).not.toHaveTextContent('none');
    });
  });
});

describe('useMinScore', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return false when not authenticated', async () => {
    render(
      <EthosAuthProvider storageType="memory">
        <MinScoreComponent minScore={500} />
      </EthosAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('meets')).toHaveTextContent('no');
      expect(screen.getByTestId('score')).toHaveTextContent('none');
    });
  });

  it('should return true when score meets requirement', async () => {
    render(
      <EthosAuthProvider storageType="memory">
        <MinScoreComponent minScore={1000} />
        <TestComponent />
      </EthosAuthProvider>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('meets')).toHaveTextContent('yes');
      expect(screen.getByTestId('score')).toHaveTextContent('1250');
    });
  });

  it('should return false when score does not meet requirement', async () => {
    render(
      <EthosAuthProvider storageType="memory">
        <MinScoreComponent minScore={1500} />
        <TestComponent />
      </EthosAuthProvider>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('meets')).toHaveTextContent('no');
      expect(screen.getByTestId('required')).toHaveTextContent('1500');
    });
  });
});

describe('useIsAuthenticated', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return loading and auth status', async () => {
    render(
      <EthosAuthProvider storageType="memory">
        <AuthStatusComponent />
      </EthosAuthProvider>
    );

    // Eventually loading should be false
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('no');
    });

    expect(screen.getByTestId('auth')).toHaveTextContent('no');
  });
});

describe('useAccessToken', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null when not authenticated', async () => {
    render(
      <EthosAuthProvider storageType="memory">
        <TokenComponent />
      </EthosAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('none');
    });
  });

  it('should return token when authenticated', async () => {
    render(
      <EthosAuthProvider storageType="memory">
        <TokenComponent />
        <TestComponent />
      </EthosAuthProvider>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('test-access-token');
    });
  });
});

describe('useIsInsideEthosProvider', () => {
  it('should return true inside provider', () => {
    render(
      <EthosAuthProvider storageType="memory">
        <InsideProviderComponent />
      </EthosAuthProvider>
    );

    expect(screen.getByTestId('inside')).toHaveTextContent('yes');
  });

  it('should return false outside provider', () => {
    render(<InsideProviderComponent />);
    expect(screen.getByTestId('inside')).toHaveTextContent('no');
  });
});
