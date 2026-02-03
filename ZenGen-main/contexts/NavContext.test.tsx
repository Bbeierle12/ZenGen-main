import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NavProvider, useNav, useActiveTab } from './NavContext';
import React from 'react';

// Mock the useIsMobile hook
vi.mock('../hooks/useMediaQuery', () => ({
  useIsMobile: vi.fn(() => false),
}));

describe('NavContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NavProvider>{children}</NavProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('useNav hook', () => {
    it('should throw error when used outside NavProvider', () => {
      // Suppress console error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useNav());
      }).toThrow('useNav must be used within a NavProvider');

      consoleSpy.mockRestore();
    });

    it('should return initial state', () => {
      const { result } = renderHook(() => useNav(), { wrapper });

      expect(result.current.state.section).toBe('meditations');
      expect(result.current.state.page).toBe('presets');
      expect(result.current.state.sidebarExpanded).toBe(true);
    });

    it('should navigate to different section', () => {
      const { result } = renderHook(() => useNav(), { wrapper });

      act(() => {
        result.current.navigateTo('journal');
      });

      expect(result.current.state.section).toBe('journal');
      expect(result.current.state.page).toBe('entries'); // default page
    });

    it('should navigate to specific page', () => {
      const { result } = renderHook(() => useNav(), { wrapper });

      act(() => {
        result.current.navigateTo('meditations', 'custom');
      });

      expect(result.current.state.section).toBe('meditations');
      expect(result.current.state.page).toBe('custom');
    });

    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useNav(), { wrapper });

      expect(result.current.state.sidebarExpanded).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.state.sidebarExpanded).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.state.sidebarExpanded).toBe(true);
    });

    it('should set sidebar expanded state directly', () => {
      const { result } = renderHook(() => useNav(), { wrapper });

      act(() => {
        result.current.setSidebarExpanded(false);
      });

      expect(result.current.state.sidebarExpanded).toBe(false);

      act(() => {
        result.current.setSidebarExpanded(true);
      });

      expect(result.current.state.sidebarExpanded).toBe(true);
    });

    it('should persist sidebar state to localStorage', () => {
      const { result } = renderHook(() => useNav(), { wrapper });

      act(() => {
        result.current.toggleSidebar();
      });

      expect(localStorage.getItem('zengen_nav_state')).toBe(
        JSON.stringify({ sidebarExpanded: false })
      );
    });
  });

  describe('backward compatibility', () => {
    it('should provide activeTab for presets page', () => {
      const { result } = renderHook(() => useNav(), { wrapper });

      expect(result.current.activeTab).toBe('presets');
    });

    it('should provide activeTab for custom page', () => {
      const { result } = renderHook(() => useNav(), { wrapper });

      act(() => {
        result.current.navigateTo('meditations', 'custom');
      });

      expect(result.current.activeTab).toBe('custom');
    });

    it('should default to presets for other sections', () => {
      const { result } = renderHook(() => useNav(), { wrapper });

      act(() => {
        result.current.navigateTo('journal');
      });

      expect(result.current.activeTab).toBe('presets');
    });

    it('should navigate via setActiveTab', () => {
      const { result } = renderHook(() => useNav(), { wrapper });

      act(() => {
        result.current.setActiveTab('custom');
      });

      expect(result.current.state.section).toBe('meditations');
      expect(result.current.state.page).toBe('custom');
    });
  });

  describe('useActiveTab hook', () => {
    it('should return activeTab and setActiveTab', () => {
      const { result } = renderHook(() => useActiveTab(), { wrapper });

      expect(result.current.activeTab).toBe('presets');
      expect(typeof result.current.setActiveTab).toBe('function');
    });

    it('should switch between presets and custom', () => {
      const { result } = renderHook(() => useActiveTab(), { wrapper });

      act(() => {
        result.current.setActiveTab('custom');
      });

      expect(result.current.activeTab).toBe('custom');

      act(() => {
        result.current.setActiveTab('presets');
      });

      expect(result.current.activeTab).toBe('presets');
    });
  });
});
