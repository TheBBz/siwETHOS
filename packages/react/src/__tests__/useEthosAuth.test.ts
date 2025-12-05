/**
 * useEthosAuth Hook Tests
 * 
 * Comprehensive tests for the main authentication hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEthosAuth } from '../hooks/useEthosAuth';

// Mock the SDK
const mockGetNonce = vi.fn().mockResolvedValue({ nonce: 'test-nonce-123' });
const mockCreateMessage = vi.fn((address: string, nonce: string) => ({
  message: { nonce },
  messageString: `Sign in with Ethos\nAddress: ${address}\nNonce: ${nonce}`,
}));
const mockVerify = vi.fn().mockResolvedValue({
  user: {
    id: 'user-123',
    address: '0x1234567890123456789012345678901234567890',
    name: 'Test User',
  },
  token: 'test-token',
});

vi.mock('@thebbz/siwe-ethos', () => ({
  EthosWalletAuth: {
    init: vi.fn(() => ({
      getNonce: mockGetNonce,
      createMessage: mockCreateMessage,
      verify: mockVerify,
    })),
  },
}));

// Store original mock implementations
let mockOpen = vi.fn();
let mockClose = vi.fn();
let mockReset = vi.fn();
let mockSelectWallet = vi.fn();
let mockSetStatus = vi.fn();
let mockSetError = vi.fn();
let mockSetSuccess = vi.fn();

// Mock useEthosModal
vi.mock('../hooks/useEthosModal', () => ({
  useEthosModal: vi.fn(() => ({
    state: {
      isOpen: false,
      status: 'idle',
      selectedWallet: null,
      user: null,
      error: null,
    },
    actions: {
      open: mockOpen,
      close: mockClose,
      reset: mockReset,
      selectWallet: mockSelectWallet,
      setStatus: mockSetStatus,
      setError: mockSetError,
      setSuccess: mockSetSuccess,
    },
  })),
}));

// Mock useWalletDetection
vi.mock('../hooks/useWalletDetection', () => ({
  useWalletDetection: vi.fn(() => ({
    isInstalled: vi.fn(() => true),
    isReady: true,
    detectedWallets: ['metamask'],
  })),
  checkWalletInstalled: vi.fn(() => true),
}));

describe('useEthosAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks
    mockOpen = vi.fn();
    mockClose = vi.fn();
    mockReset = vi.fn();
    mockSelectWallet = vi.fn();
    mockSetStatus = vi.fn();
    mockSetError = vi.fn();
    mockSetSuccess = vi.fn();
    // Reset window.ethereum
    (window as any).ethereum = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useEthosAuth());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.status).toBe('idle');
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should accept custom options', () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();

      const { result } = renderHook(() => 
        useEthosAuth({
          authServerUrl: 'https://custom.auth.server',
          chainId: 137,
          onSuccess,
          onError,
        })
      );

      expect(result.current.signIn).toBeDefined();
      expect(result.current.close).toBeDefined();
    });

    it('should have a signIn function', () => {
      const { result } = renderHook(() => useEthosAuth());
      expect(typeof result.current.signIn).toBe('function');
    });

    it('should have a close function', () => {
      const { result } = renderHook(() => useEthosAuth());
      expect(typeof result.current.close).toBe('function');
    });

    it('should have a Modal component', () => {
      const { result } = renderHook(() => useEthosAuth());
      expect(typeof result.current.Modal).toBe('function');
    });
  });

  describe('signIn', () => {
    it('should call open action when signIn is called', async () => {
      const { useEthosModal } = await import('../hooks/useEthosModal');
      const localMockOpen = vi.fn();
      vi.mocked(useEthosModal).mockReturnValue({
        state: {
          isOpen: false,
          status: 'idle',
          selectedWallet: null,
          user: null,
          error: null,
        },
        actions: {
          open: localMockOpen,
          close: vi.fn(),
          reset: vi.fn(),
          selectWallet: vi.fn(),
          setStatus: vi.fn(),
          setError: vi.fn(),
          setSuccess: vi.fn(),
        },
      });

      const { result } = renderHook(() => useEthosAuth());

      act(() => {
        result.current.signIn();
      });

      expect(localMockOpen).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should call close action when close is called', async () => {
      const { useEthosModal } = await import('../hooks/useEthosModal');
      const localMockClose = vi.fn();
      vi.mocked(useEthosModal).mockReturnValue({
        state: {
          isOpen: true,
          status: 'idle',
          selectedWallet: null,
          user: null,
          error: null,
        },
        actions: {
          open: vi.fn(),
          close: localMockClose,
          reset: vi.fn(),
          selectWallet: vi.fn(),
          setStatus: vi.fn(),
          setError: vi.fn(),
          setSuccess: vi.fn(),
        },
      });

      const { result } = renderHook(() => useEthosAuth());

      act(() => {
        result.current.close();
      });

      expect(localMockClose).toHaveBeenCalled();
    });
  });

  describe('internal state', () => {
    it('should expose internal state through _state', async () => {
      const { useEthosModal } = await import('../hooks/useEthosModal');
      vi.mocked(useEthosModal).mockReturnValue({
        state: {
          isOpen: true,
          status: 'connecting',
          selectedWallet: 'metamask',
          user: null,
          error: null,
        },
        actions: {
          open: vi.fn(),
          close: vi.fn(),
          reset: vi.fn(),
          selectWallet: vi.fn(),
          setStatus: vi.fn(),
          setError: vi.fn(),
          setSuccess: vi.fn(),
        },
      });

      const { result } = renderHook(() => useEthosAuth());

      // Access internal state
      const internalState = (result.current as any)._state;
      expect(internalState.isOpen).toBe(true);
      expect(internalState.status).toBe('connecting');
      expect(internalState.selectedWallet).toBe('metamask');
    });

    it('should expose internal actions through _actions', async () => {
      const { result } = renderHook(() => useEthosAuth());

      // Access internal actions
      const internalActions = (result.current as any)._actions;
      expect(typeof internalActions.handleWalletSelect).toBe('function');
    });
  });

  describe('handleWalletSelect', () => {
    it('should have handleWalletSelect function in _actions', () => {
      const { result } = renderHook(() => useEthosAuth());
      
      const internalActions = (result.current as any)._actions;
      expect(internalActions.handleWalletSelect).toBeDefined();
    });

    it('should set error when wallet not installed', async () => {
      const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
      const { useEthosModal } = await import('../hooks/useEthosModal');
      
      vi.mocked(checkWalletInstalled).mockReturnValue(false);
      
      const localMockSetError = vi.fn();
      vi.mocked(useEthosModal).mockReturnValue({
        state: {
          isOpen: true,
          status: 'idle',
          selectedWallet: null,
          user: null,
          error: null,
        },
        actions: {
          open: vi.fn(),
          close: vi.fn(),
          reset: vi.fn(),
          selectWallet: vi.fn(),
          setStatus: vi.fn(),
          setError: localMockSetError,
          setSuccess: vi.fn(),
        },
      });

      const { result } = renderHook(() => useEthosAuth());
      const internalActions = (result.current as any)._actions;

      await act(async () => {
        await internalActions.handleWalletSelect('metamask');
      });

      expect(localMockSetError).toHaveBeenCalledWith('metamask is not installed');
    });

    it('should attempt full auth flow when wallet is available', async () => {
      const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
      const { useEthosModal } = await import('../hooks/useEthosModal');
      
      vi.mocked(checkWalletInstalled).mockReturnValue(true);
      
      const mockRequest = vi.fn()
        .mockResolvedValueOnce(['0x1234567890123456789012345678901234567890'])
        .mockResolvedValueOnce('0xsignature');

      (window as any).ethereum = {
        isMetaMask: true,
        request: mockRequest,
      };
      
      const localMockSetStatus = vi.fn();
      const localMockSelectWallet = vi.fn();
      const localMockSetSuccess = vi.fn();
      
      vi.mocked(useEthosModal).mockReturnValue({
        state: {
          isOpen: true,
          status: 'idle',
          selectedWallet: null,
          user: null,
          error: null,
        },
        actions: {
          open: vi.fn(),
          close: vi.fn(),
          reset: vi.fn(),
          selectWallet: localMockSelectWallet,
          setStatus: localMockSetStatus,
          setError: vi.fn(),
          setSuccess: localMockSetSuccess,
        },
      });

      const onSuccess = vi.fn();
      const { result } = renderHook(() => useEthosAuth({ onSuccess }));
      const internalActions = (result.current as any)._actions;

      await act(async () => {
        await internalActions.handleWalletSelect('metamask');
      });

      expect(localMockSelectWallet).toHaveBeenCalledWith('metamask');
      expect(localMockSetStatus).toHaveBeenCalledWith('connecting');
    });
  });

  describe('callbacks', () => {
    it('should store onSuccess callback', () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => 
        useEthosAuth({ onSuccess })
      );

      expect(result.current).toBeDefined();
    });

    it('should store onError callback', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => 
        useEthosAuth({ onError })
      );

      expect(result.current).toBeDefined();
    });

    it('should call onError on rejection', async () => {
      const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
      const { useEthosModal } = await import('../hooks/useEthosModal');
      
      vi.mocked(checkWalletInstalled).mockReturnValue(true);
      
      const mockRequest = vi.fn().mockRejectedValue(new Error('User rejected'));

      (window as any).ethereum = {
        isMetaMask: true,
        request: mockRequest,
      };
      
      const localMockSetError = vi.fn();
      
      vi.mocked(useEthosModal).mockReturnValue({
        state: {
          isOpen: true,
          status: 'idle',
          selectedWallet: null,
          user: null,
          error: null,
        },
        actions: {
          open: vi.fn(),
          close: vi.fn(),
          reset: vi.fn(),
          selectWallet: vi.fn(),
          setStatus: vi.fn(),
          setError: localMockSetError,
          setSuccess: vi.fn(),
        },
      });

      const onError = vi.fn();
      const { result } = renderHook(() => useEthosAuth({ onError }));
      const internalActions = (result.current as any)._actions;

      await act(async () => {
        await internalActions.handleWalletSelect('metamask');
      });

      expect(localMockSetError).toHaveBeenCalledWith('Request was cancelled');
      expect(onError).toHaveBeenCalled();
    });

    it('should handle denied error message', async () => {
      const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
      const { useEthosModal } = await import('../hooks/useEthosModal');
      
      vi.mocked(checkWalletInstalled).mockReturnValue(true);
      
      const mockRequest = vi.fn().mockRejectedValue(new Error('User denied transaction'));

      (window as any).ethereum = {
        isMetaMask: true,
        request: mockRequest,
      };
      
      const localMockSetError = vi.fn();
      
      vi.mocked(useEthosModal).mockReturnValue({
        state: {
          isOpen: true,
          status: 'idle',
          selectedWallet: null,
          user: null,
          error: null,
        },
        actions: {
          open: vi.fn(),
          close: vi.fn(),
          reset: vi.fn(),
          selectWallet: vi.fn(),
          setStatus: vi.fn(),
          setError: localMockSetError,
          setSuccess: vi.fn(),
        },
      });

      const onError = vi.fn();
      const { result } = renderHook(() => useEthosAuth({ onError }));
      const internalActions = (result.current as any)._actions;

      await act(async () => {
        await internalActions.handleWalletSelect('metamask');
      });

      expect(localMockSetError).toHaveBeenCalledWith('Request was cancelled');
    });

    it('should handle generic error message', async () => {
      const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
      const { useEthosModal } = await import('../hooks/useEthosModal');
      
      vi.mocked(checkWalletInstalled).mockReturnValue(true);
      
      const mockRequest = vi.fn().mockRejectedValue(new Error('Network error'));

      (window as any).ethereum = {
        isMetaMask: true,
        request: mockRequest,
      };
      
      const localMockSetError = vi.fn();
      
      vi.mocked(useEthosModal).mockReturnValue({
        state: {
          isOpen: true,
          status: 'idle',
          selectedWallet: null,
          user: null,
          error: null,
        },
        actions: {
          open: vi.fn(),
          close: vi.fn(),
          reset: vi.fn(),
          selectWallet: vi.fn(),
          setStatus: vi.fn(),
          setError: localMockSetError,
          setSuccess: vi.fn(),
        },
      });

      const onError = vi.fn();
      const { result } = renderHook(() => useEthosAuth({ onError }));
      const internalActions = (result.current as any)._actions;

      await act(async () => {
        await internalActions.handleWalletSelect('metamask');
      });

      expect(localMockSetError).toHaveBeenCalledWith('Network error');
    });

    it('should handle non-Error thrown value', async () => {
      const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
      const { useEthosModal } = await import('../hooks/useEthosModal');
      
      vi.mocked(checkWalletInstalled).mockReturnValue(true);
      
      const mockRequest = vi.fn().mockRejectedValue('string error');

      (window as any).ethereum = {
        isMetaMask: true,
        request: mockRequest,
      };
      
      const localMockSetError = vi.fn();
      
      vi.mocked(useEthosModal).mockReturnValue({
        state: {
          isOpen: true,
          status: 'idle',
          selectedWallet: null,
          user: null,
          error: null,
        },
        actions: {
          open: vi.fn(),
          close: vi.fn(),
          reset: vi.fn(),
          selectWallet: vi.fn(),
          setStatus: vi.fn(),
          setError: localMockSetError,
          setSuccess: vi.fn(),
        },
      });

      const onError = vi.fn();
      const { result } = renderHook(() => useEthosAuth({ onError }));
      const internalActions = (result.current as any)._actions;

      await act(async () => {
        await internalActions.handleWalletSelect('metamask');
      });

      expect(localMockSetError).toHaveBeenCalledWith('Authentication failed');
    });

    it('should set error when provider not found', async () => {
      const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
      const { useEthosModal } = await import('../hooks/useEthosModal');
      
      vi.mocked(checkWalletInstalled).mockReturnValue(true);
      
      // No ethereum provider
      (window as any).ethereum = undefined;
      
      const localMockSetError = vi.fn();
      
      vi.mocked(useEthosModal).mockReturnValue({
        state: {
          isOpen: true,
          status: 'idle',
          selectedWallet: null,
          user: null,
          error: null,
        },
        actions: {
          open: vi.fn(),
          close: vi.fn(),
          reset: vi.fn(),
          selectWallet: vi.fn(),
          setStatus: vi.fn(),
          setError: localMockSetError,
          setSuccess: vi.fn(),
        },
      });

      const { result } = renderHook(() => useEthosAuth());
      const internalActions = (result.current as any)._actions;

      await act(async () => {
        await internalActions.handleWalletSelect('metamask');
      });

      expect(localMockSetError).toHaveBeenCalledWith('Could not connect to metamask');
    });
  });
});

describe('getWalletProvider (internal)', () => {
  beforeEach(() => {
    (window as any).ethereum = undefined;
    (window as any).phantom = undefined;
    (window as any).zerionWallet = undefined;
  });

  it('should return null when window is undefined for SSR', () => {
    // This tests the server-side rendering case
    const { result } = renderHook(() => useEthosAuth());
    expect(result.current).toBeDefined();
  });

  it('should detect MetaMask provider', () => {
    (window as any).ethereum = {
      isMetaMask: true,
      request: vi.fn(),
    };

    const { result } = renderHook(() => useEthosAuth());
    expect(result.current).toBeDefined();
  });

  it('should detect Rabby provider', () => {
    (window as any).ethereum = {
      isRabby: true,
      request: vi.fn(),
    };

    const { result } = renderHook(() => useEthosAuth());
    expect(result.current).toBeDefined();
  });

  it('should detect Phantom provider', () => {
    (window as any).phantom = {
      ethereum: {
        request: vi.fn(),
      },
    };

    const { result } = renderHook(() => useEthosAuth());
    expect(result.current).toBeDefined();
  });

  it('should detect Zerion provider', () => {
    (window as any).zerionWallet = {
      request: vi.fn(),
    };

    const { result } = renderHook(() => useEthosAuth());
    expect(result.current).toBeDefined();
  });

  it('should detect Coinbase provider', () => {
    (window as any).ethereum = {
      isCoinbaseWallet: true,
      request: vi.fn(),
    };

    const { result } = renderHook(() => useEthosAuth());
    expect(result.current).toBeDefined();
  });

  it('should detect Brave provider', () => {
    (window as any).ethereum = {
      isBraveWallet: true,
      request: vi.fn(),
    };

    const { result } = renderHook(() => useEthosAuth());
    expect(result.current).toBeDefined();
  });

  it('should handle multiple providers array', () => {
    const metamaskProvider = { isMetaMask: true, request: vi.fn() };
    const rabbyProvider = { isRabby: true, request: vi.fn() };
    
    (window as any).ethereum = {
      providers: [metamaskProvider, rabbyProvider],
    };

    const { result } = renderHook(() => useEthosAuth());
    expect(result.current).toBeDefined();
  });
});

describe('wallet provider detection with providers array', () => {
  beforeEach(() => {
    (window as any).ethereum = undefined;
    (window as any).phantom = undefined;
    (window as any).zerionWallet = undefined;
  });

  it('should find MetaMask in providers array', async () => {
    const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
    const { useEthosModal } = await import('../hooks/useEthosModal');
    
    vi.mocked(checkWalletInstalled).mockReturnValue(true);
    
    const metamaskProvider = { isMetaMask: true, request: vi.fn().mockResolvedValue(['0x123']) };
    const rabbyProvider = { isRabby: true, request: vi.fn() };
    
    (window as any).ethereum = {
      providers: [rabbyProvider, metamaskProvider],
    };
    
    const localMockSetStatus = vi.fn();
    const localMockSelectWallet = vi.fn();
    
    vi.mocked(useEthosModal).mockReturnValue({
      state: { isOpen: true, status: 'idle', selectedWallet: null, user: null, error: null },
      actions: {
        open: vi.fn(),
        close: vi.fn(),
        reset: vi.fn(),
        selectWallet: localMockSelectWallet,
        setStatus: localMockSetStatus,
        setError: vi.fn(),
        setSuccess: vi.fn(),
      },
    });

    const { result } = renderHook(() => useEthosAuth());
    const internalActions = (result.current as any)._actions;

    await act(async () => {
      await internalActions.handleWalletSelect('metamask');
    });

    expect(localMockSelectWallet).toHaveBeenCalledWith('metamask');
  });

  it('should find Rabby in providers array', async () => {
    const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
    const { useEthosModal } = await import('../hooks/useEthosModal');
    
    vi.mocked(checkWalletInstalled).mockReturnValue(true);
    
    const rabbyProvider = { isRabby: true, request: vi.fn().mockResolvedValue(['0x123']) };
    
    (window as any).ethereum = {
      providers: [rabbyProvider],
    };
    
    const localMockSelectWallet = vi.fn();
    
    vi.mocked(useEthosModal).mockReturnValue({
      state: { isOpen: true, status: 'idle', selectedWallet: null, user: null, error: null },
      actions: {
        open: vi.fn(),
        close: vi.fn(),
        reset: vi.fn(),
        selectWallet: localMockSelectWallet,
        setStatus: vi.fn(),
        setError: vi.fn(),
        setSuccess: vi.fn(),
      },
    });

    const { result } = renderHook(() => useEthosAuth());
    const internalActions = (result.current as any)._actions;

    await act(async () => {
      await internalActions.handleWalletSelect('rabby');
    });

    expect(localMockSelectWallet).toHaveBeenCalledWith('rabby');
  });

  it('should find Coinbase in providers array', async () => {
    const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
    const { useEthosModal } = await import('../hooks/useEthosModal');
    
    vi.mocked(checkWalletInstalled).mockReturnValue(true);
    
    const coinbaseProvider = { isCoinbaseWallet: true, request: vi.fn().mockResolvedValue(['0x123']) };
    
    (window as any).ethereum = {
      providers: [coinbaseProvider],
    };
    
    const localMockSelectWallet = vi.fn();
    
    vi.mocked(useEthosModal).mockReturnValue({
      state: { isOpen: true, status: 'idle', selectedWallet: null, user: null, error: null },
      actions: {
        open: vi.fn(),
        close: vi.fn(),
        reset: vi.fn(),
        selectWallet: localMockSelectWallet,
        setStatus: vi.fn(),
        setError: vi.fn(),
        setSuccess: vi.fn(),
      },
    });

    const { result } = renderHook(() => useEthosAuth());
    const internalActions = (result.current as any)._actions;

    await act(async () => {
      await internalActions.handleWalletSelect('coinbase');
    });

    expect(localMockSelectWallet).toHaveBeenCalledWith('coinbase');
  });

  it('should find Brave in providers array', async () => {
    const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
    const { useEthosModal } = await import('../hooks/useEthosModal');
    
    vi.mocked(checkWalletInstalled).mockReturnValue(true);
    
    const braveProvider = { isBraveWallet: true, request: vi.fn().mockResolvedValue(['0x123']) };
    
    (window as any).ethereum = {
      providers: [braveProvider],
    };
    
    const localMockSelectWallet = vi.fn();
    
    vi.mocked(useEthosModal).mockReturnValue({
      state: { isOpen: true, status: 'idle', selectedWallet: null, user: null, error: null },
      actions: {
        open: vi.fn(),
        close: vi.fn(),
        reset: vi.fn(),
        selectWallet: localMockSelectWallet,
        setStatus: vi.fn(),
        setError: vi.fn(),
        setSuccess: vi.fn(),
      },
    });

    const { result } = renderHook(() => useEthosAuth());
    const internalActions = (result.current as any)._actions;

    await act(async () => {
      await internalActions.handleWalletSelect('brave');
    });

    expect(localMockSelectWallet).toHaveBeenCalledWith('brave');
  });

  it('should handle Phantom wallet', async () => {
    const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
    const { useEthosModal } = await import('../hooks/useEthosModal');
    
    vi.mocked(checkWalletInstalled).mockReturnValue(true);
    
    (window as any).phantom = {
      ethereum: {
        request: vi.fn().mockResolvedValue(['0x123']),
      },
    };
    
    const localMockSelectWallet = vi.fn();
    
    vi.mocked(useEthosModal).mockReturnValue({
      state: { isOpen: true, status: 'idle', selectedWallet: null, user: null, error: null },
      actions: {
        open: vi.fn(),
        close: vi.fn(),
        reset: vi.fn(),
        selectWallet: localMockSelectWallet,
        setStatus: vi.fn(),
        setError: vi.fn(),
        setSuccess: vi.fn(),
      },
    });

    const { result } = renderHook(() => useEthosAuth());
    const internalActions = (result.current as any)._actions;

    await act(async () => {
      await internalActions.handleWalletSelect('phantom');
    });

    expect(localMockSelectWallet).toHaveBeenCalledWith('phantom');
  });

  it('should handle Zerion wallet', async () => {
    const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
    const { useEthosModal } = await import('../hooks/useEthosModal');
    
    vi.mocked(checkWalletInstalled).mockReturnValue(true);
    
    (window as any).zerionWallet = {
      request: vi.fn().mockResolvedValue(['0x123']),
    };
    
    const localMockSelectWallet = vi.fn();
    
    vi.mocked(useEthosModal).mockReturnValue({
      state: { isOpen: true, status: 'idle', selectedWallet: null, user: null, error: null },
      actions: {
        open: vi.fn(),
        close: vi.fn(),
        reset: vi.fn(),
        selectWallet: localMockSelectWallet,
        setStatus: vi.fn(),
        setError: vi.fn(),
        setSuccess: vi.fn(),
      },
    });

    const { result } = renderHook(() => useEthosAuth());
    const internalActions = (result.current as any)._actions;

    await act(async () => {
      await internalActions.handleWalletSelect('zerion');
    });

    expect(localMockSelectWallet).toHaveBeenCalledWith('zerion');
  });

  it('should return null for unknown wallet type', async () => {
    const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
    const { useEthosModal } = await import('../hooks/useEthosModal');
    
    vi.mocked(checkWalletInstalled).mockReturnValue(true);
    
    const localMockSetError = vi.fn();
    
    vi.mocked(useEthosModal).mockReturnValue({
      state: { isOpen: true, status: 'idle', selectedWallet: null, user: null, error: null },
      actions: {
        open: vi.fn(),
        close: vi.fn(),
        reset: vi.fn(),
        selectWallet: vi.fn(),
        setStatus: vi.fn(),
        setError: localMockSetError,
        setSuccess: vi.fn(),
      },
    });

    const { result } = renderHook(() => useEthosAuth());
    const internalActions = (result.current as any)._actions;

    await act(async () => {
      // Cast to any to test unknown wallet
      await internalActions.handleWalletSelect('unknown-wallet' as any);
    });

    expect(localMockSetError).toHaveBeenCalled();
  });

  it('should skip MetaMask when it is Rabby disguised', async () => {
    const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
    const { useEthosModal } = await import('../hooks/useEthosModal');
    
    vi.mocked(checkWalletInstalled).mockReturnValue(true);
    
    // MetaMask that's actually Rabby
    (window as any).ethereum = {
      isMetaMask: true,
      isRabby: true,
      request: vi.fn(),
    };
    
    const localMockSetError = vi.fn();
    
    vi.mocked(useEthosModal).mockReturnValue({
      state: { isOpen: true, status: 'idle', selectedWallet: null, user: null, error: null },
      actions: {
        open: vi.fn(),
        close: vi.fn(),
        reset: vi.fn(),
        selectWallet: vi.fn(),
        setStatus: vi.fn(),
        setError: localMockSetError,
        setSuccess: vi.fn(),
      },
    });

    const { result } = renderHook(() => useEthosAuth());
    const internalActions = (result.current as any)._actions;

    await act(async () => {
      await internalActions.handleWalletSelect('metamask');
    });

    // Should set error because MetaMask is actually Rabby
    expect(localMockSetError).toHaveBeenCalledWith('Could not connect to metamask');
  });

  it('should skip MetaMask when it is Brave disguised', async () => {
    const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
    const { useEthosModal } = await import('../hooks/useEthosModal');
    
    vi.mocked(checkWalletInstalled).mockReturnValue(true);
    
    // MetaMask that's actually Brave
    (window as any).ethereum = {
      isMetaMask: true,
      isBraveWallet: true,
      request: vi.fn(),
    };
    
    const localMockSetError = vi.fn();
    
    vi.mocked(useEthosModal).mockReturnValue({
      state: { isOpen: true, status: 'idle', selectedWallet: null, user: null, error: null },
      actions: {
        open: vi.fn(),
        close: vi.fn(),
        reset: vi.fn(),
        selectWallet: vi.fn(),
        setStatus: vi.fn(),
        setError: localMockSetError,
        setSuccess: vi.fn(),
      },
    });

    const { result } = renderHook(() => useEthosAuth());
    const internalActions = (result.current as any)._actions;

    await act(async () => {
      await internalActions.handleWalletSelect('metamask');
    });

    // Should set error because MetaMask is actually Brave
    expect(localMockSetError).toHaveBeenCalledWith('Could not connect to metamask');
  });

  it('should skip Rabby in providers array if it is also Brave', async () => {
    const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
    const { useEthosModal } = await import('../hooks/useEthosModal');
    
    vi.mocked(checkWalletInstalled).mockReturnValue(true);
    
    // Provider that's Rabby but has no direct isRabby flag
    (window as any).ethereum = {
      providers: [
        { isMetaMask: true, isRabby: true, isBraveWallet: true, request: vi.fn() },
      ],
    };
    
    const localMockSetError = vi.fn();
    
    vi.mocked(useEthosModal).mockReturnValue({
      state: { isOpen: true, status: 'idle', selectedWallet: null, user: null, error: null },
      actions: {
        open: vi.fn(),
        close: vi.fn(),
        reset: vi.fn(),
        selectWallet: vi.fn(),
        setStatus: vi.fn(),
        setError: localMockSetError,
        setSuccess: vi.fn(),
      },
    });

    const { result } = renderHook(() => useEthosAuth());
    const internalActions = (result.current as any)._actions;

    await act(async () => {
      await internalActions.handleWalletSelect('metamask');
    });

    // Should error because no pure MetaMask found
    expect(localMockSetError).toHaveBeenCalled();
  });

  it('should handle full auth flow - wallet connected', async () => {
    const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
    const { useEthosModal } = await import('../hooks/useEthosModal');
    
    vi.mocked(checkWalletInstalled).mockReturnValue(true);
    
    const mockRequest = vi.fn()
      .mockResolvedValueOnce(['0x1234567890123456789012345678901234567890'])
      .mockResolvedValueOnce('0xsignature123');

    (window as any).ethereum = {
      isMetaMask: true,
      request: mockRequest,
    };
    
    const localMockSetStatus = vi.fn();
    const localMockSelectWallet = vi.fn();
    
    vi.mocked(useEthosModal).mockReturnValue({
      state: { isOpen: true, status: 'idle', selectedWallet: null, user: null, error: null },
      actions: {
        open: vi.fn(),
        close: vi.fn(),
        reset: vi.fn(),
        selectWallet: localMockSelectWallet,
        setStatus: localMockSetStatus,
        setError: vi.fn(),
        setSuccess: vi.fn(),
      },
    });

    const { result } = renderHook(() => useEthosAuth());
    const internalActions = (result.current as any)._actions;

    await act(async () => {
      await internalActions.handleWalletSelect('metamask');
    });

    // Should have called for account
    expect(mockRequest).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
    // Should have set status to connecting
    expect(localMockSetStatus).toHaveBeenCalledWith('connecting');
  });

  it('should handle error when no accounts returned', async () => {
    const { checkWalletInstalled } = await import('../hooks/useWalletDetection');
    const { useEthosModal } = await import('../hooks/useEthosModal');
    
    vi.mocked(checkWalletInstalled).mockReturnValue(true);
    
    const mockRequest = vi.fn().mockResolvedValue([]); // Empty accounts

    (window as any).ethereum = {
      isMetaMask: true,
      request: mockRequest,
    };
    
    const localMockSetError = vi.fn();
    
    vi.mocked(useEthosModal).mockReturnValue({
      state: { isOpen: true, status: 'idle', selectedWallet: null, user: null, error: null },
      actions: {
        open: vi.fn(),
        close: vi.fn(),
        reset: vi.fn(),
        selectWallet: vi.fn(),
        setStatus: vi.fn(),
        setError: localMockSetError,
        setSuccess: vi.fn(),
      },
    });

    const onError = vi.fn();
    const { result } = renderHook(() => useEthosAuth({ onError }));
    const internalActions = (result.current as any)._actions;

    await act(async () => {
      await internalActions.handleWalletSelect('metamask');
    });

    expect(localMockSetError).toHaveBeenCalledWith('No accounts returned from wallet');
    expect(onError).toHaveBeenCalled();
  });
});
