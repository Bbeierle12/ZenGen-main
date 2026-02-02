import { UserStats, SessionData, UserPreferences, VoiceName, SoundscapeType, MeditationTechnique, GuidanceLevel } from "../types";

const STORAGE_KEY = 'zengen_user_stats';

const DEFAULT_PREFERENCES: UserPreferences = {
  displayName: 'Traveler',
  defaultDuration: 3,
  defaultVoice: VoiceName.Kore,
  defaultSoundscape: SoundscapeType.OCEAN,
  defaultTechnique: MeditationTechnique.MINDFULNESS,
  defaultGuidanceLevel: GuidanceLevel.MEDIUM,
  reducedMotion: false,
};

const INITIAL_STATS: UserStats = {
  totalSessions: 0,
  totalMinutes: 0,
  currentStreak: 0,
  lastSessionDate: null,
  history: [],
  preferences: DEFAULT_PREFERENCES
};

/**
 * Safely get a local date string (YYYY-MM-DD) in the user's timezone
 * This fixes the timezone bug where UTC dates would cause incorrect streak calculations
 */
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Safely parse a number, returning a default value if the result would be NaN
 * This prevents NaN corruption in stats
 */
const safeParseNumber = (value: unknown, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? defaultValue : num;
};

/**
 * Safely write to localStorage with error handling
 * Returns true if successful, false if failed
 */
const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    // Handle quota exceeded, private browsing mode, or other storage errors
    console.error("Failed to save to localStorage:", e);
    return false;
  }
};

/**
 * Validate that a value is a valid UserStats object
 * Returns sanitized stats merged with defaults
 */
const validateAndSanitizeStats = (data: unknown): UserStats => {
  if (!data || typeof data !== 'object') {
    return INITIAL_STATS;
  }

  const obj = data as Record<string, unknown>;

  return {
    totalSessions: safeParseNumber(obj.totalSessions, 0),
    totalMinutes: safeParseNumber(obj.totalMinutes, 0),
    currentStreak: safeParseNumber(obj.currentStreak, 0),
    lastSessionDate: typeof obj.lastSessionDate === 'string' ? obj.lastSessionDate : null,
    history: Array.isArray(obj.history) ? obj.history.slice(0, 500) : [],
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...(obj.preferences && typeof obj.preferences === 'object' ? obj.preferences as Partial<UserPreferences> : {})
    }
  };
};

export const getUserStats = (): UserStats => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return INITIAL_STATS;

    const parsed = JSON.parse(stored);
    return validateAndSanitizeStats(parsed);
  } catch (e) {
    console.error("Failed to load stats:", e);
    return INITIAL_STATS;
  }
};

export const clearUserStats = (): UserStats => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear stats:", e);
  }
  return INITIAL_STATS;
};

export const updateUserPreferences = (prefs: Partial<UserPreferences>): UserStats => {
  const stats = getUserStats();
  const newStats: UserStats = {
    ...stats,
    preferences: { ...stats.preferences, ...prefs }
  };

  safeSetItem(STORAGE_KEY, JSON.stringify(newStats));
  return newStats;
};

export const saveSessionCompletion = (session: SessionData): UserStats => {
  const stats = getUserStats();
  const now = new Date();

  // Use LOCAL date strings for streak calculation (fixes timezone bug)
  const todayStr = getLocalDateString(now);

  let newStreak = stats.currentStreak;

  if (stats.lastSessionDate) {
    const lastDate = new Date(stats.lastSessionDate);
    const lastDateStr = getLocalDateString(lastDate);

    // Determine the date string for "Yesterday" relative to now (in local time)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    if (lastDateStr === todayStr) {
      // Already meditated today. Streak remains the same.
    } else if (lastDateStr === yesterdayStr) {
      // Meditated yesterday. Streak increments.
      newStreak += 1;
    } else {
      // Last session was before yesterday. Streak resets to 1.
      newStreak = 1;
    }
  } else {
    // First ever session
    newStreak = 1;
  }

  // Safely parse duration to prevent NaN corruption
  const sessionDuration = safeParseNumber(session.config.durationMinutes, 0);

  const newStats: UserStats = {
    ...stats,
    totalSessions: stats.totalSessions + 1,
    totalMinutes: stats.totalMinutes + sessionDuration,
    currentStreak: newStreak,
    lastSessionDate: now.toISOString(),
    history: [
      {
        id: Date.now().toString(),
        date: now.toISOString(),
        topic: session.config.topic || 'Untitled Session',
        duration: sessionDuration
      },
      ...stats.history
    ].slice(0, 500) // Keep last 500
  };

  safeSetItem(STORAGE_KEY, JSON.stringify(newStats));
  return newStats;
};

// Data Management
export const exportUserData = (): void => {
  const stats = getUserStats();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stats, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `zengen_backup_${getLocalDateString(new Date())}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

export const importUserData = async (file: File): Promise<UserStats> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Failed to read file. Please try again."));
    };

    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          reject(new Error("Failed to read file contents."));
          return;
        }

        const json = JSON.parse(result);

        // Comprehensive validation
        if (typeof json !== 'object' || json === null) {
          reject(new Error("Invalid file format: Expected a JSON object."));
          return;
        }

        // Check required fields exist and have correct types
        if (typeof json.totalSessions !== 'number') {
          reject(new Error("Invalid file format: Missing or invalid 'totalSessions' field."));
          return;
        }

        if (typeof json.totalMinutes !== 'number') {
          reject(new Error("Invalid file format: Missing or invalid 'totalMinutes' field."));
          return;
        }

        if (!Array.isArray(json.history)) {
          reject(new Error("Invalid file format: Missing or invalid 'history' field."));
          return;
        }

        // Validate and sanitize the imported data, merging with defaults
        const sanitizedStats = validateAndSanitizeStats(json);

        // Try to save to localStorage
        const saved = safeSetItem(STORAGE_KEY, JSON.stringify(sanitizedStats));
        if (!saved) {
          reject(new Error("Failed to save imported data. Storage may be full or unavailable."));
          return;
        }

        resolve(sanitizedStats);
      } catch (e) {
        if (e instanceof SyntaxError) {
          reject(new Error("Failed to parse file. Please ensure it is a valid JSON backup."));
        } else {
          reject(e);
        }
      }
    };

    reader.readAsText(file);
  });
};
