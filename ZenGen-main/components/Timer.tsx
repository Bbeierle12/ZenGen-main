import React from 'react';
import { TimerState } from '../types';
import { IconPlay, IconPause, IconRefresh } from './Icons';

interface TimerProps {
  totalSeconds: number;
  remainingSeconds: number;
  state: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS format
 */
const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Timer component with circular progress indicator and controls
 */
export const Timer: React.FC<TimerProps> = ({
  totalSeconds,
  remainingSeconds,
  state,
  onStart,
  onPause,
  onResume,
  onReset,
}) => {
  const progress = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference * (1 - progress);

  const isRunning = state === 'running';
  const isPaused = state === 'paused';
  const isComplete = state === 'complete';
  const isIdle = state === 'idle';

  return (
    <div className="flex flex-col items-center">
      {/* Circular Progress */}
      <div className="relative w-72 h-72 md:w-80 md:h-80">
        {/* Background circle */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-800"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r="120"
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono text-5xl md:text-6xl font-light tracking-tight ${isComplete ? 'text-teal-400' : 'text-white'}`}>
            {formatTime(remainingSeconds)}
          </span>
          <span className="text-slate-500 text-sm mt-2 uppercase tracking-wider">
            {isComplete ? 'Complete' : isRunning ? 'Running' : isPaused ? 'Paused' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-8">
        {/* Reset Button */}
        <button
          onClick={onReset}
          disabled={isIdle}
          className="p-3 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Reset"
        >
          <IconRefresh className="w-6 h-6" />
        </button>

        {/* Main Play/Pause Button */}
        {isIdle && (
          <button
            onClick={onStart}
            className="p-6 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-teal-900/50 transition-all transform hover:scale-105"
            title="Start"
          >
            <IconPlay className="w-10 h-10" />
          </button>
        )}

        {isRunning && (
          <button
            onClick={onPause}
            className="p-6 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-900/50 transition-all transform hover:scale-105"
            title="Pause"
          >
            <IconPause className="w-10 h-10" />
          </button>
        )}

        {isPaused && (
          <button
            onClick={onResume}
            className="p-6 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-teal-900/50 transition-all transform hover:scale-105"
            title="Resume"
          >
            <IconPlay className="w-10 h-10" />
          </button>
        )}

        {isComplete && (
          <button
            onClick={onReset}
            className="p-6 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-teal-900/50 transition-all transform hover:scale-105"
            title="Start Again"
          >
            <IconRefresh className="w-10 h-10" />
          </button>
        )}

        {/* Spacer for symmetry when not complete */}
        {!isComplete && (
          <div className="w-12 h-12" />
        )}
      </div>
    </div>
  );
};
