import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { NavProvider } from '../../contexts/NavContext';
import React from 'react';

// Mock the useIsMobile hook
vi.mock('../../hooks/useMediaQuery', () => ({
  useIsMobile: vi.fn(() => false),
}));

describe('Sidebar', () => {
  const renderSidebar = () => {
    return render(
      <NavProvider>
        <Sidebar />
      </NavProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('rendering', () => {
    it('should render the sidebar with brand', () => {
      renderSidebar();

      expect(screen.getByText('ZenGen')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('should render all navigation items', () => {
      renderSidebar();

      expect(screen.getByText('Meditations')).toBeInTheDocument();
      expect(screen.getByText('Journal')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('Learn')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should show Meditations as active by default', () => {
      renderSidebar();

      const meditationsButton = screen.getByText('Meditations').closest('button');
      expect(meditationsButton).toHaveClass('bg-teal-500/10');
    });

    it('should render collapse button', () => {
      renderSidebar();

      expect(screen.getByText('Collapse')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to Journal when clicked', () => {
      renderSidebar();

      fireEvent.click(screen.getByText('Journal'));

      const journalButton = screen.getByText('Journal').closest('button');
      expect(journalButton).toHaveClass('bg-teal-500/10');
    });

    it('should navigate to Progress when clicked', () => {
      renderSidebar();

      fireEvent.click(screen.getByText('Progress'));

      const progressButton = screen.getByText('Progress').closest('button');
      expect(progressButton).toHaveClass('bg-teal-500/10');
    });

    it('should navigate to Learn when clicked', () => {
      renderSidebar();

      fireEvent.click(screen.getByText('Learn'));

      const learnButton = screen.getByText('Learn').closest('button');
      expect(learnButton).toHaveClass('bg-teal-500/10');
    });

    it('should navigate to Settings when clicked', () => {
      renderSidebar();

      fireEvent.click(screen.getByText('Settings'));

      const settingsButton = screen.getByText('Settings').closest('button');
      expect(settingsButton).toHaveClass('bg-teal-500/10');
    });
  });

  describe('collapse functionality', () => {
    it('should toggle sidebar collapse when collapse button is clicked', () => {
      const { container } = renderSidebar();

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-60');

      fireEvent.click(screen.getByText('Collapse'));

      expect(sidebar).toHaveClass('w-16');
    });

    it('should hide text labels when collapsed', () => {
      renderSidebar();

      fireEvent.click(screen.getByText('Collapse'));

      // Text labels should be hidden when collapsed
      // The icons should still be visible as buttons
      expect(screen.queryByText('Meditations')).not.toBeInTheDocument();
    });
  });
});
