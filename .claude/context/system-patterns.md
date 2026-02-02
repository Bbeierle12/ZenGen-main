---
created: 2026-02-02T12:02:24Z
last_updated: 2026-02-02T20:47:02Z
version: 1.1
author: Claude Code PM System
---

# System Patterns

## Architecture Style

The application follows a **component-based architecture** with a clear separation between:
- **UI Layer** (`components/`) - React functional components with hooks
- **Service Layer** (`services/`) - Business logic and external integrations
- **State Management** - React `useState`/`useEffect` with props drilling

## Key Design Patterns

### 1. Service Pattern
Services encapsulate external integrations and complex logic:

```typescript
// geminiService.ts - AI integration
export const generateMeditationScript = async (config: MeditationConfig) => {...}
export const generateMeditationAudio = async (text: string, voice: VoiceName) => {...}

// storageService.ts - Data persistence
export const getUserStats = (): UserStats => {...}
export const saveSessionCompletion = (session: SessionData) => {...}
```

### 2. Engine/Manager Pattern
`SoundscapeEngine` manages complex audio state:

```typescript
class SoundscapeEngine {
  private ctx: AudioContext;
  private nodes: AudioNode[] = [];

  play(type: SoundscapeType) {...}
  stop() {...}
  playBell(type: 'chime' | 'bowl' | 'soft') {...}
  playBreathCue(type: 'inhale' | 'exhale', duration: number) {...}
}
```

### 3. Enum-Driven Configuration
TypeScript enums define valid options throughout:

```typescript
enum VoiceName { Kore, Puck, Charon, Fenrir, Zephyr }
enum SoundscapeType { NONE, RAIN, OCEAN, WIND, DRONE_LOW, ... }
enum MeditationTechnique { MINDFULNESS, BODY_SCAN, ... }
```

### 4. State Machine Pattern
Generation status follows a state machine:

```typescript
type Step = 'idle' | 'script' | 'audio' | 'complete';
const [status, setStatus] = useState<GenerationState>({ step: 'idle', error: null });
```

### 5. Ref Pattern for Audio
Audio contexts and nodes are managed via refs to avoid re-initialization:

```typescript
const audioContextRef = useRef<AudioContext | null>(null);
const soundscapeRef = useRef<SoundscapeEngine | null>(null);
```

## Data Flow

```
User Input
    ↓
App.tsx (state management)
    ↓
Service Layer (API calls, audio, storage)
    ↓
External APIs (Gemini) / Browser APIs (Web Audio, localStorage)
    ↓
State Update → Re-render
```

## Component Communication

- **Props down**: Parent components pass data and callbacks to children
- **Callbacks up**: Children invoke parent callbacks for actions
- **No global state**: All state originates from App.tsx

## Error Handling Pattern

### Service Layer
Errors are captured at the service layer with timeout handling:

```typescript
// Timeout wrapper for API calls
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), ms)
  );
  return Promise.race([promise, timeout]);
};
```

### Component Layer
Errors bubble up and are displayed to users:

```typescript
try {
  const script = await generateMeditationScript(config);
  // ...
} catch (e: any) {
  setStatus({ step: 'idle', error: e.message || "Something went wrong." });
}
```

### Error Boundaries
React ErrorBoundary components catch rendering errors:

```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

## Animation Pattern

Canvas animations use requestAnimationFrame with cleanup:

```typescript
useEffect(() => {
  animationFrameRef.current = requestAnimationFrame(drawVisualizer);
  return () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };
});
```

## Audio Processing Chain

```
Sound Source (Oscillator/Noise/Buffer)
    ↓
Filter (BiquadFilter)
    ↓
Individual Gain
    ↓
Master Gain
    ↓
Global Analyser
    ↓
AudioContext.destination (speakers)
```
