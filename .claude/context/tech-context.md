---
created: 2026-02-02T12:02:24Z
last_updated: 2026-02-02T20:47:02Z
version: 1.1
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

### Type Definitions
- **@types/node** 22.14.0 - Node.js types

### AI Integration
- **@google/genai** - Google Gemini AI SDK (imported at runtime)
  - Models used:
    - `gemini-3-flash-preview` - Script generation
    - `gemini-2.5-flash-preview-tts` - Text-to-speech
    - `gemini-3-pro-preview` - Chat functionality

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
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## Environment Variables

- `GEMINI_API_KEY` or `API_KEY` - Required for AI features
- Set via `.env.local` file or AI Studio integration

## Dependencies Graph

```
App.tsx
├── services/geminiService.ts → @google/genai
├── services/soundscapeService.ts → Web Audio API
├── services/storageService.ts → localStorage
├── services/audioUtils.ts → Uint8Array/AudioBuffer
└── components/*.tsx → React
```

## Browser Compatibility

- Requires modern browser with Web Audio API support
- Uses `webkitAudioContext` fallback for Safari
- Haptics only work on supported mobile devices
- ES2022 features required (optional chaining, nullish coalescing)
