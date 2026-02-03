import React from 'react';
import { useNav } from '../../contexts/NavContext';
import { NAV_ITEMS } from '../../config/navigation';
import { IconSparkles, IconChevronLeft, IconChevronRight } from '../Icons';
import { NavSectionId } from '../../types';

export const Sidebar: React.FC = () => {
  const { state, navigateTo, toggleSidebar } = useNav();
  const { section: activeSection, sidebarExpanded } = state;

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 bg-slate-950/95 backdrop-blur-md border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${
        sidebarExpanded ? 'w-60' : 'w-16'
      }`}
    >
      {/* Logo/Brand Header */}
      <div className={`h-16 flex items-center border-b border-slate-800 ${sidebarExpanded ? 'px-4' : 'px-0 justify-center'}`}>
        <div className="p-1.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg shadow-lg shadow-teal-900/50">
          <IconSparkles className="w-5 h-5 text-white" />
        </div>
        {sidebarExpanded && (
          <h1 className="ml-3 text-lg font-light text-white tracking-tight">
            ZenGen <span className="font-semibold">AI</span>
          </h1>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;

            return (
              <li key={item.id}>
                <button
                  onClick={() => navigateTo(item.id as NavSectionId)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-400 border-r-2 border-teal-500'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  } ${!sidebarExpanded ? 'justify-center' : ''}`}
                  title={!sidebarExpanded ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-teal-400'}`} />
                  {sidebarExpanded && (
                    <span className={`text-sm font-medium ${isActive ? 'text-teal-400' : ''}`}>
                      {item.label}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-slate-800 p-2">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-500 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all"
          title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarExpanded ? (
            <>
              <IconChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          ) : (
            <IconChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
