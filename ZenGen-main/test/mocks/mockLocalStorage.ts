import { vi } from 'vitest';

interface MockLocalStorageOptions {
  quotaExceeded?: boolean;
  maxSize?: number;
}

/**
 * Creates an in-memory localStorage mock with configurable options
 */
export function mockLocalStorage(options: MockLocalStorageOptions = {}): Storage {
  let store: Record<string, string> = {};
  let quotaExceeded = options.quotaExceeded || false;
  const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default

  const getCurrentSize = () => {
    return Object.entries(store).reduce((acc, [key, value]) => {
      return acc + key.length + value.length;
    }, 0);
  };

  return {
    getItem: vi.fn((key: string) => {
      return store[key] ?? null;
    }),

    setItem: vi.fn((key: string, value: string) => {
      if (quotaExceeded || getCurrentSize() + key.length + value.length > maxSize) {
        const error = new DOMException('QuotaExceededError', 'QuotaExceededError');
        throw error;
      }
      store[key] = String(value);
    }),

    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),

    clear: vi.fn(() => {
      store = {};
    }),

    get length() {
      return Object.keys(store).length;
    },

    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    }),

    // Test utilities (not part of Storage interface)
    _setQuotaExceeded: (value: boolean) => {
      quotaExceeded = value;
    },

    _getStore: () => ({ ...store }),

    _setStore: (newStore: Record<string, string>) => {
      store = { ...newStore };
    },
  } as Storage & {
    _setQuotaExceeded: (value: boolean) => void;
    _getStore: () => Record<string, string>;
    _setStore: (newStore: Record<string, string>) => void;
  };
}

/**
 * Type for accessing mock utilities
 */
export type MockStorage = ReturnType<typeof mockLocalStorage>;
