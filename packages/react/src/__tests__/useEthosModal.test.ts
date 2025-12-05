/**
 * Tests for useEthosModal hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEthosModal } from '../hooks/useEthosModal';

describe('useEthosModal hook', () => {
  it('should initialize with closed modal', () => {
    const { result } = renderHook(() => useEthosModal());
    
    expect(result.current.state.isOpen).toBe(false);
    expect(result.current.state.view).toBe('main');
    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.selectedMethod).toBeNull();
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.user).toBeNull();
  });

  it('should open the modal', () => {
    const { result } = renderHook(() => useEthosModal());
    
    act(() => {
      result.current.actions.open();
    });
    
    expect(result.current.state.isOpen).toBe(true);
    expect(result.current.state.view).toBe('main');
  });

  it('should close the modal', () => {
    const { result } = renderHook(() => useEthosModal());
    
    act(() => {
      result.current.actions.open();
    });
    
    act(() => {
      result.current.actions.close();
    });
    
    expect(result.current.state.isOpen).toBe(false);
  });

  it('should select a wallet and change view', () => {
    const { result } = renderHook(() => useEthosModal());
    
    act(() => {
      result.current.actions.open();
    });
    
    act(() => {
      result.current.actions.selectWallet('metamask');
    });
    
    expect(result.current.state.selectedMethod).toEqual({ type: 'wallet', id: 'metamask' });
    expect(result.current.state.view).toBe('connecting');
    expect(result.current.state.status).toBe('connecting');
  });

  it('should select a social provider and change view', () => {
    const { result } = renderHook(() => useEthosModal());
    
    act(() => {
      result.current.actions.open();
    });
    
    act(() => {
      result.current.actions.selectSocial('twitter');
    });
    
    expect(result.current.state.selectedMethod).toEqual({ type: 'social', id: 'twitter' });
    expect(result.current.state.view).toBe('connecting');
    expect(result.current.state.status).toBe('connecting');
  });

  it('should update status', () => {
    const { result } = renderHook(() => useEthosModal());
    
    act(() => {
      result.current.actions.selectWallet('metamask');
    });
    
    act(() => {
      result.current.actions.setStatus('signing');
    });
    
    expect(result.current.state.status).toBe('signing');
  });

  it('should set error and change view', () => {
    const { result } = renderHook(() => useEthosModal());
    
    act(() => {
      result.current.actions.setError('Connection failed');
    });
    
    expect(result.current.state.view).toBe('error');
    expect(result.current.state.status).toBe('error');
    expect(result.current.state.error).toBe('Connection failed');
  });

  it('should set success with user', () => {
    const { result } = renderHook(() => useEthosModal());
    const mockUser = {
      sub: 'ethos:123',
      name: 'Test User',
      picture: null,
      ethosProfileId: 123,
      ethosUsername: 'testuser',
      ethosScore: 1500,
      ethosStatus: 'active',
      ethosAttestations: [],
      authMethod: 'wallet' as const,
    };
    
    act(() => {
      result.current.actions.setSuccess(mockUser);
    });
    
    expect(result.current.state.view).toBe('success');
    expect(result.current.state.status).toBe('success');
    expect(result.current.state.user).toEqual(mockUser);
    expect(result.current.state.error).toBeNull();
  });

  it('should go back to main view', () => {
    const { result } = renderHook(() => useEthosModal());
    
    act(() => {
      result.current.actions.selectWallet('metamask');
    });
    
    act(() => {
      result.current.actions.goBack();
    });
    
    expect(result.current.state.view).toBe('main');
    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.selectedMethod).toBeNull();
  });

  it('should reset to initial state', () => {
    const { result } = renderHook(() => useEthosModal());
    
    act(() => {
      result.current.actions.open();
      result.current.actions.selectWallet('metamask');
      result.current.actions.setError('Some error');
    });
    
    act(() => {
      result.current.actions.reset();
    });
    
    expect(result.current.state.isOpen).toBe(false);
    expect(result.current.state.view).toBe('main');
    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.selectedMethod).toBeNull();
    expect(result.current.state.error).toBeNull();
  });

  describe('setView action', () => {
    it('should directly set view to all-wallets', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.setView('all-wallets');
      });
      
      expect(result.current.state.view).toBe('all-wallets');
    });

    it('should directly set view to all-social', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.setView('all-social');
      });
      
      expect(result.current.state.view).toBe('all-social');
    });

    it('should directly set view to verifying', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.setView('verifying');
      });
      
      expect(result.current.state.view).toBe('verifying');
    });
  });

  describe('setStatus view mapping', () => {
    it('should map connecting status to connecting view', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.setStatus('connecting');
      });
      
      expect(result.current.state.view).toBe('connecting');
    });

    it('should map verifying status to verifying view', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.setStatus('verifying');
      });
      
      expect(result.current.state.view).toBe('verifying');
    });

    it('should map success status to success view', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.setStatus('success');
      });
      
      expect(result.current.state.view).toBe('success');
    });

    it('should map error status to error view', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.setStatus('error');
      });
      
      expect(result.current.state.view).toBe('error');
    });
  });

  describe('wallet selection', () => {
    it('should select rabby wallet', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.selectWallet('rabby');
      });
      
      expect(result.current.state.selectedMethod).toEqual({ type: 'wallet', id: 'rabby' });
    });

    it('should select phantom wallet', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.selectWallet('phantom');
      });
      
      expect(result.current.state.selectedMethod).toEqual({ type: 'wallet', id: 'phantom' });
    });

    it('should select coinbase wallet', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.selectWallet('coinbase');
      });
      
      expect(result.current.state.selectedMethod).toEqual({ type: 'wallet', id: 'coinbase' });
    });

    it('should select brave wallet', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.selectWallet('brave');
      });
      
      expect(result.current.state.selectedMethod).toEqual({ type: 'wallet', id: 'brave' });
    });

    it('should select zerion wallet', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.selectWallet('zerion');
      });
      
      expect(result.current.state.selectedMethod).toEqual({ type: 'wallet', id: 'zerion' });
    });

    it('should clear error when selecting wallet', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.setError('Previous error');
      });
      
      act(() => {
        result.current.actions.selectWallet('metamask');
      });
      
      expect(result.current.state.error).toBeNull();
    });
  });

  describe('social provider selection', () => {
    it('should select discord provider', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.selectSocial('discord');
      });
      
      expect(result.current.state.selectedMethod).toEqual({ type: 'social', id: 'discord' });
    });

    it('should select telegram provider', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.selectSocial('telegram');
      });
      
      expect(result.current.state.selectedMethod).toEqual({ type: 'social', id: 'telegram' });
    });

    it('should select farcaster provider', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.selectSocial('farcaster');
      });
      
      expect(result.current.state.selectedMethod).toEqual({ type: 'social', id: 'farcaster' });
    });

    it('should clear error when selecting social', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.setError('Previous error');
      });
      
      act(() => {
        result.current.actions.selectSocial('twitter');
      });
      
      expect(result.current.state.error).toBeNull();
    });
  });

  describe('complete authentication flows', () => {
    it('should handle wallet success flow', () => {
      const { result } = renderHook(() => useEthosModal());
      
      // Open modal
      act(() => result.current.actions.open());
      expect(result.current.state.isOpen).toBe(true);
      
      // Select wallet
      act(() => result.current.actions.selectWallet('metamask'));
      expect(result.current.state.status).toBe('connecting');
      
      // Signing
      act(() => result.current.actions.setStatus('signing'));
      expect(result.current.state.view).toBe('signing');
      
      // Verifying
      act(() => result.current.actions.setStatus('verifying'));
      expect(result.current.state.view).toBe('verifying');
      
      // Success
      const mockUser = {
        sub: 'ethos:456',
        name: 'Wallet User',
        picture: 'https://example.com/pic.png',
        ethosProfileId: 456,
        ethosUsername: 'walletuser',
        ethosScore: 900,
        ethosStatus: 'ACTIVE',
        ethosAttestations: ['verified'],
        authMethod: 'wallet' as const,
      };
      
      act(() => result.current.actions.setSuccess(mockUser));
      
      expect(result.current.state.view).toBe('success');
      expect(result.current.state.user?.name).toBe('Wallet User');
    });

    it('should handle social auth error and retry', () => {
      const { result } = renderHook(() => useEthosModal());
      
      // Open and select social
      act(() => {
        result.current.actions.open();
        result.current.actions.selectSocial('discord');
      });
      
      // Error occurs
      act(() => result.current.actions.setError('OAuth failed'));
      expect(result.current.state.view).toBe('error');
      expect(result.current.state.error).toBe('OAuth failed');
      
      // Go back
      act(() => result.current.actions.goBack());
      expect(result.current.state.view).toBe('main');
      expect(result.current.state.error).toBeNull();
      
      // Try again
      act(() => result.current.actions.selectSocial('twitter'));
      expect(result.current.state.selectedMethod?.id).toBe('twitter');
    });

    it('should handle modal close during flow', () => {
      const { result } = renderHook(() => useEthosModal());
      
      act(() => {
        result.current.actions.open();
        result.current.actions.selectWallet('metamask');
        result.current.actions.setStatus('signing');
      });
      
      act(() => result.current.actions.close());
      
      expect(result.current.state.isOpen).toBe(false);
    });
  });

  describe('action memoization', () => {
    it('should maintain stable action references', () => {
      const { result, rerender } = renderHook(() => useEthosModal());
      
      const initialActions = result.current.actions;
      
      rerender();
      
      expect(result.current.actions).toBe(initialActions);
    });
  });
});
