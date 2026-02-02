import React, { useState, useEffect } from 'react';
import { checkAndRequestApiKey, generateMeditationAudio, generateMeditationScript } from './services/geminiService';
import { ChatBot } from './components/ChatBot';
import { SessionPlayer } from './components/SessionPlayer';
import { BreathingPlayer } from './components/BreathingPlayer';
import { ProfileModal } from './components/ProfileModal';
import { Navbar } from './components/Navbar';
import { Loader } from './components/Loader';
import { ErrorBoundary, PlayerErrorBoundary } from './components/ErrorBoundary';
import { MeditationConfig, SessionData, VoiceName, GenerationState, SoundscapeType, UserStats, BreathingPattern, BreathPhase, BreathPhaseType, MeditationTechnique, GuidanceLevel } from './types';
import { IconSparkles, IconPlay } from './components/Icons';
import { getUserStats, clearUserStats } from './services/storageService';

const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Focus and stress relief (4-4-4-4)',
    color: 'from-blue-500 to-indigo-600',
    icon: '⏹️',
    phases: [
      { label: 'Inhale', duration: 4 },
      { label: 'Hold', duration: 4 },
      { label: 'Exhale', duration: 4 },
      { label: 'Hold', duration: 4 },
    ]
  },
  {
    id: 'relax',
    name: 'Relaxing Breath',
    description: 'Natural tranquilizer (4-7-8)',
    color: 'from-purple-500 to-pink-600',
    icon: '🧘',
    phases: [
      { label: 'Inhale', duration: 4 },
      { label: 'Hold', duration: 7 },
      { label: 'Exhale', duration: 8 },
    ]
  },
  {
    id: 'resonance',
    name: 'Resonance',
    description: 'Coherent heart rate (6-6)',
    color: 'from-teal-500 to-emerald-600',
    icon: '🌊',
    phases: [
      { label: 'Inhale', duration: 6 },
      { label: 'Exhale', duration: 6 },
    ]
  },
  {
    id: 'triangle',
    name: 'Triangle',
    description: 'Balance and calm (5-5-5)',
    color: 'from-orange-500 to-amber-600',
    icon: '🔺',
    phases: [
      { label: 'Inhale', duration: 5 },
      { label: 'Hold', duration: 5 },
      { label: 'Exhale', duration: 5 },
    ]
  }
];

const getPhaseColor = (label: string) => {
  switch (label) {
    case 'Inhale': return 'bg-teal-400';
    case 'Exhale': return 'bg-indigo-500';
    case 'Hold': return 'bg-white/30';
    case 'Sustain': return 'bg-slate-700';
    default: return 'bg-slate-500';
  }
};

const PatternVisualizer = ({ phases }: { phases: { label: string, duration: number }[] }) => {
  const total = phases.reduce((acc, p) => acc + p.duration, 0);
  if (total === 0) return null;
  
  return (
    <div className="w-full mt-5">
        {/* Bar */}
        <div className="w-full flex h-2 rounded-full overflow-hidden bg-slate-800/50 border border-slate-700/50">
            {phases.map((p, i) => (
                <div 
                    key={i} 
                    style={{ width: `${(p.duration / total) * 100}%` }} 
                    className={`${getPhaseColor(p.label)} transition-all duration-300 relative`}
                    title={`${p.label}: ${p.duration}s`}
                />
            ))}
        </div>
        {/* Labels below */}
        <div className="flex justify-between mt-1 text-[10px] text-slate-500 uppercase font-medium tracking-wider">
            <span>Inhale</span>
            {phases.some(p => p.label === 'Exhale') && <span>Exhale</span>}
        </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'breathing'>('generator');
  
  // Initialize with defaults, will be overwritten by effect
  const [config, setConfig] = useState<MeditationConfig>({
    topic: 'Relieving Anxiety',
    durationMinutes: 3,
    voice: VoiceName.Kore,
    soundscape: SoundscapeType.OCEAN,
    technique: MeditationTechnique.MINDFULNESS,
    guidanceLevel: GuidanceLevel.MEDIUM
  });

  // Custom Breathing State
  const [customBreath, setCustomBreath] = useState({
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 0
  });

  const [session, setSession] = useState<SessionData | null>(null);
  const [activeBreathPattern, setActiveBreathPattern] = useState<BreathingPattern | null>(null);
  const [status, setStatus] = useState<GenerationState>({ step: 'idle', error: null });
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Load stats and preferences on mount
  useEffect(() => {
    const loadedStats = getUserStats();
    setStats(loadedStats);
    
    // Apply defaults from preferences
    if (loadedStats.preferences) {
        setConfig(prev => ({
            ...prev,
            durationMinutes: loadedStats.preferences.defaultDuration,
            voice: loadedStats.preferences.defaultVoice,
            soundscape: loadedStats.preferences.defaultSoundscape,
            technique: loadedStats.preferences.defaultTechnique || MeditationTechnique.MINDFULNESS,
            guidanceLevel: loadedStats.preferences.defaultGuidanceLevel || GuidanceLevel.MEDIUM,
        }));
    }
  }, [session]); // Reload stats when session completes

  const handleGenerate = async () => {
    try {
      const hasKey = await checkAndRequestApiKey();
      if (!hasKey) {
        setStatus({ step: 'idle', error: "API Key is required to generate sessions." });
        return;
      }

      setStatus({ step: 'script', error: null });
      const script = await generateMeditationScript(config);
      
      setStatus({ step: 'audio', error: null });
      const audioBuffer = await generateMeditationAudio(script, config.voice);

      setSession({ script, audioBuffer, config });
      setStatus({ step: 'complete', error: null });

    } catch (e: any) {
      console.error(e);
      setStatus({ step: 'idle', error: e.message || "Something went wrong. Please try again." });
    }
  };

  const startCustomBreath = () => {
    const phases: BreathPhase[] = [
        { label: 'Inhale' as BreathPhaseType, duration: Math.max(1, customBreath.inhale) },
        { label: 'Hold' as BreathPhaseType, duration: Math.max(0, customBreath.hold1) },
        { label: 'Exhale' as BreathPhaseType, duration: Math.max(1, customBreath.exhale) },
        { label: 'Sustain' as BreathPhaseType, duration: Math.max(0, customBreath.hold2) },
    ].filter(p => p.duration > 0);

    const pattern: BreathingPattern = {
        id: 'custom',
        name: 'Custom Rhythm',
        description: `Custom (${customBreath.inhale}-${customBreath.hold1}-${customBreath.exhale}-${customBreath.hold2})`,
        color: 'from-pink-500 to-rose-600',
        icon: '⚡',
        phases: phases
    };
    setActiveBreathPattern(pattern);
  };

  const handleClearData = () => {
      const reset = clearUserStats();
      setStats(reset);
      setIsProfileOpen(false);
  };

  const handleProfileUpdate = (newStats: UserStats) => {
      setStats(newStats);
      // Reflect new defaults immediately if idle
      if (!session && status.step === 'idle') {
          setConfig(prev => ({
              ...prev,
              durationMinutes: newStats.preferences.defaultDuration,
              voice: newStats.preferences.defaultVoice,
              soundscape: newStats.preferences.defaultSoundscape,
              technique: newStats.preferences.defaultTechnique,
              guidanceLevel: newStats.preferences.defaultGuidanceLevel,
          }));
      }
  };

  const getLoadingText = () => {
    switch(status.step) {
      case 'script': return "Writing your guided journey...";
      case 'audio': return "Recording your personal guide...";
      default: return "Loading...";
    }
  };

  // Prepare custom phases for visualization
  const customPreviewPhases = [
    { label: 'Inhale', duration: Math.max(0, customBreath.inhale) },
    { label: 'Hold', duration: Math.max(0, customBreath.hold1) },
    { label: 'Exhale', duration: Math.max(0, customBreath.exhale) },
    { label: 'Sustain', duration: Math.max(0, customBreath.hold2) },
  ].filter(p => p.duration > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30 pb-20">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-teal-900/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      <Navbar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        stats={stats} 
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {session && (
        <PlayerErrorBoundary
          componentName="Session Player"
          onClose={() => {
            setSession(null);
            setStatus({ step: 'idle', error: null });
          }}
        >
          <SessionPlayer
            data={session}
            onReset={() => {
              setSession(null);
              setStatus({ step: 'idle', error: null });
            }}
          />
        </PlayerErrorBoundary>
      )}

      {activeBreathPattern && (
        <PlayerErrorBoundary
          componentName="Breathing Player"
          onClose={() => setActiveBreathPattern(null)}
        >
          <BreathingPlayer
              pattern={activeBreathPattern}
              onClose={() => setActiveBreathPattern(null)}
          />
        </PlayerErrorBoundary>
      )}

      {isProfileOpen && stats && (
        <ErrorBoundary>
          <ProfileModal
            stats={stats}
            onClose={() => setIsProfileOpen(false)}
            onUpdate={handleProfileUpdate}
            onClearData={handleClearData}
          />
        </ErrorBoundary>
      )}
      
      {!session && !activeBreathPattern && (
        <div className="relative z-10 container mx-auto px-4 pt-24 pb-8 flex flex-col items-center max-w-5xl">
          
          {activeTab === 'generator' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full animate-fade-in">
                {/* Left Col: Config */}
                <div className="lg:col-span-7 relative">
                    {/* Loader Overlay */}
                    {status.step !== 'idle' && status.step !== 'complete' && (
                    <div className="absolute inset-0 z-30 bg-slate-950/80 flex items-center justify-center backdrop-blur-sm rounded-3xl border border-slate-800">
                        <Loader text={getLoadingText()} />
                    </div>
                    )}

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-medium text-white">Create Session</h2>
                            <span className="text-xs px-2 py-1 rounded bg-teal-900/30 text-teal-400 border border-teal-900/50">Custom</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Topic Card */}
                            <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-colors">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Meditation Topic</label>
                                <input 
                                    type="text" 
                                    value={config.topic}
                                    onChange={(e) => setConfig({...config, topic: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all placeholder:text-slate-600"
                                    placeholder="What's on your mind?"
                                />
                            </div>

                            {/* Duration Card */}
                            <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-colors">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</label>
                                    <span className="text-teal-400 font-mono text-lg">{config.durationMinutes} min</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="10" 
                                    step="0.5"
                                    value={config.durationMinutes}
                                    onChange={(e) => setConfig({...config, durationMinutes: parseFloat(e.target.value)})}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                                />
                            </div>

                            {/* Technique Card */}
                             <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-colors">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Technique</label>
                                <select 
                                value={config.technique}
                                onChange={(e) => setConfig({...config, technique: e.target.value as MeditationTechnique})}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none appearance-none cursor-pointer"
                                >
                                {Object.values(MeditationTechnique).map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                                </select>
                            </div>

                            {/* Guidance Level Card */}
                            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-colors">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Guidance Level</label>
                                <select 
                                value={config.guidanceLevel}
                                onChange={(e) => setConfig({...config, guidanceLevel: e.target.value as GuidanceLevel})}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none appearance-none cursor-pointer"
                                >
                                {Object.values(GuidanceLevel).map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                                </select>
                            </div>

                            {/* Voice Card */}
                            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-colors">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Voice Guide</label>
                                <select 
                                value={config.voice}
                                onChange={(e) => setConfig({...config, voice: e.target.value as VoiceName})}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none appearance-none cursor-pointer"
                                >
                                {Object.values(VoiceName).map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                                </select>
                            </div>

                            {/* Soundscape Card */}
                            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-colors">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Soundscape</label>
                                <select 
                                value={config.soundscape}
                                onChange={(e) => setConfig({...config, soundscape: e.target.value as SoundscapeType})}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none appearance-none cursor-pointer"
                                >
                                {Object.values(SoundscapeType).map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                                </select>
                            </div>
                        </div>

                        <button 
                        onClick={handleGenerate}
                        disabled={status.step !== 'idle'}
                        className="w-full mt-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-teal-900/50 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                        <IconSparkles className="w-5 h-5" />
                        <span>Start Meditation</span>
                        </button>
                        
                        {status.error && (
                        <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-300 text-sm">
                            {status.error}
                        </div>
                        )}
                        
                        <div className="text-center pt-2">
                        <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-600 hover:text-teal-400 underline transition-colors">
                            Get your Anthropic API Key
                        </a>
                        </div>
                    </div>
                </div>

                {/* Right Col: Quick Start Breathing */}
                <div className="lg:col-span-5 space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-white mb-4">Quick Start Breathing</h3>
                    <div className="grid grid-cols-1 gap-4">
                    {BREATHING_PATTERNS.map(pattern => (
                        <button 
                        key={pattern.id}
                        onClick={() => setActiveBreathPattern(pattern)}
                        className="block w-full p-4 bg-slate-900/40 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-800/60 rounded-xl transition-all text-left group"
                        >
                        <div className="flex items-start gap-4 mb-2">
                            <div className="text-3xl bg-slate-950 p-3 rounded-lg border border-slate-800 group-hover:border-teal-500/30 transition-colors">
                                {pattern.icon}
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-200 group-hover:text-teal-300 transition-colors">{pattern.name}</h4>
                                <p className="text-sm text-slate-500 mt-1">{pattern.description}</p>
                                <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                                    <span className="flex items-center gap-1">
                                        <IconPlay className="w-3 h-3" /> 
                                        {pattern.phases.reduce((acc, p) => acc + p.duration, 0)}s cycle
                                    </span>
                                </div>
                            </div>
                        </div>
                         {/* Visualizer for Preset */}
                         <PatternVisualizer phases={pattern.phases} />
                        </button>
                    ))}
                    </div>
                </div>
                </div>
            </div>
          ) : (
            <div className="w-full animate-fade-in space-y-8">
                {/* Custom Builder */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 bg-gradient-to-bl from-pink-500 to-rose-600 rounded-bl-[100px] pointer-events-none"></div>
                    <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400"><IconSparkles className="w-4 h-4" /></span>
                        Design Custom Pattern
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Inhale (s)</label>
                            <input 
                                type="number" min="1" max="60"
                                value={customBreath.inhale}
                                onChange={(e) => setCustomBreath({...customBreath, inhale: parseInt(e.target.value) || 0})}
                                className="w-full bg-transparent text-xl font-mono text-white focus:outline-none"
                            />
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Hold (s)</label>
                            <input 
                                type="number" min="0" max="60"
                                value={customBreath.hold1}
                                onChange={(e) => setCustomBreath({...customBreath, hold1: parseInt(e.target.value) || 0})}
                                className="w-full bg-transparent text-xl font-mono text-white focus:outline-none"
                            />
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Exhale (s)</label>
                            <input 
                                type="number" min="1" max="60"
                                value={customBreath.exhale}
                                onChange={(e) => setCustomBreath({...customBreath, exhale: parseInt(e.target.value) || 0})}
                                className="w-full bg-transparent text-xl font-mono text-white focus:outline-none"
                            />
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Sustain (s)</label>
                            <input 
                                type="number" min="0" max="60"
                                value={customBreath.hold2}
                                onChange={(e) => setCustomBreath({...customBreath, hold2: parseInt(e.target.value) || 0})}
                                className="w-full bg-transparent text-xl font-mono text-white focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-2">Pattern Preview</label>
                        <PatternVisualizer phases={customPreviewPhases} />
                    </div>

                    <button 
                        onClick={startCustomBreath}
                        className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-medium rounded-xl shadow-lg shadow-pink-900/30 transition-all transform hover:scale-[1.01]"
                    >
                        Start Custom Breath
                    </button>
                </div>

                {/* Presets Grid */}
                <div>
                    <h3 className="text-lg font-medium text-slate-400 mb-4">Quick Presets</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {BREATHING_PATTERNS.map((pattern) => (
                            <button
                                key={pattern.id}
                                onClick={() => setActiveBreathPattern(pattern)}
                                className="bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-8 text-left transition-all hover:scale-[1.02] shadow-xl group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${pattern.color} rounded-bl-3xl`}>
                                    <IconPlay className="w-12 h-12 text-white" />
                                </div>
                                <h3 className="text-xl font-medium text-white mb-1">{pattern.name}</h3>
                                <p className="text-slate-400 text-sm mb-4">{pattern.description}</p>
                                
                                <div className="flex gap-2">
                                    {pattern.phases.map((phase, i) => (
                                        <div key={i} className="flex flex-col items-center">
                                            <div className="text-xs text-slate-500 uppercase tracking-tighter text-[10px]">{phase.label}</div>
                                            <div className="font-mono text-teal-400 font-bold">{phase.duration}s</div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Visualizer for Preset */}
                                <PatternVisualizer phases={pattern.phases} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          )}

        </div>
      )}
      
      {!session && !activeBreathPattern && <ChatBot />}
    </div>
  );
}

export default App;