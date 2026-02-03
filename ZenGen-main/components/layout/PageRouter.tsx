import React from 'react';
import { useNav } from '../../contexts/NavContext';
import { JournalPage } from '../../pages/journal/JournalPage';

interface PageRouterProps {
  children: React.ReactNode; // Meditations content (existing App content)
}

/**
 * Routes to the appropriate section content based on navigation state.
 * Meditations section shows existing content.
 * Journal section shows JournalPage.
 * Other sections show "Coming Soon" placeholders.
 */
export const PageRouter: React.FC<PageRouterProps> = ({ children }) => {
  const { state } = useNav();
  const { section } = state;

  // Meditations section - render existing content
  if (section === 'meditations') {
    return <>{children}</>;
  }

  // Journal section - render JournalPage
  if (section === 'journal') {
    return <JournalPage />;
  }

  // Other sections - Coming Soon placeholder
  return <ComingSoonPlaceholder section={section} />;
};

interface PlaceholderProps {
  section: string;
}

const ComingSoonPlaceholder: React.FC<PlaceholderProps> = ({ section }) => {
  const sectionInfo: Record<string, { icon: string; title: string; description: string }> = {
    journal: {
      icon: '📔',
      title: 'Journal',
      description: 'Track your meditation journey, log your mood, and reflect on your practice.',
    },
    progress: {
      icon: '📊',
      title: 'Progress',
      description: 'View your meditation statistics, streaks, and unlock achievements.',
    },
    learn: {
      icon: '📚',
      title: 'Learn',
      description: 'Discover meditation techniques, tips, and deepen your practice.',
    },
    settings: {
      icon: '⚙️',
      title: 'Settings',
      description: 'Customize your preferences, manage your profile, and export your data.',
    },
  };

  const info = sectionInfo[section] || {
    icon: '🔮',
    title: section.charAt(0).toUpperCase() + section.slice(1),
    description: 'This section is coming soon.',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-6xl mb-6">{info.icon}</div>
      <h2 className="text-2xl font-semibold text-white mb-3">{info.title}</h2>
      <p className="text-slate-400 max-w-md mb-6">{info.description}</p>
      <div className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full">
        <span className="text-sm text-teal-400 font-medium">Coming Soon</span>
      </div>
    </div>
  );
};
