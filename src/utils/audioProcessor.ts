import { WaveGenerator, WaveType } from './waveGenerator';

export interface ProcessedAudioParams {
  volume: number;
  pitch: number;
  wave1Type: WaveType;
  wave2Type: WaveType;
  wave1Volume: number;
  wave2Volume: number;
  lowPassFreq: number;
  lowPassResonance: number;
  highPassFreq: number;
  highPassResonance: number;
  lfo1Rate: number;
  lfo1Depth: number;
  lfo1Target: 'volume' | 'pitch';
  lfo2Rate: number;
  lfo2Depth: number;
  lfo2Target: 'volume' | 'pitch';
}

export class AudioProcessor {
  private waveGenerator: WaveGenerator;
  private audioContext: AudioContext;
  private startTime: number = 0;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.waveGenerator = new WaveGenerator(audioContext.sampleRate);
    this.startTime = audioContext.currentTime;
  }

  /**
   * Create a processed audio buffer with all effects applied
   */
  createProcessedBuffer(params: ProcessedAudioParams): AudioBuffer {
    console.log('🎵 Creating audio buffer with params:', {
      volume: params.volume,
      pitch: params.pitch,
      wave1Type: params.wave1Type,
      wave2Type: params.wave2Type,
      wave1Volume: params.wave1Volume,
      wave2Volume: params.wave2Volume
    });

    const bufferSize = 4096;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Calculate current time for LFO
    const currentTime = this.audioContext.currentTime - this.startTime;
    console.log('🕐 Current time for LFO:', currentTime);

    // Apply LFO modulation to parameters
    const modulatedPitch1 = this.waveGenerator.applyLFO(
      params.pitch, 
      params.lfo1Target === 'pitch' ? params.lfo1Rate : 0, 
      params.lfo1Target === 'pitch' ? params.lfo1Depth : 0, 
      currentTime,
      'pitch'
    );
    
    const modulatedPitch2 = this.waveGenerator.applyLFO(
      modulatedPitch1, 
      params.lfo2Target === 'pitch' ? params.lfo2Rate : 0, 
      params.lfo2Target === 'pitch' ? params.lfo2Depth : 0, 
      currentTime,
      'pitch'
    );

    let modulatedVolume1 = this.waveGenerator.applyLFO(
      params.wave1Volume,
      params.lfo1Target === 'volume' ? params.lfo1Rate : 0,
      params.lfo1Target === 'volume' ? params.lfo1Depth : 0,
      currentTime,
      'volume'
    );

    let modulatedVolume2 = this.waveGenerator.applyLFO(
      params.wave2Volume,
      params.lfo1Target === 'volume' ? params.lfo1Rate : 0,
      params.lfo1Target === 'volume' ? params.lfo1Depth : 0,
      currentTime,
      'volume'
    );

    modulatedVolume1 = this.waveGenerator.applyLFO(
      modulatedVolume1,
      params.lfo2Target === 'volume' ? params.lfo2Rate : 0,
      params.lfo2Target === 'volume' ? params.lfo2Depth : 0,
      currentTime,
      'volume'
    );

    modulatedVolume2 = this.waveGenerator.applyLFO(
      modulatedVolume2,
      params.lfo2Target === 'volume' ? params.lfo2Rate : 0,
      params.lfo2Target === 'volume' ? params.lfo2Depth : 0,
      currentTime,
      'volume'
    );

    // Generate wave samples
    let maxSample = 0;
    let sampleCount = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const t = (i / this.audioContext.sampleRate) * modulatedPitch2 * 2 * Math.PI;
      
      // Generate both waves
      const wave1Sample = this.generateSample(t, params.wave1Type) * modulatedVolume1;
      const wave2Sample = this.generateSample(t, params.wave2Type) * modulatedVolume2;
      
      // Mix the waves
      const mixedSample = (wave1Sample + wave2Sample) * params.volume;
      data[i] = mixedSample;
      
      // Track max sample for debugging
      if (Math.abs(mixedSample) > maxSample) {
        maxSample = Math.abs(mixedSample);
      }
      sampleCount++;
    }
    
    console.log('🔊 Buffer generated:', {
      samples: sampleCount,
      maxAmplitude: maxSample,
      firstFewSamples: Array.from(data.slice(0, 10)),
      nonZeroSamples: Array.from(data).filter(s => Math.abs(s) > 0.001).length
    });

    // Apply filters
    this.waveGenerator.applyHighPassFilter(
      data, 
      params.highPassFreq, 
      params.highPassResonance, 
      this.audioContext.sampleRate
    );

    this.waveGenerator.applyLowPassFilter(
      data, 
      params.lowPassFreq, 
      params.lowPassResonance, 
      this.audioContext.sampleRate
    );

    return buffer;
  }

  /**
   * Generate a single sample for the given time and wave type
   */
  private generateSample(t: number, waveType: WaveType): number {
    switch (waveType) {
      case 'sine':
        return Math.sin(t);
      
      case 'triangle':
        return (2 / Math.PI) * Math.asin(Math.sin(t));
      
      case 'square':
        return Math.sin(t) >= 0 ? 1 : -1;
      
      case 'sawtooth':
        return (2 / Math.PI) * (t % (2 * Math.PI) - Math.PI);
      
      default:
        return Math.sin(t);
    }
  }

  updateStartTime() {
    this.startTime = this.audioContext.currentTime;
  }
}