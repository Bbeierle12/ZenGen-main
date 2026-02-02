import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { decodeBase64, decodeAudioData } from './audioUtils';
import { MockAudioContext } from '../test/mocks/mockAudioContext';

describe('audioUtils', () => {
  describe('decodeBase64', () => {
    it('should decode valid base64 string', () => {
      // "Hello" in base64
      const base64 = 'SGVsbG8=';
      const result = decodeBase64(base64);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(5);
      expect(String.fromCharCode(...result)).toBe('Hello');
    });

    it('should decode empty base64 string', () => {
      const result = decodeBase64('');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    it('should handle binary data', () => {
      // Base64 of bytes [0, 127, 255]
      const base64 = 'AH//';
      const result = decodeBase64(base64);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(127);
      expect(result[2]).toBe(255);
    });

    it('should decode longer base64 strings', () => {
      // "Hello, World! This is a test." in base64
      const base64 = 'SGVsbG8sIFdvcmxkISBUaGlzIGlzIGEgdGVzdC4=';
      const result = decodeBase64(base64);

      expect(String.fromCharCode(...result)).toBe('Hello, World! This is a test.');
    });

    // Property-based test
    it('should preserve byte values through encode/decode roundtrip', () => {
      fc.assert(
        fc.property(
          fc.uint8Array({ minLength: 0, maxLength: 100 }),
          (bytes) => {
            // Encode bytes to base64
            const base64 = btoa(String.fromCharCode(...bytes));
            // Decode back
            const decoded = decodeBase64(base64);

            // Check length matches
            expect(decoded.length).toBe(bytes.length);

            // Check all bytes match
            for (let i = 0; i < bytes.length; i++) {
              expect(decoded[i]).toBe(bytes[i]);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('decodeAudioData', () => {
    let ctx: MockAudioContext;

    beforeEach(() => {
      ctx = new MockAudioContext();
    });

    it('should convert Int16 data to Float32 AudioBuffer', async () => {
      // Create Int16 test data (2 samples)
      const int16Data = new Int16Array([0, 16384, -16384, 32767]);
      const uint8View = new Uint8Array(int16Data.buffer);

      const buffer = await decodeAudioData(uint8View, ctx as unknown as AudioContext, 24000, 1);

      expect(buffer.numberOfChannels).toBe(1);
      expect(buffer.sampleRate).toBe(24000);
      expect(buffer.length).toBe(4);

      const channelData = buffer.getChannelData(0);
      // Check conversion: Int16 / 32768 = Float32
      expect(channelData[0]).toBeCloseTo(0, 5);
      expect(channelData[1]).toBeCloseTo(0.5, 2);
      expect(channelData[2]).toBeCloseTo(-0.5, 2);
      expect(channelData[3]).toBeCloseTo(1.0, 2);
    });

    it('should handle multi-channel audio', async () => {
      // Create interleaved stereo data (2 channels, 2 samples each)
      // Format: [L0, R0, L1, R1]
      const int16Data = new Int16Array([16384, -16384, 0, 32767]);
      const uint8View = new Uint8Array(int16Data.buffer);

      const buffer = await decodeAudioData(uint8View, ctx as unknown as AudioContext, 24000, 2);

      expect(buffer.numberOfChannels).toBe(2);
      expect(buffer.length).toBe(2); // 4 samples / 2 channels = 2 frames

      const leftChannel = buffer.getChannelData(0);
      const rightChannel = buffer.getChannelData(1);

      expect(leftChannel[0]).toBeCloseTo(0.5, 2);
      expect(rightChannel[0]).toBeCloseTo(-0.5, 2);
      expect(leftChannel[1]).toBeCloseTo(0, 5);
      expect(rightChannel[1]).toBeCloseTo(1.0, 2);
    });

    it('should use default sample rate and channels', async () => {
      const int16Data = new Int16Array([0, 16384]);
      const uint8View = new Uint8Array(int16Data.buffer);

      const buffer = await decodeAudioData(uint8View, ctx as unknown as AudioContext);

      expect(buffer.sampleRate).toBe(24000);
      expect(buffer.numberOfChannels).toBe(1);
    });

    it('should handle empty data', async () => {
      const uint8View = new Uint8Array(0);

      const buffer = await decodeAudioData(uint8View, ctx as unknown as AudioContext, 24000, 1);

      expect(buffer.length).toBe(0);
    });

    it('should convert max and min Int16 values correctly', async () => {
      // Max positive: 32767, Max negative: -32768
      const int16Data = new Int16Array([32767, -32768]);
      const uint8View = new Uint8Array(int16Data.buffer);

      const buffer = await decodeAudioData(uint8View, ctx as unknown as AudioContext, 24000, 1);
      const channelData = buffer.getChannelData(0);

      // 32767 / 32768 ≈ 0.99997
      expect(channelData[0]).toBeCloseTo(32767 / 32768, 4);
      // -32768 / 32768 = -1.0
      expect(channelData[1]).toBeCloseTo(-1.0, 5);
    });

    // Property-based test for conversion range
    it('should always produce Float32 values in [-1, 1] range', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.int16Array({ minLength: 1, maxLength: 100 }),
          async (int16Values) => {
            const uint8View = new Uint8Array(int16Values.buffer);
            const buffer = await decodeAudioData(uint8View, ctx as unknown as AudioContext, 24000, 1);
            const channelData = buffer.getChannelData(0);

            for (let i = 0; i < channelData.length; i++) {
              if (channelData[i] < -1 || channelData[i] > 1) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
