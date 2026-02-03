import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  getUserStats,
  clearUserStats,
  updateUserPreferences,
  saveSessionCompletion,
  exportUserData,
  importUserData,
  getTimerHistory,
  saveTimerSession,
  clearTimerHistory,
  getMoodEntries,
  saveMoodEntry,
  updateMoodEntry,
  deleteMoodEntry,
  clearMoodEntries,
  getJournalEntries,
  saveJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  clearJournalEntries,
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

  describe('Timer storage', () => {
    describe('getTimerHistory', () => {
      it('should return empty array when storage is empty', () => {
        const history = getTimerHistory();
        expect(history).toEqual([]);
      });

      it('should return stored timer sessions', () => {
        const sessions = [
          { id: 'timer-1', date: '2024-01-01T10:00:00Z', durationSeconds: 300, completedSeconds: 300, completed: true, timestamp: 1704103200000 },
          { id: 'timer-2', date: '2024-01-02T10:00:00Z', durationSeconds: 600, completedSeconds: 450, completed: false, timestamp: 1704189600000 },
        ];
        localStorage.setItem('zengen_timer_history', JSON.stringify(sessions));

        const history = getTimerHistory();

        expect(history).toHaveLength(2);
        expect(history[0].id).toBe('timer-1');
        expect(history[1].durationSeconds).toBe(600);
      });

      it('should return empty array when JSON is corrupted', () => {
        localStorage.setItem('zengen_timer_history', '{ invalid json }}}');

        const history = getTimerHistory();

        expect(history).toEqual([]);
      });

      it('should return empty array when stored value is not an array', () => {
        localStorage.setItem('zengen_timer_history', JSON.stringify({ not: 'array' }));

        const history = getTimerHistory();

        expect(history).toEqual([]);
      });
    });

    describe('saveTimerSession', () => {
      it('should save a timer session and return updated history', () => {
        const result = saveTimerSession({
          durationSeconds: 300,
          completedSeconds: 300,
          completed: true,
        });

        expect(result).toHaveLength(1);
        expect(result[0].durationSeconds).toBe(300);
        expect(result[0].completedSeconds).toBe(300);
        expect(result[0].completed).toBe(true);
        expect(result[0].id).toMatch(/^timer-\d+$/);
        expect(result[0].date).toBeDefined();
        expect(result[0].timestamp).toBeDefined();
      });

      it('should prepend new session to existing history', () => {
        const existingSessions = [
          { id: 'timer-1', date: '2024-01-01T10:00:00Z', durationSeconds: 300, completedSeconds: 300, completed: true, timestamp: 1704103200000 },
        ];
        localStorage.setItem('zengen_timer_history', JSON.stringify(existingSessions));

        const result = saveTimerSession({
          durationSeconds: 600,
          completedSeconds: 600,
          completed: true,
        });

        expect(result).toHaveLength(2);
        expect(result[0].durationSeconds).toBe(600); // New session first
        expect(result[1].durationSeconds).toBe(300); // Old session second
      });

      it('should limit history to 100 entries', () => {
        const existingSessions = Array.from({ length: 100 }, (_, i) => ({
          id: `timer-${i}`,
          date: '2024-01-01T10:00:00Z',
          durationSeconds: 300,
          completedSeconds: 300,
          completed: true,
          timestamp: 1704103200000 + i,
        }));
        localStorage.setItem('zengen_timer_history', JSON.stringify(existingSessions));

        const result = saveTimerSession({
          durationSeconds: 600,
          completedSeconds: 600,
          completed: true,
        });

        expect(result).toHaveLength(100);
        expect(result[0].durationSeconds).toBe(600); // New session
      });

      it('should update user stats when session is completed and >= 60 seconds', () => {
        const result = saveTimerSession({
          durationSeconds: 120,
          completedSeconds: 120,
          completed: true,
        });

        const stats = getUserStats();
        expect(stats.totalSessions).toBe(1);
        expect(stats.totalMinutes).toBe(2); // 120 seconds = 2 minutes
        expect(stats.history).toHaveLength(1);
        expect(stats.history[0].topic).toBe('Timer Session');
      });

      it('should not update user stats when session is incomplete', () => {
        saveTimerSession({
          durationSeconds: 300,
          completedSeconds: 150,
          completed: false,
        });

        const stats = getUserStats();
        expect(stats.totalSessions).toBe(0);
        expect(stats.totalMinutes).toBe(0);
      });

      it('should not update user stats when completed session is < 60 seconds', () => {
        saveTimerSession({
          durationSeconds: 30,
          completedSeconds: 30,
          completed: true,
        });

        const stats = getUserStats();
        expect(stats.totalSessions).toBe(0);
        expect(stats.totalMinutes).toBe(0);
      });

      it('should persist history to localStorage', () => {
        saveTimerSession({
          durationSeconds: 300,
          completedSeconds: 300,
          completed: true,
        });

        const stored = JSON.parse(localStorage.getItem('zengen_timer_history')!);
        expect(stored).toHaveLength(1);
        expect(stored[0].durationSeconds).toBe(300);
      });
    });

    describe('clearTimerHistory', () => {
      it('should clear timer history from localStorage', () => {
        localStorage.setItem('zengen_timer_history', JSON.stringify([{ id: 'test' }]));

        clearTimerHistory();

        expect(localStorage.getItem('zengen_timer_history')).toBeNull();
      });

      it('should not throw when history is already empty', () => {
        expect(() => clearTimerHistory()).not.toThrow();
      });
    });
  });

  describe('Mood entry storage', () => {
    describe('getMoodEntries', () => {
      it('should return empty array when storage is empty', () => {
        const entries = getMoodEntries();
        expect(entries).toEqual([]);
      });

      it('should return stored mood entries', () => {
        const entries = [
          { id: 'mood-1', date: '2024-01-01T10:00:00Z', moodBefore: 3, moodAfter: 4, timestamp: 1704103200000 },
          { id: 'mood-2', date: '2024-01-02T10:00:00Z', moodBefore: 2, moodAfter: 5, notes: 'Felt great', timestamp: 1704189600000 },
        ];
        localStorage.setItem('zengen_mood_entries', JSON.stringify(entries));

        const result = getMoodEntries();

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('mood-1');
        expect(result[1].notes).toBe('Felt great');
      });

      it('should return empty array when JSON is corrupted', () => {
        localStorage.setItem('zengen_mood_entries', '{ invalid json }}}');

        const entries = getMoodEntries();

        expect(entries).toEqual([]);
      });
    });

    describe('saveMoodEntry', () => {
      it('should save a mood entry and return updated entries', () => {
        const result = saveMoodEntry({
          moodBefore: 2,
          moodAfter: 4,
          notes: 'Test note',
        });

        expect(result).toHaveLength(1);
        expect(result[0].moodBefore).toBe(2);
        expect(result[0].moodAfter).toBe(4);
        expect(result[0].notes).toBe('Test note');
        expect(result[0].id).toMatch(/^mood-\d+$/);
      });

      it('should prepend new entry to existing entries', () => {
        const existingEntries = [
          { id: 'mood-1', date: '2024-01-01T10:00:00Z', moodBefore: 3, moodAfter: 4, timestamp: 1704103200000 },
        ];
        localStorage.setItem('zengen_mood_entries', JSON.stringify(existingEntries));

        const result = saveMoodEntry({
          moodBefore: 1,
          moodAfter: 5,
        });

        expect(result).toHaveLength(2);
        expect(result[0].moodBefore).toBe(1); // New entry first
        expect(result[1].moodBefore).toBe(3); // Old entry second
      });

      it('should limit entries to 500', () => {
        const existingEntries = Array.from({ length: 500 }, (_, i) => ({
          id: `mood-${i}`,
          date: '2024-01-01T10:00:00Z',
          moodBefore: 3,
          moodAfter: 4,
          timestamp: 1704103200000 + i,
        }));
        localStorage.setItem('zengen_mood_entries', JSON.stringify(existingEntries));

        const result = saveMoodEntry({
          moodBefore: 1,
          moodAfter: 5,
        });

        expect(result).toHaveLength(500);
        expect(result[0].moodBefore).toBe(1); // New entry
      });
    });

    describe('updateMoodEntry', () => {
      it('should update an existing mood entry', () => {
        const entries = [
          { id: 'mood-1', date: '2024-01-01T10:00:00Z', moodBefore: 3, moodAfter: 4, timestamp: 1704103200000 },
        ];
        localStorage.setItem('zengen_mood_entries', JSON.stringify(entries));

        const result = updateMoodEntry('mood-1', { notes: 'Updated note', moodAfter: 5 });

        expect(result[0].notes).toBe('Updated note');
        expect(result[0].moodAfter).toBe(5);
        expect(result[0].moodBefore).toBe(3); // Unchanged
      });

      it('should return unchanged entries when id not found', () => {
        const entries = [
          { id: 'mood-1', date: '2024-01-01T10:00:00Z', moodBefore: 3, moodAfter: 4, timestamp: 1704103200000 },
        ];
        localStorage.setItem('zengen_mood_entries', JSON.stringify(entries));

        const result = updateMoodEntry('mood-999', { notes: 'Test' });

        expect(result).toHaveLength(1);
        expect(result[0].notes).toBeUndefined();
      });
    });

    describe('deleteMoodEntry', () => {
      it('should delete a mood entry by id', () => {
        const entries = [
          { id: 'mood-1', date: '2024-01-01T10:00:00Z', moodBefore: 3, moodAfter: 4, timestamp: 1704103200000 },
          { id: 'mood-2', date: '2024-01-02T10:00:00Z', moodBefore: 2, moodAfter: 5, timestamp: 1704189600000 },
        ];
        localStorage.setItem('zengen_mood_entries', JSON.stringify(entries));

        const result = deleteMoodEntry('mood-1');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('mood-2');
      });
    });

    describe('clearMoodEntries', () => {
      it('should clear all mood entries', () => {
        localStorage.setItem('zengen_mood_entries', JSON.stringify([{ id: 'test' }]));

        clearMoodEntries();

        expect(localStorage.getItem('zengen_mood_entries')).toBeNull();
      });
    });
  });

  describe('Journal entry storage', () => {
    describe('getJournalEntries', () => {
      it('should return empty array when storage is empty', () => {
        const entries = getJournalEntries();
        expect(entries).toEqual([]);
      });

      it('should return stored journal entries', () => {
        const entries = [
          { id: 'journal-1', date: '2024-01-01T10:00:00Z', title: 'Day 1', content: 'My first entry', tags: ['meditation'], timestamp: 1704103200000 },
        ];
        localStorage.setItem('zengen_journal_entries', JSON.stringify(entries));

        const result = getJournalEntries();

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Day 1');
        expect(result[0].tags).toContain('meditation');
      });

      it('should return empty array when JSON is corrupted', () => {
        localStorage.setItem('zengen_journal_entries', '{ invalid }}}');

        const entries = getJournalEntries();

        expect(entries).toEqual([]);
      });
    });

    describe('saveJournalEntry', () => {
      it('should save a journal entry and return updated entries', () => {
        const result = saveJournalEntry({
          title: 'My Entry',
          content: 'Today was great',
          tags: ['mindfulness', 'gratitude'],
        });

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('My Entry');
        expect(result[0].content).toBe('Today was great');
        expect(result[0].tags).toContain('mindfulness');
        expect(result[0].id).toMatch(/^journal-\d+$/);
      });

      it('should prepend new entry to existing entries', () => {
        const existingEntries = [
          { id: 'journal-1', date: '2024-01-01T10:00:00Z', title: 'Old', content: 'Old content', tags: [], timestamp: 1704103200000 },
        ];
        localStorage.setItem('zengen_journal_entries', JSON.stringify(existingEntries));

        const result = saveJournalEntry({
          title: 'New',
          content: 'New content',
          tags: [],
        });

        expect(result).toHaveLength(2);
        expect(result[0].title).toBe('New'); // New entry first
        expect(result[1].title).toBe('Old'); // Old entry second
      });
    });

    describe('updateJournalEntry', () => {
      it('should update an existing journal entry', () => {
        const entries = [
          { id: 'journal-1', date: '2024-01-01T10:00:00Z', title: 'Original', content: 'Content', tags: [], timestamp: 1704103200000 },
        ];
        localStorage.setItem('zengen_journal_entries', JSON.stringify(entries));

        const result = updateJournalEntry('journal-1', { title: 'Updated Title', tags: ['new-tag'] });

        expect(result[0].title).toBe('Updated Title');
        expect(result[0].tags).toContain('new-tag');
        expect(result[0].content).toBe('Content'); // Unchanged
      });
    });

    describe('deleteJournalEntry', () => {
      it('should delete a journal entry by id', () => {
        const entries = [
          { id: 'journal-1', date: '2024-01-01T10:00:00Z', title: 'Entry 1', content: '', tags: [], timestamp: 1704103200000 },
          { id: 'journal-2', date: '2024-01-02T10:00:00Z', title: 'Entry 2', content: '', tags: [], timestamp: 1704189600000 },
        ];
        localStorage.setItem('zengen_journal_entries', JSON.stringify(entries));

        const result = deleteJournalEntry('journal-1');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('journal-2');
      });
    });

    describe('clearJournalEntries', () => {
      it('should clear all journal entries', () => {
        localStorage.setItem('zengen_journal_entries', JSON.stringify([{ id: 'test' }]));

        clearJournalEntries();

        expect(localStorage.getItem('zengen_journal_entries')).toBeNull();
      });
    });
  });
});
