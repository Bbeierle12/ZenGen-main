import React from 'react';
import { MeditationPreset } from '../types';
import { IconClose, IconPlay } from './Icons';

interface Props {
  preset: MeditationPreset;
  onSelect: (preset: MeditationPreset) => void;
  onDelete?: (id: string) => void;
}

export const PresetCard: React.FC<Props> = ({ preset, onSelect, onDelete }) => {
  return (
    <div
      className={`bg-gradient-to-br ${preset.color} p-[1px] rounded-2xl group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg`}
      onClick={() => onSelect(preset)}
    >
      <div className="bg-slate-950/90 backdrop-blur-sm rounded-2xl p-5 h-full relative">
        {/* Delete button for user-created presets */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(preset.id);
            }}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800/50 text-slate-500 hover:text-red-400 hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete preset"
          >
            <IconClose className="w-4 h-4" />
          </button>
        )}

        {/* Icon and Name */}
        <div className="flex items-start gap-4">
          <div className="text-3xl">{preset.icon}</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white truncate">{preset.name}</h4>
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{preset.description}</p>
          </div>
        </div>

        {/* Settings tags */}
        <div className="flex flex-wrap gap-2 mt-4 text-xs">
          <span className="px-2 py-1 bg-slate-800/50 text-slate-300 rounded-lg">
            {preset.durationMinutes} min
          </span>
          <span className="px-2 py-1 bg-slate-800/50 text-slate-300 rounded-lg truncate max-w-[120px]">
            {preset.technique}
          </span>
        </div>

        {/* Hover overlay with play button */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
          <div className="flex items-center gap-2 text-white text-sm font-medium">
            <IconPlay className="w-5 h-5" />
            <span>Use Preset</span>
          </div>
        </div>
      </div>
    </div>
  );
};
