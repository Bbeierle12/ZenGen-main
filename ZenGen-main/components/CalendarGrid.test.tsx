import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarGrid, CalendarDayData, useCalendarData } from './CalendarGrid';
import { MoodLevel } from '../types';
import { renderHook } from '@testing-library/react';

describe('CalendarGrid', () => {
  const defaultProps = {
    year: 2024,
    month: 0, // January
    dayData: new Map<string, CalendarDayData>(),
    onPrevMonth: vi.fn(),
    onNextMonth: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render month and year header', () => {
      render(<CalendarGrid {...defaultProps} />);

      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should render weekday headers', () => {
      render(<CalendarGrid {...defaultProps} />);

      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('should render all days of the month', () => {
      render(<CalendarGrid {...defaultProps} />);

      // January 2024 has 31 days
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('31')).toBeInTheDocument();
    });

    it('should render different months correctly', () => {
      const { rerender } = render(<CalendarGrid {...defaultProps} month={1} />);
      expect(screen.getByText('February 2024')).toBeInTheDocument();
      // February 2024 has 29 days (leap year)
      expect(screen.getByText('29')).toBeInTheDocument();

      rerender(<CalendarGrid {...defaultProps} month={11} />);
      expect(screen.getByText('December 2024')).toBeInTheDocument();
    });

    it('should render legend', () => {
      render(<CalendarGrid {...defaultProps} />);

      expect(screen.getByText('Session')).toBeInTheDocument();
      expect(screen.getByText('With mood')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should call onPrevMonth when previous button is clicked', () => {
      render(<CalendarGrid {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Previous month'));

      expect(defaultProps.onPrevMonth).toHaveBeenCalledTimes(1);
    });

    it('should call onNextMonth when next button is clicked', () => {
      render(<CalendarGrid {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Next month'));

      expect(defaultProps.onNextMonth).toHaveBeenCalledTimes(1);
    });
  });

  describe('day interaction', () => {
    it('should call onDayClick when a day is clicked', () => {
      const onDayClick = vi.fn();
      render(<CalendarGrid {...defaultProps} onDayClick={onDayClick} />);

      fireEvent.click(screen.getByText('15'));

      expect(onDayClick).toHaveBeenCalledTimes(1);
      expect(onDayClick).toHaveBeenCalledWith(expect.any(Date), undefined);
    });

    it('should pass day data to onDayClick when available', () => {
      const onDayClick = vi.fn();
      const dayData = new Map<string, CalendarDayData>();
      dayData.set('2024-01-15', {
        date: new Date(2024, 0, 15),
        hasSession: true,
        sessionCount: 2,
        mood: MoodLevel.GOOD,
      });

      render(<CalendarGrid {...defaultProps} dayData={dayData} onDayClick={onDayClick} />);

      fireEvent.click(screen.getByText('15'));

      expect(onDayClick).toHaveBeenCalledWith(
        expect.any(Date),
        expect.objectContaining({
          hasSession: true,
          sessionCount: 2,
          mood: MoodLevel.GOOD,
        })
      );
    });
  });

  describe('day data display', () => {
    it('should show session indicator for days with sessions', () => {
      const dayData = new Map<string, CalendarDayData>();
      dayData.set('2024-01-10', {
        date: new Date(2024, 0, 10),
        hasSession: true,
        sessionCount: 1,
      });

      const { container } = render(<CalendarGrid {...defaultProps} dayData={dayData} />);

      // Day 10 should have a session indicator (teal dot)
      const day10Button = screen.getByText('10').closest('button');
      const indicator = day10Button?.querySelector('.bg-teal-400');
      expect(indicator).toBeInTheDocument();
    });

    it('should show multiple session count', () => {
      const dayData = new Map<string, CalendarDayData>();
      dayData.set('2024-01-10', {
        date: new Date(2024, 0, 10),
        hasSession: true,
        sessionCount: 3,
      });

      render(<CalendarGrid {...defaultProps} dayData={dayData} />);

      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should show mood indicator when mood is present', () => {
      const dayData = new Map<string, CalendarDayData>();
      dayData.set('2024-01-10', {
        date: new Date(2024, 0, 10),
        hasSession: true,
        sessionCount: 1,
        mood: MoodLevel.EXCELLENT,
      });

      render(<CalendarGrid {...defaultProps} dayData={dayData} />);

      // Should render MoodDisplay with emoji
      expect(screen.getByRole('img', { name: 'Excellent' })).toBeInTheDocument();
    });
  });

  describe('selected date', () => {
    it('should highlight selected date', () => {
      const selectedDate = new Date(2024, 0, 15);

      render(<CalendarGrid {...defaultProps} selectedDate={selectedDate} />);

      const day15Button = screen.getByText('15').closest('button');
      expect(day15Button).toHaveClass('bg-teal-600');
      expect(day15Button).toHaveClass('ring-2');
    });
  });
});

describe('useCalendarData', () => {
  it('should create map from sessions', () => {
    const sessions = [
      { id: '1', date: '2024-01-15T10:00:00Z' },
      { id: '2', date: '2024-01-15T14:00:00Z' },
      { id: '3', date: '2024-01-20T10:00:00Z' },
    ];

    const { result } = renderHook(() => useCalendarData(sessions, []));

    expect(result.current.size).toBe(2);
    expect(result.current.get('2024-01-15')?.sessionCount).toBe(2);
    expect(result.current.get('2024-01-20')?.sessionCount).toBe(1);
  });

  it('should include mood data when available', () => {
    const sessions = [{ id: '1', date: '2024-01-15T10:00:00Z' }];
    const moods = [{ date: '2024-01-15T10:30:00Z', moodAfter: MoodLevel.GOOD }];

    const { result } = renderHook(() => useCalendarData(sessions, moods));

    expect(result.current.get('2024-01-15')?.mood).toBe(MoodLevel.GOOD);
  });

  it('should handle mood entries without sessions', () => {
    const moods = [{ date: '2024-01-15T10:30:00Z', moodAfter: MoodLevel.NEUTRAL }];

    const { result } = renderHook(() => useCalendarData([], moods));

    expect(result.current.get('2024-01-15')?.mood).toBe(MoodLevel.NEUTRAL);
    expect(result.current.get('2024-01-15')?.hasSession).toBe(false);
  });

  it('should return empty map for empty inputs', () => {
    const { result } = renderHook(() => useCalendarData([], []));

    expect(result.current.size).toBe(0);
  });
});
