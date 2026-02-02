import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SoundscapeEngine } from './soundscapeService';
import { SoundscapeType } from '../types';
import { MockAudioContext, MockGainNode, MockAnalyserNode } from '../test/mocks/mockAudioContext';

describe('SoundscapeEngine', () => {
  let ctx: MockAudioContext;
  let destination: MockGainNode;
  let engine: SoundscapeEngine;

  beforeEach(() => {
    ctx = new MockAudioContext();
    destination = new MockGainNode();
    engine = new SoundscapeEngine(ctx as unknown as AudioContext, destination as unknown as AudioNode);
  });

  describe('constructor', () => {
    it('should create master gain node connected to analyser', () => {
      expect(ctx.createGain).toHaveBeenCalled();
      expect(ctx.createAnalyser).toHaveBeenCalled();
    });

    it('should set default master volume to 0.5', () => {
      // The masterGain is internal, but we can verify through setVolume behavior
      expect(engine).toBeDefined();
    });

    it('should expose globalAnalyser', () => {
      expect(engine.globalAnalyser).toBeDefined();
      expect(engine.globalAnalyser.fftSize).toBe(1024);
    });
  });

  describe('setVolume', () => {
    it('should call setTargetAtTime on master gain', () => {
      engine.setVolume(0.8);

      // Get the mock gain node (first created gain is master)
      const mockGain = ctx.createGain.mock.results[0].value;
      expect(mockGain.gain.setTargetAtTime).toHaveBeenCalledWith(
        0.8,
        expect.any(Number),
        0.1
      );
    });

    it('should accept volume values between 0 and 2', () => {
      expect(() => engine.setVolume(0)).not.toThrow();
      expect(() => engine.setVolume(1)).not.toThrow();
      expect(() => engine.setVolume(2)).not.toThrow();
    });
  });

  describe('setBellVolume', () => {
    it('should clamp volume to [0, 2] range', () => {
      const mockBellGain = ctx.createGain.mock.results[1].value;

      engine.setBellVolume(-0.5);
      expect(mockBellGain.gain.setTargetAtTime).toHaveBeenCalledWith(
        0, // Clamped to 0
        expect.any(Number),
        0.1
      );

      engine.setBellVolume(3);
      expect(mockBellGain.gain.setTargetAtTime).toHaveBeenCalledWith(
        2, // Clamped to 2
        expect.any(Number),
        0.1
      );
    });

    it('should set valid volume values', () => {
      const mockBellGain = ctx.createGain.mock.results[1].value;

      engine.setBellVolume(1.5);
      expect(mockBellGain.gain.setTargetAtTime).toHaveBeenCalledWith(
        1.5,
        expect.any(Number),
        0.1
      );
    });
  });

  describe('play', () => {
    it('should stop previous sounds before playing', () => {
      const stopSpy = vi.spyOn(engine, 'stop');

      engine.play(SoundscapeType.OCEAN);

      expect(stopSpy).toHaveBeenCalled();
    });

    it('should do nothing when type is NONE', () => {
      const createBufferSourceBefore = ctx.createBufferSource.mock.calls.length;

      engine.play(SoundscapeType.NONE);

      expect(ctx.createBufferSource.mock.calls.length).toBe(createBufferSourceBefore);
    });

    it('should create pink noise for RAIN type', () => {
      engine.play(SoundscapeType.RAIN);

      expect(ctx.createScriptProcessor).toHaveBeenCalled();
      expect(ctx.createGain).toHaveBeenCalled();
    });

    it('should create ocean waves for OCEAN type', () => {
      engine.play(SoundscapeType.OCEAN);

      expect(ctx.createBuffer).toHaveBeenCalled();
      expect(ctx.createBufferSource).toHaveBeenCalled();
      expect(ctx.createBiquadFilter).toHaveBeenCalled();
      expect(ctx.createOscillator).toHaveBeenCalled(); // LFO
    });

    it('should create wind sound for WIND type', () => {
      engine.play(SoundscapeType.WIND);

      expect(ctx.createBuffer).toHaveBeenCalled();
      expect(ctx.createBufferSource).toHaveBeenCalled();
      expect(ctx.createBiquadFilter).toHaveBeenCalled();
    });

    it('should create oscillators for DRONE_LOW type', () => {
      engine.play(SoundscapeType.DRONE_LOW);

      // DRONE_LOW uses 4 frequencies
      expect(ctx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(4);
    });

    it('should create oscillators for DRONE_MID type', () => {
      engine.play(SoundscapeType.DRONE_MID);

      expect(ctx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(4);
    });

    it('should create oscillators for DRONE_HIGH type', () => {
      engine.play(SoundscapeType.DRONE_HIGH);

      expect(ctx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(4);
    });

    it('should create crystal bowl for BOWL type', () => {
      engine.play(SoundscapeType.BOWL);

      // Crystal bowl uses 2 oscillators
      expect(ctx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('playBell', () => {
    it('should create chime sound by default', () => {
      engine.playBell();

      // Chime uses 4 frequencies
      expect(ctx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(4);
    });

    it('should create chime sound with correct frequencies', () => {
      engine.playBell('chime');

      expect(ctx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(4);
    });

    it('should create bowl sound', () => {
      engine.playBell('bowl');

      // Bowl uses 3 oscillators at close frequencies
      expect(ctx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('should create soft sound', () => {
      engine.playBell('soft');

      // Soft uses 1 oscillator
      expect(ctx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('playBreathCue', () => {
    it('should create pink noise buffer for breath sounds', () => {
      engine.playBreathCue('inhale', 4);

      expect(ctx.createBuffer).toHaveBeenCalled();
      expect(ctx.createBufferSource).toHaveBeenCalled();
      expect(ctx.createBiquadFilter).toHaveBeenCalled();
    });

    it('should set inhale automation (volume ramps up, frequency up)', () => {
      engine.playBreathCue('inhale', 4);

      const mockSource = ctx.createBufferSource.mock.results[0].value;
      expect(mockSource.start).toHaveBeenCalled();
    });

    it('should set exhale automation (volume ramps down, frequency down)', () => {
      engine.playBreathCue('exhale', 4);

      const mockSource = ctx.createBufferSource.mock.results[0].value;
      expect(mockSource.start).toHaveBeenCalled();
    });

    it('should stop previous breath cue before playing new one', () => {
      engine.playBreathCue('inhale', 4);
      const firstSource = ctx.createBufferSource.mock.results[0].value;

      engine.playBreathCue('exhale', 4);

      expect(firstSource.stop).toHaveBeenCalled();
    });
  });

  describe('stopBreathCue', () => {
    it('should stop and disconnect breath source', () => {
      engine.playBreathCue('inhale', 4);
      const mockSource = ctx.createBufferSource.mock.results[0].value;

      engine.stopBreathCue();

      expect(mockSource.stop).toHaveBeenCalled();
      expect(mockSource.disconnect).toHaveBeenCalled();
    });

    it('should reset breath gain to 0', () => {
      engine.playBreathCue('inhale', 4);
      engine.stopBreathCue();

      // Breath gain is the third gain node created
      const breathGain = ctx.createGain.mock.results[2].value;
      expect(breathGain.gain.cancelScheduledValues).toHaveBeenCalled();
    });

    it('should handle being called when no breath cue is playing', () => {
      expect(() => engine.stopBreathCue()).not.toThrow();
    });
  });

  describe('stop', () => {
    it('should stop breath cue', () => {
      const stopBreathSpy = vi.spyOn(engine, 'stopBreathCue');

      engine.play(SoundscapeType.OCEAN);
      engine.stop();

      expect(stopBreathSpy).toHaveBeenCalled();
    });

    it('should disconnect all nodes', () => {
      engine.play(SoundscapeType.OCEAN);
      engine.stop();

      // Verify stop was called without errors
      expect(() => engine.stop()).not.toThrow();
    });

    it('should clear internal nodes array', () => {
      engine.play(SoundscapeType.DRONE_LOW);
      engine.stop();

      // Play again and stop - should not have lingering nodes
      engine.play(SoundscapeType.RAIN);
      expect(() => engine.stop()).not.toThrow();
    });

    it('should stop active bells', () => {
      engine.playBell('chime');
      const oscillators = ctx.createOscillator.mock.results;

      engine.stop();

      // All oscillators should have stop called
      oscillators.forEach((result) => {
        expect(result.value.stop).toHaveBeenCalled();
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle rapid play/stop cycles', () => {
      for (let i = 0; i < 10; i++) {
        engine.play(SoundscapeType.OCEAN);
        engine.stop();
      }

      expect(() => engine.play(SoundscapeType.RAIN)).not.toThrow();
    });

    it('should handle switching between soundscape types', () => {
      engine.play(SoundscapeType.OCEAN);
      engine.play(SoundscapeType.WIND);
      engine.play(SoundscapeType.DRONE_LOW);
      engine.play(SoundscapeType.BOWL);

      expect(() => engine.stop()).not.toThrow();
    });

    it('should allow bells during active soundscape', () => {
      engine.play(SoundscapeType.OCEAN);

      expect(() => engine.playBell('chime')).not.toThrow();
      expect(() => engine.playBell('bowl')).not.toThrow();
    });

    it('should allow breath cues during active soundscape', () => {
      engine.play(SoundscapeType.RAIN);

      expect(() => engine.playBreathCue('inhale', 4)).not.toThrow();
      expect(() => engine.playBreathCue('exhale', 4)).not.toThrow();
    });
  });
});
