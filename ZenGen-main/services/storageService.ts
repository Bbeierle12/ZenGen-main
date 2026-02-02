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

export const getUserStats = (): UserStats => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return INITIAL_STATS;
    const parsed = JSON.parse(stored);
    // Merge with defaults to ensure new fields exist for old users
    return {
      ...INITIAL_STATS,
      ...parsed,
      preferences: {
        ...DEFAULT_PREFERENCES,
        ...(parsed.preferences || {})
      }
    };
  } catch (e) {
    console.error("Failed to load stats", e);
    return INITIAL_STATS;
  }
};

export const clearUserStats = (): UserStats => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear stats", e);
  }
  return INITIAL_STATS;
};

export const updateUserPreferences = (prefs: Partial<UserPreferences>): UserStats => {
  const stats = getUserStats();
  const newStats = {
    ...stats,
    preferences: { ...stats.preferences, ...prefs }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
  return newStats;
};

export const saveSessionCompletion = (session: SessionData) => {
  const stats = getUserStats();
  const now = new Date();
  
  // Use ISO string split for consistent YYYY-MM-DD comparison
  const todayStr = now.toISOString().split('T')[0]; 
  
  let newStreak = stats.currentStreak;

  if (stats.lastSessionDate) {
    const lastDate = new Date(stats.lastSessionDate);
    const lastDateStr = lastDate.toISOString().split('T')[0];

    // Determine the date string for "Yesterday" relative to now
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

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

  const newStats: UserStats = {
    ...stats,
    totalSessions: stats.totalSessions + 1,
    // Ensure durationMinutes is treated as a number for accurate addition
    totalMinutes: stats.totalMinutes + Number(session.config.durationMinutes),
    currentStreak: newStreak,
    lastSessionDate: now.toISOString(),
    history: [
      {
        id: Date.now().toString(),
        date: now.toISOString(),
        topic: session.config.topic,
        duration: session.config.durationMinutes
      },
      ...stats.history
    ].slice(0, 500) // Keep last 500
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
  return newStats;
};

// Data Management
export const exportUserData = () => {
   const stats = getUserStats();
   const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stats, null, 2));
   const downloadAnchorNode = document.createElement('a');
   downloadAnchorNode.setAttribute("href",     dataStr);
   downloadAnchorNode.setAttribute("download", `zengen_backup_${new Date().toISOString().split('T')[0]}.json`);
   document.body.appendChild(downloadAnchorNode); 
   downloadAnchorNode.click();
   downloadAnchorNode.remove();
}

export const importUserData = async (file: File): Promise<UserStats> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                // Basic validation
                if (typeof json.totalSessions === 'number' && Array.isArray(json.history)) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
                    resolve(json);
                } else {
                    reject(new Error("Invalid file format: Missing required session data."));
                }
            } catch (e) {
                reject(new Error("Failed to parse file. Please ensure it is a valid JSON backup."));
            }
        };
        reader.readAsText(file);
    });
}
