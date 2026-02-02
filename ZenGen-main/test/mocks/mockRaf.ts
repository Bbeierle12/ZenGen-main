import { vi } from 'vitest';

type RafCallback = (timestamp: number) => void;

interface PendingCallback {
  id: number;
  callback: RafCallback;
}

let nextId = 1;
let pendingCallbacks: PendingCallback[] = [];
let currentTime = 0;

/**
 * Mock requestAnimationFrame that allows deterministic control
 */
export function mockRaf(callback: RafCallback): number {
  const id = nextId++;
  pendingCallbacks.push({ id, callback });
  return id;
}

/**
 * Cancel a pending animation frame callback
 */
export function mockCancelRaf(id: number): void {
  pendingCallbacks = pendingCallbacks.filter(cb => cb.id !== id);
}

/**
 * Flush all pending RAF callbacks
 * @param advanceTime - Time to advance in ms (default: 16.67ms = ~60fps)
 */
export function flushRafCallbacks(advanceTime: number = 16.67): void {
  currentTime += advanceTime;
  const callbacksToRun = [...pendingCallbacks];
  pendingCallbacks = [];

  for (const { callback } of callbacksToRun) {
    callback(currentTime);
  }
}

/**
 * Run a specific number of animation frames
 */
export function runRafFrames(count: number, frameTime: number = 16.67): void {
  for (let i = 0; i < count; i++) {
    flushRafCallbacks(frameTime);
  }
}

/**
 * Get the current mock time
 */
export function getRafTime(): number {
  return currentTime;
}

/**
 * Get the count of pending callbacks
 */
export function getPendingRafCount(): number {
  return pendingCallbacks.length;
}

/**
 * Reset the RAF mock to initial state
 */
export function resetRaf(): void {
  nextId = 1;
  pendingCallbacks = [];
  currentTime = 0;
}

/**
 * Get all pending callback IDs (for debugging)
 */
export function getPendingRafIds(): number[] {
  return pendingCallbacks.map(cb => cb.id);
}
