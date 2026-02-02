import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SessionData } from '../types';
import { IconPause, IconPlay, IconClose } from './Icons';
import { SoundscapeEngine } from '../services/soundscapeService';
import { saveSessionCompletion } from '../services/storageService';

interface Props {
  data: SessionData;
  onReset: () => void;
}

export const SessionPlayer: React.FC<Props> = ({ data, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [voiceVolume, setVoiceVolume] = useState(1);
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const [completed, setCompleted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const soundscapeRef = useRef<SoundscapeEngine | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const voiceGainRef = useRef<GainNode | null>(null);

  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false); // Track playing state in ref to avoid stale closures
  const completedRef = useRef<boolean>(false); // Track completion to avoid double-save

  // Get actual duration from audioBuffer, or estimate from config
  const getDuration = useCallback(() => {
    if (data.audioBuffer) {
      return data.audioBuffer.duration;
    }
    // Fallback: estimate from config duration
    return data.config.durationMinutes * 60;
  }, [data.audioBuffer, data.config.durationMinutes]);

  // Initialize Audio Context on mount
  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;

    // Create voice gain node for volume control
    const voiceGain = ctx.createGain();
    voiceGain.connect(ctx.destination);
    voiceGain.gain.value = voiceVolume;
    voiceGainRef.current = voiceGain;

    // Init Soundscape
    soundscapeRef.current = new SoundscapeEngine(ctx, ctx.destination);

    return () => {
      // Cleanup on unmount
      stopPlayback();
      soundscapeRef.current?.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Close the AudioContext to prevent leaks
      ctx.close().catch(() => { /* ignore close errors */ });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update voice volume in real-time
  useEffect(() => {
    if (voiceGainRef.current) {
      voiceGainRef.current.gain.setTargetAtTime(voiceVolume, audioContextRef.current?.currentTime || 0, 0.1);
    }
  }, [voiceVolume]);

  // Update ambient volume in real-time
  useEffect(() => {
    if (soundscapeRef.current) {
      soundscapeRef.current.setVolume(ambientVolume * 0.4);
    }
  }, [ambientVolume]);

  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Ignore errors if already stopped
      }
      sourceNodeRef.current = null;
    }
  }, []);

  const handlePlaybackEnded = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setProgress(100);
    soundscapeRef.current?.stop();

    if (!completedRef.current) {
      completedRef.current = true;
      setCompleted(true);
      saveSessionCompletion(data);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [data]);

  const updateProgress = useCallback(() => {
    if (!isPlayingRef.current || !audioContextRef.current) {
      return;
    }

    const currentTime = audioContextRef.current.currentTime;
    const elapsed = currentTime - startTimeRef.current + pausedAtRef.current;
    const duration = getDuration();
    const percent = Math.min((elapsed / duration) * 100, 100);

    setProgress(percent);

    if (percent >= 100) {
      handlePlaybackEnded();
    } else {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [getDuration, handlePlaybackEnded]);

  const play = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !data.audioBuffer) {
      console.error('No audio context or audio buffer available');
      return;
    }

    // Resume context if suspended (autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Stop any existing playback
    stopPlayback();

    // Create new source node (AudioBufferSourceNode can only be played once)
    const source = ctx.createBufferSource();
    source.buffer = data.audioBuffer;
    source.connect(voiceGainRef.current || ctx.destination);

    // Handle playback end
    source.onended = () => {
      if (isPlayingRef.current) {
        handlePlaybackEnded();
      }
    };

    sourceNodeRef.current = source;

    // Calculate offset for resuming
    const offset = pausedAtRef.current;
    startTimeRef.current = ctx.currentTime;

    // Start playback from offset
    source.start(0, offset);

    // Start soundscape
    soundscapeRef.current?.play(data.config.soundscape);

    setIsPlaying(true);
    isPlayingRef.current = true;

    // Start progress updates
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  }, [data.audioBuffer, data.config.soundscape, stopPlayback, handlePlaybackEnded, updateProgress]);

  const pause = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Calculate how far we've played
    const currentTime = ctx.currentTime;
    pausedAtRef.current += currentTime - startTimeRef.current;

    // Stop the source
    stopPlayback();

    // Stop soundscape
    soundscapeRef.current?.stop();

    setIsPlaying(false);
    isPlayingRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [stopPlayback]);

  const stop = useCallback(() => {
    stopPlayback();
    soundscapeRef.current?.stop();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isPlayingRef.current = false;
  }, [stopPlayback]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalDuration = getDuration();
  const elapsedSeconds = (progress / 100) * totalDuration;
  const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);

  return (
    <div className="fixed inset-0 z-40 bg-black flex items-center justify-center animate-fade-in">
      {/* Background Gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 transition-opacity duration-1000"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col h-full justify-between py-12">
        {/* Header */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => { stop(); onReset(); }}
            className="text-white/70 hover:text-white flex items-center gap-2 bg-black/20 hover:bg-black/40 px-4 py-2 rounded-full backdrop-blur-md transition-all"
          >
            <IconClose className="w-5 h-5" />
            <span className="hidden sm:inline">Close</span>
          </button>

          {completed && (
              <div className="px-4 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/50 rounded-full text-sm animate-pulse">
                  Session Completed
              </div>
          )}
        </div>

        {/* Script / Captions Area */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden my-8 space-y-8">
           <div className="text-center space-y-2">
               <h2 className="text-3xl font-light text-teal-100/80">{data.config.topic}</h2>
               <p className="text-sm text-teal-100/50 uppercase tracking-widest">{data.config.soundscape}</p>
           </div>

           <div className="w-full max-w-2xl max-h-[40vh] overflow-y-auto px-4 text-center scrollbar-hide mask-fade-vertical">
              <p className="text-xl md:text-2xl font-light leading-relaxed text-white/90 drop-shadow-md whitespace-pre-wrap">
                {data.script}
              </p>
           </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-8 bg-black/30 backdrop-blur-md p-6 rounded-3xl border border-white/5">
          {/* Progress Bar */}
          <div className="w-full space-y-2">
              <div className="flex justify-between text-xs text-white/50 font-mono">
                  <span>{formatTime(elapsedSeconds)}</span>
                  <span>-{formatTime(remainingSeconds)}</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden cursor-pointer">
                <div
                  className="h-full bg-teal-400 rounded-full transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
             {/* Volume Controls */}
             <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-3">
                     <span className="text-xs text-white/60 w-12">Voice</span>
                     <input
                        type="range" min="0" max="1" step="0.01"
                        value={voiceVolume} onChange={e => setVoiceVolume(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-teal-500"
                     />
                 </div>
                 <div className="flex items-center gap-3">
                     <span className="text-xs text-white/60 w-12">Ambient</span>
                     <input
                        type="range" min="0" max="1" step="0.01"
                        value={ambientVolume} onChange={e => setAmbientVolume(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-teal-500"
                     />
                 </div>
             </div>

             {/* Play Button */}
             <div className="flex justify-center">
                 <button
                  onClick={togglePlay}
                  className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-teal-900/50"
                 >
                   {isPlaying ? <IconPause className="w-8 h-8" /> : <IconPlay className="w-8 h-8 ml-1" />}
                 </button>
             </div>

             {/* Spacer / Additional controls could go here */}
             <div className="hidden md:block"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
