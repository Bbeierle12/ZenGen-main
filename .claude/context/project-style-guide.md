---
created: 2026-02-02T12:02:24Z
last_updated: 2026-02-02T12:02:24Z
version: 1.0
author: Claude Code PM System
---

# Project Style Guide

## TypeScript Conventions

### Type Definitions
- Use `interface` for object shapes
- Use `type` for unions and complex types
- Use `enum` for fixed sets of values
- Export all types from `types.ts`

```typescript
// Enums for fixed options
export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
}

// Interfaces for data structures
export interface MeditationConfig {
  topic: string;
  durationMinutes: number;
  voice: VoiceName;
}
```

### Naming Conventions
- Components: PascalCase (`BreathingPlayer`)
- Functions: camelCase (`handleGenerate`)
- Constants: UPPER_SNAKE_CASE (`BREATHING_PATTERNS`)
- Types/Interfaces: PascalCase (`UserStats`)
- Files: Match export name (`BreathingPlayer.tsx`)

## React Patterns

### Functional Components with Props Interface
```typescript
interface Props {
  pattern: BreathingPattern;
  onClose: () => void;
}

export const BreathingPlayer: React.FC<Props> = ({ pattern, onClose }) => {
  // ...
};
```

### State Management
- Use `useState` for component state
- Use `useRef` for values that shouldn't trigger re-renders
- Use `useEffect` for side effects and cleanup

```typescript
const [isActive, setIsActive] = useState(false);
const audioContextRef = useRef<AudioContext | null>(null);

useEffect(() => {
  // Setup
  return () => { /* Cleanup */ };
}, [dependencies]);
```

### Event Handlers
- Prefix with `handle`: `handleGenerate`, `handleClose`
- Inline functions for simple cases, extracted for complex logic

## CSS/Styling

### Tailwind CSS Usage
- Use utility classes directly in JSX
- Group related utilities together
- Use template literals for conditional classes

```tsx
<button className={`px-4 py-2 rounded-lg transition-colors ${
  isActive
    ? 'bg-teal-500/20 text-teal-300'
    : 'bg-slate-800 text-slate-400'
}`}>
```

### Color Palette
- Background: `slate-950`, `slate-900`, `slate-800`
- Primary: `teal-500`, `teal-400`, `teal-300`
- Accent: `emerald-600`, `pink-500`, `indigo-500`
- Text: `white`, `slate-200`, `slate-400`, `slate-500`
- Error: `red-900`, `red-400`, `red-300`

### Animation Classes
- `animate-fade-in` - Entry animations
- `animate-pulse-slow` - Subtle background movement
- `transition-all`, `transition-colors` - State changes

## Code Organization

### File Structure
```
ComponentName.tsx
├── Imports (React, types, components, services)
├── Interface/Types (if local)
├── Helper functions (outside component)
├── Component function
│   ├── State declarations
│   ├── Refs
│   ├── Effects
│   ├── Event handlers
│   └── Return JSX
```

### Import Order
1. React and React libraries
2. Types and interfaces
3. Components
4. Services
5. Utilities/helpers

## Service Layer

### Function Exports
- Export individual functions, not classes (except SoundscapeEngine)
- Use descriptive names: `generateMeditationScript`, not `generate`

### Error Handling
- Throw errors with descriptive messages
- Let caller handle error display
- Log to console for debugging

```typescript
if (!apiKey) {
  throw new Error("API Key not found. Please select a key.");
}
```

## Comments

### When to Comment
- Complex algorithms (audio processing)
- Non-obvious behavior
- TODO/FIXME markers

### Style
```typescript
// Single line for brief notes

/**
 * Multi-line for function documentation
 * @param text - The meditation script text
 * @returns AudioBuffer for playback
 */
```

## Git Conventions

### Commit Messages
- Format: `type: description`
- Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`
- Example: `feat: Initialize ZenGen project with core services`

### Branch Naming
- Feature: `feat/feature-name`
- Fix: `fix/bug-description`
