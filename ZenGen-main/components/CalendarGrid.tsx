import React, { useMemo } from 'react';
import { IconChevronLeft, IconChevronRight } from './Icons';
import { MoodLevel } from '../types';
import { MoodDisplay } from './MoodSelector';

export interface CalendarDayData {
  date: Date;
  hasSession: boolean;
  sessionCount: number;
  mood?: MoodLevel;
}

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed (0 = January)
  dayData: Map<string, CalendarDayData>; // Key: YYYY-MM-DD
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick?: (date: Date, data?: CalendarDayData) => void;
  selectedDate?: Date;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  year,
  month,
  dayData,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  selectedDate,
}) => {
  const today = useMemo(() => new Date(), []);

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Add empty slots for days before the first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [year, month]);

  const handleDayClick = (date: Date | null) => {
    if (!date || !onDayClick) return;
    const key = formatDateKey(date);
    onDayClick(date, dayData.get(key));
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
          aria-label="Previous month"
        >
          <IconChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-medium text-white">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
          aria-label="Next month"
        >
          <IconChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-slate-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const key = formatDateKey(date);
          const data = dayData.get(key);
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isFuture = date > today;

          return (
            <button
              key={key}
              onClick={() => handleDayClick(date)}
              disabled={isFuture}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5
                transition-all duration-200 relative
                ${isSelected
                  ? 'bg-teal-600 text-white ring-2 ring-teal-400'
                  : isToday
                    ? 'bg-slate-700/50 text-white ring-1 ring-teal-500/50'
                    : data?.hasSession
                      ? 'bg-slate-800/50 hover:bg-slate-700/50 text-white'
                      : 'hover:bg-slate-800/30 text-slate-400'
                }
                ${isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className={`text-sm ${isToday && !isSelected ? 'font-bold' : ''}`}>
                {date.getDate()}
              </span>

              {/* Session indicator */}
              {data?.hasSession && (
                <div className="flex items-center gap-0.5">
                  {data.mood ? (
                    <MoodDisplay mood={data.mood} size="sm" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  )}
                  {data.sessionCount > 1 && (
                    <span className="text-[10px] text-teal-400">+{data.sessionCount - 1}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-teal-400" />
          <span className="text-xs text-slate-500">Session</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px]">
            🙂
          </div>
          <span className="text-xs text-slate-500">With mood</span>
        </div>
      </div>
    </div>
  );
};

// Helper hook to generate calendar data from session/mood entries
export const useCalendarData = (
  sessions: { date: string; id: string }[],
  moods: { date: string; moodAfter?: MoodLevel }[]
): Map<string, CalendarDayData> => {
  return useMemo(() => {
    const dataMap = new Map<string, CalendarDayData>();

    // Process sessions
    sessions.forEach((session) => {
      const date = new Date(session.date);
      const key = formatDateKey(date);

      const existing = dataMap.get(key);
      if (existing) {
        existing.sessionCount += 1;
      } else {
        dataMap.set(key, {
          date,
          hasSession: true,
          sessionCount: 1,
        });
      }
    });

    // Process moods (link to existing sessions if same day)
    moods.forEach((mood) => {
      const date = new Date(mood.date);
      const key = formatDateKey(date);

      const existing = dataMap.get(key);
      if (existing && mood.moodAfter) {
        existing.mood = mood.moodAfter;
      } else if (mood.moodAfter) {
        dataMap.set(key, {
          date,
          hasSession: false,
          sessionCount: 0,
          mood: mood.moodAfter,
        });
      }
    });

    return dataMap;
  }, [sessions, moods]);
};
