import { vi, beforeAll, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock localStorage
import { mockLocalStorage } from './mocks/mockLocalStorage';

// Mock AudioContext and related Web Audio APIs
import { MockAudioContext, MockAnalyserNode, MockGainNode, MockOscillatorNode, MockBiquadFilterNode, MockAudioBufferSourceNode } from './mocks/mockAudioContext';

// Mock requestAnimationFrame
import { mockRaf, flushRafCallbacks, resetRaf } from './mocks/mockRaf';

// Mock Canvas 2D context
import { mockCanvas } from './mocks/mockCanvas';

beforeAll(() => {
  // Use fake timers for deterministic time control
  vi.useFakeTimers();

  // Setup localStorage mock
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage(),
    writable: true,
  });

  // Setup AudioContext mock
  Object.defineProperty(window, 'AudioContext', {
    value: MockAudioContext,
    writable: true,
  });
  Object.defineProperty(window, 'webkitAudioContext', {
    value: MockAudioContext,
    writable: true,
  });

  // Setup requestAnimationFrame mock
  const cancelRaf = vi.fn((id: number) => {
    // No-op for mock
  });
  Object.defineProperty(window, 'requestAnimationFrame', {
    value: mockRaf,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    value: cancelRaf,
    writable: true,
    configurable: true,
  });
  // Also define on global for Node.js context
  global.requestAnimationFrame = mockRaf as any;
  global.cancelAnimationFrame = cancelRaf as any;

  // Mock Canvas 2D context
  HTMLCanvasElement.prototype.getContext = function (contextId: string) {
    if (contextId === '2d') {
      return mockCanvas();
    }
    return null;
  } as any;

  // Mock window.alert
  window.alert = vi.fn();

  // Mock window.confirm
  window.confirm = vi.fn(() => true);

  // Mock window.matchMedia for responsive hooks
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false, // Default to desktop view (not mobile)
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock navigator.vibrate
  Object.defineProperty(navigator, 'vibrate', {
    value: vi.fn(() => true),
    writable: true,
  });

  // Mock speechSynthesis
  const mockSpeechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => [
      { lang: 'en-US', name: 'Test Voice', voiceURI: 'test', localService: true, default: true },
    ]),
    speaking: false,
    paused: false,
    pending: false,
    onvoiceschanged: null,
  };
  Object.defineProperty(window, 'speechSynthesis', {
    value: mockSpeechSynthesis,
    writable: true,
  });

  // Mock SpeechSynthesisUtterance
  (window as any).SpeechSynthesisUtterance = vi.fn().mockImplementation((text?: string) => ({
    text: text || '',
    lang: '',
    voice: null,
    volume: 1,
    rate: 1,
    pitch: 1,
    onend: null,
    onerror: null,
    onstart: null,
    onpause: null,
    onresume: null,
    onmark: null,
    onboundary: null,
  }));

  // Mock fetch for API tests
  global.fetch = vi.fn();

  // Mock Element.prototype.scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();

  // Mock process.env
  vi.stubEnv('API_KEY', 'test-api-key');
  vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key-12345678901234567890');
});

afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks();

  // Reset RAF callbacks
  resetRaf();

  // Clear localStorage
  window.localStorage.clear();

  // Reset timers
  vi.clearAllTimers();
});

// Export utilities for tests
export { flushRafCallbacks, resetRaf };
