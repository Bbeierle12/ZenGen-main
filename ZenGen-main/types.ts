
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
