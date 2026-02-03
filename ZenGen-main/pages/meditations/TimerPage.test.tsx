import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TimerPage } from './TimerPage';
import * as storageService from '../../services/storageService';

// Mock AudioContext globally
const mockAudioContext = {
  state: 'running',
  resume: vi.fn(),
  destination: {},
};
vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext));

// Mock the SoundscapeEngine
vi.mock('../../services/soundscapeService', () => ({
  SoundscapeEngine: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    stop: vi.fn(),
    playBell: vi.fn(),
    setVolume: vi.fn(),
  })),
}));

// Mock the storage service
vi.mock('../../services/storageService', () => ({
  saveTimerSession: vi.fn(() => []),
}));

describe('TimerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render the timer page with title', () => {
      render(<TimerPage />);

      expect(screen.getByText('Meditation Timer')).toBeInTheDocument();
      expect(screen.getByText('Simple, distraction-free timed meditation')).toBeInTheDocument();
    });

    it('should render duration presets', () => {
      render(<TimerPage />);

      // Multiple presets appear in both duration and interval sections, use getAllByText
      expect(screen.getAllByText('1 min')[0]).toBeInTheDocument();
      expect(screen.getByText('3 min')).toBeInTheDocument();
      expect(screen.getAllByText('5 min')[0]).toBeInTheDocument();
      expect(screen.getAllByText('10 min')[0]).toBeInTheDocument();
    });

    it('should render bell options', () => {
      render(<TimerPage />);

      expect(screen.getByText('Bell at start')).toBeInTheDocument();
      expect(screen.getByText('Bell at end')).toBeInTheDocument();
      expect(screen.getByText('Interval bells')).toBeInTheDocument();
    });

    it('should render ambient sound options', () => {
      render(<TimerPage />);

      expect(screen.getByText('Ambient Sound')).toBeInTheDocument();
      // "None" appears in both interval bells and ambient sound sections
      expect(screen.getAllByText('None')[1]).toBeInTheDocument();
      expect(screen.getByText('Soft Rain')).toBeInTheDocument();
      expect(screen.getByText('Ocean Waves')).toBeInTheDocument();
    });

    it('should show 5 min as default selected duration', () => {
      render(<TimerPage />);

      // First "5 min" is in duration presets
      const fiveMinButton = screen.getAllByText('5 min')[0];
      expect(fiveMinButton).toHaveClass('bg-teal-600');
    });

    it('should display default time of 5:00', () => {
      render(<TimerPage />);

      expect(screen.getByText('5:00')).toBeInTheDocument();
    });
  });

  describe('duration selection', () => {
    it('should update duration when preset is clicked', () => {
      render(<TimerPage />);

      // First "10 min" is in duration presets
      fireEvent.click(screen.getAllByText('10 min')[0]);

      expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('should update selected state when preset is clicked', () => {
      render(<TimerPage />);

      // First "10 min" is in duration presets
      const tenMinButton = screen.getAllByText('10 min')[0];
      fireEvent.click(tenMinButton);

      expect(tenMinButton).toHaveClass('bg-teal-600');
    });

    it('should allow custom duration input', () => {
      render(<TimerPage />);

      const input = screen.getByPlaceholderText('Custom minutes');
      fireEvent.change(input, { target: { value: '25' } });

      const setButton = screen.getByText('Set');
      fireEvent.click(setButton);

      expect(screen.getByText('25:00')).toBeInTheDocument();
    });
  });

  describe('bell options', () => {
    it('should have bell at start checked by default', () => {
      render(<TimerPage />);

      const checkbox = screen.getByRole('checkbox', { name: /bell at start/i });
      expect(checkbox).toBeChecked();
    });

    it('should have bell at end checked by default', () => {
      render(<TimerPage />);

      const checkbox = screen.getByRole('checkbox', { name: /bell at end/i });
      expect(checkbox).toBeChecked();
    });

    it('should toggle bell at start option', () => {
      render(<TimerPage />);

      const checkbox = screen.getByRole('checkbox', { name: /bell at start/i });
      fireEvent.click(checkbox);

      expect(checkbox).not.toBeChecked();
    });

    it('should select interval bell option', () => {
      render(<TimerPage />);

      const intervalButton = screen.getAllByText('1 min')[1]; // Second "1 min" is interval option
      fireEvent.click(intervalButton);

      expect(intervalButton).toHaveClass('bg-teal-600');
    });
  });

  describe('ambient sound selection', () => {
    it('should have None selected by default', () => {
      render(<TimerPage />);

      // Find the None button in the Ambient Sound section
      const ambientSection = screen.getByText('Ambient Sound').closest('div');
      const noneButton = ambientSection?.querySelector('button');
      expect(noneButton).toHaveClass('bg-teal-600');
    });

    it('should update ambient sound when option is clicked', () => {
      render(<TimerPage />);

      const rainButton = screen.getByText('Soft Rain');
      fireEvent.click(rainButton);

      expect(rainButton).toHaveClass('bg-teal-600');
    });
  });

  describe('timer controls', () => {
    it('should start timer when start button is clicked', async () => {
      render(<TimerPage />);

      const startButton = screen.getByTitle('Start');
      await act(async () => {
        fireEvent.click(startButton);
      });

      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    it('should hide configuration when timer is running', async () => {
      render(<TimerPage />);

      await act(async () => {
        fireEvent.click(screen.getByTitle('Start'));
      });

      expect(screen.queryByText('Duration')).not.toBeInTheDocument();
    });

    it('should show pause button when timer is running', async () => {
      render(<TimerPage />);

      await act(async () => {
        fireEvent.click(screen.getByTitle('Start'));
      });

      expect(screen.getByTitle('Pause')).toBeInTheDocument();
    });

    it('should pause timer when pause button is clicked', async () => {
      render(<TimerPage />);

      await act(async () => {
        fireEvent.click(screen.getByTitle('Start'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTitle('Pause'));
      });

      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    it('should show resume button when timer is paused', async () => {
      render(<TimerPage />);

      await act(async () => {
        fireEvent.click(screen.getByTitle('Start'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTitle('Pause'));
      });

      expect(screen.getByTitle('Resume')).toBeInTheDocument();
    });

    it('should reset timer when reset button is clicked', async () => {
      render(<TimerPage />);

      // Start and run for a bit
      await act(async () => {
        fireEvent.click(screen.getByTitle('Start'));
        vi.advanceTimersByTime(5000);
      });

      // Reset
      await act(async () => {
        fireEvent.click(screen.getByTitle('Reset'));
      });

      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getByText('5:00')).toBeInTheDocument();
    });
  });

  describe('timer countdown', () => {
    it('should decrement remaining time', async () => {
      render(<TimerPage />);

      // Set to 1 minute (first "1 min" is in duration presets)
      fireEvent.click(screen.getAllByText('1 min')[0]);

      // Start the timer
      await act(async () => {
        fireEvent.click(screen.getByTitle('Start'));
      });

      // Advance 5 seconds (timer ticks every 1000ms)
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText('0:55')).toBeInTheDocument();
    });

    it('should complete when time runs out', async () => {
      render(<TimerPage />);

      // Set to 1 minute (first "1 min" is in duration presets)
      fireEvent.click(screen.getAllByText('1 min')[0]);

      // Start the timer
      await act(async () => {
        fireEvent.click(screen.getByTitle('Start'));
      });

      // Advance full minute
      await act(async () => {
        vi.advanceTimersByTime(60000);
      });

      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('should save session when timer completes', async () => {
      render(<TimerPage />);

      // Set to 1 minute (first "1 min" is in duration presets)
      fireEvent.click(screen.getAllByText('1 min')[0]);

      // Start the timer
      await act(async () => {
        fireEvent.click(screen.getByTitle('Start'));
      });

      // Advance full minute
      await act(async () => {
        vi.advanceTimersByTime(60000);
      });

      expect(storageService.saveTimerSession).toHaveBeenCalledWith({
        durationSeconds: 60,
        completedSeconds: 60,
        completed: true,
      });
    });
  });
});
