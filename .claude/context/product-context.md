---
created: 2026-02-02T12:02:24Z
last_updated: 2026-02-02T12:02:24Z
version: 1.0
author: Claude Code PM System
---

# Product Context

## User Personas

### Primary: The Mindfulness Seeker
- Wants personalized meditation experiences
- Values variety in guided content
- Appreciates customization options
- Tracks progress for motivation

### Secondary: The Breathing Practitioner
- Uses breathing exercises for stress relief
- Wants quick-start preset patterns
- May create custom breathing rhythms
- Values audio/visual feedback

## Core Features

### 1. Meditation Session Generator
**User Need**: Create unique, personalized meditation sessions

**Functionality**:
- Enter custom topic (e.g., "Relieving Anxiety", "Focus for Work")
- Select meditation technique
- Adjust duration (1-10 minutes)
- Choose voice guide and ambient soundscape
- AI generates script → TTS converts to audio

### 2. Breathing Exercise Player
**User Need**: Guided breathing with clear visual/audio cues

**Functionality**:
- Pre-built patterns (Box, Relaxing, Resonance, Triangle)
- Custom pattern builder (Inhale/Hold/Exhale/Sustain timings)
- Audio-reactive visual orb that expands/contracts with breath
- Transition bells, breath sounds, haptic feedback options
- Session timer and controls

### 3. Progress Tracking
**User Need**: Motivation through visible progress

**Functionality**:
- Session history with topics and durations
- Daily streak counter (consecutive days)
- Total minutes tracked
- Level progression (Novice → Seeker → Practitioner → Guide → Master)

### 4. User Preferences
**User Need**: Remember settings between sessions

**Functionality**:
- Default meditation settings (duration, voice, soundscape, technique)
- Display name customization
- Data export/import (JSON backup)
- Clear all data option

## User Flows

### Generate Meditation
1. User enters topic in "Create Session" form
2. Adjusts settings (duration, technique, voice, soundscape)
3. Clicks "Start Meditation"
4. Loading: "Writing your guided journey..." → "Recording your personal guide..."
5. SessionPlayer opens with generated content
6. User plays/pauses session with ambient sound
7. Session completes, stats update

### Start Breathing Exercise
1. User clicks "Meditations" tab or selects preset from sidebar
2. Chooses preset pattern OR builds custom pattern
3. BreathingPlayer opens full-screen
4. User adjusts settings (bell, breath sound, ambience)
5. Presses play, follows visual orb guidance
6. Can pause/reset as needed

### View Profile
1. User clicks profile icon in navbar
2. ProfileModal slides in from right
3. Profile tab: View level, stats, session history
4. Settings tab: Adjust defaults, export/import data

## Feature Priorities

1. **Must Have**: Meditation generation, breathing exercises, basic persistence
2. **Should Have**: Progress tracking, user preferences, multiple soundscapes
3. **Nice to Have**: Haptic feedback, data export, level system
4. **Future**: Offline mode, guided programs, social features
