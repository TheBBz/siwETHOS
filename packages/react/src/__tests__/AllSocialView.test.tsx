/**
 * AllSocialView Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AllSocialView } from '../modal/AllSocialView';

describe('AllSocialView', () => {
  const mockOnSelect = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the view with title', () => {
      render(
        <AllSocialView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Log in with social')).toBeInTheDocument();
    });

    it('should render subtitle', () => {
      render(
        <AllSocialView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Connect a social account linked to your Ethos profile')).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(
        <AllSocialView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should render all default social providers', () => {
      render(
        <AllSocialView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Twitter')).toBeInTheDocument();
      expect(screen.getByText('Discord')).toBeInTheDocument();
      expect(screen.getByText('Telegram')).toBeInTheDocument();
      expect(screen.getByText('Farcaster')).toBeInTheDocument();
    });

    it('should render only specified providers', () => {
      render(
        <AllSocialView 
          providers={['discord', 'telegram']}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Discord')).toBeInTheDocument();
      expect(screen.getByText('Telegram')).toBeInTheDocument();
      expect(screen.queryByText('X (Twitter)')).not.toBeInTheDocument();
      expect(screen.queryByText('Farcaster')).not.toBeInTheDocument();
    });

    it('should render help text with Ethos link', () => {
      render(
        <AllSocialView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(/Your social account must be linked/)).toBeInTheDocument();
      expect(screen.getByText('Ethos profile')).toHaveAttribute('href', 'https://ethos.network');
    });

    it('should render link with proper attributes', () => {
      render(
        <AllSocialView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const link = screen.getByText('Ethos profile');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('interactions', () => {
    it('should call onBack when back button clicked', () => {
      render(
        <AllSocialView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      fireEvent.click(screen.getByText('Back'));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should call onSelect when provider clicked', () => {
      render(
        <AllSocialView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      fireEvent.click(screen.getByText('Discord'));
      expect(mockOnSelect).toHaveBeenCalledWith('discord');
    });

    it('should call onSelect with correct provider id', () => {
      render(
        <AllSocialView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      fireEvent.click(screen.getByText('Twitter'));
      expect(mockOnSelect).toHaveBeenCalledWith('twitter');

      fireEvent.click(screen.getByText('Telegram'));
      expect(mockOnSelect).toHaveBeenCalledWith('telegram');

      fireEvent.click(screen.getByText('Farcaster'));
      expect(mockOnSelect).toHaveBeenCalledWith('farcaster');
    });
  });

  describe('theming', () => {
    it('should apply custom theme colors', () => {
      const customTheme = {
        textPrimary: '#ff0000',
        textSecondary: '#00ff00',
        textMuted: '#0000ff',
        accentColor: '#ff00ff',
      };

      render(
        <AllSocialView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
          theme={customTheme}
        />
      );

      const title = screen.getByText('Log in with social');
      expect(title).toHaveStyle({ color: '#ff0000' });
    });

    it('should apply custom accent color to link', () => {
      const customTheme = {
        textPrimary: '#ffffff',
        textSecondary: '#cccccc',
        textMuted: '#999999',
        accentColor: '#00ff00',
      };

      render(
        <AllSocialView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
          theme={customTheme}
        />
      );

      const link = screen.getByText('Ethos profile');
      expect(link).toHaveStyle({ color: '#00ff00' });
    });

    it('should use default theme when not provided', () => {
      render(
        <AllSocialView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      // Should render without errors
      expect(screen.getByText('Log in with social')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should handle empty providers array', () => {
      render(
        <AllSocialView 
          providers={[]}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      // Should still render header and help text
      expect(screen.getByText('Log in with social')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible back button', () => {
      render(
        <AllSocialView 
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const backButton = screen.getByText('Back').closest('button');
      expect(backButton).toHaveAttribute('type', 'button');
    });
  });
});
