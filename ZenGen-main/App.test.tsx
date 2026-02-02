import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { createMockUserStats } from './test/fixtures/testData';

// Set up global RAF mocks before any imports
beforeAll(() => {
  global.cancelAnimationFrame = vi.fn();
  global.requestAnimationFrame = vi.fn((cb) => {
    setTimeout(cb, 16);
    return 1;
  }) as any;
});

// Mock all external services
vi.mock('./services/claudeService', () => ({
  checkAndRequestApiKey: vi.fn().mockResolvedValue(true),
  generateMeditationScript: vi.fn().mockResolvedValue('Welcome to your meditation session...'),
  generateMeditationAudio: vi.fn().mockResolvedValue(null),
}));

vi.mock('./services/storageService', () => ({
  getUserStats: vi.fn(() => createMockUserStats()),
  saveSessionCompletion: vi.fn(),
  clearUserStats: vi.fn(() => ({
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    lastSessionDate: null,
    history: [],
    preferences: createMockUserStats().preferences,
  })),
  updateUserPreferences: vi.fn((prefs) => ({
    ...createMockUserStats(),
    preferences: { ...createMockUserStats().preferences, ...prefs },
  })),
  exportUserData: vi.fn(),
  importUserData: vi.fn(),
}));

vi.mock('./services/soundscapeService', () => ({
  SoundscapeEngine: vi.fn().mockImplementation(() => ({
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
  })),
}));

vi.mock('./services/claudeService', () => ({
  createChat: vi.fn(() => ({
    sendMessage: vi.fn().mockResolvedValue({ text: 'Mock response' }),
  })),
}));

import { getUserStats, clearUserStats } from './services/storageService';

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial render', () => {
    it('should render the app with generator tab active by default', () => {
      render(<App />);

      expect(screen.getByText('Create Session')).toBeInTheDocument();
      expect(screen.getByText('ZenGen')).toBeInTheDocument();
    });

    it('should render navbar with tabs', () => {
      render(<App />);

      expect(screen.getByText('Session')).toBeInTheDocument();
      expect(screen.getByText('Meditations')).toBeInTheDocument();
    });

    it('should load user stats on mount', () => {
      render(<App />);

      expect(getUserStats).toHaveBeenCalled();
    });

    it('should display quick start breathing patterns', () => {
      render(<App />);

      expect(screen.getByText('Quick Start Breathing')).toBeInTheDocument();
      expect(screen.getByText('Box Breathing')).toBeInTheDocument();
      expect(screen.getByText('Relaxing Breath')).toBeInTheDocument();
    });

    it('should render ChatBot button', () => {
      const { container } = render(<App />);

      // ChatBot has a fixed positioned button
      const chatButton = container.querySelector('.fixed.bottom-6');
      expect(chatButton).toBeInTheDocument();
    });
  });

  describe('tab navigation', () => {
    it('should switch to breathing tab when clicked', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Meditations'));

      expect(screen.getByText('Design Custom Pattern')).toBeInTheDocument();
      expect(screen.getByText('Quick Presets')).toBeInTheDocument();
    });

    it('should switch back to generator tab', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Meditations'));
      fireEvent.click(screen.getByText('Session'));

      expect(screen.getByText('Create Session')).toBeInTheDocument();
    });

    it('should show custom breathing builder in breathing tab', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Meditations'));

      expect(screen.getByText('Inhale (s)')).toBeInTheDocument();
      expect(screen.getByText('Hold (s)')).toBeInTheDocument();
      expect(screen.getByText('Exhale (s)')).toBeInTheDocument();
    });
  });

  describe('profile modal integration', () => {
    it('should open profile modal when profile button is clicked', () => {
      render(<App />);

      // Find profile button (the button with user initial)
      const buttons = screen.getAllByRole('button');
      const profileButton = buttons.find((b) => b.textContent?.includes('T'));
      if (profileButton) {
        fireEvent.click(profileButton);
      }

      expect(screen.getByText('Session History')).toBeInTheDocument();
    });

    it('should clear data when reset is confirmed', async () => {
      (window.confirm as any).mockReturnValue(true);

      render(<App />);

      // Open profile and go to settings
      const buttons = screen.getAllByRole('button');
      const profileButton = buttons.find((b) => b.textContent?.includes('T'));
      if (profileButton) {
        fireEvent.click(profileButton);
      }

      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
      fireEvent.click(screen.getByText('Reset Everything'));

      expect(clearUserStats).toHaveBeenCalled();
    });
  });

  describe('configuration form', () => {
    it('should update duration slider', () => {
      render(<App />);

      const durationSlider = screen.getByRole('slider');
      fireEvent.change(durationSlider, { target: { value: '7' } });

      expect(screen.getByText('7 min')).toBeInTheDocument();
    });

    it('should update technique select', () => {
      render(<App />);

      const techniqueSelect = screen.getByDisplayValue('Mindfulness');
      fireEvent.change(techniqueSelect, { target: { value: 'Body Scan' } });

      expect(screen.getByDisplayValue('Body Scan')).toBeInTheDocument();
    });

    it('should update voice select', () => {
      render(<App />);

      const voiceSelect = screen.getByDisplayValue('Kore');
      fireEvent.change(voiceSelect, { target: { value: 'Puck' } });

      expect(screen.getByDisplayValue('Puck')).toBeInTheDocument();
    });

    it('should update soundscape select', () => {
      render(<App />);

      const soundscapeSelect = screen.getByDisplayValue('Ocean Waves');
      fireEvent.change(soundscapeSelect, { target: { value: 'Soft Rain' } });

      expect(screen.getByDisplayValue('Soft Rain')).toBeInTheDocument();
    });
  });

  describe('preferences integration', () => {
    it('should apply preferences from loaded stats', () => {
      const statsWithPrefs = createMockUserStats();
      statsWithPrefs.preferences.defaultDuration = 7;
      (getUserStats as any).mockReturnValue(statsWithPrefs);

      render(<App />);

      expect(screen.getByText('7 min')).toBeInTheDocument();
    });
  });
});
