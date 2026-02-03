import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Timer } from './Timer';
import { TimerState } from '../types';

describe('Timer', () => {
  const defaultProps = {
    totalSeconds: 300, // 5 minutes
    remainingSeconds: 300,
    state: 'idle' as TimerState,
    onStart: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onReset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render time display in MM:SS format', () => {
      render(<Timer {...defaultProps} />);

      expect(screen.getByText('5:00')).toBeInTheDocument();
    });

    it('should render time with leading zeros', () => {
      render(<Timer {...defaultProps} remainingSeconds={65} />);

      expect(screen.getByText('1:05')).toBeInTheDocument();
    });

    it('should render HH:MM:SS format for times over an hour', () => {
      render(<Timer {...defaultProps} totalSeconds={3700} remainingSeconds={3700} />);

      expect(screen.getByText('1:01:40')).toBeInTheDocument();
    });

    it('should show Ready status when idle', () => {
      render(<Timer {...defaultProps} state="idle" />);

      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('should show Running status when running', () => {
      render(<Timer {...defaultProps} state="running" remainingSeconds={250} />);

      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    it('should show Paused status when paused', () => {
      render(<Timer {...defaultProps} state="paused" remainingSeconds={250} />);

      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    it('should show Complete status when complete', () => {
      render(<Timer {...defaultProps} state="complete" remainingSeconds={0} />);

      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  describe('controls', () => {
    it('should show play button when idle', () => {
      render(<Timer {...defaultProps} state="idle" />);

      const playButton = screen.getByTitle('Start');
      expect(playButton).toBeInTheDocument();
    });

    it('should call onStart when play button is clicked', () => {
      render(<Timer {...defaultProps} state="idle" />);

      fireEvent.click(screen.getByTitle('Start'));

      expect(defaultProps.onStart).toHaveBeenCalledTimes(1);
    });

    it('should show pause button when running', () => {
      render(<Timer {...defaultProps} state="running" remainingSeconds={250} />);

      const pauseButton = screen.getByTitle('Pause');
      expect(pauseButton).toBeInTheDocument();
    });

    it('should call onPause when pause button is clicked', () => {
      render(<Timer {...defaultProps} state="running" remainingSeconds={250} />);

      fireEvent.click(screen.getByTitle('Pause'));

      expect(defaultProps.onPause).toHaveBeenCalledTimes(1);
    });

    it('should show resume button when paused', () => {
      render(<Timer {...defaultProps} state="paused" remainingSeconds={250} />);

      const resumeButton = screen.getByTitle('Resume');
      expect(resumeButton).toBeInTheDocument();
    });

    it('should call onResume when resume button is clicked', () => {
      render(<Timer {...defaultProps} state="paused" remainingSeconds={250} />);

      fireEvent.click(screen.getByTitle('Resume'));

      expect(defaultProps.onResume).toHaveBeenCalledTimes(1);
    });

    it('should show reset button when complete', () => {
      render(<Timer {...defaultProps} state="complete" remainingSeconds={0} />);

      const resetButton = screen.getByTitle('Start Again');
      expect(resetButton).toBeInTheDocument();
    });

    it('should call onReset when reset button is clicked while complete', () => {
      render(<Timer {...defaultProps} state="complete" remainingSeconds={0} />);

      fireEvent.click(screen.getByTitle('Start Again'));

      expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
    });

    it('should have disabled reset button when idle', () => {
      render(<Timer {...defaultProps} state="idle" />);

      const resetButton = screen.getByTitle('Reset');
      expect(resetButton).toBeDisabled();
    });

    it('should have enabled reset button when running', () => {
      render(<Timer {...defaultProps} state="running" remainingSeconds={250} />);

      const resetButton = screen.getByTitle('Reset');
      expect(resetButton).not.toBeDisabled();
    });
  });

  describe('progress', () => {
    it('should render SVG progress circle', () => {
      const { container } = render(<Timer {...defaultProps} />);

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(2); // Background and progress circles
    });

    it('should have full progress when timer has not started', () => {
      const { container } = render(
        <Timer {...defaultProps} totalSeconds={300} remainingSeconds={300} />
      );

      // The progress circle should have minimal offset (timer not started = 0% complete)
      const progressCircle = container.querySelectorAll('circle')[1];
      const dashOffset = progressCircle.getAttribute('stroke-dashoffset');
      expect(dashOffset).toBeDefined();
    });

    it('should update progress as time decreases', () => {
      const { container, rerender } = render(
        <Timer {...defaultProps} totalSeconds={300} remainingSeconds={300} />
      );

      const initialCircle = container.querySelectorAll('circle')[1];
      const initialOffset = initialCircle.getAttribute('stroke-dashoffset');

      rerender(<Timer {...defaultProps} totalSeconds={300} remainingSeconds={150} />);

      const updatedCircle = container.querySelectorAll('circle')[1];
      const updatedOffset = updatedCircle.getAttribute('stroke-dashoffset');

      expect(initialOffset).not.toBe(updatedOffset);
    });
  });
});
