import React from 'react';
import { useNav } from '../../contexts/NavContext';
import { EntriesView } from './EntriesView';
import { CalendarView } from './CalendarView';
import { MoodLogView } from './MoodLogView';
import { IconBook, IconClock, IconSparkles } from '../../components/Icons';
import { NavPageId } from '../../types';

const SUB_PAGES = [
  { id: 'entries' as NavPageId, label: 'Entries', icon: IconBook },
  { id: 'calendar' as NavPageId, label: 'Calendar', icon: IconClock },
  { id: 'mood-log' as NavPageId, label: 'Mood', icon: IconSparkles },
];

export const JournalPage: React.FC = () => {
  const { state, navigateTo } = useNav();
  const currentPage = state.page || 'entries';

  const renderContent = () => {
    switch (currentPage) {
      case 'entries':
        return <EntriesView />;
      case 'calendar':
        return <CalendarView />;
      case 'mood-log':
        return <MoodLogView />;
      default:
        return <EntriesView />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Mobile Sub-navigation */}
      {state.isMobile && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {SUB_PAGES.map((page) => {
            const Icon = page.icon;
            const isActive = currentPage === page.id;
            return (
              <button
                key={page.id}
                onClick={() => navigateTo('journal', page.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {page.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Page Content */}
      {renderContent()}
    </div>
  );
};

export default JournalPage;
