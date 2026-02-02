import React from 'react';
import { UserStats } from '../types';
import { IconSparkles, IconUser } from './Icons';

interface Props {
  activeTab: 'custom' | 'presets';
  onTabChange: (tab: 'custom' | 'presets') => void;
  stats: UserStats | null;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, onTabChange, stats, onOpenProfile }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-30 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 transition-all">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg shadow-lg shadow-teal-900/50">
          <IconSparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-light text-white tracking-tight hidden sm:block">
          ZenGen <span className="font-semibold">AI</span>
        </h1>
      </div>

      {/* Navigation Links - Centered */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center bg-slate-900/50 rounded-full p-1 border border-slate-800">
            <button
            onClick={() => onTabChange('presets')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'presets'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            >
            Quick Start
            </button>
            <button
            onClick={() => onTabChange('custom')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'custom'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            >
            Custom
            </button>
        </div>
      </div>

      {/* Profile Section */}
      <button 
        onClick={onOpenProfile}
        className="group flex items-center gap-3 hover:bg-slate-900/50 rounded-full pl-3 pr-1 py-1 transition-all border border-transparent hover:border-slate-800"
      >
        {stats && (
            <div className="hidden md:block text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider leading-none mb-1">Streak</div>
                <div className="text-sm font-bold text-teal-400 leading-none">{stats.currentStreak} <span className="text-xs font-normal text-slate-500">days</span></div>
            </div>
        )}
        <div className="w-9 h-9 rounded-full bg-slate-800 group-hover:bg-teal-900/50 flex items-center justify-center border border-slate-700 group-hover:border-teal-500/50 transition-colors shadow-sm">
            {stats?.preferences?.displayName ? (
                    <span className="font-bold text-sm text-slate-300 group-hover:text-teal-300">
                        {stats.preferences.displayName.charAt(0).toUpperCase()}
                    </span>
            ) : (
                <IconUser className="w-4 h-4 text-slate-300 group-hover:text-teal-300" />
            )}
        </div>
      </button>
    </nav>
  );
};