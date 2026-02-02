import React, { useState } from 'react';
import { MeditationPreset, MeditationTechnique, SoundscapeType, GuidanceLevel } from '../types';
import { IconSparkles } from './Icons';

interface Props {
  onSave: (preset: Omit<MeditationPreset, 'id' | 'isUserCreated'>) => void;
}

const PRESET_ICONS = ['🧘', '🌅', '🌙', '🍃', '💫', '🌊', '⚡', '🔮', '☀️', '🌸'];
const PRESET_COLORS = [
  'from-teal-500 to-emerald-600',
  'from-purple-500 to-pink-600',
  'from-blue-500 to-indigo-600',
  'from-orange-500 to-amber-600',
  'from-cyan-500 to-blue-600',
  'from-rose-500 to-red-600',
  'from-violet-500 to-purple-600',
  'from-green-500 to-teal-600',
];

export const PresetBuilder: React.FC<Props> = ({ onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [technique, setTechnique] = useState<MeditationTechnique>(MeditationTechnique.MINDFULNESS);
  const [soundscape, setSoundscape] = useState<SoundscapeType>(SoundscapeType.NONE);
  const [guidanceLevel, setGuidanceLevel] = useState<GuidanceLevel>(GuidanceLevel.MEDIUM);
  const [selectedIcon, setSelectedIcon] = useState(PRESET_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || `Custom ${durationMinutes} min meditation`,
      icon: selectedIcon,
      color: selectedColor,
      durationMinutes,
      technique,
      soundscape,
      guidanceLevel
    });

    // Reset form
    setName('');
    setDescription('');
    setDurationMinutes(5);
    setTechnique(MeditationTechnique.MINDFULNESS);
    setSoundscape(SoundscapeType.NONE);
    setGuidanceLevel(GuidanceLevel.MEDIUM);
    setSelectedIcon(PRESET_ICONS[0]);
    setSelectedColor(PRESET_COLORS[0]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name and Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Preset Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Meditation"
            maxLength={30}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            maxLength={50}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
          />
        </div>
      </div>

      {/* Icon and Color selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Icon
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setSelectedIcon(icon)}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                  selectedIcon === icon
                    ? 'bg-teal-600 ring-2 ring-teal-400'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} transition-all ${
                  selectedColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Duration slider */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Duration: <span className="text-teal-400">{durationMinutes} min</span>
        </label>
        <input
          type="range"
          min="1"
          max="30"
          step="1"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>1 min</span>
          <span>30 min</span>
        </div>
      </div>

      {/* Settings row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Technique
          </label>
          <select
            value={technique}
            onChange={(e) => setTechnique(e.target.value as MeditationTechnique)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none appearance-none cursor-pointer"
          >
            {Object.values(MeditationTechnique).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Soundscape
          </label>
          <select
            value={soundscape}
            onChange={(e) => setSoundscape(e.target.value as SoundscapeType)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none appearance-none cursor-pointer"
          >
            {Object.values(SoundscapeType).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Guidance
          </label>
          <select
            value={guidanceLevel}
            onChange={(e) => setGuidanceLevel(e.target.value as GuidanceLevel)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none appearance-none cursor-pointer"
          >
            {Object.values(GuidanceLevel).map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Save button */}
      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-teal-900/30 transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
      >
        <IconSparkles className="w-5 h-5" />
        <span>Save Preset</span>
      </button>
    </form>
  );
};
