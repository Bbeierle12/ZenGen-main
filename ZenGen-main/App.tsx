import React, { useState, useEffect } from 'react';
import { checkAndRequestApiKey, generateMeditationAudio, generateMeditationScript } from './services/claudeService';
import { ChatBot } from './components/ChatBot';
import { SessionPlayer } from './components/SessionPlayer';
import { BreathingPlayer } from './components/BreathingPlayer';
import { ProfileModal } from './components/ProfileModal';
import { Navbar } from './components/Navbar';
import { Loader } from './components/Loader';
import { ErrorBoundary, PlayerErrorBoundary } from './components/ErrorBoundary';
import { MeditationConfig, SessionData, VoiceName, GenerationState, SoundscapeType, UserStats, BreathingPattern, BreathPhase, BreathPhaseType, MeditationTechnique, GuidanceLevel, MeditationPreset } from './types';
import { IconSparkles, IconPlay } from './components/Icons';
import { getUserStats, clearUserStats, getUserPresets, saveUserPreset, deleteUserPreset, getCustomBreathingPatterns, saveCustomBreathingPattern, deleteCustomBreathingPattern } from './services/storageService';
import { PresetCard } from './components/PresetCard';
import { PresetBuilder } from './components/PresetBuilder';

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

const MEDITATION_PRESETS: MeditationPreset[] = [
  {
    id: 'morning-focus',
    name: 'Morning Focus',
    description: 'Start your day with clarity and intention',
    icon: '☀️',
    color: 'from-orange-500 to-amber-600',
    durationMinutes: 5,
    technique: MeditationTechnique.MINDFULNESS,
    soundscape: SoundscapeType.WIND,
    guidanceLevel: GuidanceLevel.MEDIUM,
  },
  {
    id: 'stress-relief',
    name: 'Stress Relief',
    description: 'Release tension and find calm',
    icon: '🍃',
    color: 'from-teal-500 to-emerald-600',
    durationMinutes: 10,
    technique: MeditationTechnique.BODY_SCAN,
    soundscape: SoundscapeType.RAIN,
    guidanceLevel: GuidanceLevel.HIGH,
  },
  {
    id: 'sleep-prep',
    name: 'Sleep Preparation',
    description: 'Drift into peaceful, restful sleep',
    icon: '🌙',
    color: 'from-indigo-500 to-purple-600',
    durationMinutes: 15,
    technique: MeditationTechnique.SLEEP_INDUCTION,
    soundscape: SoundscapeType.DRONE_LOW,
    guidanceLevel: GuidanceLevel.LOW,
  },
  {
    id: 'quick-reset',
    name: 'Quick Reset',
    description: 'A brief mindful pause for busy moments',
    icon: '⚡',
    color: 'from-cyan-500 to-blue-600',
    durationMinutes: 3,
    technique: MeditationTechnique.BREATH_WORK,
    soundscape: SoundscapeType.BOWL,
    guidanceLevel: GuidanceLevel.MEDIUM,
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
  const [activeTab, setActiveTab] = useState<'custom' | 'presets'>('presets');
  
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
  const [userPresets, setUserPresets] = useState<MeditationPreset[]>([]);
  const [customBreathingPatterns, setCustomBreathingPatterns] = useState<BreathingPattern[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Load stats and preferences on mount
  useEffect(() => {
    const loadedStats = getUserStats();
    setStats(loadedStats);
    setUserPresets(getUserPresets());
    setCustomBreathingPatterns(getCustomBreathingPatterns());

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

  const handleQuickStart = async () => {
    if (!stats?.preferences) return;

    const quickConfig: MeditationConfig = {
      topic: 'Quick Meditation',
      durationMinutes: stats.preferences.defaultDuration,
      voice: stats.preferences.defaultVoice,
      soundscape: stats.preferences.defaultSoundscape,
      technique: stats.preferences.defaultTechnique,
      guidanceLevel: stats.preferences.defaultGuidanceLevel
    };

    setConfig(quickConfig);

    try {
      const keyValid = await checkAndRequestApiKey();
      if (!keyValid) {
        setStatus({ step: 'idle', error: "API Key is required to generate sessions." });
        return;
      }

      setStatus({ step: 'script', error: null });
      const script = await generateMeditationScript(quickConfig);

      setStatus({ step: 'audio', error: null });
      const audioBuffer = await generateMeditationAudio(script, quickConfig.voice);

      setSession({ script, audioBuffer, config: quickConfig });
      setStatus({ step: 'complete', error: null });

    } catch (e: any) {
      console.error(e);
      setStatus({ step: 'idle', error: e.message || "Something went wrong. Please try again." });
    }
  };

  const handleSelectPreset = async (preset: MeditationPreset) => {
    // Set the config from preset
    const presetConfig: MeditationConfig = {
      topic: preset.name,
      durationMinutes: preset.durationMinutes,
      technique: preset.technique,
      soundscape: preset.soundscape,
      guidanceLevel: preset.guidanceLevel,
      voice: config.voice,
    };
    setConfig(presetConfig);

    // Directly start the meditation with this preset
    try {
      const hasKey = await checkAndRequestApiKey();
      if (!hasKey) {
        setStatus({ step: 'idle', error: "API Key is required to generate sessions." });
        setActiveTab('custom');
        return;
      }

      setStatus({ step: 'script', error: null });
      const script = await generateMeditationScript(presetConfig);

      setStatus({ step: 'audio', error: null });
      const audioBuffer = await generateMeditationAudio(script, presetConfig.voice);

      setSession({ script, audioBuffer, config: presetConfig });
      setStatus({ step: 'complete', error: null });

    } catch (e: any) {
      console.error(e);
      setStatus({ step: 'idle', error: e.message || "Something went wrong. Please try again." });
      setActiveTab('custom');
    }
  };

  const handleSavePreset = (preset: Omit<MeditationPreset, 'id' | 'isUserCreated'>) => {
    const updatedPresets = saveUserPreset(preset);
    setUserPresets(updatedPresets);
  };

  const handleDeletePreset = (id: string) => {
    const updatedPresets = deleteUserPreset(id);
    setUserPresets(updatedPresets);
  };

  const saveCustomBreath = () => {
    const phases: BreathPhase[] = [
        { label: 'Inhale' as BreathPhaseType, duration: Math.max(1, customBreath.inhale) },
        { label: 'Hold' as BreathPhaseType, duration: Math.max(0, customBreath.hold1) },
        { label: 'Exhale' as BreathPhaseType, duration: Math.max(1, customBreath.exhale) },
        { label: 'Sustain' as BreathPhaseType, duration: Math.max(0, customBreath.hold2) },
    ].filter(p => p.duration > 0);

    const pattern: Omit<BreathingPattern, 'id'> = {
        name: `Custom (${customBreath.inhale}-${customBreath.hold1}-${customBreath.exhale}-${customBreath.hold2})`,
        description: `${phases.reduce((acc, p) => acc + p.duration, 0)}s cycle`,
        color: 'from-pink-500 to-rose-600',
        icon: '⚡',
        phases: phases
    };
    const updatedPatterns = saveCustomBreathingPattern(pattern);
    setCustomBreathingPatterns(updatedPatterns);
    // Switch to Quick Start tab to show the new pattern
    setActiveTab('presets');
  };

  const handleDeleteCustomBreathing = (id: string) => {
    const updatedPatterns = deleteCustomBreathingPattern(id);
    setCustomBreathingPatterns(updatedPatterns);
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
          
          {activeTab === 'presets' ? (
            /* ========== PRESETS TAB - Ready-to-go meditations ========== */
            <div className="w-full animate-fade-in space-y-8">
                {/* SECTION 1: Meditation Presets */}
                <div>
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">🧘</span>
                        Guided Meditations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...MEDITATION_PRESETS, ...userPresets].map((preset) => (
                            <PresetCard
                                key={preset.id}
                                preset={preset}
                                onSelect={handleSelectPreset}
                                onDelete={preset.isUserCreated ? handleDeletePreset : undefined}
                            />
                        ))}
                    </div>
                </div>

                {/* SECTION 2: Breathing Exercises */}
                <div>
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">🌬️</span>
                        Breathing Exercises
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...BREATHING_PATTERNS, ...customBreathingPatterns].map((pattern) => {
                            const isCustom = pattern.id.startsWith('custom-');
                            return (
                            <div key={pattern.id} className="relative group">
                                {isCustom && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete this custom breathing pattern?')) {
                                                handleDeleteCustomBreathing(pattern.id);
                                            }
                                        }}
                                        className="absolute top-2 right-2 z-10 p-1.5 bg-red-900/80 hover:bg-red-800 text-red-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete pattern"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveBreathPattern(pattern)}
                                    className="w-full h-full bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-5 text-left transition-all hover:scale-[1.02] shadow-xl relative overflow-hidden"
                                >
                                    <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${pattern.color} rounded-bl-2xl`}>
                                        <IconPlay className="w-8 h-8 text-white" />
                                    </div>
                                    {isCustom && (
                                        <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[9px] bg-pink-900/50 text-pink-400 rounded uppercase font-bold">Custom</span>
                                    )}
                                    <h4 className="text-lg font-medium text-white mb-1">{pattern.name}</h4>
                                    <p className="text-slate-400 text-sm mb-3">{pattern.description}</p>

                                    <div className="flex gap-2 flex-wrap">
                                        {pattern.phases.map((phase, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <div className="text-[9px] text-slate-500 uppercase">{phase.label}</div>
                                                <div className="font-mono text-teal-400 font-bold text-sm">{phase.duration}s</div>
                                            </div>
                                        ))}
                                    </div>

                                    <PatternVisualizer phases={pattern.phases} />
                                </button>
                            </div>
                            );
                        })}
                    </div>
                </div>
            </div>
          ) : (
            /* ========== CUSTOM TAB - Build your own ========== */
            <div className="w-full animate-fade-in space-y-8">
                {/* SECTION 1: Custom Session Builder */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 bg-gradient-to-bl from-teal-500 to-emerald-600 rounded-bl-[100px] pointer-events-none"></div>

                    {/* Loader Overlay */}
                    {status.step !== 'idle' && status.step !== 'complete' && (
                    <div className="absolute inset-0 z-30 bg-slate-950/80 flex items-center justify-center backdrop-blur-sm rounded-2xl">
                        <Loader text={getLoadingText()} />
                    </div>
                    )}

                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-medium text-white flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400"><IconSparkles className="w-4 h-4" /></span>
                            Create Custom Session
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Topic Card */}
                        <div className="md:col-span-2 bg-slate-950/50 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-colors">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Meditation Topic</label>
                            <input
                                type="text"
                                value={config.topic}
                                onChange={(e) => setConfig({...config, topic: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all placeholder:text-slate-600"
                                placeholder="What's on your mind?"
                            />
                        </div>

                        {/* Duration Card */}
                        <div className="md:col-span-2 bg-slate-950/50 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-colors">
                            <div className="flex justify-between items-center mb-2">
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
                        <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-colors">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Technique</label>
                            <select
                            value={config.technique}
                            onChange={(e) => setConfig({...config, technique: e.target.value as MeditationTechnique})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none appearance-none cursor-pointer"
                            >
                            {Object.values(MeditationTechnique).map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                            </select>
                        </div>

                        {/* Guidance Level Card */}
                        <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-colors">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Guidance Level</label>
                            <select
                            value={config.guidanceLevel}
                            onChange={(e) => setConfig({...config, guidanceLevel: e.target.value as GuidanceLevel})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none appearance-none cursor-pointer"
                            >
                            {Object.values(GuidanceLevel).map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                            </select>
                        </div>

                        {/* Soundscape Card */}
                        <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-colors">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Soundscape</label>
                            <select
                            value={config.soundscape}
                            onChange={(e) => setConfig({...config, soundscape: e.target.value as SoundscapeType})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none appearance-none cursor-pointer"
                            >
                            {Object.values(SoundscapeType).map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                            </select>
                        </div>

                        {/* Voice Card - INACTIVE */}
                        <div className="bg-slate-950/50 border border-slate-800/50 p-4 rounded-xl relative opacity-60">
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-900/30 text-amber-500 text-[10px] font-bold uppercase rounded-full border border-amber-800/30">
                                TBA
                            </div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Voice Guide</label>
                            <select
                            value={config.voice}
                            disabled
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed appearance-none"
                            >
                            {Object.values(VoiceName).map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                            </select>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                    onClick={handleGenerate}
                    disabled={status.step !== 'idle'}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-teal-900/50 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                    <IconSparkles className="w-5 h-5" />
                    <span>Generate Meditation</span>
                    </button>

                    {status.error && (
                    <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-300 text-sm">
                        {status.error}
                    </div>
                    )}

                    <div className="text-center pt-4">
                    <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-600 hover:text-teal-400 underline transition-colors">
                        Get your Anthropic API Key
                    </a>
                    </div>
                </div>

                {/* SECTION 2: Create Custom Preset */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 bg-gradient-to-bl from-purple-500 to-indigo-600 rounded-bl-[100px] pointer-events-none"></div>
                    <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400"><IconSparkles className="w-4 h-4" /></span>
                        Save as Preset
                    </h3>
                    <PresetBuilder onSave={handleSavePreset} />
                </div>

                {/* SECTION 3: Custom Breathing Builder */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 bg-gradient-to-bl from-pink-500 to-rose-600 rounded-bl-[100px] pointer-events-none"></div>
                    <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400"><IconSparkles className="w-4 h-4" /></span>
                        Design Custom Breathing Pattern
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
                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Exhale (s)</label>
                            <input
                                type="number" min="1" max="60"
                                value={customBreath.exhale}
                                onChange={(e) => setCustomBreath({...customBreath, exhale: parseInt(e.target.value) || 0})}
                                className="w-full bg-transparent text-xl font-mono text-white focus:outline-none"
                            />
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
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
                        onClick={saveCustomBreath}
                        className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-medium rounded-xl shadow-lg shadow-pink-900/30 transition-all transform hover:scale-[1.01]"
                    >
                        Create Custom Breathing
                    </button>
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