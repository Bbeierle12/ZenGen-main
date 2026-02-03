import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav } from './BottomNav';
import { NavProvider } from '../../contexts/NavContext';
import React from 'react';

// Mock the useIsMobile hook
vi.mock('../../hooks/useMediaQuery', () => ({
  useIsMobile: vi.fn(() => true), // Mobile view for BottomNav tests
}));

describe('BottomNav', () => {
  const renderBottomNav = () => {
    return render(
      <NavProvider>
        <BottomNav />
      </NavProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('rendering', () => {
    it('should render the bottom navigation', () => {
      renderBottomNav();

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('fixed', 'bottom-0');
    });

    it('should render all navigation items', () => {
      renderBottomNav();

      expect(screen.getByText('Meditations')).toBeInTheDocument();
      expect(screen.getByText('Journal')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('Learn')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should show Meditations as active by default', () => {
      renderBottomNav();

      const meditationsButton = screen.getByText('Meditations').closest('button');
      expect(meditationsButton).toHaveClass('text-teal-400');
    });
  });

  describe('navigation', () => {
    it('should navigate to Journal when clicked', () => {
      renderBottomNav();

      fireEvent.click(screen.getByText('Journal'));

      const journalButton = screen.getByText('Journal').closest('button');
      expect(journalButton).toHaveClass('text-teal-400');
    });

    it('should navigate to Progress when clicked', () => {
      renderBottomNav();

      fireEvent.click(screen.getByText('Progress'));

      const progressButton = screen.getByText('Progress').closest('button');
      expect(progressButton).toHaveClass('text-teal-400');
    });

    it('should navigate to Learn when clicked', () => {
      renderBottomNav();

      fireEvent.click(screen.getByText('Learn'));

      const learnButton = screen.getByText('Learn').closest('button');
      expect(learnButton).toHaveClass('text-teal-400');
    });

    it('should navigate to Settings when clicked', () => {
      renderBottomNav();

      fireEvent.click(screen.getByText('Settings'));

      const settingsButton = screen.getByText('Settings').closest('button');
      expect(settingsButton).toHaveClass('text-teal-400');
    });

    it('should deactivate previous section when navigating', () => {
      renderBottomNav();

      // Initially Meditations is active
      expect(screen.getByText('Meditations').closest('button')).toHaveClass('text-teal-400');

      // Click Journal
      fireEvent.click(screen.getByText('Journal'));

      // Journal should be active, Meditations should not
      expect(screen.getByText('Journal').closest('button')).toHaveClass('text-teal-400');
      expect(screen.getByText('Meditations').closest('button')).not.toHaveClass('text-teal-400');
    });
  });
});
