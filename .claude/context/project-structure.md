---
created: 2026-02-02T12:02:24Z
last_updated: 2026-02-02T22:03:31Z
version: 1.2
author: Claude Code PM System
---

# Project Structure

## Directory Layout

```
ZenGen-main/
├── .gitignore
├── index.html              # App entry point HTML
├── index.tsx               # React entry point
├── App.tsx                 # Main application component
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
│   ├── Navbar.tsx          # Navigation bar
│   ├── ProfileModal.tsx    # User profile panel
│   └── SessionPlayer.tsx   # Meditation player UI
│
├── services/               # Business logic layer
│   ├── claudeService.ts    # Anthropic Claude AI integration
│   ├── soundscapeService.ts # Web Audio soundscapes
│   ├── storageService.ts   # localStorage management
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
- `storageService.ts` - User data CRUD operations
- `audioUtils.ts` - Base64 decoding and audio buffer creation

### Components
- `BreathingPlayer.tsx` - Full-featured breathing exercise UI (~550 lines)
- `ProfileModal.tsx` - Settings and profile management (~330 lines)
- `App.tsx` - Main layout and state management (~530 lines)
- `Navbar.tsx` - Top navigation with tab switching
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
