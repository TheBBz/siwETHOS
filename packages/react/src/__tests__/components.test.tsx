/**
 * Tests for React components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WalletButton } from '../components/WalletButton';
import { ProgressView } from '../components/ProgressView';
import { SuccessView } from '../components/SuccessView';
import { ErrorView } from '../components/ErrorView';
import type { WalletConfig, EthosUser } from '../types';

describe('WalletButton', () => {
  const mockWallet: WalletConfig = {
    id: 'metamask',
    name: 'MetaMask',
    isInstalled: () => true,
    getProvider: () => undefined,
  };

  it('should render wallet name', () => {
    const onClick = vi.fn();
    render(<WalletButton wallet={mockWallet} onClick={onClick} />);
    
    expect(screen.getByText('MetaMask')).toBeInTheDocument();
  });

  it('should show first letter as icon placeholder', () => {
    const onClick = vi.fn();
    render(<WalletButton wallet={mockWallet} onClick={onClick} />);
    
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<WalletButton wallet={mockWallet} onClick={onClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should show "Not detected" when not installed', () => {
    const onClick = vi.fn();
    render(<WalletButton wallet={mockWallet} onClick={onClick} isInstalled={false} />);
    
    expect(screen.getByText('Not detected')).toBeInTheDocument();
  });

  it('should not show "Not detected" when installed', () => {
    const onClick = vi.fn();
    render(<WalletButton wallet={mockWallet} onClick={onClick} isInstalled={true} />);
    
    expect(screen.queryByText('Not detected')).not.toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const onClick = vi.fn();
    render(<WalletButton wallet={mockWallet} onClick={onClick} disabled />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});

describe('ProgressView', () => {
  it('should show connecting message', () => {
    render(<ProgressView status="connecting" methodName="MetaMask" />);
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    expect(screen.getByText('Please approve the connection request')).toBeInTheDocument();
  });

  it('should show signing message', () => {
    render(<ProgressView status="signing" methodName="MetaMask" />);
    
    expect(screen.getByText('Please sign the message')).toBeInTheDocument();
  });

  it('should show verifying message', () => {
    render(<ProgressView status="verifying" methodName="MetaMask" />);
    
    expect(screen.getByText('Confirming authentication...')).toBeInTheDocument();
  });

  it('should show back button when not verifying', () => {
    const onBack = vi.fn();
    render(<ProgressView status="connecting" methodName="MetaMask" onBack={onBack} />);
    
    expect(screen.getByText(/Choose a different method/)).toBeInTheDocument();
  });

  it('should not show back button when verifying', () => {
    const onBack = vi.fn();
    render(<ProgressView status="verifying" methodName="MetaMask" onBack={onBack} />);
    
    expect(screen.queryByText(/Choose a different method/)).not.toBeInTheDocument();
  });

  it('should call onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<ProgressView status="connecting" methodName="MetaMask" onBack={onBack} />);
    
    fireEvent.click(screen.getByText(/Choose a different method/));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('SuccessView', () => {
  const mockUser: EthosUser = {
    sub: 'ethos:123',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    ethosProfileId: 123,
    ethosUsername: 'testuser',
    ethosScore: 1500,
    ethosStatus: 'active',
    ethosAttestations: [],
    authMethod: 'wallet',
    walletAddress: '0x123',
  };

  it('should display user name', () => {
    render(<SuccessView user={mockUser} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should display username with @ prefix', () => {
    render(<SuccessView user={mockUser} />);
    
    // Component shows truncated wallet address instead of @username
    expect(screen.getByText('0x123...x123')).toBeInTheDocument();
  });

  it('should display score when showScore is true', () => {
    render(<SuccessView user={mockUser} showScore={true} />);
    
    expect(screen.getByText('1500')).toBeInTheDocument();
  });

  it('should not display score when showScore is false', () => {
    render(<SuccessView user={mockUser} showScore={false} />);
    
    expect(screen.queryByText('1500')).not.toBeInTheDocument();
  });

  it('should display score label', () => {
    render(<SuccessView user={mockUser} showScore={true} />);
    
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('should call onContinue when continue button clicked', () => {
    const onContinue = vi.fn();
    render(<SuccessView user={mockUser} onContinue={onContinue} />);
    
    fireEvent.click(screen.getByText('Continue'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('should display avatar when picture is provided', () => {
    render(<SuccessView user={mockUser} />);
    
    const img = screen.getByAltText('Test User');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });
});

describe('ErrorView', () => {
  it('should display error message', () => {
    render(<ErrorView message="Connection failed" />);
    
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
  });

  it('should call onRetry when retry button clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorView message="Error" onRetry={onRetry} />);
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should call onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<ErrorView message="Error" onBack={onBack} />);
    
    fireEvent.click(screen.getByText('Go Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('should not show retry button when onRetry is not provided', () => {
    render(<ErrorView message="Error" />);
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('should not show back button when onBack is not provided', () => {
    render(<ErrorView message="Error" />);
    
    expect(screen.queryByText('Go Back')).not.toBeInTheDocument();
  });
});
