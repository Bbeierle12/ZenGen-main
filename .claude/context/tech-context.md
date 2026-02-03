---
created: 2026-02-02T12:02:24Z
last_updated: 2026-02-03T00:40:11Z
version: 1.3
author: Claude Code PM System
---

# Technical Context

## Technology Stack

### Frontend Framework
- **React** 19.2.3 - UI library
- **React DOM** 19.2.3 - DOM rendering

### Build Tools
- **Vite** 6.2.0 - Development server and bundler
- **TypeScript** 5.8.2 - Type safety
- **@vitejs/plugin-react** 5.0.0 - React HMR support

### Testing (NEW)
- **Vitest** 3.0.0 - Test runner
- **@vitest/coverage-v8** 3.0.0 - Code coverage
- **@testing-library/react** 16.0.0 - Component testing
- **@testing-library/user-event** 14.5.0 - User interaction simulation
- **@testing-library/jest-dom** 6.6.0 - DOM assertions
- **jsdom** 25.0.0 - Browser environment simulation
- **fast-check** 3.23.0 - Property-based testing

### Type Definitions
- **@types/node** 22.14.0 - Node.js types

### AI Integration
- **Anthropic Claude API** - Script generation and chat (via fetch)
  - Models used:
    - `claude-haiku-4-5-20250101` - Script generation and chat
  - Headers: `x-api-key`, `anthropic-version: 2023-06-01`
- **Web Speech API** - Text-to-speech fallback (browser native)

### Styling
- **Tailwind CSS** - Utility-first CSS (via CDN or build)
- Custom animations with `animate-fade-in`, `animate-pulse-slow`

## Runtime APIs

### Web Audio API
Heavy usage for audio synthesis and processing:
- `AudioContext` - Audio graph management
- `AnalyserNode` - Frequency data for visualization
- `OscillatorNode` - Tone generation
- `GainNode` - Volume control
- `BiquadFilterNode` - Frequency filtering
- `ScriptProcessorNode` - Pink noise generation (deprecated but functional)
- `AudioBufferSourceNode` - Sample playback

### Browser APIs
- `localStorage` - User data persistence
- `navigator.vibrate` - Haptic feedback (mobile)
- `requestAnimationFrame` - Smooth canvas animations
- `FileReader` - Data import
- `atob`/`btoa` - Base64 encoding
- `speechSynthesis` - Text-to-speech

## TypeScript Configuration

```json
{
  "target": "ES2022",
  "module": "ESNext",
  "jsx": "react-jsx",
  "moduleResolution": "bundler",
  "experimentalDecorators": true,
  "paths": { "@/*": ["./*"] }
}
```

## Development Scripts

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run preview    # Preview production build
npm test           # Run tests in watch mode
npm run test:run   # Run tests once
npm run test:coverage  # Run tests with coverage
```

## Environment Variables

- `VITE_ANTHROPIC_API_KEY` - Required for AI features (must start with `sk-`)
- Set via `.env` file (Vite requires `VITE_` prefix for browser-accessible env vars)

## Dependencies Graph

```
App.tsx
├── services/claudeService.ts → Anthropic API (fetch)
├── services/soundscapeService.ts → Web Audio API
├── services/storageService.ts → localStorage
├── services/audioUtils.ts → Uint8Array/AudioBuffer
└── components/*.tsx → React
```

## Test Structure

```
ZenGen-main/
├── test/
│   ├── vitest.setup.ts          # Global test setup
│   ├── mocks/
│   │   ├── mockLocalStorage.ts  # localStorage mock
│   │   ├── mockAudioContext.ts  # Web Audio API mocks
│   │   ├── mockRaf.ts           # requestAnimationFrame mock
│   │   ├── mockCanvas.ts        # Canvas 2D context mock
│   │   └── mockFileReader.ts    # FileReader mock
│   └── fixtures/
│       └── testData.ts          # Test data factories
├── services/*.test.ts           # Service unit tests
├── components/*.test.tsx        # Component tests
├── App.test.tsx                 # Integration tests
└── vitest.config.ts             # Test configuration
```

## Browser Compatibility

- Requires modern browser with Web Audio API support
- Uses `webkitAudioContext` fallback for Safari
- Haptics only work on supported mobile devices
- ES2022 features required (optional chaining, nullish coalescing)

## Update History
- 2026-02-03T00:40:11Z: Fixed env var naming (VITE_ prefix for Vite compatibility)
- 2026-02-02T22:03:31Z: Updated to reflect Gemini→Claude migration and new testing stack
