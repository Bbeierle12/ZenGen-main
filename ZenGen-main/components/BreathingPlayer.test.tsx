import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BreathingPlayer } from './BreathingPlayer';
import { createMockBreathingPattern, create478BreathingPattern } from '../test/fixtures/testData';

// Set up global RAF mocks before any imports
beforeAll(() => {
  global.cancelAnimationFrame = vi.fn();
  global.requestAnimationFrame = vi.fn((cb) => {
    setTimeout(cb, 16);
    return 1;
  }) as any;
});

// Mock the soundscape service
const mockSoundscapeInstance = {
  play: vi.fn(),
  stop: vi.fn(),
  setVolume: vi.fn(),
  setBellVolume: vi.fn(),
  playBell: vi.fn(),
  playBreathCue: vi.fn(),
  stopBreathCue: vi.fn(),
  globalAnalyser: {
    fftSize: 1024,
    frequencyBinCount: 512,
    getByteFrequencyData: vi.fn(),
  },
};

vi.mock('../services/soundscapeService', () => ({
  SoundscapeEngine: vi.fn().mockImplementation(() => mockSoundscapeInstance),
}));

import { SoundscapeEngine } from '../services/soundscapeService';

describe('BreathingPlayer', () => {
  const defaultProps = {
    pattern: createMockBreathingPattern(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock functions
    Object.values(mockSoundscapeInstance).forEach((fn) => {
      if (typeof fn === 'function' && fn.mockClear) {
        fn.mockClear();
      }
    });
  });

  describe('rendering', () => {
    it('should render pattern name', () => {
      render(<BreathingPlayer {...defaultProps} />);
      expect(screen.getByText('Box Breathing')).toBeInTheDocument();
    });

    it('should render pattern description', () => {
      render(<BreathingPlayer {...defaultProps} />);
      expect(screen.getByText('Equal inhale, hold, exhale, hold')).toBeInTheDocument();
    });

    it('should render close button', () => {
      const { container } = render(<BreathingPlayer {...defaultProps} />);
      const closeButton = container.querySelector('button svg');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render play button', () => {
      const { container } = render(<BreathingPlayer {...defaultProps} />);
      const playButton = container.querySelector('button.w-20');
      expect(playButton).toBeInTheDocument();
    });

    it('should render canvas for visualizer', () => {
      const { container } = render(<BreathingPlayer {...defaultProps} />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should show "Ready?" initially', () => {
      render(<BreathingPlayer {...defaultProps} />);
      expect(screen.getByText('Ready?')).toBeInTheDocument();
    });

    it('should show initial phase instructions', () => {
      render(<BreathingPlayer {...defaultProps} />);
      expect(screen.getByText('Press play to begin')).toBeInTheDocument();
    });

    it('should display total time as 0:00 initially', () => {
      render(<BreathingPlayer {...defaultProps} />);
      expect(screen.getByText('Total Time: 0:00')).toBeInTheDocument();
    });
  });

  describe('play/pause functionality', () => {
    it('should start breathing exercise when play is clicked', () => {
      const { container } = render(<BreathingPlayer {...defaultProps} />);
      const playButton = container.querySelector('button.w-20');
      if (playButton) {
        fireEvent.click(playButton);
      }
      expect(screen.getByText('Inhale')).toBeInTheDocument();
    });

    it('should show pause icon when playing', () => {
      const { container } = render(<BreathingPlayer {...defaultProps} />);
      const playButton = container.querySelector('button.w-20');
      if (playButton) {
        fireEvent.click(playButton);
      }
      const pauseIcon = container.querySelector('svg path[d*="15.75 5.25v13.5"]');
      expect(pauseIcon).toBeInTheDocument();
    });

    it('should pause when pause button is clicked', () => {
      const { container } = render(<BreathingPlayer {...defaultProps} />);
      const playButton = container.querySelector('button.w-20');
      if (playButton) {
        fireEvent.click(playButton); // Start
        fireEvent.click(playButton); // Pause
      }
      const playIcon = container.querySelector('svg path[d*="5.25 5.653"]');
      expect(playIcon).toBeInTheDocument();
    });

    it('should play bell on first start when bell is enabled', () => {
      const { container } = render(<BreathingPlayer {...defaultProps} />);
      const playButton = container.querySelector('button.w-20');
      if (playButton) {
        fireEvent.click(playButton);
      }
      expect(mockSoundscapeInstance.playBell).toHaveBeenCalledWith('chime');
    });
  });

  describe('controls', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      const { container } = render(<BreathingPlayer {...defaultProps} onClose={onClose} />);
      const closeButton = container.querySelector('.absolute.top-6 button');
      if (closeButton) {
        fireEvent.click(closeButton);
      }
      expect(onClose).toHaveBeenCalled();
    });

    it('should have bell tone selector', () => {
      render(<BreathingPlayer {...defaultProps} />);
      expect(screen.getByText('Bell Tone')).toBeInTheDocument();
    });
  });

  describe('soundscape integration', () => {
    it('should initialize soundscape engine', () => {
      render(<BreathingPlayer {...defaultProps} />);
      expect(SoundscapeEngine).toHaveBeenCalled();
    });
  });

  describe('different patterns', () => {
    it('should render 4-7-8 pattern', () => {
      const pattern478 = create478BreathingPattern();
      render(<BreathingPlayer {...defaultProps} pattern={pattern478} />);
      expect(screen.getByText('4-7-8 Relaxation')).toBeInTheDocument();
    });

    it('should handle pattern with no hold phase', () => {
      const simplePattern = {
        id: 'simple',
        name: 'Simple Breath',
        description: 'Just inhale and exhale',
        phases: [
          { label: 'Inhale' as const, duration: 4 },
          { label: 'Exhale' as const, duration: 4 },
        ],
        color: '#00d4aa',
        icon: '○',
      };
      render(<BreathingPlayer {...defaultProps} pattern={simplePattern} />);
      expect(screen.getByText('Simple Breath')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should render as fullscreen overlay', () => {
      const { container } = render(<BreathingPlayer {...defaultProps} />);
      const overlay = container.querySelector('.fixed.inset-0.z-50');
      expect(overlay).toBeInTheDocument();
    });

    it('should have dark background', () => {
      const { container } = render(<BreathingPlayer {...defaultProps} />);
      const overlay = container.querySelector('.bg-slate-950');
      expect(overlay).toBeInTheDocument();
    });
  });
});
