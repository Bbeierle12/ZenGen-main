import {
  UserStats,
  UserPreferences,
  MeditationConfig,
  SessionData,
  BreathingPattern,
  VoiceName,
  SoundscapeType,
  MeditationTechnique,
  GuidanceLevel,
} from '../../types';
import { MockAudioBuffer } from '../mocks/mockAudioContext';

/**
 * Create default user preferences for testing
 */
export function createMockUserPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    displayName: 'Test User',
    defaultDuration: 5,
    defaultVoice: VoiceName.Kore,
    defaultSoundscape: SoundscapeType.OCEAN,
    defaultTechnique: MeditationTechnique.MINDFULNESS,
    defaultGuidanceLevel: GuidanceLevel.MEDIUM,
    reducedMotion: false,
    ...overrides,
  };
}

/**
 * Create mock user stats for testing
 */
export function createMockUserStats(overrides: Partial<UserStats> = {}): UserStats {
  return {
    totalSessions: 10,
    totalMinutes: 120,
    currentStreak: 3,
    lastSessionDate: new Date().toISOString(),
    history: [
      {
        id: '1',
        date: new Date().toISOString(),
        topic: 'Morning Calm',
        duration: 10,
      },
      {
        id: '2',
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        topic: 'Evening Relaxation',
        duration: 15,
      },
    ],
    preferences: createMockUserPreferences(),
    ...overrides,
  };
}

/**
 * Create fresh user stats (no sessions)
 */
export function createFreshUserStats(): UserStats {
  return {
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    lastSessionDate: null,
    history: [],
    preferences: createMockUserPreferences({ displayName: 'Traveler' }),
  };
}

/**
 * Create mock meditation config for testing
 */
export function createMockMeditationConfig(overrides: Partial<MeditationConfig> = {}): MeditationConfig {
  return {
    topic: 'Finding Inner Peace',
    durationMinutes: 5,
    voice: VoiceName.Kore,
    soundscape: SoundscapeType.OCEAN,
    technique: MeditationTechnique.MINDFULNESS,
    guidanceLevel: GuidanceLevel.MEDIUM,
    ...overrides,
  };
}

/**
 * Create mock session data for testing
 */
export function createMockSessionData(overrides: Partial<SessionData> = {}): SessionData {
  return {
    script: 'Welcome to this meditation session. Take a deep breath...',
    audioBuffer: createMockAudioBuffer(60, 24000, 1) as unknown as AudioBuffer,
    config: createMockMeditationConfig(),
    ...overrides,
  };
}

/**
 * Create mock AudioBuffer with test data
 */
export function createMockAudioBuffer(
  duration: number = 1,
  sampleRate: number = 44100,
  channels: number = 1
): MockAudioBuffer {
  const length = Math.floor(duration * sampleRate);
  const buffer = new MockAudioBuffer({ numberOfChannels: channels, length, sampleRate });

  // Fill with a simple sine wave for testing
  for (let channel = 0; channel < channels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5;
    }
  }

  return buffer;
}

/**
 * Create mock breathing pattern for testing
 */
export function createMockBreathingPattern(overrides: Partial<BreathingPattern> = {}): BreathingPattern {
  return {
    id: 'test-pattern',
    name: 'Box Breathing',
    description: 'Equal inhale, hold, exhale, hold',
    phases: [
      { label: 'Inhale', duration: 4 },
      { label: 'Hold', duration: 4 },
      { label: 'Exhale', duration: 4 },
      { label: 'Sustain', duration: 4 },
    ],
    color: '#00d4aa',
    icon: '□',
    ...overrides,
  };
}

/**
 * Create a 4-7-8 breathing pattern
 */
export function create478BreathingPattern(): BreathingPattern {
  return {
    id: '478',
    name: '4-7-8 Relaxation',
    description: 'Calming breath for sleep',
    phases: [
      { label: 'Inhale', duration: 4 },
      { label: 'Hold', duration: 7 },
      { label: 'Exhale', duration: 8 },
    ],
    color: '#6366f1',
    icon: '🌙',
  };
}

/**
 * Create corrupted stats data (for testing validation)
 */
export function createCorruptedStatsData(): Record<string, unknown> {
  return {
    totalSessions: 'invalid', // Should be number
    totalMinutes: NaN,
    currentStreak: -5, // Negative
    lastSessionDate: 12345, // Should be string
    history: 'not an array',
    preferences: null,
  };
}

/**
 * Create valid exported stats JSON string
 */
export function createExportedStatsJson(): string {
  return JSON.stringify(createMockUserStats(), null, 2);
}

/**
 * Create an invalid JSON string
 */
export function createInvalidJson(): string {
  return '{ invalid json }}}';
}

/**
 * Date utilities for streak testing
 */
export const dateUtils = {
  /**
   * Get today's date as ISO string (start of day)
   */
  today: () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  },

  /**
   * Get yesterday's date as ISO string
   */
  yesterday: () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  },

  /**
   * Get date N days ago as ISO string
   */
  daysAgo: (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  },

  /**
   * Get a specific date as ISO string
   */
  specific: (year: number, month: number, day: number) => {
    return new Date(year, month - 1, day).toISOString();
  },
};

/**
 * Level calculation test cases
 */
export const levelTestCases = [
  { minutes: 0, expectedLevel: 1, expectedTitle: 'Novice' },
  { minutes: 30, expectedLevel: 1, expectedTitle: 'Novice' },
  { minutes: 60, expectedLevel: 2, expectedTitle: 'Seeker' },
  { minutes: 200, expectedLevel: 2, expectedTitle: 'Seeker' },
  { minutes: 300, expectedLevel: 3, expectedTitle: 'Practitioner' },
  { minutes: 500, expectedLevel: 3, expectedTitle: 'Practitioner' },
  { minutes: 1000, expectedLevel: 4, expectedTitle: 'Guide' },
  { minutes: 2000, expectedLevel: 4, expectedTitle: 'Guide' },
  { minutes: 3000, expectedLevel: 5, expectedTitle: 'Master' },
  { minutes: 10000, expectedLevel: 5, expectedTitle: 'Master' },
];
