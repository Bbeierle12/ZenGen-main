import { SoundscapeType } from "../types";

export class SoundscapeEngine {
  private ctx: AudioContext;
  private nodes: AudioNode[] = [];
  private masterGain: GainNode;
  private bellGain: GainNode;
  
  // Breath sound nodes
  private breathGain: GainNode;
  public globalAnalyser: AnalyserNode; // Renamed to globalAnalyser
  private breathFilter: BiquadFilterNode | null = null;
  private breathSource: AudioBufferSourceNode | null = null;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    
    // Create Analyser (The visualizer now sits just before the speakers)
    this.globalAnalyser = ctx.createAnalyser();
    this.globalAnalyser.fftSize = 1024;
    this.globalAnalyser.smoothingTimeConstant = 0.8;
    this.globalAnalyser.connect(destination);

    // Master Gain connects to Analyser
    this.masterGain = ctx.createGain();
    this.masterGain.connect(this.globalAnalyser);
    this.masterGain.gain.value = 0.5; // Default master volume

    // Dedicated gain for bells
    this.bellGain = ctx.createGain();
    this.bellGain.connect(this.masterGain);
    this.bellGain.gain.value = 0.8; 

    // Dedicated gain for breath cues
    this.breathGain = ctx.createGain();
    this.breathGain.connect(this.masterGain);
    this.breathGain.gain.value = 0; 
  }

  setVolume(val: number) {
    this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1);
  }

  setBellVolume(val: number) {
    const safeVal = Math.max(0, Math.min(2, val)); 
    this.bellGain.gain.setTargetAtTime(safeVal, this.ctx.currentTime, 0.1);
  }

  stop() {
    this.stopBreathCue();
    this.nodes.forEach(node => {
      try {
        if (node instanceof AudioScheduledSourceNode) {
            node.stop();
        }
        node.disconnect();
      } catch (e) { /* ignore */ }
    });
    this.nodes = [];
  }

  // --- Breath Cues ---

  playBreathCue(type: 'inhale' | 'exhale', duration: number) {
    this.stopBreathCue(); 

    const now = this.ctx.currentTime;
    
    // Pink Noise Buffer
    const bufferSize = 4096;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; 
        b6 = white * 0.115926;
    }

    this.breathSource = this.ctx.createBufferSource();
    this.breathSource.buffer = buffer;
    this.breathSource.loop = true;

    this.breathFilter = this.ctx.createBiquadFilter();
    this.breathFilter.type = 'lowpass';
    this.breathFilter.Q.value = 0.5;

    this.breathSource.connect(this.breathFilter);
    this.breathFilter.connect(this.breathGain);

    this.breathSource.start(now);

    // Automation
    this.breathGain.gain.cancelScheduledValues(now);
    this.breathFilter.frequency.cancelScheduledValues(now);

    const maxVol = 0.4;
    const minFreq = 100;
    const maxFreq = 800;

    if (type === 'inhale') {
        this.breathGain.gain.setValueAtTime(0, now);
        this.breathGain.gain.linearRampToValueAtTime(maxVol, now + duration);
        
        this.breathFilter.frequency.setValueAtTime(minFreq, now);
        this.breathFilter.frequency.exponentialRampToValueAtTime(maxFreq, now + duration);
    } else {
        this.breathGain.gain.setValueAtTime(maxVol, now);
        this.breathGain.gain.linearRampToValueAtTime(0, now + duration);

        this.breathFilter.frequency.setValueAtTime(maxFreq, now);
        this.breathFilter.frequency.exponentialRampToValueAtTime(minFreq, now + duration);
    }
  }

  stopBreathCue() {
    if (this.breathSource) {
        try { this.breathSource.stop(); } catch(e){}
        this.breathSource.disconnect();
        this.breathSource = null;
    }
    if (this.breathFilter) {
        this.breathFilter.disconnect();
        this.breathFilter = null;
    }
    this.breathGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.breathGain.gain.value = 0;
  }

  // --- Bells ---

  playBell(type: 'chime' | 'bowl' | 'soft' = 'chime') {
    const now = this.ctx.currentTime;
    
    if (type === 'chime') {
        const freqs = [523.25, 783.99, 1046.50, 1567.98]; 
        const decays = [2.0, 1.5, 1.0, 0.8];
        const gains = [0.2, 0.1, 0.05, 0.02];
        freqs.forEach((f, i) => this.playOscOneShot(f, now, decays[i], gains[i]));
    } else if (type === 'bowl') {
        this.playOscOneShot(220, now, 4.0, 0.3); 
        this.playOscOneShot(221, now, 3.5, 0.15); 
        this.playOscOneShot(440, now, 2.0, 0.05); 
    } else if (type === 'soft') {
        this.playOscOneShot(523.25, now, 1.5, 0.15); 
    }
  }

  private playOscOneShot(freq: number, startTime: number, duration: number, peakGain: number) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.05); 
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); 
      
      osc.connect(gain);
      gain.connect(this.bellGain);
      
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
  }

  play(type: SoundscapeType) {
    this.stop(); // Stop previous loops
    if (type === SoundscapeType.NONE) return;

    switch (type) {
      case SoundscapeType.RAIN:
        this.createPinkNoise(0.5);
        break;
      case SoundscapeType.OCEAN:
        this.createOceanWaves();
        break;
      case SoundscapeType.WIND:
        this.createWind();
        break;
      case SoundscapeType.DRONE_LOW:
        this.createDrone([110, 110.5, 165, 220]);
        break;
      case SoundscapeType.DRONE_MID:
        this.createDrone([261.6, 262, 392, 523]);
        break;
      case SoundscapeType.DRONE_HIGH:
        this.createDrone([523, 524, 784, 1046]);
        break;
      case SoundscapeType.BOWL:
        this.createCrystalBowl(440);
        break;
    }
  }

  // --- Generators ---

  private createPinkNoise(volume: number) {
    const bufferSize = 4096;
    const pinkNoise = (() => {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        const node = this.ctx.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11; 
                b6 = white * 0.115926;
            }
        };
        return node;
    })();

    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    pinkNoise.connect(gain);
    gain.connect(this.masterGain);
    
    this.nodes.push(pinkNoise, gain);
  }

  private createOceanWaves() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; 

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 600;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const mainGain = this.ctx.createGain();
    mainGain.gain.value = 0.15;

    noise.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(this.masterGain);

    noise.start();
    lfo.start();

    this.nodes.push(noise, filter, lfo, lfoGain, mainGain);
  }

  private createWind() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1;

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.2;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 400; 

    filter.frequency.value = 600; 

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.value = 0.2;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    lfo.start();
    
    this.nodes.push(noise, filter, lfo, lfoGain, gain);
  }

  private createDrone(freqs: number[]) {
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      
      const gain = this.ctx.createGain();
      gain.gain.value = 0.1 / freqs.length;

      osc.detune.value = (Math.random() - 0.5) * 10;

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      
      this.nodes.push(osc, gain);
    });
  }

  private createCrystalBowl(freq: number) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 2.02; 

      const gain = this.ctx.createGain();
      gain.gain.value = 0.1;

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc2.start();

      this.nodes.push(osc, osc2, gain);
  }
}
