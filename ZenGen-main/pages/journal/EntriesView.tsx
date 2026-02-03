import React, { useState, useEffect } from 'react';
import { JournalEntry, MoodLevel } from '../../types';
import { getJournalEntries, saveJournalEntry, deleteJournalEntry, getMoodEntries } from '../../services/storageService';
import { MoodDisplay, getMoodInfo } from '../../components/MoodSelector';
import { IconClose } from '../../components/Icons';

export const EntriesView: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [moodMap, setMoodMap] = useState<Map<string, MoodLevel>>(new Map());
  const [isCreating, setIsCreating] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: '', content: '', tags: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const journalEntries = getJournalEntries();
    setEntries(journalEntries);

    // Create mood map for quick lookup
    const moods = getMoodEntries();
    const map = new Map<string, MoodLevel>();
    moods.forEach(mood => {
      if (mood.moodAfter) {
        const dateKey = mood.date.split('T')[0];
        if (!map.has(dateKey)) {
          map.set(dateKey, mood.moodAfter);
        }
      }
    });
    setMoodMap(map);
  };

  const handleCreateEntry = () => {
    if (!newEntry.title.trim() && !newEntry.content.trim()) return;

    const tags = newEntry.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    saveJournalEntry({
      title: newEntry.title.trim() || 'Untitled',
      content: newEntry.content.trim(),
      tags,
    });

    setNewEntry({ title: '', content: '', tags: '' });
    setIsCreating(false);
    loadData();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this journal entry?')) {
      deleteJournalEntry(id);
      loadData();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getEntryMood = (dateStr: string): MoodLevel | undefined => {
    const dateKey = dateStr.split('T')[0];
    return moodMap.get(dateKey);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Journal Entries</h3>
          <p className="text-sm text-slate-400">Record your meditation journey</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            New Entry
          </button>
        )}
      </div>

      {/* Create Entry Form */}
      {isCreating && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white">New Journal Entry</h4>
            <button
              onClick={() => setIsCreating(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Title (optional)"
            value={newEntry.title}
            onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
          />

          <textarea
            placeholder="What's on your mind? How did your practice go today?"
            value={newEntry.content}
            onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
            rows={5}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none resize-none"
          />

          <input
            type="text"
            placeholder="Tags (comma-separated, e.g., gratitude, morning)"
            value={newEntry.tags}
            onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
          />

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateEntry}
              disabled={!newEntry.title.trim() && !newEntry.content.trim()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Entry
            </button>
          </div>
        </div>
      )}

      {/* Entries List */}
      {entries.length === 0 && !isCreating ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No journal entries yet</p>
          <button
            onClick={() => setIsCreating(true)}
            className="text-teal-400 hover:text-teal-300 text-sm"
          >
            Create your first entry
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const mood = getEntryMood(entry.date);

            return (
              <div
                key={entry.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="w-full p-4 flex items-start gap-3 text-left hover:bg-slate-800/30 transition-colors"
                >
                  {/* Date column */}
                  <div className="flex-shrink-0 text-center">
                    <div className="text-2xl font-bold text-white">
                      {new Date(entry.date).getDate()}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white truncate">{entry.title}</h4>
                      {mood && <MoodDisplay mood={mood} size="sm" />}
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {entry.content || 'No content'}
                    </p>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {entry.tags.length > 3 && (
                          <span className="text-xs text-slate-500">
                            +{entry.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-800">
                    <div className="pt-4 space-y-4">
                      <div className="text-sm text-slate-300 whitespace-pre-wrap">
                        {entry.content}
                      </div>

                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-xs text-slate-500">
                          {formatDate(entry.date)}
                        </span>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
