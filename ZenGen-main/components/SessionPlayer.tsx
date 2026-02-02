import React, { useEffect, useRef, useState } from 'react';
import { SessionData } from '../types';
import { IconPause, IconPlay, IconClose } from './Icons';
import { SoundscapeEngine } from '../services/soundscapeService';
import { saveSessionCompletion } from '../services/storageService';
import { speakText, pauseSpeech, resumeSpeech, stopSpeech, isSpeaking } from '../services/claudeService';

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
  
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const estimatedDurationRef = useRef<number>(0);
  const hasStartedRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize Audio Context on mount
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Init Soundscape
    if (audioContextRef.current) {
        soundscapeRef.current = new SoundscapeEngine(audioContextRef.current, audioContextRef.current.destination);
    }

    // Estimate duration based on text length (roughly 150 words per minute for meditation pace)
    const wordCount = data.script.split(/\s+/).length;
    estimatedDurationRef.current = Math.max((wordCount / 150) * 60, data.config.durationMinutes * 60);
    
    // Auto-play on mount
    play();

    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update ambient volume in real-time
  useEffect(() => {
      if (soundscapeRef.current) soundscapeRef.current.setVolume(ambientVolume * 0.4);
  }, [ambientVolume]);

  const play = () => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Start from where we left off or beginning
    const offset = pausedAtRef.current;
    startTimeRef.current = Date.now() / 1000 - offset;
    
    // Start speech synthesis
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      speakText(data.script, data.config.voice, () => {
        // Speech ended
        setIsPlaying(false);
        setProgress(100);
        soundscapeRef.current?.stop();
        
        if (!completed) {
          saveSessionCompletion(data);
          setCompleted(true);
        }
        
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      });
    } else {
      resumeSpeech();
    }
    
    // Soundscape Setup
    soundscapeRef.current?.play(data.config.soundscape);
    
    setIsPlaying(true);
    updateProgress();
  };

  const pause = () => {
    pauseSpeech();
    pausedAtRef.current = Date.now() / 1000 - startTimeRef.current;
    soundscapeRef.current?.stop();
    setIsPlaying(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const stop = () => {
    stopSpeech();
    soundscapeRef.current?.stop();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const updateProgress = () => {
    const elapsed = Date.now() / 1000 - startTimeRef.current;
    const duration = estimatedDurationRef.current;
    const percent = Math.min((elapsed / duration) * 100, 100);
    
    setProgress(percent);
    
    // Check if speech synthesis is still playing
    if (isSpeaking()) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else if (percent >= 100) {
      setIsPlaying(false);
      soundscapeRef.current?.stop();
      if (!completed) {
        saveSessionCompletion(data);
        setCompleted(true);
      }
    } else {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const togglePlay = () => {
    if (isPlaying) pause();
    else play();
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalDuration = estimatedDurationRef.current || (data.config.durationMinutes * 60);
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
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                  // Basic seek functionality could be added here if needed, 
                  // but for now keeping it simple as specific request was just display
              }}>
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