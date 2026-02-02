import React, { useState, useRef } from 'react';
import { UserStats, VoiceName, SoundscapeType, MeditationTechnique, GuidanceLevel } from '../types';
import { IconClose, IconHistory, IconSettings, IconSparkles, IconUser } from './Icons';
import { updateUserPreferences, exportUserData, importUserData, clearUserStats } from '../services/storageService';

interface Props {
  stats: UserStats;
  onClose: () => void;
  onUpdate: (stats: UserStats) => void;
  onClearData?: () => void;
}

export const ProfileModal: React.FC<Props> = ({ stats, onClose, onUpdate, onClearData }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [historyLimit, setHistoryLimit] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Logic
  const calculateLevel = (mins: number) => {
      if (mins < 60) return { level: 1, title: 'Novice', next: 60 };
      if (mins < 300) return { level: 2, title: 'Seeker', next: 300 };
      if (mins < 1000) return { level: 3, title: 'Practitioner', next: 1000 };
      if (mins < 3000) return { level: 4, title: 'Guide', next: 3000 };
      return { level: 5, title: 'Master', next: null };
  };

  const levelInfo = calculateLevel(stats.totalMinutes);
  const progressPercent = levelInfo.next 
      ? Math.min(100, (stats.totalMinutes / levelInfo.next) * 100) 
      : 100;

  // History Logic
  const displayedHistory = stats.history.slice(0, historyLimit);
  const hasMoreHistory = stats.history.length > historyLimit;
  const handleLoadMore = () => setHistoryLimit(prev => prev + 5);

  // Settings Handlers
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStats = updateUserPreferences({ displayName: e.target.value });
      onUpdate(newStats);
  };

  const handleDefaultDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStats = updateUserPreferences({ defaultDuration: parseFloat(e.target.value) });
      onUpdate(newStats);
  };

  const handleDefaultVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStats = updateUserPreferences({ defaultVoice: e.target.value as VoiceName });
      onUpdate(newStats);
  };

  const handleDefaultSoundscapeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStats = updateUserPreferences({ defaultSoundscape: e.target.value as SoundscapeType });
      onUpdate(newStats);
  };

  const handleDefaultTechniqueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStats = updateUserPreferences({ defaultTechnique: e.target.value as MeditationTechnique });
      onUpdate(newStats);
  };

  const handleDefaultGuidanceLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStats = updateUserPreferences({ defaultGuidanceLevel: e.target.value as GuidanceLevel });
      onUpdate(newStats);
  };


  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const newStats = await importUserData(file);
          onUpdate(newStats);
          alert('Data imported successfully!');
      } catch (err: any) {
          alert(err.message);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg h-full bg-slate-950 border-l border-slate-800 shadow-2xl overflow-y-auto flex flex-col transform transition-transform duration-300 ease-out">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center sticky top-0 z-20 shadow-md">
           <div className="flex gap-4">
               <button 
                  onClick={() => setActiveTab('profile')}
                  className={`pb-1 text-lg font-medium transition-all ${activeTab === 'profile' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400 hover:text-white'}`}
               >
                   Profile
               </button>
               <button 
                  onClick={() => setActiveTab('settings')}
                  className={`pb-1 text-lg font-medium transition-all ${activeTab === 'settings' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400 hover:text-white'}`}
               >
                   Settings
               </button>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
              <IconClose className="w-6 h-6" />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'profile' ? (
                <div className="space-y-8 animate-fade-in">
                    {/* User Header */}
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-teal-900/40">
                            {stats.preferences.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-light text-white">{stats.preferences.displayName}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-teal-400 border border-teal-500/30 uppercase tracking-wide">
                                    Lvl {levelInfo.level} • {levelInfo.title}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <div className="flex justify-between text-xs text-slate-400 mb-2 uppercase tracking-wider">
                            <span>Progress to next level</span>
                            {levelInfo.next && <span>{Math.floor(stats.totalMinutes)} / {levelInfo.next} mins</span>}
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center italic">
                            "Every breath is a step forward."
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Streak</div>
                            <div className="text-3xl font-light text-white">{stats.currentStreak} <span className="text-sm text-slate-600">days</span></div>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Sessions</div>
                            <div className="text-3xl font-light text-white">{stats.totalSessions}</div>
                        </div>
                        <div className="col-span-2 bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div>
                                <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total Mindful Time</div>
                                <div className="text-3xl font-light text-teal-400">{Math.floor(stats.totalMinutes)} <span className="text-sm text-slate-600">mins</span></div>
                            </div>
                            <IconSparkles className="w-8 h-8 text-teal-500/20" />
                        </div>
                    </div>

                    {/* History */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                            <IconHistory className="w-4 h-4" /> Session History
                        </h3>
                         <div className="space-y-3">
                            {stats.history.length === 0 ? (
                                <div className="text-center py-8 text-slate-600 italic">No sessions yet.</div>
                            ) : (
                                <div className="space-y-4 relative">
                                    <div className="absolute left-3.5 top-2 bottom-2 w-px bg-slate-800"></div>
                                    {displayedHistory.map((session, idx) => (
                                        <div key={session.id || idx} className="relative pl-10 group">
                                            <div className="absolute left-[11px] top-2.5 w-2 h-2 rounded-full bg-slate-700 border border-slate-900 group-hover:bg-teal-500 transition-colors"></div>
                                            <div className="bg-slate-900 hover:bg-slate-800 p-3 rounded-lg border border-slate-800 transition-colors flex justify-between items-center">
                                                <div className="overflow-hidden">
                                                    <div className="font-medium text-slate-300 truncate pr-2">{session.topic}</div>
                                                    <div className="text-xs text-slate-500">{new Date(session.date).toLocaleDateString()} • {new Date(session.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                </div>
                                                <div className="text-sm font-mono text-teal-500/70">{session.duration}m</div>
                                            </div>
                                        </div>
                                    ))}
                                    {hasMoreHistory && (
                                        <button 
                                            onClick={handleLoadMore}
                                            className="w-full py-2 mt-2 text-sm text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
                                        >
                                            Show Older Sessions
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Personalization */}
                    <section>
                         <h3 className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-4">You</h3>
                         <div className="space-y-4">
                             <div>
                                 <label className="block text-sm text-slate-400 mb-1">Display Name</label>
                                 <input 
                                    type="text" 
                                    value={stats.preferences.displayName}
                                    onChange={handleNameChange}
                                    maxLength={20}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-teal-500 focus:outline-none transition-colors"
                                 />
                             </div>
                         </div>
                    </section>

                    {/* Defaults */}
                    <section>
                         <h3 className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-4">Meditation Defaults</h3>
                         <div className="space-y-5">
                             <div>
                                 <div className="flex justify-between mb-2">
                                    <label className="text-sm text-slate-400">Default Duration</label>
                                    <span className="text-sm text-white font-mono">{stats.preferences.defaultDuration} min</span>
                                 </div>
                                 <input 
                                    type="range" min="1" max="30" step="1"
                                    value={stats.preferences.defaultDuration}
                                    onChange={handleDefaultDurationChange}
                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                                 />
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                     <label className="block text-sm text-slate-400 mb-2">Technique</label>
                                     <select 
                                        value={stats.preferences.defaultTechnique}
                                        onChange={handleDefaultTechniqueChange}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-500 outline-none"
                                     >
                                         {Object.values(MeditationTechnique).map(v => <option key={v} value={v}>{v}</option>)}
                                     </select>
                                </div>
                                <div>
                                     <label className="block text-sm text-slate-400 mb-2">Guidance</label>
                                     <select 
                                        value={stats.preferences.defaultGuidanceLevel}
                                        onChange={handleDefaultGuidanceLevelChange}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-500 outline-none"
                                     >
                                         {Object.values(GuidanceLevel).map(v => <option key={v} value={v}>{v}</option>)}
                                     </select>
                                </div>
                                <div className="opacity-60">
                                     <label className="block text-sm text-slate-500 mb-2 flex items-center gap-2">
                                        Voice
                                        <span className="px-1.5 py-0.5 text-[9px] bg-amber-900/30 text-amber-500 rounded-full uppercase font-bold border border-amber-800/30">TBA</span>
                                     </label>
                                     <select
                                        value={stats.preferences.defaultVoice}
                                        disabled
                                        className="w-full bg-slate-900/50 border border-slate-800/50 rounded-lg px-3 py-2 text-slate-500 text-sm cursor-not-allowed"
                                     >
                                         {Object.values(VoiceName).map(v => <option key={v} value={v}>{v}</option>)}
                                     </select>
                                </div>
                                <div>
                                     <label className="block text-sm text-slate-400 mb-2">Ambience</label>
                                     <select 
                                        value={stats.preferences.defaultSoundscape}
                                        onChange={handleDefaultSoundscapeChange}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-500 outline-none"
                                     >
                                         {Object.values(SoundscapeType).map(v => <option key={v} value={v}>{v}</option>)}
                                     </select>
                                </div>
                             </div>
                         </div>
                    </section>

                    {/* Data Management */}
                    <section>
                         <h3 className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-4">Data Management</h3>
                         <div className="grid grid-cols-2 gap-3">
                             <button 
                                onClick={exportUserData}
                                className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-sm text-slate-300 transition-all flex items-center justify-center gap-2"
                             >
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                 Export Data
                             </button>
                             
                             <button 
                                onClick={handleImportClick}
                                className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-sm text-slate-300 transition-all flex items-center justify-center gap-2"
                             >
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                 Import Data
                             </button>
                             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                             
                             <button 
                                onClick={() => {
                                    if(confirm('Are you sure? This will wipe all stats and history.')) {
                                        if (onClearData) {
                                            onClearData();
                                        } else {
                                            const empty = clearUserStats();
                                            onUpdate(empty);
                                        }
                                    }
                                }}
                                className="col-span-2 px-4 py-3 bg-red-900/10 hover:bg-red-900/20 border border-red-900/30 rounded-lg text-sm text-red-400 transition-all"
                             >
                                 Reset Everything
                             </button>
                         </div>
                    </section>
                    
                    <div className="text-center text-xs text-slate-600 pt-4">
                        ZenGen AI v1.2.0 • Build 2024
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
