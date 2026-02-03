import React, { useState, useEffect, useMemo } from 'react';
import { CalendarGrid, CalendarDayData, useCalendarData } from '../../components/CalendarGrid';
import { getUserStats, getMoodEntries, getTimerHistory } from '../../services/storageService';
import { MoodDisplay, getMoodInfo } from '../../components/MoodSelector';
import { MoodLevel } from '../../types';

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDayData, setSelectedDayData] = useState<CalendarDayData | undefined>();

  // Load all session data
  const [sessions, setSessions] = useState<{ id: string; date: string; topic?: string; duration?: number }[]>([]);
  const [moods, setMoods] = useState<{ date: string; moodBefore?: MoodLevel; moodAfter?: MoodLevel; notes?: string }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Get meditation sessions from user stats history
    const stats = getUserStats();
    const meditationSessions = stats.history.map(h => ({
      id: h.id,
      date: h.date,
      topic: h.topic,
      duration: h.duration,
    }));

    // Get timer sessions
    const timerSessions = getTimerHistory().map(t => ({
      id: t.id,
      date: t.date,
      topic: 'Timer Session',
      duration: Math.round(t.completedSeconds / 60),
    }));

    // Combine and sort by date
    const allSessions = [...meditationSessions, ...timerSessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setSessions(allSessions);

    // Get mood entries
    const moodEntries = getMoodEntries().map(m => ({
      date: m.date,
      moodBefore: m.moodBefore,
      moodAfter: m.moodAfter,
      notes: m.notes,
    }));
    setMoods(moodEntries);
  };

  // Generate calendar data
  const calendarData = useCalendarData(sessions, moods);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(undefined);
    setSelectedDayData(undefined);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(undefined);
    setSelectedDayData(undefined);
  };

  const handleDayClick = (date: Date, data?: CalendarDayData) => {
    setSelectedDate(date);
    setSelectedDayData(data);
  };

  // Get sessions for selected date
  const selectedDateSessions = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return sessions.filter(s => s.date.startsWith(dateStr));
  }, [selectedDate, sessions]);

  // Get moods for selected date
  const selectedDateMoods = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return moods.filter(m => m.date.startsWith(dateStr));
  }, [selectedDate, moods]);

  // Stats for current month
  const monthStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    let sessionCount = 0;
    let totalMinutes = 0;
    let daysWithSessions = 0;

    calendarData.forEach((data, key) => {
      const [y, m] = key.split('-').map(Number);
      if (y === year && m - 1 === month) {
        sessionCount += data.sessionCount;
        if (data.hasSession) daysWithSessions++;
      }
    });

    sessions.forEach(s => {
      const date = new Date(s.date);
      if (date.getFullYear() === year && date.getMonth() === month) {
        totalMinutes += s.duration || 0;
      }
    });

    return { sessionCount, totalMinutes, daysWithSessions };
  }, [currentDate, calendarData, sessions]);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Month Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{monthStats.sessionCount}</div>
          <div className="text-xs text-slate-400">Sessions</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{monthStats.totalMinutes}</div>
          <div className="text-xs text-slate-400">Minutes</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{monthStats.daysWithSessions}</div>
          <div className="text-xs text-slate-400">Active Days</div>
        </div>
      </div>

      {/* Calendar */}
      <CalendarGrid
        year={currentDate.getFullYear()}
        month={currentDate.getMonth()}
        dayData={calendarData}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onDayClick={handleDayClick}
        selectedDate={selectedDate}
      />

      {/* Selected Day Details */}
      {selectedDate && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <h4 className="font-medium text-white mb-4">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </h4>

          {selectedDateSessions.length === 0 && selectedDateMoods.length === 0 ? (
            <p className="text-sm text-slate-400">No activity recorded for this day</p>
          ) : (
            <div className="space-y-4">
              {/* Sessions */}
              {selectedDateSessions.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Sessions ({selectedDateSessions.length})
                  </h5>
                  <div className="space-y-2">
                    {selectedDateSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg"
                      >
                        <div>
                          <div className="text-sm text-white">{session.topic || 'Meditation'}</div>
                          <div className="text-xs text-slate-500">{formatTime(session.date)}</div>
                        </div>
                        <div className="text-sm text-teal-400">
                          {session.duration} min
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Moods */}
              {selectedDateMoods.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Mood Log
                  </h5>
                  <div className="space-y-2">
                    {selectedDateMoods.map((mood, i) => (
                      <div
                        key={i}
                        className="py-2 px-3 bg-slate-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-4 mb-2">
                          {mood.moodBefore && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-500">Before:</span>
                              <MoodDisplay mood={mood.moodBefore} size="sm" />
                            </div>
                          )}
                          {mood.moodAfter && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-500">After:</span>
                              <MoodDisplay mood={mood.moodAfter} size="sm" />
                            </div>
                          )}
                        </div>
                        {mood.notes && (
                          <p className="text-xs text-slate-400">{mood.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
