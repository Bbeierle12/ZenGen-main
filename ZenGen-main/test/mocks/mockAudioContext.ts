import { vi } from 'vitest';

/**
 * Mock GainNode for Web Audio API testing
 */
export class MockGainNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn().mockReturnThis(),
    linearRampToValueAtTime: vi.fn().mockReturnThis(),
    exponentialRampToValueAtTime: vi.fn().mockReturnThis(),
    setTargetAtTime: vi.fn().mockReturnThis(),
    cancelScheduledValues: vi.fn().mockReturnThis(),
  };

  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
}

/**
 * Mock OscillatorNode for Web Audio API testing
 */
export class MockOscillatorNode {
  type: OscillatorType = 'sine';
  frequency = {
    value: 440,
    setValueAtTime: vi.fn().mockReturnThis(),
    linearRampToValueAtTime: vi.fn().mockReturnThis(),
    exponentialRampToValueAtTime: vi.fn().mockReturnThis(),
  };
  detune = {
    value: 0,
  };

  onended: (() => void) | null = null;

  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn(() => {
    // Trigger onended after stop
    setTimeout(() => this.onended?.(), 0);
  });
}

/**
 * Mock AnalyserNode for Web Audio API testing
 */
export class MockAnalyserNode {
  fftSize = 2048;
  frequencyBinCount = 1024;
  smoothingTimeConstant = 0.8;
  minDecibels = -100;
  maxDecibels = -30;

  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();

  getByteFrequencyData = vi.fn((array: Uint8Array) => {
    // Fill with mock frequency data (simulating some audio activity)
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 128);
    }
  });

  getByteTimeDomainData = vi.fn((array: Uint8Array) => {
    // Fill with mock time domain data centered around 128
    for (let i = 0; i < array.length; i++) {
      array[i] = 128 + Math.floor((Math.random() - 0.5) * 50);
    }
  });

  getFloatFrequencyData = vi.fn((array: Float32Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = -60 + Math.random() * 30;
    }
  });

  getFloatTimeDomainData = vi.fn((array: Float32Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = (Math.random() - 0.5) * 0.5;
    }
  });
}

/**
 * Mock BiquadFilterNode for Web Audio API testing
 */
export class MockBiquadFilterNode {
  type: BiquadFilterType = 'lowpass';
  frequency = {
    value: 350,
    setValueAtTime: vi.fn().mockReturnThis(),
    linearRampToValueAtTime: vi.fn().mockReturnThis(),
    exponentialRampToValueAtTime: vi.fn().mockReturnThis(),
    cancelScheduledValues: vi.fn().mockReturnThis(),
  };
  Q = {
    value: 1,
    setValueAtTime: vi.fn().mockReturnThis(),
  };
  gain = {
    value: 0,
    setValueAtTime: vi.fn().mockReturnThis(),
  };
  detune = {
    value: 0,
  };

  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
  getFrequencyResponse = vi.fn();
}

/**
 * Mock AudioBufferSourceNode for Web Audio API testing
 */
export class MockAudioBufferSourceNode {
  buffer: AudioBuffer | null = null;
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  playbackRate = {
    value: 1,
    setValueAtTime: vi.fn().mockReturnThis(),
  };

  onended: (() => void) | null = null;

  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn(() => {
    // Trigger onended after stop
    setTimeout(() => this.onended?.(), 0);
  });
}

/**
 * Mock AudioBuffer for Web Audio API testing
 */
export class MockAudioBuffer {
  sampleRate: number;
  length: number;
  duration: number;
  numberOfChannels: number;
  private channelData: Float32Array[];

  constructor(options: { numberOfChannels: number; length: number; sampleRate: number }) {
    this.numberOfChannels = options.numberOfChannels;
    this.length = options.length;
    this.sampleRate = options.sampleRate;
    this.duration = options.length / options.sampleRate;
    this.channelData = [];
    for (let i = 0; i < options.numberOfChannels; i++) {
      this.channelData.push(new Float32Array(options.length));
    }
  }

  getChannelData(channel: number): Float32Array {
    if (channel >= this.numberOfChannels) {
      throw new DOMException('Index is out of range', 'IndexSizeError');
    }
    return this.channelData[channel];
  }

  copyFromChannel = vi.fn((destination: Float32Array, channelNumber: number, startInChannel?: number) => {
    const start = startInChannel || 0;
    const source = this.channelData[channelNumber];
    const length = Math.min(destination.length, source.length - start);
    for (let i = 0; i < length; i++) {
      destination[i] = source[start + i];
    }
  });

  copyToChannel = vi.fn((source: Float32Array, channelNumber: number, startInChannel?: number) => {
    const start = startInChannel || 0;
    const dest = this.channelData[channelNumber];
    const length = Math.min(source.length, dest.length - start);
    for (let i = 0; i < length; i++) {
      dest[start + i] = source[i];
    }
  });
}

/**
 * Mock ScriptProcessorNode (deprecated but still used in some code)
 */
export class MockScriptProcessorNode {
  bufferSize: number;
  onaudioprocess: ((event: any) => void) | null = null;

  constructor(bufferSize: number) {
    this.bufferSize = bufferSize;
  }

  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
}

/**
 * Mock AudioContext for comprehensive Web Audio API testing
 */
export class MockAudioContext {
  state: AudioContextState = 'running';
  sampleRate = 44100;
  currentTime = 0;
  destination = new MockGainNode();
  baseLatency = 0.01;
  outputLatency = 0.01;

  private _intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(options?: { sampleRate?: number }) {
    if (options?.sampleRate) {
      this.sampleRate = options.sampleRate;
    }
    // Simulate time progression
    this._intervalId = setInterval(() => {
      this.currentTime += 0.01;
    }, 10);
  }

  createGain = vi.fn(() => new MockGainNode());
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createAnalyser = vi.fn(() => new MockAnalyserNode());
  createBiquadFilter = vi.fn(() => new MockBiquadFilterNode());
  createBufferSource = vi.fn(() => new MockAudioBufferSourceNode());

  createBuffer = vi.fn((numberOfChannels: number, length: number, sampleRate: number) => {
    return new MockAudioBuffer({ numberOfChannels, length, sampleRate });
  });

  createScriptProcessor = vi.fn((bufferSize: number) => {
    return new MockScriptProcessorNode(bufferSize);
  });

  decodeAudioData = vi.fn(async (arrayBuffer: ArrayBuffer) => {
    // Return a mock AudioBuffer
    return new MockAudioBuffer({
      numberOfChannels: 2,
      length: 44100, // 1 second
      sampleRate: this.sampleRate,
    });
  });

  resume = vi.fn(async () => {
    this.state = 'running';
  });

  suspend = vi.fn(async () => {
    this.state = 'suspended';
  });

  close = vi.fn(async () => {
    this.state = 'closed';
    if (this._intervalId) {
      clearInterval(this._intervalId);
    }
  });

  createMediaElementSource = vi.fn(() => ({
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  }));

  createMediaStreamSource = vi.fn(() => ({
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  }));
}

/**
 * Create a mock AudioBuffer with custom data
 */
export function createMockAudioBuffer(
  duration: number = 1,
  sampleRate: number = 44100,
  numberOfChannels: number = 1
): MockAudioBuffer {
  const length = Math.floor(duration * sampleRate);
  return new MockAudioBuffer({ numberOfChannels, length, sampleRate });
}
