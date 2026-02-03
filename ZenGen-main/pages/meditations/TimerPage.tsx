import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Timer } from '../../components/Timer';
import { SoundscapeEngine } from '../../services/soundscapeService';
import { saveTimerSession } from '../../services/storageService';
import { TimerConfig, TimerState, SoundscapeType } from '../../types';
import { IconSparkles } from '../../components/Icons';

const DURATION_PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '20 min', seconds: 1200 },
  { label: '30 min', seconds: 1800 },
  { label: '45 min', seconds: 2700 },
  { label: '60 min', seconds: 3600 },
];

const INTERVAL_OPTIONS = [
  { label: 'None', seconds: 0 },
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
];

const AMBIENT_OPTIONS = [
  { value: SoundscapeType.NONE, label: 'None' },
  { value: SoundscapeType.RAIN, label: 'Soft Rain' },
  { value: SoundscapeType.OCEAN, label: 'Ocean Waves' },
  { value: SoundscapeType.WIND, label: 'Forest Wind' },
  { value: SoundscapeType.DRONE_LOW, label: 'Deep Drone' },
  { value: SoundscapeType.BOWL, label: 'Crystal Bowl' },
];

export const TimerPage: React.FC = () => {
  // Timer configuration
  const [config, setConfig] = useState<TimerConfig>({
    durationSeconds: 300, // 5 minutes default
    bellAtStart: true,
    bellAtEnd: true,
    intervalBellSeconds: 0,
    ambientSound: SoundscapeType.NONE,
  });

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState(config.durationSeconds);
  const [customMinutes, setCustomMinutes] = useState<number | ''>('');

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundscapeRef = useRef<SoundscapeEngine | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastIntervalBellRef = useRef<number>(0);

  // Initialize audio context on first interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      soundscapeRef.current = new SoundscapeEngine(
        audioContextRef.current,
        audioContextRef.current.destination
      );
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  // Play bell sound
  const playBell = useCallback(() => {
    if (soundscapeRef.current) {
      soundscapeRef.current.playBell('bowl');
    }
  }, []);

  // Start ambient sound
  const startAmbient = useCallback(() => {
    if (soundscapeRef.current && config.ambientSound !== SoundscapeType.NONE) {
      soundscapeRef.current.play(config.ambientSound);
    }
  }, [config.ambientSound]);

  // Stop ambient sound
  const stopAmbient = useCallback(() => {
    if (soundscapeRef.current) {
      soundscapeRef.current.stop();
    }
  }, []);

  // Handle timer start
  const handleStart = useCallback(() => {
    initAudio();
    setTimerState('running');
    setRemainingSeconds(config.durationSeconds);
    lastIntervalBellRef.current = config.durationSeconds;

    if (config.bellAtStart) {
      playBell();
    }
    startAmbient();
  }, [config, initAudio, playBell, startAmbient]);

  // Handle timer pause
  const handlePause = useCallback(() => {
    setTimerState('paused');
    stopAmbient();
  }, [stopAmbient]);

  // Handle timer resume
  const handleResume = useCallback(() => {
    setTimerState('running');
    startAmbient();
  }, [startAmbient]);

  // Handle timer reset
  const handleReset = useCallback(() => {
    setTimerState('idle');
    setRemainingSeconds(config.durationSeconds);
    stopAmbient();
    lastIntervalBellRef.current = 0;
  }, [config.durationSeconds, stopAmbient]);

  // Handle timer completion
  const handleComplete = useCallback(() => {
    setTimerState('complete');
    stopAmbient();

    if (config.bellAtEnd) {
      playBell();
      // Play a second bell after a delay
      setTimeout(() => playBell(), 1500);
    }

    // Save session
    saveTimerSession({
      durationSeconds: config.durationSeconds,
      completedSeconds: config.durationSeconds,
      completed: true,
    });
  }, [config, playBell, stopAmbient]);

  // Timer tick effect
  useEffect(() => {
    if (timerState === 'running') {
      timerIntervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          const newValue = prev - 1;

          // Check for interval bells
          if (config.intervalBellSeconds > 0) {
            const elapsed = config.durationSeconds - newValue;
            if (elapsed > 0 && elapsed % config.intervalBellSeconds === 0 && elapsed !== lastIntervalBellRef.current) {
              lastIntervalBellRef.current = elapsed;
              playBell();
            }
          }

          if (newValue <= 0) {
            handleComplete();
            return 0;
          }
          return newValue;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timerState, config, playBell, handleComplete]);

  // Update remaining seconds when duration changes (only when idle)
  useEffect(() => {
    if (timerState === 'idle') {
      setRemainingSeconds(config.durationSeconds);
    }
  }, [config.durationSeconds, timerState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAmbient();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [stopAmbient]);

  // Handle custom duration input
  const handleCustomDuration = () => {
    if (customMinutes && customMinutes > 0 && customMinutes <= 180) {
      setConfig({ ...config, durationSeconds: customMinutes * 60 });
      setCustomMinutes('');
    }
  };

  const isConfigurable = timerState === 'idle';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-medium text-white flex items-center justify-center gap-2">
          <span className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
            <IconSparkles className="w-5 h-5" />
          </span>
          Meditation Timer
        </h2>
        <p className="text-slate-400 mt-2">Simple, distraction-free timed meditation</p>
      </div>

      {/* Timer Display */}
      <div className="flex justify-center mb-12">
        <Timer
          totalSeconds={config.durationSeconds}
          remainingSeconds={remainingSeconds}
          state={timerState}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onReset={handleReset}
        />
      </div>

      {/* Configuration (only visible when idle) */}
      {isConfigurable && (
        <div className="space-y-6 animate-fade-in">
          {/* Duration Selection */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Duration
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.seconds}
                  onClick={() => setConfig({ ...config, durationSeconds: preset.seconds })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    config.durationSeconds === preset.seconds
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Duration */}
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="180"
                placeholder="Custom minutes"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value ? parseInt(e.target.value) : '')}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
              />
              <button
                onClick={handleCustomDuration}
                disabled={!customMinutes || customMinutes <= 0}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Set
              </button>
            </div>
          </div>

          {/* Bell Options */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Bells
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={config.bellAtStart}
                  onChange={(e) => setConfig({ ...config, bellAtStart: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500/50 focus:ring-offset-0"
                />
                <span className="text-slate-300 group-hover:text-white transition-colors">
                  Bell at start
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={config.bellAtEnd}
                  onChange={(e) => setConfig({ ...config, bellAtEnd: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500/50 focus:ring-offset-0"
                />
                <span className="text-slate-300 group-hover:text-white transition-colors">
                  Bell at end
                </span>
              </label>

              <div className="pt-2">
                <label className="block text-sm text-slate-400 mb-2">Interval bells</label>
                <div className="flex flex-wrap gap-2">
                  {INTERVAL_OPTIONS.map((option) => (
                    <button
                      key={option.seconds}
                      onClick={() => setConfig({ ...config, intervalBellSeconds: option.seconds })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        config.intervalBellSeconds === option.seconds
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Ambient Sound */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Ambient Sound
            </label>
            <div className="flex flex-wrap gap-2">
              {AMBIENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setConfig({ ...config, ambientSound: option.value })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    config.ambientSound === option.value
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Running state info */}
      {timerState === 'running' && config.ambientSound !== SoundscapeType.NONE && (
        <div className="text-center mt-8 text-slate-500 text-sm">
          Playing: {config.ambientSound}
        </div>
      )}
    </div>
  );
};
