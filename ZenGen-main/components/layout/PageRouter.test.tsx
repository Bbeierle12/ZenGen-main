import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageRouter } from './PageRouter';
import { NavProvider, useNav } from '../../contexts/NavContext';
import React from 'react';

// Mock the useIsMobile hook
vi.mock('../../hooks/useMediaQuery', () => ({
  useIsMobile: vi.fn(() => false),
}));

// Helper component to access nav context and navigate
const NavigationHelper: React.FC<{ section: string }> = ({ section }) => {
  const { navigateTo } = useNav();
  return (
    <button onClick={() => navigateTo(section as any)}>
      Navigate to {section}
    </button>
  );
};

describe('PageRouter', () => {
  const MeditationContent = () => <div data-testid="meditation-content">Meditation Content</div>;

  const renderPageRouter = () => {
    return render(
      <NavProvider>
        <NavigationHelper section="journal" />
        <NavigationHelper section="progress" />
        <NavigationHelper section="learn" />
        <NavigationHelper section="settings" />
        <NavigationHelper section="meditations" />
        <PageRouter>
          <MeditationContent />
        </PageRouter>
      </NavProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('meditations section', () => {
    it('should render children content for meditations section', () => {
      renderPageRouter();

      expect(screen.getByTestId('meditation-content')).toBeInTheDocument();
    });
  });

  describe('journal section', () => {
    it('should show JournalPage when navigating to journal', () => {
      renderPageRouter();

      fireEvent.click(screen.getByText('Navigate to journal'));

      // Journal page should show entries view by default
      expect(screen.getByText('Journal Entries')).toBeInTheDocument();
      expect(screen.getByText(/Record your meditation journey/)).toBeInTheDocument();
    });
  });

  describe('coming soon placeholders', () => {
    it('should show Progress placeholder when navigating to progress', () => {
      renderPageRouter();

      fireEvent.click(screen.getByText('Navigate to progress'));

      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      expect(screen.getByText(/View your meditation statistics/)).toBeInTheDocument();
    });

    it('should show Learn placeholder when navigating to learn', () => {
      renderPageRouter();

      fireEvent.click(screen.getByText('Navigate to learn'));

      expect(screen.getByText('Learn')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      expect(screen.getByText(/Discover meditation techniques/)).toBeInTheDocument();
    });

    it('should show Settings placeholder when navigating to settings', () => {
      renderPageRouter();

      fireEvent.click(screen.getByText('Navigate to settings'));

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      expect(screen.getByText(/Customize your preferences/)).toBeInTheDocument();
    });

    it('should return to meditation content when navigating back', () => {
      renderPageRouter();

      // Navigate away to progress (which still shows Coming Soon)
      fireEvent.click(screen.getByText('Navigate to progress'));
      expect(screen.queryByTestId('meditation-content')).not.toBeInTheDocument();

      // Navigate back
      fireEvent.click(screen.getByText('Navigate to meditations'));
      expect(screen.getByTestId('meditation-content')).toBeInTheDocument();
    });
  });
});
