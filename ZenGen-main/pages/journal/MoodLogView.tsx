import React, { useState, useEffect } from 'react';
import { MoodSelector, MoodDisplay, getMoodInfo } from '../../components/MoodSelector';
import { getMoodEntries, saveMoodEntry, deleteMoodEntry } from '../../services/storageService';
import { MoodEntry, MoodLevel } from '../../types';
import { IconClose } from '../../components/Icons';

export const MoodLogView: React.FC = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [newMood, setNewMood] = useState<{
    moodBefore?: MoodLevel;
    moodAfter?: MoodLevel;
    notes: string;
  }>({ notes: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const moodEntries = getMoodEntries();
    setEntries(moodEntries);
  };

  const handleSaveMood = () => {
    if (!newMood.moodBefore && !newMood.moodAfter) return;

    saveMoodEntry({
      moodBefore: newMood.moodBefore,
      moodAfter: newMood.moodAfter,
      notes: newMood.notes.trim() || undefined,
    });

    setNewMood({ notes: '' });
    setIsLogging(false);
    loadData();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this mood entry?')) {
      deleteMoodEntry(id);
      loadData();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Calculate mood stats
  const moodStats = React.useMemo(() => {
    if (entries.length === 0) return null;

    const improvements = entries.filter(
      e => e.moodBefore && e.moodAfter && e.moodAfter > e.moodBefore
    ).length;

    const avgMoodAfter = entries.reduce((sum, e) => {
      return e.moodAfter ? sum + e.moodAfter : sum;
    }, 0) / entries.filter(e => e.moodAfter).length;

    const mostCommonMood = entries.reduce((acc, e) => {
      if (e.moodAfter) {
        acc[e.moodAfter] = (acc[e.moodAfter] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    let topMood: MoodLevel | undefined;
    let topCount = 0;
    Object.entries(mostCommonMood).forEach(([mood, count]) => {
      if (count > topCount) {
        topCount = count;
        topMood = Number(mood) as MoodLevel;
      }
    });

    return {
      total: entries.length,
      improvements,
      avgMoodAfter: isNaN(avgMoodAfter) ? 0 : avgMoodAfter,
      topMood,
    };
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Mood Log</h3>
          <p className="text-sm text-slate-400">Track how meditation affects your mood</p>
        </div>
        {!isLogging && (
          <button
            onClick={() => setIsLogging(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Log Mood
          </button>
        )}
      </div>

      {/* Stats */}
      {moodStats && moodStats.total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{moodStats.total}</div>
            <div className="text-xs text-slate-400">Entries</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{moodStats.improvements}</div>
            <div className="text-xs text-slate-400">Mood Boosts</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
            {moodStats.topMood && (
              <div className="flex justify-center mb-1">
                <MoodDisplay mood={moodStats.topMood} size="md" />
              </div>
            )}
            <div className="text-xs text-slate-400">Most Common</div>
          </div>
        </div>
      )}

      {/* Log Mood Form */}
      {isLogging && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white">Log Your Mood</h4>
            <button
              onClick={() => setIsLogging(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">
                How were you feeling before meditation?
              </label>
              <MoodSelector
                value={newMood.moodBefore}
                onChange={(mood) => setNewMood({ ...newMood, moodBefore: mood })}
                size="lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">
                How are you feeling now?
              </label>
              <MoodSelector
                value={newMood.moodAfter}
                onChange={(mood) => setNewMood({ ...newMood, moodAfter: mood })}
                size="lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Notes (optional)
              </label>
              <textarea
                placeholder="Any thoughts or observations..."
                value={newMood.notes}
                onChange={(e) => setNewMood({ ...newMood, notes: e.target.value })}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setIsLogging(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMood}
              disabled={!newMood.moodBefore && !newMood.moodAfter}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Mood
            </button>
          </div>
        </div>
      )}

      {/* Entries List */}
      {entries.length === 0 && !isLogging ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No mood entries yet</p>
          <p className="text-sm text-slate-500 mb-4">
            Track how you feel before and after meditation to see the benefits over time.
          </p>
          <button
            onClick={() => setIsLogging(true)}
            className="text-teal-400 hover:text-teal-300 text-sm"
          >
            Log your first mood
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const moodChange = entry.moodBefore && entry.moodAfter
              ? entry.moodAfter - entry.moodBefore
              : null;

            return (
              <div
                key={entry.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500">{formatDate(entry.date)}</span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {entry.moodBefore && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Before</span>
                      <MoodDisplay mood={entry.moodBefore} size="md" />
                    </div>
                  )}

                  {entry.moodBefore && entry.moodAfter && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        moodChange && moodChange > 0
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : moodChange && moodChange < 0
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-700 text-slate-400'
                      }`}>
                        {moodChange && moodChange > 0 ? '+' : ''}{moodChange || '='}
                      </div>
                    </div>
                  )}

                  {entry.moodAfter && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">After</span>
                      <MoodDisplay mood={entry.moodAfter} size="md" />
                    </div>
                  )}
                </div>

                {entry.notes && (
                  <p className="mt-3 text-sm text-slate-400 border-t border-slate-800 pt-3">
                    {entry.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
