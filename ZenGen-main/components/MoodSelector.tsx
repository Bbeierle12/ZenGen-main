import React from 'react';
import { MoodLevel } from '../types';

interface MoodSelectorProps {
  value?: MoodLevel;
  onChange: (mood: MoodLevel) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const MOOD_OPTIONS = [
  { level: MoodLevel.VERY_LOW, emoji: '😔', label: 'Very Low', color: 'from-red-500 to-red-600' },
  { level: MoodLevel.LOW, emoji: '😕', label: 'Low', color: 'from-orange-500 to-orange-600' },
  { level: MoodLevel.NEUTRAL, emoji: '😐', label: 'Neutral', color: 'from-yellow-500 to-yellow-600' },
  { level: MoodLevel.GOOD, emoji: '🙂', label: 'Good', color: 'from-lime-500 to-lime-600' },
  { level: MoodLevel.EXCELLENT, emoji: '😊', label: 'Excellent', color: 'from-emerald-500 to-emerald-600' },
];

const sizeClasses = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-12 h-12 text-2xl',
  lg: 'w-16 h-16 text-3xl',
};

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  value,
  onChange,
  label,
  size = 'md',
  disabled = false,
}) => {
  return (
    <div className="flex flex-col items-center gap-3">
      {label && (
        <label className="text-sm font-medium text-slate-400">{label}</label>
      )}
      <div className="flex items-center gap-2">
        {MOOD_OPTIONS.map((option) => {
          const isSelected = value === option.level;
          return (
            <button
              key={option.level}
              onClick={() => onChange(option.level)}
              disabled={disabled}
              title={option.label}
              aria-label={option.label}
              className={`
                ${sizeClasses[size]}
                rounded-full flex items-center justify-center
                transition-all duration-200
                ${isSelected
                  ? `bg-gradient-to-br ${option.color} shadow-lg scale-110 ring-2 ring-white/30`
                  : 'bg-slate-800/50 hover:bg-slate-700/50 hover:scale-105'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span role="img" aria-hidden="true">{option.emoji}</span>
            </button>
          );
        })}
      </div>
      {value && (
        <span className="text-xs text-slate-500">
          {MOOD_OPTIONS.find(o => o.level === value)?.label}
        </span>
      )}
    </div>
  );
};

// Compact inline version for forms
export const MoodSelectorInline: React.FC<MoodSelectorProps> = ({
  value,
  onChange,
  label,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-3">
      {label && (
        <label className="text-sm text-slate-400 min-w-20">{label}</label>
      )}
      <div className="flex items-center gap-1">
        {MOOD_OPTIONS.map((option) => {
          const isSelected = value === option.level;
          return (
            <button
              key={option.level}
              onClick={() => onChange(option.level)}
              disabled={disabled}
              title={option.label}
              aria-label={option.label}
              className={`
                w-9 h-9 text-xl
                rounded-lg flex items-center justify-center
                transition-all duration-200
                ${isSelected
                  ? `bg-gradient-to-br ${option.color} shadow-md`
                  : 'bg-slate-800/30 hover:bg-slate-700/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span role="img" aria-hidden="true">{option.emoji}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Display-only mood indicator
export const MoodDisplay: React.FC<{ mood: MoodLevel; size?: 'sm' | 'md' | 'lg' }> = ({
  mood,
  size = 'sm',
}) => {
  const option = MOOD_OPTIONS.find(o => o.level === mood);
  if (!option) return null;

  const displaySizes = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-lg',
    lg: 'w-10 h-10 text-xl',
  };

  return (
    <div
      className={`
        ${displaySizes[size]}
        rounded-full flex items-center justify-center
        bg-gradient-to-br ${option.color}
      `}
      title={option.label}
    >
      <span role="img" aria-label={option.label}>{option.emoji}</span>
    </div>
  );
};

// Get mood info helper
export const getMoodInfo = (mood: MoodLevel) => {
  return MOOD_OPTIONS.find(o => o.level === mood);
};
