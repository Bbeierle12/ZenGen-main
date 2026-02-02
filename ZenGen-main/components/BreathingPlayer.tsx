import React, { useEffect, useRef, useState } from 'react';
import { BreathingPattern, BreathPhaseType, SoundscapeType } from '../types';
import { IconClose, IconPause, IconPlay, IconRefresh } from './Icons';
import { SoundscapeEngine } from '../services/soundscapeService';

interface Props {
  pattern: BreathingPattern;
  onClose: () => void;
}

export const BreathingPlayer: React.FC<Props> = ({ pattern, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(pattern.phases[0].duration);
  const [totalSeconds, setTotalSeconds] = useState(0);

  // Settings
  const [bellEnabled, setBellEnabled] = useState(true);
  const [bellType, setBellType] = useState<'chime' | 'bowl' | 'soft'>('chime');
  const [bellVolume, setBellVolume] = useState(0.8);
  const [hapticsEnabled, setHapticsEnabled] = useState(false);
  const [breathSoundEnabled, setBreathSoundEnabled] = useState(false);
  const [selectedSoundscape, setSelectedSoundscape] = useState<SoundscapeType>(SoundscapeType.NONE);
  const [soundscapeVolume, setSoundscapeVolume] = useState(0.4);

  const soundscapeRef = useRef<SoundscapeEngine | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  
  // Visualizer Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseStartTimeRef = useRef<number>(0);

  // Initialize Audio
  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    soundscapeRef.current = new SoundscapeEngine(ctx, ctx.destination);
    
    soundscapeRef.current.setVolume(soundscapeVolume); 
    soundscapeRef.current.setBellVolume(bellVolume);
    soundscapeRef.current.play(selectedSoundscape);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      soundscapeRef.current?.stop();
      ctx.close();
    };
  }, []);

  // Update volume when state changes
  useEffect(() => {
      if (soundscapeRef.current) {
          soundscapeRef.current.setBellVolume(bellVolume);
          soundscapeRef.current.setVolume(soundscapeVolume);
      }
  }, [bellVolume, soundscapeVolume]);

  // Handle Soundscape Change
  useEffect(() => {
      if (soundscapeRef.current) {
          soundscapeRef.current.play(selectedSoundscape);
      }
  }, [selectedSoundscape]);

  const handleBreathSound = (phaseLabel: BreathPhaseType, duration: number) => {
    if (!breathSoundEnabled || !soundscapeRef.current) {
        soundscapeRef.current?.stopBreathCue();
        return;
    }

    if (phaseLabel === 'Inhale') {
        soundscapeRef.current.playBreathCue('inhale', duration);
    } else if (phaseLabel === 'Exhale') {
        soundscapeRef.current.playBreathCue('exhale', duration);
    } else {
        soundscapeRef.current.stopBreathCue();
    }
  };

  // Timer & Phase Logic
  useEffect(() => {
    if (isActive) {
      if (totalSeconds === 0) {
          phaseStartTimeRef.current = Date.now();
          handleBreathSound(pattern.phases[phaseIndex].label, pattern.phases[phaseIndex].duration);
      }

      timerRef.current = window.setInterval(() => {
        setTotalSeconds(prev => prev + 1);
        
        setTimeLeft(prev => {
          if (prev <= 1) {
            handlePhaseChange();
            return 0; // Will be overwritten by handlePhaseChange logic
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      soundscapeRef.current?.stopBreathCue();
    }
    return () => { 
        if (timerRef.current) clearInterval(timerRef.current); 
    };
  }, [isActive, phaseIndex, bellEnabled, bellType, bellVolume, hapticsEnabled, breathSoundEnabled]); 

  const handlePhaseChange = () => {
    const nextIndex = (phaseIndex + 1) % pattern.phases.length;
    setPhaseIndex(nextIndex);
    const nextDuration = pattern.phases[nextIndex].duration;
    setTimeLeft(nextDuration);
    phaseStartTimeRef.current = Date.now();
    
    const nextPhaseLabel = pattern.phases[nextIndex].label;

    if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }

    // Audio Cues
    if (bellEnabled) {
        soundscapeRef.current?.playBell(bellType);
    }
    handleBreathSound(nextPhaseLabel, nextDuration);

    // Haptics
    if (hapticsEnabled && navigator.vibrate) {
        navigator.vibrate(200);
    }
  };

  const togglePlay = () => {
    if (!isActive) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      phaseStartTimeRef.current = Date.now();
      // Play bell on start if first start
      if (totalSeconds === 0) {
          if (bellEnabled) soundscapeRef.current?.playBell(bellType);
          if (hapticsEnabled && navigator.vibrate) navigator.vibrate(200);
      }
    } else {
        soundscapeRef.current?.stopBreathCue();
    }
    setIsActive(!isActive);
  };

  const resetSession = () => {
    setIsActive(false);
    setTotalSeconds(0);
    setPhaseIndex(0);
    setTimeLeft(pattern.phases[0].duration);
    if (soundscapeRef.current) {
        soundscapeRef.current.stopBreathCue();
        // Don't stop soundscape, keep ambiance flowing
    }
  };

  // --- Visualizer Logic ---
  const drawVisualizer = () => {
    if (!canvasRef.current || !soundscapeRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset size to match display size for crisp rendering
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Get Audio Data from GLOBAL analyser (captures bells + ambience + breath)
    const analyser = soundscapeRef.current.globalAnalyser;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Calculate Audio Energy (Reactivity) & Dominant Frequency
    let energy = 0;
    let spectralCentroid = 0;
    const binCount = 50; 
    for(let i=0; i<binCount; i++) {
        const val = dataArray[i];
        energy += val;
        spectralCentroid += i * val;
    }
    const avg = energy / binCount;
    const normVol = Math.pow(avg / 255, 1.2); // Smoother curve
    
    // Normalized 0-1 measure of dominant frequency within our bin range
    // High values mean more treble/high-pitch energy
    const domFreq = energy > 0 ? (spectralCentroid / energy) / binCount : 0.5;

    // Phase Logic
    const now = Date.now();
    const currentPhase = pattern.phases[phaseIndex];
    const durationMs = currentPhase.duration * 1000;
    const elapsed = now - phaseStartTimeRef.current;
    const progress = Math.min(Math.max(elapsed / durationMs, 0), 1);
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    // Is this an "expanding" phase? (Inhale or Hold after Inhale)
    const isExpandPhase = currentPhase.label === 'Inhale' || 
        (currentPhase.label === 'Hold' && pattern.phases[(phaseIndex - 1 + pattern.phases.length) % pattern.phases.length].label === 'Inhale');

    // Radius Calculation
    const minRadius = 60;
    const maxRadius = 130;
    let targetRadius = minRadius;

    if (currentPhase.label === 'Inhale') {
        targetRadius = minRadius + (maxRadius - minRadius) * easeInOut(progress);
    } else if (currentPhase.label === 'Exhale') {
        targetRadius = maxRadius - (maxRadius - minRadius) * easeInOut(progress);
    } else if (currentPhase.label === 'Hold') {
        targetRadius = isExpandPhase ? maxRadius : minRadius;
    }
    
    // Add audio reactivity texture
    const jitter = normVol * (Math.random() * 3); 
    let finalRadius = targetRadius + (normVol * 25) + jitter;
    
    // Idle gentle pulse
    if (!isActive) finalRadius = minRadius + Math.sin(now / 1500) * 5;

    // Base Color (Inhale=Teal, Exhale=Indigo/Violet)
    // Shift slightly based on dominant frequency
    const baseHue = isExpandPhase ? 175 : 245;
    const freqColorOffset = (domFreq - 0.3) * 60; // +/- 30 degrees based on pitch

    // --- Draw Spectrum Bars ---
    // Only draw bars if there is significant audio to prevent clutter when silent
    if (isActive && normVol > 0.05) {
        const barCount = 64; 
        const angleStep = (Math.PI * 2) / barCount;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(now * 0.0001); // Slow spin

        for (let i = 0; i < barCount; i++) {
            // Map bars to frequency data bins
            const binIdx = Math.floor((i / barCount) * binCount * 1.5);
            const val = dataArray[binIdx] / 255;
            
            const barHeight = 4 + (val * 60) + (normVol * 20);
            
            ctx.save();
            ctx.rotate(i * angleStep);
            
            // Dynamic color shift
            const barHue = baseHue + (val * 40) + (freqColorOffset * 0.5); 
            const barLight = 50 + (val * 40);
            
            ctx.fillStyle = `hsla(${barHue}, 80%, ${barLight}%, ${0.3 + val * 0.7})`;
            
            ctx.beginPath();
            ctx.roundRect(-2, finalRadius - 5, 4, barHeight, 2);
            ctx.fill();
            
            ctx.restore();
        }
        ctx.restore();
    }

    // --- Central Orb ---
    const gradient = ctx.createRadialGradient(centerX, centerY, finalRadius * 0.2, centerX, centerY, finalRadius);
    const intensity = 0.5 + (normVol * 0.5);
    
    gradient.addColorStop(0, `hsla(${baseHue + freqColorOffset}, 80%, 60%, ${0.9})`);
    gradient.addColorStop(0.6, `hsla(${baseHue}, 70%, 50%, ${0.8 * intensity})`);
    gradient.addColorStop(1, `hsla(${baseHue - 20}, 60%, 40%, 0)`);

    ctx.beginPath();
    ctx.arc(centerX, centerY, finalRadius + 15, 0, Math.PI * 2); 
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Bright Core
    ctx.beginPath();
    ctx.arc(centerX, centerY, finalRadius * 0.4, 0, Math.PI*2);
    ctx.fillStyle = `hsla(${baseHue + freqColorOffset}, 90%, 80%, ${0.3 + normVol * 0.4})`;
    ctx.fill();

    // Shockwave Ring (on peaks)
    if (normVol > 0.4) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, finalRadius + (normVol * 30), 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${baseHue}, 100%, 90%, ${normVol * 0.3})`;
        ctx.lineWidth = 1 + normVol * 5;
        ctx.stroke();
    }

    // --- Particles ---
    if (isActive) {
        const pCount = 80; // Increased count
        const range = 140 + (normVol * 50); // Expand range based on volume
        
        for (let i = 0; i < pCount; i++) {
             const angleOffset = (i / pCount) * Math.PI * 2;
             
             // Varies speed per particle index
             // Added normVol influence to speed: Loud = Faster
             const speed = 0.05 + (i % 7) * 0.01 + (normVol * 0.25); 
             
             // Flow Logic: Inhale = Outward, Exhale = Inward
             
             // Create spread distribution so they aren't all in a line
             // We use 'now' to move them, and 'i' to offset them
             const spreadOffset = i * (range / pCount) * 7; 

             let dist = 0;
             
             if (isExpandPhase) {
                 dist = ((now * speed) + spreadOffset) % range;
             } else {
                 dist = range - (((now * speed) + spreadOffset) % range);
             }
             
             // Spiral twist - increased twist for more dynamic motion
             const twist = (dist / range) * Math.PI * 0.8 * (isExpandPhase ? 1 : -1);
             const angle = angleOffset + twist + (now * 0.0001);
             
             const r = finalRadius + dist;
             const x = centerX + Math.cos(angle) * r;
             const y = centerY + Math.sin(angle) * r;
             
             // Fade out logic
             const distFactor = dist / range;
             // Alpha boost on volume - "Emitting" effect
             const alpha = (1 - distFactor) * (0.3 + normVol * 0.7); 
             // Size boost on volume
             const pSize = 1.5 + (Math.random() * 1.5) + (normVol * 5); 
             
             // Color Logic
             // Shift hue based on how far out the particle is + volume intensity + frequency
             const hueShift = (distFactor * 30) + (normVol * 30); 
             // Apply dominant frequency shift to particles too
             const pHue = baseHue + hueShift + (freqColorOffset * 1.5);
             const pLight = 60 + (normVol * 40); // Brighter on beats

             ctx.beginPath();
             ctx.arc(x, y, pSize, 0, Math.PI * 2);
             ctx.fillStyle = `hsla(${pHue}, 85%, ${pLight}%, ${alpha})`;
             ctx.fill();
        }
    }

    animationFrameRef.current = requestAnimationFrame(drawVisualizer);
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(drawVisualizer);
    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }); 

  const currentPhase = pattern.phases[phaseIndex];
  
  const getPhaseText = () => {
    if (!isActive && totalSeconds === 0) return "Ready?";
    return currentPhase.label;
  };
  
  const getInstruction = () => {
      switch(currentPhase.label) {
          case 'Inhale': return "Breathe in deeply...";
          case 'Exhale': return "Release slowly...";
          case 'Hold': return "Hold...";
          case 'Sustain': return "Sustain...";
          default: return "";
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="absolute top-6 right-6 z-20">
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-900/50">
          <IconClose className="w-8 h-8" />
        </button>
      </div>

      <div className="text-center mb-8 space-y-2 z-10">
        <h2 className="text-3xl font-light text-white">{pattern.name}</h2>
        <p className="text-slate-400">{pattern.description}</p>
      </div>

      {/* Visualizer Canvas Container */}
      <div className="relative w-80 h-80 flex items-center justify-center mb-12">
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full z-0"
        />
        
        {/* Text Overlay */}
        <div className="relative z-10 text-center text-white pointer-events-none drop-shadow-md"> 
             <div className="text-2xl font-light tracking-widest uppercase mb-1">{getPhaseText()}</div>
             {isActive && <div className="text-4xl font-bold font-mono">{timeLeft}</div>}
        </div>
      </div>
      
      <p className="h-8 text-xl text-teal-200/80 font-light tracking-wide animate-pulse mb-8 z-10">
          {isActive ? getInstruction() : "Press play to begin"}
      </p>

      {/* Controls */}
      <div className="flex flex-col items-center gap-6 mb-8 z-10">
        <div className="flex items-center gap-8">
            <button 
                onClick={resetSession}
                className="p-3 rounded-full text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 transition-all"
                title="Reset Session"
            >
                <IconRefresh className="w-6 h-6" />
            </button>

            <button 
            onClick={togglePlay}
            className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl shadow-teal-900/50"
            >
            {isActive ? <IconPause className="w-8 h-8" /> : <IconPlay className="w-8 h-8 ml-1" />}
            </button>

            {/* Spacer for visual balance */}
            <div className="w-12"></div>
        </div>
        
        <div className="text-slate-500 font-mono text-sm">
            Total Time: {Math.floor(totalSeconds / 60)}:{(totalSeconds % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Expanded Settings Panel */}
      <div className="w-full max-w-2xl bg-slate-900/50 rounded-xl border border-slate-800 p-4 z-10 backdrop-blur-sm">
          <div className="flex flex-col gap-4">
              
              {/* Row 1: Toggles */}
              <div className="flex flex-wrap justify-center gap-3">
                 <button 
                    onClick={() => setBellEnabled(!bellEnabled)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        bellEnabled ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                >
                    🔔 Bell {bellEnabled ? 'On' : 'Off'}
                </button>

                <button 
                    onClick={() => setBreathSoundEnabled(!breathSoundEnabled)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        breathSoundEnabled ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                >
                    🌬️ Breath Audio {breathSoundEnabled ? 'On' : 'Off'}
                </button>

                <button 
                    onClick={() => {
                        if (!navigator.vibrate) alert("Haptics not supported on this device");
                        else {
                            setHapticsEnabled(!hapticsEnabled);
                            if(!hapticsEnabled) navigator.vibrate(100);
                        }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        hapticsEnabled ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                >
                    📳 Haptics {hapticsEnabled ? 'On' : 'Off'}
                </button>
              </div>

              {/* Row 2: Soundscape Settings */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Ambience</span>
                        <select 
                        value={selectedSoundscape}
                        onChange={(e) => setSelectedSoundscape(e.target.value as SoundscapeType)}
                        className="bg-slate-800 text-slate-200 text-sm rounded-lg px-2 py-1.5 border border-slate-700 outline-none focus:border-teal-500"
                        >
                        {Object.values(SoundscapeType).map(v => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 w-32">
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Vol</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="1.5" 
                            step="0.1" 
                            value={soundscapeVolume} 
                            onChange={(e) => setSoundscapeVolume(parseFloat(e.target.value))}
                            className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                    </div>
              </div>

              {/* Row 3: Bell Settings (Only if Bell is On) */}
              {bellEnabled && (
                  <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Bell Tone</span>
                            <select 
                            value={bellType}
                            onChange={(e) => setBellType(e.target.value as any)}
                            className="bg-slate-800 text-slate-200 text-sm rounded-lg px-2 py-1.5 border border-slate-700 outline-none focus:border-teal-500"
                            >
                            <option value="chime">Chime</option>
                            <option value="bowl">Bowl</option>
                            <option value="soft">Soft</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 w-32">
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Vol</span>
                            <input 
                                type="range" 
                                min="0" 
                                max="1.5" 
                                step="0.1" 
                                value={bellVolume} 
                                onChange={(e) => setBellVolume(parseFloat(e.target.value))}
                                className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                            />
                        </div>
                  </div>
              )}
          </div>
      </div>

    </div>
  );
};