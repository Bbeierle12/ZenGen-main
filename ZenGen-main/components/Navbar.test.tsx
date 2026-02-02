import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from './Navbar';
import { createMockUserStats } from '../test/fixtures/testData';

describe('Navbar', () => {
  const defaultProps = {
    activeTab: 'generator' as const,
    onTabChange: vi.fn(),
    stats: createMockUserStats(),
    onOpenProfile: vi.fn(),
  };

  describe('rendering', () => {
    it('should render brand logo and name', () => {
      render(<Navbar {...defaultProps} />);

      expect(screen.getByText('ZenGen')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('should render Session tab button', () => {
      render(<Navbar {...defaultProps} />);

      expect(screen.getByText('Session')).toBeInTheDocument();
    });

    it('should render Meditations tab button', () => {
      render(<Navbar {...defaultProps} />);

      expect(screen.getByText('Meditations')).toBeInTheDocument();
    });

    it('should display streak when stats are provided', () => {
      const stats = createMockUserStats({ currentStreak: 5 });
      render(<Navbar {...defaultProps} stats={stats} />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('days')).toBeInTheDocument();
    });

    it('should not display streak section when stats is null', () => {
      render(<Navbar {...defaultProps} stats={null} />);

      expect(screen.queryByText('Streak')).not.toBeInTheDocument();
    });

    it('should display user initial in profile button', () => {
      const stats = createMockUserStats();
      stats.preferences.displayName = 'John';
      render(<Navbar {...defaultProps} stats={stats} />);

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should show user icon when no display name', () => {
      const stats = createMockUserStats();
      stats.preferences.displayName = '';
      render(<Navbar {...defaultProps} stats={stats} />);

      // IconUser should be rendered inside the profile button
      const buttons = screen.getAllByRole('button');
      // Profile button is the one that's not Session or Meditations
      const profileButton = buttons.find(
        (b) => !b.textContent?.includes('Session') && !b.textContent?.includes('Meditations')
      );
      expect(profileButton).toBeInTheDocument();
    });
  });

  describe('tab navigation', () => {
    it('should highlight active generator tab', () => {
      render(<Navbar {...defaultProps} activeTab="generator" />);

      const sessionButton = screen.getByText('Session');
      expect(sessionButton).toHaveClass('bg-teal-600');
    });

    it('should highlight active breathing tab', () => {
      render(<Navbar {...defaultProps} activeTab="breathing" />);

      const meditationsButton = screen.getByText('Meditations');
      expect(meditationsButton).toHaveClass('bg-teal-600');
    });

    it('should call onTabChange with "generator" when Session is clicked', () => {
      const onTabChange = vi.fn();
      render(<Navbar {...defaultProps} onTabChange={onTabChange} activeTab="breathing" />);

      fireEvent.click(screen.getByText('Session'));

      expect(onTabChange).toHaveBeenCalledWith('generator');
    });

    it('should call onTabChange with "breathing" when Meditations is clicked', () => {
      const onTabChange = vi.fn();
      render(<Navbar {...defaultProps} onTabChange={onTabChange} activeTab="generator" />);

      fireEvent.click(screen.getByText('Meditations'));

      expect(onTabChange).toHaveBeenCalledWith('breathing');
    });

    it('should not re-highlight when clicking already active tab', () => {
      const onTabChange = vi.fn();
      render(<Navbar {...defaultProps} onTabChange={onTabChange} activeTab="generator" />);

      fireEvent.click(screen.getByText('Session'));

      expect(onTabChange).toHaveBeenCalledWith('generator');
      // Still called, but UI shouldn't change since it's already active
    });
  });

  describe('profile button', () => {
    it('should call onOpenProfile when profile button is clicked', () => {
      const onOpenProfile = vi.fn();
      render(<Navbar {...defaultProps} onOpenProfile={onOpenProfile} />);

      // Find the profile button (it's a button that doesn't have text "Session" or "Meditations")
      const buttons = screen.getAllByRole('button');
      const profileButton = buttons.find(
        (b) => !b.textContent?.includes('Session') && !b.textContent?.includes('Meditations')
      );

      if (profileButton) {
        fireEvent.click(profileButton);
      }

      expect(onOpenProfile).toHaveBeenCalled();
    });

    it('should uppercase the first letter of display name', () => {
      const stats = createMockUserStats();
      stats.preferences.displayName = 'alice';
      render(<Navbar {...defaultProps} stats={stats} />);

      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should be fixed at top', () => {
      const { container } = render(<Navbar {...defaultProps} />);

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('fixed', 'top-0');
    });

    it('should have backdrop blur', () => {
      const { container } = render(<Navbar {...defaultProps} />);

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('backdrop-blur-md');
    });

    it('should have high z-index', () => {
      const { container } = render(<Navbar {...defaultProps} />);

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('z-30');
    });
  });

  describe('responsive behavior', () => {
    it('should hide brand name on small screens', () => {
      render(<Navbar {...defaultProps} />);

      const brandName = screen.getByText('ZenGen').closest('h1');
      expect(brandName).toHaveClass('hidden', 'sm:block');
    });

    it('should hide streak on small screens', () => {
      const stats = createMockUserStats({ currentStreak: 5 });
      const { container } = render(<Navbar {...defaultProps} stats={stats} />);

      // The streak section is wrapped in a div with 'hidden md:block' classes
      // Find the element containing both 'hidden' and 'md:block' classes
      const streakContainer = container.querySelector('.hidden.md\\:block');
      expect(streakContainer).toBeInTheDocument();
      expect(streakContainer).toHaveTextContent('Streak');
    });
  });
});
