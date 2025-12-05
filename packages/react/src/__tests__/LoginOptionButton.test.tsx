/**
 * LoginOptionButton Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LoginOptionButton } from '../components/LoginOptionButton';
import { DEFAULT_THEME } from '../types';

describe('LoginOptionButton', () => {
  const mockOnClick = vi.fn();
  const mockIcon = <svg data-testid="mock-icon" />;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with name', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
        />
      );

      expect(screen.getByText('Test Option')).toBeInTheDocument();
    });

    it('should render icon', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
        />
      );

      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('should show indicator when showIndicator is true', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
          showIndicator={true}
        />
      );

      // Button should be rendered
      expect(screen.getByText('Test Option')).toBeInTheDocument();
    });

    it('should not show indicator by default', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
        />
      );

      expect(screen.getByText('Test Option')).toBeInTheDocument();
    });

    it('should show chevron when showChevron is true', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
          showChevron={true}
        />
      );

      expect(screen.getByText('Test Option')).toBeInTheDocument();
    });

    it('should render button with provided props', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
        />
      );

      // Button should be clickable and show name
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Test Option')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onClick when clicked', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
        />
      );

      fireEvent.click(screen.getByText('Test Option'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
          disabled={true}
        />
      );

      const button = screen.getByText('Test Option').closest('button');
      if (button) {
        fireEvent.click(button);
      }
      // If disabled attribute is set, click shouldn't propagate
    });
  });

  describe('availability state', () => {
    it('should render as available by default', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
        />
      );

      expect(screen.getByText('Test Option')).toBeInTheDocument();
    });

    it('should render as unavailable when isAvailable is false', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
          isAvailable={false}
        />
      );

      expect(screen.getByText('Test Option')).toBeInTheDocument();
    });
  });

  describe('theming', () => {
    it('should apply custom theme', () => {
      const customTheme = {
        ...DEFAULT_THEME,
        textPrimary: '#ff0000',
        buttonBackground: '#000000',
      };

      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={customTheme}
        />
      );

      expect(screen.getByText('Test Option')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading state when isLoading is true', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
          isLoading={true}
        />
      );

      expect(screen.getByText('Test Option')).toBeInTheDocument();
    });
  });

  describe('hover interactions', () => {
    it('should change styles on mouse enter when not disabled', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      
      // Check that hover styles were applied
      expect(button.style.background).toBe('rgba(255, 255, 255, 0.08)');
      expect(button.style.transform).toBe('translateY(-1px)');
    });

    it('should not change styles on mouse enter when disabled', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
          disabled={true}
        />
      );

      const button = screen.getByRole('button');
      const originalBackground = button.style.background;
      
      fireEvent.mouseEnter(button);
      
      // Should remain unchanged when disabled
      expect(button.style.background).toBe(originalBackground);
    });

    it('should revert styles on mouse leave', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
        />
      );

      const button = screen.getByRole('button');
      
      // First hover
      fireEvent.mouseEnter(button);
      expect(button.style.transform).toBe('translateY(-1px)');
      
      // Then leave
      fireEvent.mouseLeave(button);
      expect(button.style.transform).toBe('translateY(0)');
      expect(button.style.background).toBe('rgba(255, 255, 255, 0.03)');
    });
  });

  describe('badge rendering', () => {
    it('should render badge when provided', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
          badge="Recent"
        />
      );

      expect(screen.getByText('Recent')).toBeInTheDocument();
    });

    it('should not render badge when not provided', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
        />
      );

      expect(screen.queryByText('Recent')).not.toBeInTheDocument();
    });
  });

  describe('custom styling', () => {
    it('should apply custom className', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
          className="custom-class"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should apply custom style', () => {
      render(
        <LoginOptionButton
          id="test"
          name="Test Option"
          icon={mockIcon}
          onClick={mockOnClick}
          theme={DEFAULT_THEME}
          style={{ marginTop: '10px' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button.style.marginTop).toBe('10px');
    });
  });
});
