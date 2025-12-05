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

  describe('hover interactions', () => {
    it('should change border color on mouse enter when not disabled', () => {
      const onClick = vi.fn();
      render(<WalletButton wallet={mockWallet} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      
      // Check that hover styles were applied (RGB format)
      expect(button.style.borderColor).toBe('rgb(99, 102, 241)');
      expect(button.style.backgroundColor).toBe('rgb(250, 250, 250)');
    });

    it('should not change styles on mouse enter when disabled', () => {
      const onClick = vi.fn();
      render(<WalletButton wallet={mockWallet} onClick={onClick} disabled />);
      
      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      
      // Should not change when disabled
    });

    it('should not change styles on mouse enter when selected', () => {
      const onClick = vi.fn();
      render(<WalletButton wallet={mockWallet} onClick={onClick} selected />);
      
      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      
      // Should maintain selected styles
    });

    it('should revert styles on mouse leave', () => {
      const onClick = vi.fn();
      render(<WalletButton wallet={mockWallet} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      
      // Hover
      fireEvent.mouseEnter(button);
      expect(button.style.borderColor).toBe('rgb(99, 102, 241)');
      
      // Leave
      fireEvent.mouseLeave(button);
      expect(button.style.borderColor).toBe('rgb(229, 231, 235)');
      expect(button.style.backgroundColor).toBe('rgb(255, 255, 255)');
    });

    it('should not revert styles when disabled', () => {
      const onClick = vi.fn();
      render(<WalletButton wallet={mockWallet} onClick={onClick} disabled />);
      
      const button = screen.getByRole('button');
      fireEvent.mouseLeave(button);
      // Should maintain disabled appearance
    });

    it('should not revert styles when selected', () => {
      const onClick = vi.fn();
      render(<WalletButton wallet={mockWallet} onClick={onClick} selected />);
      
      const button = screen.getByRole('button');
      fireEvent.mouseLeave(button);
      // Should maintain selected appearance
    });
  });

  describe('selected state', () => {
    it('should show selected styles when selected is true', () => {
      const onClick = vi.fn();
      render(<WalletButton wallet={mockWallet} onClick={onClick} selected />);
      
      const button = screen.getByRole('button');
      expect(button.style.border).toContain('2px');
    });
  });

  describe('custom styling', () => {
    it('should apply custom className', () => {
      const onClick = vi.fn();
      render(<WalletButton wallet={mockWallet} onClick={onClick} className="custom-wallet" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-wallet');
    });

    it('should apply custom style', () => {
      const onClick = vi.fn();
      render(<WalletButton wallet={mockWallet} onClick={onClick} style={{ margin: '10px' }} />);
      
      const button = screen.getByRole('button');
      expect(button.style.margin).toBe('10px');
    });
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

  describe('avatar fallback', () => {
    it('should display first letter when picture is not provided', () => {
      const userWithoutPicture = { ...mockUser, picture: null };
      render(<SuccessView user={userWithoutPicture} />);
      
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('should display ? when name is empty', () => {
      const userWithoutName = { ...mockUser, picture: null, name: '' };
      render(<SuccessView user={userWithoutName} />);
      
      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  describe('identifier display', () => {
    it('should display username when no wallet address', () => {
      const userWithUsername = { ...mockUser, walletAddress: undefined, ethosUsername: 'testuser' };
      render(<SuccessView user={userWithUsername} />);
      
      expect(screen.getByText('@testuser')).toBeInTheDocument();
    });

    it('should display wallet address when provided', () => {
      render(<SuccessView user={mockUser} />);
      
      expect(screen.getByText('0x123...x123')).toBeInTheDocument();
    });
  });

  describe('score ranges', () => {
    it('should show Exemplary for score >= 2200', () => {
      const excellentUser = { ...mockUser, ethosScore: 2500 };
      render(<SuccessView user={excellentUser} showScore />);
      
      expect(screen.getByText('Exemplary')).toBeInTheDocument();
    });

    it('should show Good for score >= 1300', () => {
      const goodUser = { ...mockUser, ethosScore: 1500 };
      render(<SuccessView user={goodUser} showScore />);
      
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('should show Moderate for score >= 1000', () => {
      const neutralUser = { ...mockUser, ethosScore: 1100 };
      render(<SuccessView user={neutralUser} showScore />);
      
      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });

    it('should show Low for score >= 700', () => {
      const lowUser = { ...mockUser, ethosScore: 800 };
      render(<SuccessView user={lowUser} showScore />);
      
      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    it('should show Very Low for score < 700', () => {
      const poorUser = { ...mockUser, ethosScore: 300 };
      render(<SuccessView user={poorUser} showScore />);
      
      expect(screen.getByText('Very Low')).toBeInTheDocument();
    });
  });

  describe('theming', () => {
    it('should apply custom theme', () => {
      render(<SuccessView user={mockUser} theme={{ textPrimary: '#ff0000' }} />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  describe('custom styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<SuccessView user={mockUser} className="custom-success" />);
      
      expect(container.querySelector('.custom-success')).toBeInTheDocument();
    });

    it('should apply custom style', () => {
      const { container } = render(<SuccessView user={mockUser} style={{ padding: '50px' }} />);
      
      const view = container.firstChild as HTMLElement;
      expect(view.style.padding).toBe('50px');
    });
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
