
export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export enum SoundscapeType {
  NONE = 'None',
  RAIN = 'Soft Rain',
  OCEAN = 'Ocean Waves',
  WIND = 'Forest Wind',
  DRONE_LOW = 'Deep Drone (Low)',
  DRONE_MID = 'Healing Drone (Mid)',
  DRONE_HIGH = 'Celestial Drone (High)',
  BOWL = 'Crystal Bowl',
}

export enum MeditationTechnique {
  MINDFULNESS = 'Mindfulness',
  BODY_SCAN = 'Body Scan',
  VISUALIZATION = 'Visualization',
  BREATH_WORK = 'Breath Work',
  LOVING_KINDNESS = 'Loving Kindness',
  SLEEP_INDUCTION = 'Sleep Induction'
}

export enum GuidanceLevel {
  LOW = 'Low (Mostly Silence)',
  MEDIUM = 'Medium (Balanced)',
  HIGH = 'High (Continuous)'
}

export interface MeditationConfig {
  topic: string;
  durationMinutes: number;
  voice: VoiceName;
  soundscape: SoundscapeType;
  technique: MeditationTechnique;
  guidanceLevel: GuidanceLevel;
}

export interface SessionData {
  script: string;
  audioBuffer: AudioBuffer | null;
  config: MeditationConfig; // Added config to session data for tracking
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

export interface GenerationState {
  step: 'idle' | 'script' | 'audio' | 'complete';
  error: string | null;
}

export interface UserPreferences {
  displayName: string;
  defaultDuration: number;
  defaultVoice: VoiceName;
  defaultSoundscape: SoundscapeType;
  defaultTechnique: MeditationTechnique;
  defaultGuidanceLevel: GuidanceLevel;
  reducedMotion: boolean;
}

export interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  lastSessionDate: string | null; // ISO Date string
  history: {
    id: string;
    date: string;
    topic: string;
    duration: number;
  }[];
  preferences: UserPreferences;
}

// Breathing Types
export type BreathPhaseType = 'Inhale' | 'Hold' | 'Exhale' | 'Sustain';

export interface BreathPhase {
  label: BreathPhaseType;
  duration: number; // seconds
}

export interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  phases: BreathPhase[];
  color: string;
  icon: string;
}

// Meditation Preset Types
export interface MeditationPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  durationMinutes: number;
  technique: MeditationTechnique;
  soundscape: SoundscapeType;
  guidanceLevel: GuidanceLevel;
  isUserCreated?: boolean;
}

// Navigation Types
export type NavSectionId = 'meditations' | 'journal' | 'progress' | 'learn' | 'settings';
export type NavPageId =
  | 'presets' | 'custom' | 'breathing' | 'timer'
  | 'entries' | 'calendar' | 'mood-log' | 'insights'
  | 'overview' | 'stats' | 'achievements'
  | 'articles' | 'techniques' | 'tips'
  | 'profile' | 'preferences' | 'data';

export interface NavState {
  section: NavSectionId;
  page: NavPageId | null;
  sidebarExpanded: boolean;
  isMobile: boolean;
}

export interface NavItem {
  id: NavSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultPage?: NavPageId;
}

// Timer Types
export interface TimerConfig {
  durationSeconds: number;
  bellAtStart: boolean;
  bellAtEnd: boolean;
  intervalBellSeconds: number; // 0 = none, or seconds between bells
  ambientSound: SoundscapeType;
}

export interface TimerSession {
  id: string;
  date: string; // ISO date string
  durationSeconds: number;
  completedSeconds: number;
  completed: boolean;
  timestamp: number;
}

export type TimerState = 'idle' | 'running' | 'paused' | 'complete';

// Mood Types
export enum MoodLevel {
  VERY_LOW = 1,
  LOW = 2,
  NEUTRAL = 3,
  GOOD = 4,
  EXCELLENT = 5,
}

export interface MoodEntry {
  id: string;
  sessionId?: string; // Optional link to meditation session
  date: string; // ISO date string
  moodBefore?: MoodLevel;
  moodAfter?: MoodLevel;
  notes?: string;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  date: string; // ISO date string
  title: string;
  content: string;
  moodId?: string; // Optional link to mood entry
  sessionId?: string; // Optional link to meditation session
  tags: string[];
  timestamp: number;
}
