import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileModal } from './ProfileModal';
import { createMockUserStats, levelTestCases } from '../test/fixtures/testData';
import { VoiceName, SoundscapeType, MeditationTechnique, GuidanceLevel } from '../types';

// Default preferences to use in mock factory (cannot use createMockUserStats inside factory due to hoisting)
const defaultPreferences = {
  displayName: 'Test User',
  defaultDuration: 5,
  defaultVoice: VoiceName.Kore,
  defaultSoundscape: SoundscapeType.OCEAN,
  defaultTechnique: MeditationTechnique.MINDFULNESS,
  defaultGuidanceLevel: GuidanceLevel.MEDIUM,
};

const emptyStats = {
  totalSessions: 0,
  totalMinutes: 0,
  currentStreak: 0,
  lastSessionDate: null,
  history: [],
  preferences: defaultPreferences,
};

// Create mock functions outside factory
const mockUpdateUserPreferences = vi.fn();
const mockExportUserData = vi.fn();
const mockImportUserData = vi.fn();
const mockClearUserStats = vi.fn();

// Mock storageService with simple return values (no createMockUserStats inside factory)
vi.mock('../services/storageService', () => ({
  updateUserPreferences: (prefs: any) => {
    mockUpdateUserPreferences(prefs);
    return {
      totalSessions: 10,
      totalMinutes: 120,
      currentStreak: 3,
      lastSessionDate: new Date().toISOString(),
      history: [],
      preferences: { ...defaultPreferences, ...prefs },
    };
  },
  exportUserData: () => {
    mockExportUserData();
  },
  importUserData: (file: File) => {
    mockImportUserData(file);
    return Promise.resolve({
      totalSessions: 5,
      totalMinutes: 60,
      currentStreak: 2,
      lastSessionDate: null,
      history: [],
      preferences: defaultPreferences,
    });
  },
  clearUserStats: () => {
    mockClearUserStats();
    return emptyStats;
  },
}));

describe('ProfileModal', () => {
  const defaultProps = {
    stats: createMockUserStats(),
    onClose: vi.fn(),
    onUpdate: vi.fn(),
    onClearData: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateUserPreferences.mockClear();
    mockExportUserData.mockClear();
    mockImportUserData.mockClear();
    mockClearUserStats.mockClear();
    // Use real timers for userEvent compatibility
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useFakeTimers();
  });

  describe('rendering', () => {
    it('should render modal with profile tab active by default', () => {
      render(<ProfileModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    });

    it('should display user display name', () => {
      const stats = createMockUserStats();
      stats.preferences.displayName = 'John';
      render(<ProfileModal {...defaultProps} stats={stats} />);

      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('should display user initial in avatar', () => {
      const stats = createMockUserStats();
      stats.preferences.displayName = 'Alice';
      render(<ProfileModal {...defaultProps} stats={stats} />);

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('should display stats grid', () => {
      render(<ProfileModal {...defaultProps} />);

      expect(screen.getByText('Streak')).toBeInTheDocument();
      expect(screen.getByText('Sessions')).toBeInTheDocument();
      expect(screen.getByText('Total Mindful Time')).toBeInTheDocument();
    });

    it('should display correct streak value', () => {
      const stats = createMockUserStats({ currentStreak: 7 });
      render(<ProfileModal {...defaultProps} stats={stats} />);

      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('should display correct session count', () => {
      const stats = createMockUserStats({ totalSessions: 42 });
      render(<ProfileModal {...defaultProps} stats={stats} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should display total minutes', () => {
      const stats = createMockUserStats({ totalMinutes: 150 });
      render(<ProfileModal {...defaultProps} stats={stats} />);

      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  describe('level calculation', () => {
    it.each(levelTestCases)(
      'should show level $expectedLevel ($expectedTitle) for $minutes minutes',
      ({ minutes, expectedLevel, expectedTitle }) => {
        const stats = createMockUserStats({ totalMinutes: minutes });
        render(<ProfileModal {...defaultProps} stats={stats} />);

        expect(screen.getByText(new RegExp(`Lvl ${expectedLevel}`))).toBeInTheDocument();
        expect(screen.getByText(new RegExp(expectedTitle))).toBeInTheDocument();
      }
    );

    it('should show progress bar', () => {
      const stats = createMockUserStats({ totalMinutes: 30 });
      render(<ProfileModal {...defaultProps} stats={stats} />);

      expect(screen.getByText('Progress to next level')).toBeInTheDocument();
    });
  });

  describe('session history', () => {
    it('should display session history', () => {
      render(<ProfileModal {...defaultProps} />);

      expect(screen.getByText('Session History')).toBeInTheDocument();
    });

    it('should show "No sessions yet" when history is empty', () => {
      const stats = createMockUserStats({ history: [] });
      render(<ProfileModal {...defaultProps} stats={stats} />);

      expect(screen.getByText('No sessions yet.')).toBeInTheDocument();
    });

    it('should display session topics', () => {
      const stats = createMockUserStats({
        history: [
          { id: '1', date: new Date().toISOString(), topic: 'Morning Calm', duration: 10 },
        ],
      });
      render(<ProfileModal {...defaultProps} stats={stats} />);

      expect(screen.getByText('Morning Calm')).toBeInTheDocument();
    });

    it('should show "Show Older Sessions" when more history exists', () => {
      const stats = createMockUserStats({
        history: Array.from({ length: 10 }, (_, i) => ({
          id: String(i),
          date: new Date().toISOString(),
          topic: `Session ${i}`,
          duration: 5,
        })),
      });
      render(<ProfileModal {...defaultProps} stats={stats} />);

      expect(screen.getByText('Show Older Sessions')).toBeInTheDocument();
    });

    it('should load more history when button clicked', () => {
      const stats = createMockUserStats({
        history: Array.from({ length: 10 }, (_, i) => ({
          id: String(i),
          date: new Date().toISOString(),
          topic: `Session ${i}`,
          duration: 5,
        })),
      });
      render(<ProfileModal {...defaultProps} stats={stats} />);

      fireEvent.click(screen.getByText('Show Older Sessions'));

      // Should now show all 10 sessions
      expect(screen.getByText('Session 9')).toBeInTheDocument();
    });
  });

  describe('tab switching', () => {
    it('should switch to settings tab', () => {
      render(<ProfileModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

      expect(screen.getByText('Display Name')).toBeInTheDocument();
    });

    it('should switch back to profile tab', () => {
      render(<ProfileModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
      fireEvent.click(screen.getByRole('button', { name: 'Profile' }));

      expect(screen.getByText('Session History')).toBeInTheDocument();
    });

    it('should highlight active tab', () => {
      render(<ProfileModal {...defaultProps} />);

      const profileTab = screen.getByRole('button', { name: 'Profile' });
      expect(profileTab).toHaveClass('text-teal-400');
    });
  });

  describe('settings - preferences', () => {
    it('should update display name on change', () => {
      render(<ProfileModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

      const nameInput = screen.getByDisplayValue('Test User') as HTMLInputElement;
      // Use fireEvent.change for a simpler, more reliable test
      fireEvent.change(nameInput, { target: { value: 'New Name' } });

      expect(mockUpdateUserPreferences).toHaveBeenCalledWith({ displayName: 'New Name' });
    });

    it('should update default duration on slider change', () => {
      render(<ProfileModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

      const durationSlider = screen.getByRole('slider');
      fireEvent.change(durationSlider, { target: { value: '15' } });

      expect(mockUpdateUserPreferences).toHaveBeenCalledWith({ defaultDuration: 15 });
    });

    // Voice selection is disabled (TBA feature)
    it('should have voice select disabled', () => {
      render(<ProfileModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

      const voiceSelect = screen.getByDisplayValue(VoiceName.Kore);
      expect(voiceSelect).toBeDisabled();
    });

    it('should update default soundscape on select change', () => {
      render(<ProfileModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

      const soundscapeSelect = screen.getByDisplayValue(SoundscapeType.OCEAN);
      fireEvent.change(soundscapeSelect, { target: { value: SoundscapeType.RAIN } });

      expect(mockUpdateUserPreferences).toHaveBeenCalledWith({ defaultSoundscape: SoundscapeType.RAIN });
    });

    it('should update default technique on select change', () => {
      render(<ProfileModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

      const techniqueSelect = screen.getByDisplayValue(MeditationTechnique.MINDFULNESS);
      fireEvent.change(techniqueSelect, { target: { value: MeditationTechnique.BODY_SCAN } });

      expect(mockUpdateUserPreferences).toHaveBeenCalledWith({ defaultTechnique: MeditationTechnique.BODY_SCAN });
    });

    it('should update default guidance level on select change', () => {
      render(<ProfileModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

      const guidanceSelect = screen.getByDisplayValue(GuidanceLevel.MEDIUM);
      fireEvent.change(guidanceSelect, { target: { value: GuidanceLevel.HIGH } });

      expect(mockUpdateUserPreferences).toHaveBeenCalledWith({ defaultGuidanceLevel: GuidanceLevel.HIGH });
    });
  });

  describe('data management', () => {
    it('should call exportUserData on export button click', () => {
      render(<ProfileModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

      fireEvent.click(screen.getByText('Export Data'));

      expect(mockExportUserData).toHaveBeenCalled();
    });

    it('should trigger file input on import button click', () => {
      render(<ProfileModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      fireEvent.click(screen.getByText('Import Data'));

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should import data when file is selected', async () => {
      const onUpdate = vi.fn();
      render(<ProfileModal {...defaultProps} onUpdate={onUpdate} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

      const file = new File(['{"totalSessions":5}'], 'backup.json', { type: 'application/json' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockImportUserData).toHaveBeenCalled();
      });
    });

    it('should show confirmation before clearing data', () => {
      render(<ProfileModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

      fireEvent.click(screen.getByText('Reset Everything'));

      expect(window.confirm).toHaveBeenCalled();
    });

    it('should call onClearData when confirmed', () => {
      (window.confirm as any).mockReturnValue(true);
      const onClearData = vi.fn();

      render(<ProfileModal {...defaultProps} onClearData={onClearData} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
      fireEvent.click(screen.getByText('Reset Everything'));

      expect(onClearData).toHaveBeenCalled();
    });

    it('should not clear data when cancelled', () => {
      (window.confirm as any).mockReturnValue(false);
      const onClearData = vi.fn();

      render(<ProfileModal {...defaultProps} onClearData={onClearData} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
      fireEvent.click(screen.getByText('Reset Everything'));

      expect(onClearData).not.toHaveBeenCalled();
    });

    it('should fallback to clearUserStats when onClearData not provided', () => {
      (window.confirm as any).mockReturnValue(true);

      render(<ProfileModal {...defaultProps} onClearData={undefined} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
      fireEvent.click(screen.getByText('Reset Everything'));

      expect(mockClearUserStats).toHaveBeenCalled();
    });
  });

  describe('modal behavior', () => {
    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<ProfileModal {...defaultProps} onClose={onClose} />);

      // Click the backdrop (first absolute div inside fixed container)
      const backdrop = document.querySelector('.absolute.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<ProfileModal {...defaultProps} onClose={onClose} />);

      // Find close button by the IconClose inside it
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find((b) => b.querySelector('svg'));
      if (closeButton && !closeButton.textContent?.includes('Profile')) {
        fireEvent.click(closeButton);
      }

      // The onClose should be called
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('version info', () => {
    it('should display version information in settings', () => {
      render(<ProfileModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

      expect(screen.getByText(/ZenGen AI v/)).toBeInTheDocument();
    });
  });
});
