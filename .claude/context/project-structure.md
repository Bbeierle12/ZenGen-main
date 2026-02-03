---
created: 2026-02-02T12:02:24Z
last_updated: 2026-02-03T00:40:11Z
version: 1.3
author: Claude Code PM System
---

# Project Structure

## Directory Layout

```
ZenGen-main/
├── .gitignore
├── .env                    # Environment variables (VITE_ANTHROPIC_API_KEY)
├── index.html              # App entry point HTML
├── index.tsx               # React entry point
├── App.tsx                 # Main application component (~700 lines)
├── types.ts                # TypeScript type definitions
├── metadata.json           # App metadata
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
├── README.md               # Setup instructions
│
├── components/             # React UI components
│   ├── ApiKeyGuard.tsx     # API key validation
│   ├── BreathingPlayer.tsx # Breathing exercise UI
│   ├── ChatBot.tsx         # AI chat assistant
│   ├── ErrorBoundary.tsx   # Error boundary for graceful recovery
│   ├── Icons.tsx           # SVG icon components
│   ├── Loader.tsx          # Loading state component
│   ├── Navbar.tsx          # Navigation bar (Quick Start / Custom tabs)
│   ├── PresetCard.tsx      # Meditation preset card component
│   ├── PresetBuilder.tsx   # Custom preset builder form
│   ├── ProfileModal.tsx    # User profile panel
│   └── SessionPlayer.tsx   # Meditation player UI
│
├── services/               # Business logic layer
│   ├── claudeService.ts    # Anthropic Claude AI integration
│   ├── soundscapeService.ts # Web Audio soundscapes
│   ├── storageService.ts   # localStorage management (stats, presets, breathing)
│   └── audioUtils.ts       # Audio decoding utilities
│
└── node_modules/           # Dependencies (not tracked)
```

## Key Files

### Entry Points
- `index.html` - HTML shell with root div
- `index.tsx` - React DOM render entry
- `App.tsx` - Main component with routing logic

### Type Definitions
- `types.ts` - All TypeScript interfaces and enums:
  - `VoiceName`, `SoundscapeType`, `MeditationTechnique`, `GuidanceLevel`
  - `MeditationConfig`, `SessionData`, `UserStats`, `UserPreferences`
  - `BreathingPattern`, `BreathPhase`, `ChatMessage`, `GenerationState`

### Services
- `claudeService.ts` - Anthropic Claude API for script generation + Web Speech TTS fallback
- `soundscapeService.ts` - `SoundscapeEngine` class for all audio
- `storageService.ts` - User data CRUD: stats, meditation presets, custom breathing patterns
- `audioUtils.ts` - Base64 decoding and audio buffer creation

### Components
- `BreathingPlayer.tsx` - Full-featured breathing exercise UI (~550 lines)
- `ProfileModal.tsx` - Settings and profile management (~330 lines)
- `App.tsx` - Main layout and state management (~700 lines)
- `Navbar.tsx` - Top navigation with "Quick Start" / "Custom" tabs
- `PresetCard.tsx` - Meditation preset display with select/delete
- `PresetBuilder.tsx` - Form for creating custom meditation presets
- `SessionPlayer.tsx` - Meditation playback UI

## File Naming Conventions

- Components: PascalCase (`BreathingPlayer.tsx`)
- Services: camelCase (`claudeService.ts`)
- Types: `types.ts` (single file)
- Config files: lowercase (`package.json`, `tsconfig.json`)

## Module Organization

The project follows a feature-based organization:
- UI logic in `components/`
- Business logic in `services/`
- Types centralized in root `types.ts`
- No routing library (tab-based navigation in App.tsx)
