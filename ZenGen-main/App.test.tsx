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
  createChat: vi.fn(() => ({
    sendMessage: vi.fn().mockResolvedValue({ text: 'Mock response' }),
  })),
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
  getUserPresets: vi.fn(() => []),
  saveUserPreset: vi.fn(() => []),
  deleteUserPreset: vi.fn(() => []),
  getCustomBreathingPatterns: vi.fn(() => []),
  saveCustomBreathingPattern: vi.fn(() => []),
  deleteCustomBreathingPattern: vi.fn(() => []),
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

import { getUserStats, clearUserStats } from './services/storageService';

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial render', () => {
    it('should render the app with presets tab active by default', () => {
      render(<App />);

      expect(screen.getByText('Guided Meditations')).toBeInTheDocument();
      expect(screen.getByText('ZenGen')).toBeInTheDocument();
    });

    it('should render navbar with tabs', () => {
      render(<App />);

      expect(screen.getByText('Quick Start')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('should load user stats on mount', () => {
      render(<App />);

      expect(getUserStats).toHaveBeenCalled();
    });

    it('should display breathing patterns on presets tab', () => {
      render(<App />);

      expect(screen.getByText('Breathing Exercises')).toBeInTheDocument();
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
    it('should switch to custom tab when clicked', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Custom'));

      expect(screen.getByText('Create Custom Session')).toBeInTheDocument();
      expect(screen.getByText('Design Custom Breathing Pattern')).toBeInTheDocument();
    });

    it('should switch back to presets tab', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Custom'));
      fireEvent.click(screen.getByText('Quick Start'));

      expect(screen.getByText('Guided Meditations')).toBeInTheDocument();
    });

    it('should show custom breathing builder in custom tab', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Custom'));

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

      // Find the Settings tab button within the profile modal (exclude sidebar Settings nav item)
      const settingsButtons = screen.getAllByRole('button', { name: 'Settings' });
      // The profile modal Settings tab is the one that appears after opening the profile
      const settingsTabButton = settingsButtons.find(btn =>
        btn.closest('[role="dialog"]') || btn.closest('.fixed.inset-0')
      );
      if (settingsTabButton) {
        fireEvent.click(settingsTabButton);
      }
      fireEvent.click(screen.getByText('Reset Everything'));

      expect(clearUserStats).toHaveBeenCalled();
    });
  });

  describe('configuration form', () => {
    it('should update duration slider', () => {
      render(<App />);
      fireEvent.click(screen.getByText('Custom'));

      // Get all sliders and use the first one (from Custom Session builder)
      const durationSliders = screen.getAllByRole('slider');
      fireEvent.change(durationSliders[0], { target: { value: '7' } });

      expect(screen.getByText('7 min')).toBeInTheDocument();
    });

    it('should update technique select', () => {
      render(<App />);
      fireEvent.click(screen.getByText('Custom'));

      // Get the first technique select (from Custom Session builder)
      const techniqueSelects = screen.getAllByDisplayValue('Mindfulness');
      fireEvent.change(techniqueSelects[0], { target: { value: 'Body Scan' } });

      expect(screen.getAllByDisplayValue('Body Scan').length).toBeGreaterThan(0);
    });

    it('should update soundscape select', () => {
      render(<App />);
      fireEvent.click(screen.getByText('Custom'));

      // Get the first soundscape select (from Custom Session builder)
      const soundscapeSelects = screen.getAllByDisplayValue('Ocean Waves');
      fireEvent.change(soundscapeSelects[0], { target: { value: 'Soft Rain' } });

      expect(screen.getAllByDisplayValue('Soft Rain').length).toBeGreaterThan(0);
    });
  });

  describe('preferences integration', () => {
    it('should apply preferences from loaded stats', () => {
      const statsWithPrefs = createMockUserStats();
      statsWithPrefs.preferences.defaultDuration = 7;
      (getUserStats as any).mockReturnValue(statsWithPrefs);

      render(<App />);
      fireEvent.click(screen.getByText('Custom'));

      expect(screen.getByText('7 min')).toBeInTheDocument();
    });
  });
});
