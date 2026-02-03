import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JournalPage } from './JournalPage';
import { NavProvider } from '../../contexts/NavContext';

// Mock the child views
vi.mock('./EntriesView', () => ({
  EntriesView: () => <div data-testid="entries-view">Entries View</div>,
}));

vi.mock('./CalendarView', () => ({
  CalendarView: () => <div data-testid="calendar-view">Calendar View</div>,
}));

vi.mock('./MoodLogView', () => ({
  MoodLogView: () => <div data-testid="mood-log-view">Mood Log View</div>,
}));

// Helper to render with context
const renderWithNav = (initialSection = 'journal', initialPage = 'entries') => {
  // Mock useNav to control initial state
  return render(
    <NavProvider>
      <JournalPage />
    </NavProvider>
  );
};

describe('JournalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render EntriesView by default', () => {
      renderWithNav();

      expect(screen.getByTestId('entries-view')).toBeInTheDocument();
    });
  });

  describe('mobile navigation', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(max-width: 767px)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    it('should render mobile sub-navigation on mobile', () => {
      renderWithNav();

      expect(screen.getByText('Entries')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.getByText('Mood')).toBeInTheDocument();
    });
  });
});
