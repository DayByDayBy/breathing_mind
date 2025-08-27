export interface LFOTarget {
  enabled: boolean;
  inverted: boolean;
}

export interface LFOTargets {
  volume: LFOTarget;
  pitch1: LFOTarget;
  pitch2: LFOTarget;
  lowPassFreq: LFOTarget;
  highPassFreq: LFOTarget;
}

export interface SynthParams {
  volume: number;
  pitch1: number;
  pitch2: number;
  wave1Type: OscillatorType;
  wave2Type: OscillatorType;
  wave1Volume: number;
  wave2Volume: number;
  noiseVolume: number;
  fmBlend: number;
  lowPassFreq: number;
  lowPassResonance: number;
  highPassFreq: number;
  highPassResonance: number;
  lfo1Rate: number;
  lfo1Depth: number;
  lfo1Targets: LFOTargets;
  lfo2Rate: number;
  lfo2Depth: number;
  lfo2Targets: LFOTargets;
}

export interface MeditationSynth {
  stop(): void;
  masterGain: GainNode;
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  osc1Gain: GainNode;
  osc2Gain: GainNode;
  osc1ParallelGain: GainNode;
  osc2ParallelGain: GainNode;
  osc1FMGain: GainNode;
  osc2FMGain: GainNode;
  noiseBuffer: AudioBufferSourceNode;
  noiseGain: GainNode;
  lowPass: BiquadFilterNode;
  highPass: BiquadFilterNode;
  lfo1: OscillatorNode;
  lfo2: OscillatorNode;
  lfo1Gain: GainNode;
  lfo2Gain: GainNode;
  lfo1VolumeGain: GainNode;
  lfo1Pitch1Gain: GainNode;
  lfo1Pitch2Gain: GainNode;
  lfo1LowPassGain: GainNode;
  lfo1HighPassGain: GainNode;
  lfo2VolumeGain: GainNode;
  lfo2Pitch1Gain: GainNode;
  lfo2Pitch2Gain: GainNode;
  lfo2LowPassGain: GainNode;
  lfo2HighPassGain: GainNode;
  updateParam(paramName: keyof SynthParams, value: any): void;
  updateLFOTargets(lfoNum: 1 | 2, targets: LFOTargets): void;
  replaceOscillator(oscNum: 1 | 2, newType: OscillatorType): void;
}

export function createMeditationSynth(
  audioContext: AudioContext, 
  params: SynthParams
): MeditationSynth {
  console.log('🎹 Creating meditation synth with params:', params);

  // Main gain - start at 0 for fade-in
  const masterGain = audioContext.createGain();
  masterGain.gain.value = 0;

  // Two oscillators
  const osc1 = audioContext.createOscillator();
  osc1.type = params.wave1Type;
  osc1.frequency.value = params.pitch1;

  const osc1Gain = audioContext.createGain();
  osc1Gain.gain.value = params.wave1Volume;

  const osc2 = audioContext.createOscillator();
  osc2.type = params.wave2Type;
  osc2.frequency.value = params.pitch2;

  const osc2Gain = audioContext.createGain();
  osc2Gain.gain.value = params.wave2Volume;

  // FM/Parallel blend routing gains
  const osc1ParallelGain = audioContext.createGain();
  const osc2ParallelGain = audioContext.createGain();
  const osc1FMGain = audioContext.createGain();
  const osc2FMGain = audioContext.createGain();
  
  // Set blend ratios: 0 = full parallel, 1 = full FM
  const parallelAmount = 1 - params.fmBlend;
  const fmAmount = params.fmBlend;
  
  osc1ParallelGain.gain.value = parallelAmount;
  osc2ParallelGain.gain.value = parallelAmount;
  osc1FMGain.gain.value = fmAmount;
  osc2FMGain.gain.value = fmAmount;

  // White noise generator
  const noiseBuffer = audioContext.createBufferSource();
  const noiseGain = audioContext.createGain();
  
  // Create white noise buffer (2 seconds, looped)
  const bufferSize = audioContext.sampleRate * 2; // 2 seconds
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Generate white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1; // Random values between -1 and 1
  }
  
  noiseBuffer.buffer = buffer;
  noiseBuffer.loop = true;
  
  // Convert from -12dB to linear scale (0 = silent, -12dB = 0.25 linear)
  const noiseVolumeLinear = params.noiseVolume === 0 ? 0 : Math.pow(10, (params.noiseVolume - 12) / 20);
  noiseGain.gain.value = noiseVolumeLinear;

  // Filters
  const lowPass = audioContext.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = params.lowPassFreq;
  lowPass.Q.value = params.lowPassResonance;

  const highPass = audioContext.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.value = params.highPassFreq;
  highPass.Q.value = params.highPassResonance;

  // Create reverb for smoother endings
  const convolver = audioContext.createConvolver();
  const reverbGain = audioContext.createGain();
  reverbGain.gain.value = 0.15; // Subtle reverb
  
  // Create simple reverb impulse response
  const reverbLength = audioContext.sampleRate * 2; // 2 seconds
  const reverbBuffer = audioContext.createBuffer(2, reverbLength, audioContext.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const channelData = reverbBuffer.getChannelData(channel);
    for (let i = 0; i < reverbLength; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 2);
    }
  }
  convolver.buffer = reverbBuffer;

  // Connect oscillators through blend routing
  // Parallel path: Osc → OscGain → ParallelGain → LowPass
  osc1.connect(osc1Gain);
  osc2.connect(osc2Gain);
  
  osc1Gain.connect(osc1ParallelGain);
  osc2Gain.connect(osc2ParallelGain);
  
  // FM path: Osc1 → Osc1Gain → Osc1FMGain → Osc2.frequency (modulation)
  //          Osc2 → Osc2Gain → Osc2FMGain → LowPass (carrier)
  osc1Gain.connect(osc1FMGain);
  osc2Gain.connect(osc2FMGain);
  
  // FM modulation: Osc1 modulates Osc2 frequency
  osc1FMGain.connect(osc2.frequency);
  
  // Connect white noise
  noiseBuffer.connect(noiseGain);
  
  // Mix parallel outputs and FM carrier into the filter chain
  osc1ParallelGain.connect(lowPass);
  osc2ParallelGain.connect(lowPass);
  osc2FMGain.connect(lowPass); // FM carrier
  noiseGain.connect(lowPass);
  
  lowPass.connect(highPass);
  
  // Split to dry and wet (reverb) paths
  highPass.connect(masterGain); // Dry signal
  highPass.connect(convolver);  // Wet signal to reverb
  convolver.connect(reverbGain);
  reverbGain.connect(masterGain); // Reverb back to master
  
  masterGain.connect(audioContext.destination);

  // LFOs for modulation
  const lfo1 = audioContext.createOscillator();
  lfo1.frequency.value = params.lfo1Rate;
  lfo1.type = 'sine'; // LFOs are typically sine waves
  
  const lfo1Gain = audioContext.createGain();
  lfo1Gain.gain.value = params.lfo1Depth;
  
  const lfo2 = audioContext.createOscillator();
  lfo2.frequency.value = params.lfo2Rate;
  lfo2.type = 'sine';
  
  const lfo2Gain = audioContext.createGain();
  lfo2Gain.gain.value = params.lfo2Depth;

  // Create individual gain nodes for each LFO target to allow multiple connections
  const lfo1VolumeGain = audioContext.createGain();
  const lfo1Pitch1Gain = audioContext.createGain();
  const lfo1Pitch2Gain = audioContext.createGain();
  const lfo1LowPassGain = audioContext.createGain();
  const lfo1HighPassGain = audioContext.createGain();
  
  const lfo2VolumeGain = audioContext.createGain();
  const lfo2Pitch1Gain = audioContext.createGain();
  const lfo2Pitch2Gain = audioContext.createGain();
  const lfo2LowPassGain = audioContext.createGain();
  const lfo2HighPassGain = audioContext.createGain();

  // Connect LFOs to their target-specific gain nodes
  lfo1.connect(lfo1Gain);
  lfo2.connect(lfo2Gain);
  
  // Split LFO1 output to multiple target gains
  lfo1Gain.connect(lfo1VolumeGain);
  lfo1Gain.connect(lfo1Pitch1Gain);
  lfo1Gain.connect(lfo1Pitch2Gain);
  lfo1Gain.connect(lfo1LowPassGain);
  lfo1Gain.connect(lfo1HighPassGain);
  
  // Split LFO2 output to multiple target gains
  lfo2Gain.connect(lfo2VolumeGain);
  lfo2Gain.connect(lfo2Pitch1Gain);
  lfo2Gain.connect(lfo2Pitch2Gain);
  lfo2Gain.connect(lfo2LowPassGain);
  lfo2Gain.connect(lfo2HighPassGain);
  
  // Configure LFO1 target connections based on enabled/inverted settings
  if (params.lfo1Targets.volume.enabled) {
    lfo1VolumeGain.gain.value = params.lfo1Depth * (params.lfo1Targets.volume.inverted ? -1 : 1);
    lfo1VolumeGain.connect(masterGain.gain);
  } else {
    lfo1VolumeGain.gain.value = 0;
  }
  
  if (params.lfo1Targets.pitch1.enabled) {
    lfo1Pitch1Gain.gain.value = params.lfo1Depth * (params.lfo1Targets.pitch1.inverted ? -1 : 1);
    lfo1Pitch1Gain.connect(osc1.frequency);
  } else {
    lfo1Pitch1Gain.gain.value = 0;
  }
  
  if (params.lfo1Targets.pitch2.enabled) {
    lfo1Pitch2Gain.gain.value = params.lfo1Depth * (params.lfo1Targets.pitch2.inverted ? -1 : 1);
    lfo1Pitch2Gain.connect(osc2.frequency);
  } else {
    lfo1Pitch2Gain.gain.value = 0;
  }
  
  if (params.lfo1Targets.lowPassFreq.enabled) {
    lfo1LowPassGain.gain.value = params.lfo1Depth * (params.lfo1Targets.lowPassFreq.inverted ? -1 : 1);
    lfo1LowPassGain.connect(lowPass.frequency);
  } else {
    lfo1LowPassGain.gain.value = 0;
  }
  
  if (params.lfo1Targets.highPassFreq.enabled) {
    lfo1HighPassGain.gain.value = params.lfo1Depth * (params.lfo1Targets.highPassFreq.inverted ? -1 : 1);
    lfo1HighPassGain.connect(highPass.frequency);
  } else {
    lfo1HighPassGain.gain.value = 0;
  }
  
  // Configure LFO2 target connections based on enabled/inverted settings
  if (params.lfo2Targets.volume.enabled) {
    lfo2VolumeGain.gain.value = params.lfo2Depth * (params.lfo2Targets.volume.inverted ? -1 : 1);
    lfo2VolumeGain.connect(masterGain.gain);
  } else {
    lfo2VolumeGain.gain.value = 0;
  }
  
  if (params.lfo2Targets.pitch1.enabled) {
    lfo2Pitch1Gain.gain.value = params.lfo2Depth * (params.lfo2Targets.pitch1.inverted ? -1 : 1);
    lfo2Pitch1Gain.connect(osc1.frequency);
  } else {
    lfo2Pitch1Gain.gain.value = 0;
  }
  
  if (params.lfo2Targets.pitch2.enabled) {
    lfo2Pitch2Gain.gain.value = params.lfo2Depth * (params.lfo2Targets.pitch2.inverted ? -1 : 1);
    lfo2Pitch2Gain.connect(osc2.frequency);
  } else {
    lfo2Pitch2Gain.gain.value = 0;
  }
  
  if (params.lfo2Targets.lowPassFreq.enabled) {
    lfo2LowPassGain.gain.value = params.lfo2Depth * (params.lfo2Targets.lowPassFreq.inverted ? -1 : 1);
    lfo2LowPassGain.connect(lowPass.frequency);
  } else {
    lfo2LowPassGain.gain.value = 0;
  }
  
  if (params.lfo2Targets.highPassFreq.enabled) {
    lfo2HighPassGain.gain.value = params.lfo2Depth * (params.lfo2Targets.highPassFreq.inverted ? -1 : 1);
    lfo2HighPassGain.connect(highPass.frequency);
  } else {
    lfo2HighPassGain.gain.value = 0;
  }

  // Start everything
  osc1.start();
  osc2.start();
  noiseBuffer.start();
  lfo1.start();
  lfo2.start();

  console.log('🎹 Meditation synth started successfully');

  const synthInstance = {
    stop() {
      console.log('🎹 Stopping meditation synth...');
      try {
        osc1.stop();
        osc2.stop();
        noiseBuffer.stop();
        lfo1.stop();
        lfo2.stop();
        
        // Disconnect all nodes
        masterGain.disconnect();
        osc1Gain.disconnect();
        osc2Gain.disconnect();
        osc1ParallelGain.disconnect();
        osc2ParallelGain.disconnect();
        osc1FMGain.disconnect();
        osc2FMGain.disconnect();
        noiseGain.disconnect();
        lowPass.disconnect();
        highPass.disconnect();
        lfo1Gain.disconnect();
        lfo2Gain.disconnect();
        lfo1VolumeGain.disconnect();
        lfo1Pitch1Gain.disconnect();
        lfo1Pitch2Gain.disconnect();
        lfo1LowPassGain.disconnect();
        lfo1HighPassGain.disconnect();
        lfo2VolumeGain.disconnect();
        lfo2Pitch1Gain.disconnect();
        lfo2Pitch2Gain.disconnect();
        lfo2LowPassGain.disconnect();
        lfo2HighPassGain.disconnect();
        
        console.log('🎹 Meditation synth stopped');
      } catch (error) {
        console.error('Error stopping synth:', error);
      }
    },
    
    masterGain,
    osc1,
    osc2,
    osc1Gain,
    osc2Gain,
    osc1ParallelGain,
    osc2ParallelGain,
    osc1FMGain,
    osc2FMGain,
    noiseBuffer,
    noiseGain,
    lowPass,
    highPass,
    lfo1,
    lfo2,
    lfo1Gain,
    lfo2Gain,
    lfo1VolumeGain,
    lfo1Pitch1Gain,
    lfo1Pitch2Gain,
    lfo1LowPassGain,
    lfo1HighPassGain,
    lfo2VolumeGain,
    lfo2Pitch1Gain,
    lfo2Pitch2Gain,
    lfo2LowPassGain,
    lfo2HighPassGain,
    
    updateParam(paramName: keyof SynthParams, value: any) {
      console.log(`🎹 Live updating synth param ${paramName} to:`, value);
      const currentTime = audioContext.currentTime;
      
      try {
        switch (paramName) {
          case 'pitch1':
            osc1.frequency.setTargetAtTime(value, currentTime, 0.05);
            break;
          case 'pitch2':
            osc2.frequency.setTargetAtTime(value, currentTime, 0.05);
            break;
          case 'wave1Volume':
            osc1Gain.gain.setTargetAtTime(value, currentTime, 0.05);
            break;
          case 'wave2Volume':
            osc2Gain.gain.setTargetAtTime(value, currentTime, 0.05);
            break;
          case 'noiseVolume':
            // Convert from -12dB to linear scale
            const noiseLinear = value === 0 ? 0 : Math.pow(10, (value - 12) / 20);
            noiseGain.gain.setTargetAtTime(noiseLinear, currentTime, 0.05);
            break;
          case 'fmBlend':
            // Update blend ratios
            const newParallelAmount = 1 - value;
            const newFMAmount = value;
            osc1ParallelGain.gain.setTargetAtTime(newParallelAmount, currentTime, 0.05);
            osc2ParallelGain.gain.setTargetAtTime(newParallelAmount, currentTime, 0.05);
            osc1FMGain.gain.setTargetAtTime(newFMAmount * 100, currentTime, 0.05); // Scale FM modulation
            osc2FMGain.gain.setTargetAtTime(newFMAmount, currentTime, 0.05);
            break;
          case 'lowPassFreq':
            lowPass.frequency.setTargetAtTime(value, currentTime, 0.05);
            break;
          case 'lowPassResonance':
            lowPass.Q.setTargetAtTime(value, currentTime, 0.05);
            break;
          case 'highPassFreq':
            highPass.frequency.setTargetAtTime(value, currentTime, 0.05);
            break;
          case 'highPassResonance':
            highPass.Q.setTargetAtTime(value, currentTime, 0.05);
            break;
          case 'lfo1Rate':
            lfo1.frequency.setTargetAtTime(value, currentTime, 0.05);
            break;
          case 'lfo1Depth':
            lfo1Gain.gain.setTargetAtTime(value, currentTime, 0.05);
            // Update all target gains with new depth
            lfo1VolumeGain.gain.setTargetAtTime(
              params.lfo1Targets.volume.enabled ? value * (params.lfo1Targets.volume.inverted ? -1 : 1) : 0, 
              currentTime, 0.05
            );
            lfo1Pitch1Gain.gain.setTargetAtTime(
              params.lfo1Targets.pitch1.enabled ? value * (params.lfo1Targets.pitch1.inverted ? -1 : 1) : 0, 
              currentTime, 0.05
            );
            lfo1Pitch2Gain.gain.setTargetAtTime(
              params.lfo1Targets.pitch2.enabled ? value * (params.lfo1Targets.pitch2.inverted ? -1 : 1) : 0, 
              currentTime, 0.05
            );
            lfo1LowPassGain.gain.setTargetAtTime(
              params.lfo1Targets.lowPassFreq.enabled ? value * (params.lfo1Targets.lowPassFreq.inverted ? -1 : 1) : 0, 
              currentTime, 0.05
            );
            lfo1HighPassGain.gain.setTargetAtTime(
              params.lfo1Targets.highPassFreq.enabled ? value * (params.lfo1Targets.highPassFreq.inverted ? -1 : 1) : 0, 
              currentTime, 0.05
            );
            break;
          case 'lfo2Rate':
            lfo2.frequency.setTargetAtTime(value, currentTime, 0.05);
            break;
          case 'lfo2Depth':
            lfo2Gain.gain.setTargetAtTime(value, currentTime, 0.05);
            // Update all target gains with new depth
            lfo2VolumeGain.gain.setTargetAtTime(
              params.lfo2Targets.volume.enabled ? value * (params.lfo2Targets.volume.inverted ? -1 : 1) : 0, 
              currentTime, 0.05
            );
            lfo2Pitch1Gain.gain.setTargetAtTime(
              params.lfo2Targets.pitch1.enabled ? value * (params.lfo2Targets.pitch1.inverted ? -1 : 1) : 0, 
              currentTime, 0.05
            );
            lfo2Pitch2Gain.gain.setTargetAtTime(
              params.lfo2Targets.pitch2.enabled ? value * (params.lfo2Targets.pitch2.inverted ? -1 : 1) : 0, 
              currentTime, 0.05
            );
            lfo2LowPassGain.gain.setTargetAtTime(
              params.lfo2Targets.lowPassFreq.enabled ? value * (params.lfo2Targets.lowPassFreq.inverted ? -1 : 1) : 0, 
              currentTime, 0.05
            );
            lfo2HighPassGain.gain.setTargetAtTime(
              params.lfo2Targets.highPassFreq.enabled ? value * (params.lfo2Targets.highPassFreq.inverted ? -1 : 1) : 0, 
              currentTime, 0.05
            );
            break;
          default:
            console.log(`🎹 Parameter ${paramName} requires special handling or restart`);
        }
      } catch (error) {
        console.error(`🎹 Error updating parameter ${paramName}:`, error);
      }
    },

    updateLFOTargets(lfoNum: 1 | 2, targets: LFOTargets) {
      console.log(`🎹 Updating LFO${lfoNum} targets:`, targets);
      const currentTime = audioContext.currentTime;
      
      try {
        if (lfoNum === 1) {
          // Update params reference
          params.lfo1Targets = targets;
          
          // Disconnect and reconnect volume modulation
          try { lfo1VolumeGain.disconnect(); } catch (e) {}
          if (targets.volume.enabled) {
            lfo1VolumeGain.gain.setTargetAtTime(params.lfo1Depth * (targets.volume.inverted ? -1 : 1), currentTime, 0.05);
            lfo1VolumeGain.connect(masterGain.gain);
          } else {
            lfo1VolumeGain.gain.setTargetAtTime(0, currentTime, 0.05);
          }
          
          // Disconnect and reconnect pitch1 modulation
          try { lfo1Pitch1Gain.disconnect(); } catch (e) {}
          if (targets.pitch1.enabled) {
            lfo1Pitch1Gain.gain.setTargetAtTime(params.lfo1Depth * (targets.pitch1.inverted ? -1 : 1), currentTime, 0.05);
            lfo1Pitch1Gain.connect(osc1.frequency);
          } else {
            lfo1Pitch1Gain.gain.setTargetAtTime(0, currentTime, 0.05);
          }
          
          // Disconnect and reconnect pitch2 modulation
          try { lfo1Pitch2Gain.disconnect(); } catch (e) {}
          if (targets.pitch2.enabled) {
            lfo1Pitch2Gain.gain.setTargetAtTime(params.lfo1Depth * (targets.pitch2.inverted ? -1 : 1), currentTime, 0.05);
            lfo1Pitch2Gain.connect(osc2.frequency);
          } else {
            lfo1Pitch2Gain.gain.setTargetAtTime(0, currentTime, 0.05);
          }
          
          // Disconnect and reconnect low pass filter modulation
          try { lfo1LowPassGain.disconnect(); } catch (e) {}
          if (targets.lowPassFreq.enabled) {
            lfo1LowPassGain.gain.setTargetAtTime(params.lfo1Depth * (targets.lowPassFreq.inverted ? -1 : 1), currentTime, 0.05);
            lfo1LowPassGain.connect(lowPass.frequency);
          } else {
            lfo1LowPassGain.gain.setTargetAtTime(0, currentTime, 0.05);
          }
          
          // Disconnect and reconnect high pass filter modulation
          try { lfo1HighPassGain.disconnect(); } catch (e) {}
          if (targets.highPassFreq.enabled) {
            lfo1HighPassGain.gain.setTargetAtTime(params.lfo1Depth * (targets.highPassFreq.inverted ? -1 : 1), currentTime, 0.05);
            lfo1HighPassGain.connect(highPass.frequency);
          } else {
            lfo1HighPassGain.gain.setTargetAtTime(0, currentTime, 0.05);
          }
          
        } else {
          // Update params reference
          params.lfo2Targets = targets;
          
          // Similar logic for LFO2
          try { lfo2VolumeGain.disconnect(); } catch (e) {}
          if (targets.volume.enabled) {
            lfo2VolumeGain.gain.setTargetAtTime(params.lfo2Depth * (targets.volume.inverted ? -1 : 1), currentTime, 0.05);
            lfo2VolumeGain.connect(masterGain.gain);
          } else {
            lfo2VolumeGain.gain.setTargetAtTime(0, currentTime, 0.05);
          }
          
          try { lfo2Pitch1Gain.disconnect(); } catch (e) {}
          if (targets.pitch1.enabled) {
            lfo2Pitch1Gain.gain.setTargetAtTime(params.lfo2Depth * (targets.pitch1.inverted ? -1 : 1), currentTime, 0.05);
            lfo2Pitch1Gain.connect(osc1.frequency);
          } else {
            lfo2Pitch1Gain.gain.setTargetAtTime(0, currentTime, 0.05);
          }
          
          try { lfo2Pitch2Gain.disconnect(); } catch (e) {}
          if (targets.pitch2.enabled) {
            lfo2Pitch2Gain.gain.setTargetAtTime(params.lfo2Depth * (targets.pitch2.inverted ? -1 : 1), currentTime, 0.05);
            lfo2Pitch2Gain.connect(osc2.frequency);
          } else {
            lfo2Pitch2Gain.gain.setTargetAtTime(0, currentTime, 0.05);
          }
          
          try { lfo2LowPassGain.disconnect(); } catch (e) {}
          if (targets.lowPassFreq.enabled) {
            lfo2LowPassGain.gain.setTargetAtTime(params.lfo2Depth * (targets.lowPassFreq.inverted ? -1 : 1), currentTime, 0.05);
            lfo2LowPassGain.connect(lowPass.frequency);
          } else {
            lfo2LowPassGain.gain.setTargetAtTime(0, currentTime, 0.05);
          }
          
          try { lfo2HighPassGain.disconnect(); } catch (e) {}
          if (targets.highPassFreq.enabled) {
            lfo2HighPassGain.gain.setTargetAtTime(params.lfo2Depth * (targets.highPassFreq.inverted ? -1 : 1), currentTime, 0.05);
            lfo2HighPassGain.connect(highPass.frequency);
          } else {
            lfo2HighPassGain.gain.setTargetAtTime(0, currentTime, 0.05);
          }
        }
      } catch (error) {
        console.error(`🎹 Error updating LFO${lfoNum} targets:`, error);
      }
    },
    
    replaceOscillator(oscNum: 1 | 2, newType: OscillatorType) {
      console.log(`🎹 Hot-swapping oscillator ${oscNum} to ${newType}`);
      const currentTime = audioContext.currentTime;
      
      try {
        if (oscNum === 1) {
          const currentFreq = osc1.frequency.value;
          const newOsc = audioContext.createOscillator();
          newOsc.type = newType;
          newOsc.frequency.value = currentFreq;
          
          // Connect to same destinations
          newOsc.connect(osc1Gain);
          
          // Route LFOs if they were targeting pitch1
          try {
            if (params.lfo1Targets.pitch1.enabled) {
              lfo1Pitch1Gain.disconnect(osc1.frequency);
              lfo1Pitch1Gain.connect(newOsc.frequency);
            }
          } catch (e) {
            // LFO1 may not have been connected to this frequency
            if (params.lfo1Targets.pitch1.enabled) {
              lfo1Pitch1Gain.connect(newOsc.frequency);
            }
          }
          try {
            if (params.lfo2Targets.pitch1.enabled) {
              lfo2Pitch1Gain.disconnect(osc1.frequency);
              lfo2Pitch1Gain.connect(newOsc.frequency);
            }
          } catch (e) {
            // LFO2 may not have been connected to this frequency
            if (params.lfo2Targets.pitch1.enabled) {
              lfo2Pitch1Gain.connect(newOsc.frequency);
            }
          }
          
          newOsc.start();
          
          // Stop and replace old oscillator
          osc1.stop();
          osc1.disconnect();
          synthInstance.osc1 = newOsc;
          
        } else {
          const currentFreq = osc2.frequency.value;
          const newOsc = audioContext.createOscillator();
          newOsc.type = newType;
          newOsc.frequency.value = currentFreq;
          
          // Connect to same destinations
          newOsc.connect(osc2Gain);
          
          // Route LFOs if they were targeting pitch2
          try {
            if (params.lfo1Targets.pitch2.enabled) {
              lfo1Pitch2Gain.disconnect(osc2.frequency);
              lfo1Pitch2Gain.connect(newOsc.frequency);
            }
          } catch (e) {
            // LFO1 may not have been connected to this frequency
            if (params.lfo1Targets.pitch2.enabled) {
              lfo1Pitch2Gain.connect(newOsc.frequency);
            }
          }
          try {
            if (params.lfo2Targets.pitch2.enabled) {
              lfo2Pitch2Gain.disconnect(osc2.frequency);
              lfo2Pitch2Gain.connect(newOsc.frequency);
            }
          } catch (e) {
            // LFO2 may not have been connected to this frequency
            if (params.lfo2Targets.pitch2.enabled) {
              lfo2Pitch2Gain.connect(newOsc.frequency);
            }
          }
          
          newOsc.start();
          
          // Stop and replace old oscillator
          osc2.stop();
          osc2.disconnect();
          synthInstance.osc2 = newOsc;
        }
        
        console.log(`🎹 Oscillator ${oscNum} hot-swapped successfully`);
      } catch (error) {
        console.error(`🎹 Error hot-swapping oscillator ${oscNum}:`, error);
      }
    }
  };

  return synthInstance;
}