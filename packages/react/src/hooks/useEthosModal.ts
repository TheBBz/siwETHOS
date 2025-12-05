/**
 * Hook for managing modal state
 */

import { useState, useCallback, useMemo } from 'react';
import type { 
  ModalState, 
  ModalActions, 
  ModalView, 
  ConnectionStatus, 
  WalletId,
  SocialProviderId,
  LoginMethodType,
  LoginMethodId,
  EthosUser 
} from '../types';

/**
 * Initial modal state
 */
const initialState: ModalState = {
  isOpen: false,
  view: 'main',
  status: 'idle',
  selectedMethod: null,
  error: null,
  user: null,
};

/**
 * Hook for managing modal state and transitions
 * 
 * @returns Modal state and actions
 * 
 * @example
 * ```tsx
 * const { state, actions } = useEthosModal();
 * 
 * // Open modal
 * actions.open();
 * 
 * // Select wallet
 * actions.selectWallet('metamask');
 * 
 * // Select social provider
 * actions.selectSocial('discord');
 * 
 * // Update status during connection
 * actions.setStatus('signing');
 * ```
 */
export function useEthosModal() {
  const [state, setState] = useState<ModalState>(initialState);

  const open = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      view: 'main',
      status: 'idle',
      error: null,
    }));
  }, []);

  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const goBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      view: 'main',
      status: 'idle',
      selectedMethod: null,
      error: null,
    }));
  }, []);

  const selectWallet = useCallback((walletId: WalletId) => {
    setState(prev => ({
      ...prev,
      selectedMethod: { type: 'wallet', id: walletId },
      view: 'connecting',
      status: 'connecting',
      error: null,
    }));
  }, []);

  const selectSocial = useCallback((providerId: SocialProviderId) => {
    setState(prev => ({
      ...prev,
      selectedMethod: { type: 'social', id: providerId },
      view: 'connecting',
      status: 'connecting',
      error: null,
    }));
  }, []);

  const setStatus = useCallback((status: ConnectionStatus) => {
    // Map status to appropriate view
    let view: ModalView = state.view;
    if (status === 'connecting') view = 'connecting';
    if (status === 'signing') view = 'signing';
    if (status === 'verifying') view = 'verifying';
    if (status === 'success') view = 'success';
    if (status === 'error') view = 'error';
    
    setState(prev => ({
      ...prev,
      status,
      view,
    }));
  }, [state.view]);

  const setView = useCallback((view: ModalView) => {
    setState(prev => ({
      ...prev,
      view,
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      view: 'error',
      status: 'error',
      error,
    }));
  }, []);

  const setSuccess = useCallback((user: EthosUser) => {
    setState(prev => ({
      ...prev,
      view: 'success',
      status: 'success',
      user,
      error: null,
    }));
  }, []);

  const actions = useMemo<ModalActions & {
    setStatus: (status: ConnectionStatus) => void;
    setView: (view: ModalView) => void;
    setError: (error: string) => void;
    setSuccess: (user: EthosUser) => void;
  }>(() => ({
    open,
    close,
    reset,
    goBack,
    selectWallet,
    selectSocial,
    setStatus,
    setView,
    setError,
    setSuccess,
  }), [open, close, reset, goBack, selectWallet, selectSocial, setStatus, setView, setError, setSuccess]);

  return { state, actions };
}

export type UseEthosModalReturn = ReturnType<typeof useEthosModal>;
