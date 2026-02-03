import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from './useMediaQuery';

describe('useMediaQuery', () => {
  let addEventListenerMock: ReturnType<typeof vi.fn>;
  let removeEventListenerMock: ReturnType<typeof vi.fn>;
  let matchesMock: boolean;

  const createMatchMediaMock = (matches: boolean) => {
    matchesMock = matches;
    addEventListenerMock = vi.fn();
    removeEventListenerMock = vi.fn();

    return vi.fn().mockImplementation((query: string) => ({
      matches: matchesMock,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      dispatchEvent: vi.fn(),
    }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useMediaQuery hook', () => {
    it('should return true when media query matches', () => {
      window.matchMedia = createMatchMediaMock(true);

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));

      expect(result.current).toBe(true);
    });

    it('should return false when media query does not match', () => {
      window.matchMedia = createMatchMediaMock(false);

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));

      expect(result.current).toBe(false);
    });

    it('should add event listener on mount', () => {
      window.matchMedia = createMatchMediaMock(false);

      renderHook(() => useMediaQuery('(max-width: 767px)'));

      expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should remove event listener on unmount', () => {
      window.matchMedia = createMatchMediaMock(false);

      const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'));
      unmount();

      expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should update when media query changes', () => {
      const mockMatchMedia = createMatchMediaMock(false);
      window.matchMedia = mockMatchMedia;

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));

      expect(result.current).toBe(false);

      // Simulate media query change
      const changeHandler = addEventListenerMock.mock.calls[0][1];
      act(() => {
        changeHandler({ matches: true });
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useIsMobile hook', () => {
    it('should return true for mobile viewport', () => {
      window.matchMedia = createMatchMediaMock(true);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
      expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    });

    it('should return false for desktop viewport', () => {
      window.matchMedia = createMatchMediaMock(false);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });
  });

  describe('useIsTablet hook', () => {
    it('should return true for tablet viewport', () => {
      window.matchMedia = createMatchMediaMock(true);

      const { result } = renderHook(() => useIsTablet());

      expect(result.current).toBe(true);
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px) and (max-width: 1023px)');
    });

    it('should return false for non-tablet viewport', () => {
      window.matchMedia = createMatchMediaMock(false);

      const { result } = renderHook(() => useIsTablet());

      expect(result.current).toBe(false);
    });
  });

  describe('useIsDesktop hook', () => {
    it('should return true for desktop viewport', () => {
      window.matchMedia = createMatchMediaMock(true);

      const { result } = renderHook(() => useIsDesktop());

      expect(result.current).toBe(true);
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
    });

    it('should return false for non-desktop viewport', () => {
      window.matchMedia = createMatchMediaMock(false);

      const { result } = renderHook(() => useIsDesktop());

      expect(result.current).toBe(false);
    });
  });
});
