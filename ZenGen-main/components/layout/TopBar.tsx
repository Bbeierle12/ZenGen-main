import React from 'react';
import { useNav } from '../../contexts/NavContext';
import { NAV_ITEMS, SECTION_PAGES } from '../../config/navigation';
import { UserStats, NavPageId } from '../../types';
import { IconUser } from '../Icons';

interface TopBarProps {
  stats: UserStats | null;
  onOpenProfile: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ stats, onOpenProfile }) => {
  const { state, navigateTo } = useNav();
  const { section, page, sidebarExpanded, isMobile } = state;

  // Get current section info
  const currentSection = NAV_ITEMS.find(item => item.id === section);
  const currentPages = SECTION_PAGES[section] || [];

  // Calculate left offset based on sidebar state (desktop only)
  const leftOffset = isMobile ? '0' : sidebarExpanded ? '15rem' : '4rem'; // 240px or 64px

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 transition-all"
      style={{ left: leftOffset }}
    >
      {/* Section Title & Sub-navigation */}
      <div className="flex items-center gap-4">
        {/* Section Title */}
        <h2 className="text-lg font-medium text-white">
          {currentSection?.label || 'ZenGen'}
        </h2>

        {/* Sub-navigation tabs (desktop only, for sections with sub-pages) */}
        {!isMobile && (section === 'meditations' || section === 'journal') && currentPages.length > 0 && (
          <div className="hidden md:flex items-center bg-slate-900/50 rounded-full p-1 border border-slate-800">
            {currentPages.slice(0, 3).map((pageItem) => (
              <button
                key={pageItem.id}
                onClick={() => navigateTo(section, pageItem.id as NavPageId)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  page === pageItem.id
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {pageItem.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Profile Section */}
      <button
        onClick={onOpenProfile}
        className="group flex items-center gap-3 hover:bg-slate-900/50 rounded-full pl-3 pr-1 py-1 transition-all border border-transparent hover:border-slate-800"
      >
        {stats && (
          <div className="hidden md:block text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider leading-none mb-1">
              Streak
            </div>
            <div className="text-sm font-bold text-teal-400 leading-none">
              {stats.currentStreak}{' '}
              <span className="text-xs font-normal text-slate-500">days</span>
            </div>
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
    </header>
  );
};
