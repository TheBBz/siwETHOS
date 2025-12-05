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
});
