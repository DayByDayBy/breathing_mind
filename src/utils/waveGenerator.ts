export type WaveType = 'sine' | 'triangle' | 'square' | 'sawtooth';

export class WaveGenerator {
  private sampleRate: number;
  private bufferSize: number;

  constructor(sampleRate: number = 44100, bufferSize: number = 4096) {
    this.sampleRate = sampleRate;
    this.bufferSize = bufferSize;
  }

  /**
   * Generate a wave buffer for a given frequency and wave type
   */
  generateWaveBuffer(frequency: number, waveType: WaveType, audioContext: AudioContext): AudioBuffer {
    const buffer = audioContext.createBuffer(1, this.bufferSize, this.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < this.bufferSize; i++) {
      const t = (i / this.sampleRate) * frequency * 2 * Math.PI;
      data[i] = this.generateSample(t, waveType);
    }

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

  /**
   * Apply a simple low-pass filter to audio data
   */
  applyLowPassFilter(data: Float32Array, cutoffFreq: number, resonance: number, sampleRate: number) {
    const nyquist = sampleRate / 2;
    const normalizedCutoff = Math.min(cutoffFreq / nyquist, 0.99);
    
    // Simple IIR low-pass filter
    const a = Math.exp(-2 * Math.PI * normalizedCutoff);
    const b = 1 - a;
    
    let prevOutput = 0;
    
    for (let i = 0; i < data.length; i++) {
      const output = b * data[i] + a * prevOutput;
      data[i] = output + (data[i] - output) * (resonance - 1) * 0.1;
      prevOutput = output;
    }
  }

  /**
   * Apply a simple high-pass filter to audio data
   */
  applyHighPassFilter(data: Float32Array, cutoffFreq: number, resonance: number, sampleRate: number) {
    const nyquist = sampleRate / 2;
    const normalizedCutoff = Math.min(cutoffFreq / nyquist, 0.99);
    
    // Simple IIR high-pass filter
    const a = Math.exp(-2 * Math.PI * normalizedCutoff);
    const b = (1 + a) / 2;
    
    let prevInput = 0;
    let prevOutput = 0;
    
    for (let i = 0; i < data.length; i++) {
      const output = b * (data[i] - prevInput) + a * prevOutput;
      data[i] = output + (data[i] - output) * (resonance - 1) * 0.1;
      prevInput = data[i];
      prevOutput = output;
    }
  }

  /**
   * Apply LFO modulation to a parameter
   */
  applyLFO(
    baseValue: number, 
    lfoRate: number, 
    lfoDepth: number, 
    time: number,
    target: 'volume' | 'pitch'
  ): number {
    const lfoValue = Math.sin(2 * Math.PI * lfoRate * time);
    
    if (target === 'volume') {
      // Volume modulation: 0 to 1 range
      return Math.max(0, Math.min(1, baseValue + (lfoValue * lfoDepth * 0.5)));
    } else {
      // Pitch modulation: frequency multiplier
      return baseValue * (1 + (lfoValue * lfoDepth * 0.1));
    }
  }
}