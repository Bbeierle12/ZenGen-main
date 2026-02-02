import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  getUserStats,
  clearUserStats,
  updateUserPreferences,
  saveSessionCompletion,
  exportUserData,
  importUserData,
} from './storageService';
import {
  createMockUserStats,
  createMockMeditationConfig,
  createMockUserPreferences,
  createFreshUserStats,
  createCorruptedStatsData,
  dateUtils,
} from '../test/fixtures/testData';
import { VoiceName, SoundscapeType } from '../types';

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getUserStats', () => {
    it('should return initial stats when storage is empty', () => {
      const stats = getUserStats();

      expect(stats.totalSessions).toBe(0);
      expect(stats.totalMinutes).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.lastSessionDate).toBeNull();
      expect(stats.history).toEqual([]);
      expect(stats.preferences.displayName).toBe('Traveler');
    });

    it('should return stored stats when valid data exists', () => {
      const mockStats = createMockUserStats();
      localStorage.setItem('zengen_user_stats', JSON.stringify(mockStats));

      const stats = getUserStats();

      expect(stats.totalSessions).toBe(mockStats.totalSessions);
      expect(stats.totalMinutes).toBe(mockStats.totalMinutes);
      expect(stats.currentStreak).toBe(mockStats.currentStreak);
    });

    it('should return initial stats when JSON is corrupted', () => {
      localStorage.setItem('zengen_user_stats', '{ invalid json }}}');

      const stats = getUserStats();

      expect(stats.totalSessions).toBe(0);
      expect(stats.totalMinutes).toBe(0);
    });

    it('should sanitize NaN values to 0', () => {
      const corruptedStats = {
        totalSessions: NaN,
        totalMinutes: 'not a number',
        currentStreak: Infinity,
        lastSessionDate: null,
        history: [],
        preferences: {},
      };
      localStorage.setItem('zengen_user_stats', JSON.stringify(corruptedStats));

      const stats = getUserStats();

      expect(stats.totalSessions).toBe(0);
      expect(stats.totalMinutes).toBe(0);
      expect(stats.currentStreak).toBe(0);
    });

    it('should merge preferences with defaults', () => {
      const partialStats = {
        totalSessions: 5,
        totalMinutes: 30,
        currentStreak: 1,
        lastSessionDate: null,
        history: [],
        preferences: {
          displayName: 'Custom Name',
          // Other preferences missing
        },
      };
      localStorage.setItem('zengen_user_stats', JSON.stringify(partialStats));

      const stats = getUserStats();

      expect(stats.preferences.displayName).toBe('Custom Name');
      expect(stats.preferences.defaultDuration).toBe(3); // Default value
      expect(stats.preferences.defaultVoice).toBe(VoiceName.Kore);
    });

    it('should limit history to 500 entries', () => {
      const largeHistory = Array.from({ length: 600 }, (_, i) => ({
        id: String(i),
        date: new Date().toISOString(),
        topic: `Session ${i}`,
        duration: 5,
      }));

      const stats = {
        totalSessions: 600,
        totalMinutes: 3000,
        currentStreak: 1,
        lastSessionDate: new Date().toISOString(),
        history: largeHistory,
        preferences: {},
      };
      localStorage.setItem('zengen_user_stats', JSON.stringify(stats));

      const loadedStats = getUserStats();

      expect(loadedStats.history.length).toBe(500);
    });
  });

  describe('clearUserStats', () => {
    it('should clear storage and return initial stats', () => {
      localStorage.setItem('zengen_user_stats', JSON.stringify(createMockUserStats()));

      const result = clearUserStats();

      expect(localStorage.getItem('zengen_user_stats')).toBeNull();
      expect(result.totalSessions).toBe(0);
      expect(result.totalMinutes).toBe(0);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update specific preferences while preserving others', () => {
      const initialStats = createMockUserStats();
      localStorage.setItem('zengen_user_stats', JSON.stringify(initialStats));

      const result = updateUserPreferences({ displayName: 'New Name' });

      expect(result.preferences.displayName).toBe('New Name');
      expect(result.preferences.defaultDuration).toBe(initialStats.preferences.defaultDuration);
      expect(result.preferences.defaultVoice).toBe(initialStats.preferences.defaultVoice);
    });

    it('should update multiple preferences at once', () => {
      const result = updateUserPreferences({
        displayName: 'Test',
        defaultDuration: 10,
        defaultSoundscape: SoundscapeType.RAIN,
      });

      expect(result.preferences.displayName).toBe('Test');
      expect(result.preferences.defaultDuration).toBe(10);
      expect(result.preferences.defaultSoundscape).toBe(SoundscapeType.RAIN);
    });

    it('should persist changes to localStorage', () => {
      updateUserPreferences({ displayName: 'Persisted Name' });

      const stored = JSON.parse(localStorage.getItem('zengen_user_stats')!);
      expect(stored.preferences.displayName).toBe('Persisted Name');
    });
  });

  describe('saveSessionCompletion', () => {
    describe('streak logic', () => {
      it('should set streak to 1 for first ever session', () => {
        const session = {
          script: 'Test',
          audioBuffer: null,
          config: createMockMeditationConfig({ durationMinutes: 5 }),
        };

        const result = saveSessionCompletion(session);

        expect(result.currentStreak).toBe(1);
        expect(result.totalSessions).toBe(1);
        expect(result.totalMinutes).toBe(5);
      });

      it('should keep streak unchanged when meditating on same day', () => {
        const now = new Date();
        const initialStats = createMockUserStats({
          currentStreak: 5,
          lastSessionDate: now.toISOString(),
        });
        localStorage.setItem('zengen_user_stats', JSON.stringify(initialStats));

        const session = {
          script: 'Test',
          audioBuffer: null,
          config: createMockMeditationConfig(),
        };

        const result = saveSessionCompletion(session);

        expect(result.currentStreak).toBe(5); // Unchanged
      });

      it('should increment streak when meditating on consecutive day', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const initialStats = createMockUserStats({
          currentStreak: 3,
          lastSessionDate: yesterday.toISOString(),
        });
        localStorage.setItem('zengen_user_stats', JSON.stringify(initialStats));

        const session = {
          script: 'Test',
          audioBuffer: null,
          config: createMockMeditationConfig(),
        };

        const result = saveSessionCompletion(session);

        expect(result.currentStreak).toBe(4);
      });

      it('should reset streak to 1 when gap is more than one day', () => {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const initialStats = createMockUserStats({
          currentStreak: 10,
          lastSessionDate: threeDaysAgo.toISOString(),
        });
        localStorage.setItem('zengen_user_stats', JSON.stringify(initialStats));

        const session = {
          script: 'Test',
          audioBuffer: null,
          config: createMockMeditationConfig(),
        };

        const result = saveSessionCompletion(session);

        expect(result.currentStreak).toBe(1); // Reset
      });
    });

    it('should add session to history', () => {
      const session = {
        script: 'Test meditation',
        audioBuffer: null,
        config: createMockMeditationConfig({ topic: 'Morning Calm', durationMinutes: 10 }),
      };

      const result = saveSessionCompletion(session);

      expect(result.history.length).toBe(1);
      expect(result.history[0].topic).toBe('Morning Calm');
      expect(result.history[0].duration).toBe(10);
    });

    it('should prepend new session to history', () => {
      const initialStats = createMockUserStats();
      localStorage.setItem('zengen_user_stats', JSON.stringify(initialStats));

      const session = {
        script: 'New session',
        audioBuffer: null,
        config: createMockMeditationConfig({ topic: 'New Topic' }),
      };

      const result = saveSessionCompletion(session);

      expect(result.history[0].topic).toBe('New Topic');
    });

    it('should limit history to 500 entries', () => {
      const largeHistory = Array.from({ length: 500 }, (_, i) => ({
        id: String(i),
        date: new Date().toISOString(),
        topic: `Session ${i}`,
        duration: 5,
      }));

      const initialStats = createMockUserStats({ history: largeHistory });
      localStorage.setItem('zengen_user_stats', JSON.stringify(initialStats));

      const session = {
        script: 'New',
        audioBuffer: null,
        config: createMockMeditationConfig(),
      };

      const result = saveSessionCompletion(session);

      expect(result.history.length).toBe(500);
      expect(result.history[0].topic).toBe('Finding Inner Peace'); // New session topic
    });

    it('should use "Untitled Session" when topic is empty', () => {
      const session = {
        script: 'Test',
        audioBuffer: null,
        config: createMockMeditationConfig({ topic: '' }),
      };

      const result = saveSessionCompletion(session);

      expect(result.history[0].topic).toBe('Untitled Session');
    });

    it('should handle NaN duration gracefully', () => {
      const session = {
        script: 'Test',
        audioBuffer: null,
        config: { ...createMockMeditationConfig(), durationMinutes: NaN as number },
      };

      const result = saveSessionCompletion(session);

      expect(result.totalMinutes).toBe(0); // Should not add NaN
      expect(result.history[0].duration).toBe(0);
    });

    // Property-based tests for streak invariants
    it('should always have non-negative streak', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 100 }),
          fc.date(),
          (initialStreak, lastDate) => {
            localStorage.clear();
            const stats = createMockUserStats({
              currentStreak: initialStreak,
              lastSessionDate: lastDate.toISOString(),
            });
            localStorage.setItem('zengen_user_stats', JSON.stringify(stats));

            const session = {
              script: 'Test',
              audioBuffer: null,
              config: createMockMeditationConfig(),
            };

            const result = saveSessionCompletion(session);
            expect(result.currentStreak).toBeGreaterThanOrEqual(1);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('exportUserData', () => {
    it('should create download with correct filename format', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      // Mock the anchor element
      const mockAnchor = {
        setAttribute: vi.fn(),
        click: vi.fn(),
        remove: vi.fn(),
      };
      createElementSpy.mockReturnValue(mockAnchor as any);

      exportUserData();

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.setAttribute).toHaveBeenCalledWith('href', expect.stringContaining('data:text/json'));
      expect(mockAnchor.setAttribute).toHaveBeenCalledWith('download', expect.stringMatching(/zengen_backup_\d{4}-\d{2}-\d{2}\.json/));
      expect(mockAnchor.click).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('importUserData', () => {
    // Note: FileReader-based tests need real timers and work with actual File API
    // These tests use vi.useRealTimers() to work with FileReader's async nature

    it('should import valid JSON data', async () => {
      vi.useRealTimers();
      const validStats = createMockUserStats();
      const file = new File([JSON.stringify(validStats)], 'backup.json', { type: 'application/json' });

      const result = await importUserData(file);

      expect(result.totalSessions).toBe(validStats.totalSessions);
      expect(result.totalMinutes).toBe(validStats.totalMinutes);
      vi.useFakeTimers();
    });

    it('should reject file with missing totalSessions', async () => {
      vi.useRealTimers();
      const invalidData = { totalMinutes: 100, history: [] };
      const file = new File([JSON.stringify(invalidData)], 'backup.json');

      await expect(importUserData(file)).rejects.toThrow("Missing or invalid 'totalSessions'");
      vi.useFakeTimers();
    });

    it('should reject file with missing totalMinutes', async () => {
      vi.useRealTimers();
      const invalidData = { totalSessions: 10, history: [] };
      const file = new File([JSON.stringify(invalidData)], 'backup.json');

      await expect(importUserData(file)).rejects.toThrow("Missing or invalid 'totalMinutes'");
      vi.useFakeTimers();
    });

    it('should reject file with missing history array', async () => {
      vi.useRealTimers();
      const invalidData = { totalSessions: 10, totalMinutes: 100 };
      const file = new File([JSON.stringify(invalidData)], 'backup.json');

      await expect(importUserData(file)).rejects.toThrow("Missing or invalid 'history'");
      vi.useFakeTimers();
    });

    it('should reject invalid JSON', async () => {
      vi.useRealTimers();
      const file = new File(['{ not valid json }}}'], 'backup.json');

      await expect(importUserData(file)).rejects.toThrow('Failed to parse file');
      vi.useFakeTimers();
    });

    it('should reject non-object JSON', async () => {
      vi.useRealTimers();
      const file = new File(['"just a string"'], 'backup.json');

      await expect(importUserData(file)).rejects.toThrow('Expected a JSON object');
      vi.useFakeTimers();
    });

    it('should merge imported preferences with defaults', async () => {
      vi.useRealTimers();
      const partialStats = {
        totalSessions: 5,
        totalMinutes: 30,
        currentStreak: 1,
        lastSessionDate: null,
        history: [],
        preferences: {
          displayName: 'Imported User',
        },
      };
      const file = new File([JSON.stringify(partialStats)], 'backup.json');

      const result = await importUserData(file);

      expect(result.preferences.displayName).toBe('Imported User');
      expect(result.preferences.defaultDuration).toBe(3); // Default
      vi.useFakeTimers();
    });

    it('should persist imported data to localStorage', async () => {
      vi.useRealTimers();
      const validStats = createMockUserStats();
      const file = new File([JSON.stringify(validStats)], 'backup.json');

      await importUserData(file);

      const stored = JSON.parse(localStorage.getItem('zengen_user_stats')!);
      expect(stored.totalSessions).toBe(validStats.totalSessions);
      vi.useFakeTimers();
    });

    // Test import/export roundtrip without property testing to avoid FileReader issues
    it('should preserve data through import/export roundtrip', async () => {
      vi.useRealTimers();
      const stats = createMockUserStats({
        totalSessions: 42,
        totalMinutes: 500,
        currentStreak: 7,
      });

      localStorage.setItem('zengen_user_stats', JSON.stringify(stats));
      const exported = JSON.parse(localStorage.getItem('zengen_user_stats')!);

      const file = new File([JSON.stringify(exported)], 'backup.json');
      const imported = await importUserData(file);

      expect(imported.totalSessions).toBe(42);
      expect(imported.totalMinutes).toBe(500);
      expect(imported.currentStreak).toBe(7);
      vi.useFakeTimers();
    });
  });
});
