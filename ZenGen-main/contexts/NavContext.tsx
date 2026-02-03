import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { NavState, NavSectionId, NavPageId } from '../types';
import { NAV_ITEMS, NAV_STORAGE_KEY } from '../config/navigation';
import { useIsMobile } from '../hooks/useMediaQuery';

interface NavContextValue {
  state: NavState;
  navigateTo: (section: NavSectionId, page?: NavPageId | null) => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  // Backward compatibility with existing tab system
  activeTab: 'presets' | 'custom';
  setActiveTab: (tab: 'presets' | 'custom') => void;
}

const NavContext = createContext<NavContextValue | null>(null);

interface NavProviderProps {
  children: React.ReactNode;
}

/**
 * Load persisted sidebar state from localStorage
 */
const loadSidebarState = (): boolean => {
  try {
    const stored = localStorage.getItem(NAV_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.sidebarExpanded ?? true;
    }
  } catch (e) {
    console.error('Failed to load nav state:', e);
  }
  return true; // Default to expanded
};

/**
 * Persist sidebar state to localStorage
 */
const saveSidebarState = (expanded: boolean): void => {
  try {
    localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ sidebarExpanded: expanded }));
  } catch (e) {
    console.error('Failed to save nav state:', e);
  }
};

export const NavProvider: React.FC<NavProviderProps> = ({ children }) => {
  const isMobile = useIsMobile();

  const [state, setState] = useState<NavState>(() => ({
    section: 'meditations',
    page: 'presets',
    sidebarExpanded: loadSidebarState(),
    isMobile: false, // Will be updated by effect
  }));

  // Update isMobile state when viewport changes
  useEffect(() => {
    setState(prev => ({ ...prev, isMobile }));
  }, [isMobile]);

  /**
   * Navigate to a section and optionally a specific page
   */
  const navigateTo = useCallback((section: NavSectionId, page?: NavPageId | null) => {
    setState(prev => {
      // If no page specified, use the section's default page
      const navItem = NAV_ITEMS.find(item => item.id === section);
      const targetPage = page !== undefined ? page : (navItem?.defaultPage ?? null);

      return {
        ...prev,
        section,
        page: targetPage,
      };
    });
  }, []);

  /**
   * Toggle sidebar expanded/collapsed state
   */
  const toggleSidebar = useCallback(() => {
    setState(prev => {
      const newExpanded = !prev.sidebarExpanded;
      saveSidebarState(newExpanded);
      return { ...prev, sidebarExpanded: newExpanded };
    });
  }, []);

  /**
   * Explicitly set sidebar expanded state
   */
  const setSidebarExpanded = useCallback((expanded: boolean) => {
    setState(prev => {
      saveSidebarState(expanded);
      return { ...prev, sidebarExpanded: expanded };
    });
  }, []);

  /**
   * Backward compatibility: Map state to activeTab
   * 'presets' and 'custom' map to the meditations section pages
   */
  const activeTab = useMemo((): 'presets' | 'custom' => {
    if (state.section === 'meditations') {
      if (state.page === 'custom') return 'custom';
    }
    return 'presets';
  }, [state.section, state.page]);

  /**
   * Backward compatibility: setActiveTab navigates within meditations section
   */
  const setActiveTab = useCallback((tab: 'presets' | 'custom') => {
    navigateTo('meditations', tab);
  }, [navigateTo]);

  const value = useMemo<NavContextValue>(() => ({
    state,
    navigateTo,
    toggleSidebar,
    setSidebarExpanded,
    activeTab,
    setActiveTab,
  }), [state, navigateTo, toggleSidebar, setSidebarExpanded, activeTab, setActiveTab]);

  return (
    <NavContext.Provider value={value}>
      {children}
    </NavContext.Provider>
  );
};

/**
 * Hook to access navigation context
 */
export const useNav = (): NavContextValue => {
  const context = useContext(NavContext);
  if (!context) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return context;
};

/**
 * Hook for backward compatibility with existing tab-based navigation
 */
export const useActiveTab = (): { activeTab: 'presets' | 'custom'; setActiveTab: (tab: 'presets' | 'custom') => void } => {
  const { activeTab, setActiveTab } = useNav();
  return { activeTab, setActiveTab };
};
