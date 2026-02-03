import { NavItem, NavSectionId, NavPageId } from '../types';
import { IconSparkles, IconBook, IconChart, IconBookOpen, IconSettings } from '../components/Icons';

/**
 * Main navigation items for the sidebar and bottom nav
 */
export const NAV_ITEMS: NavItem[] = [
  {
    id: 'meditations',
    label: 'Meditations',
    icon: IconSparkles,
    defaultPage: 'presets',
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: IconBook,
    defaultPage: 'entries',
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: IconChart,
    defaultPage: 'overview',
  },
  {
    id: 'learn',
    label: 'Learn',
    icon: IconBookOpen,
    defaultPage: 'articles',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: IconSettings,
    defaultPage: 'profile',
  },
];

/**
 * Sub-pages for each section (used for secondary navigation)
 */
export const SECTION_PAGES: Record<NavSectionId, { id: NavPageId; label: string }[]> = {
  meditations: [
    { id: 'presets', label: 'Quick Start' },
    { id: 'custom', label: 'Custom' },
    { id: 'breathing', label: 'Breathing' },
    { id: 'timer', label: 'Timer' },
  ],
  journal: [
    { id: 'entries', label: 'Entries' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'mood-log', label: 'Mood Log' },
    { id: 'insights', label: 'Insights' },
  ],
  progress: [
    { id: 'overview', label: 'Overview' },
    { id: 'stats', label: 'Statistics' },
    { id: 'achievements', label: 'Achievements' },
  ],
  learn: [
    { id: 'articles', label: 'Articles' },
    { id: 'techniques', label: 'Techniques' },
    { id: 'tips', label: 'Tips' },
  ],
  settings: [
    { id: 'profile', label: 'Profile' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'data', label: 'Data' },
  ],
};

/**
 * Storage key for persisting sidebar collapsed state
 */
export const NAV_STORAGE_KEY = 'zengen_nav_state';
