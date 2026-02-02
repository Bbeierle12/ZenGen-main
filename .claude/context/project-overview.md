---
created: 2026-02-02T12:02:24Z
last_updated: 2026-02-02T12:02:24Z
version: 1.0
author: Claude Code PM System
---

# Project Overview: ZenGen AI

## Application Summary

ZenGen AI is a React-based web application that combines AI-generated meditation content with interactive breathing exercises. It uses Google's Gemini AI for script generation and text-to-speech, with a sophisticated Web Audio API implementation for soundscapes.

## Key Features

### 1. AI-Powered Meditation Generator
- Custom topic input for personalized sessions
- Multiple meditation techniques (Mindfulness, Body Scan, Visualization, etc.)
- Adjustable guidance levels and duration
- Multiple AI voice options (Kore, Puck, Charon, Fenrir, Zephyr)
- Ambient soundscape selection

### 2. Breathing Exercise Player
- Pre-built patterns: Box (4-4-4-4), Relaxing (4-7-8), Resonance (6-6), Triangle (5-5-5)
- Custom pattern builder with adjustable phase durations
- Real-time visual feedback with audio-reactive orb animation
- Audio cues: transition bells, breath sounds, haptic feedback
- Session timer and pause/resume controls

### 3. User Profile System
- Session history tracking
- Streak counter for daily practice
- Level progression system (Novice → Master)
- Customizable default preferences
- Data export/import functionality

### 4. Soundscape Engine
- Procedurally generated ambient sounds
- Options: Rain, Ocean Waves, Forest Wind, Drones, Crystal Bowl
- Volume control independent of voice
- Real-time audio visualization

## Current State

- **Version**: 1.2.0 (as noted in ProfileModal)
- **Status**: Functional MVP
- **Last Commit**: Initial project setup with core services

## Integration Points

- **Google Gemini AI**: Script generation and TTS
- **Web Audio API**: All audio processing and synthesis
- **localStorage**: User data persistence
- **Vite**: Development server and build tooling
