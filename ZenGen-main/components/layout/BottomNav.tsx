import React from 'react';
import { useNav } from '../../contexts/NavContext';
import { NAV_ITEMS } from '../../config/navigation';
import { NavSectionId } from '../../types';

export const BottomNav: React.FC = () => {
  const { state, navigateTo } = useNav();
  const { section: activeSection } = state;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 safe-area-inset-bottom">
      <ul className="h-full flex items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;

          return (
            <li key={item.id} className="flex-1">
              <button
                onClick={() => navigateTo(item.id as NavSectionId)}
                className={`w-full h-full flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? 'text-teal-400' : 'text-slate-500'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-teal-400' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
