import { AudioParams } from '@/hooks/useMeditationAudio';

export interface MeditationPreset {
  id: string;
  name: string;
  description: string;
  params: AudioParams;
}

export const meditationPresets: MeditationPreset[] = [
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    description: 'Clear, steady tones for concentration and mental clarity',
    params: {
      volume: 0.4,
      pitch1: 220,
      pitch2: 330, // Perfect fifth interval for focus
      wave1Type: 'sine',
      wave2Type: 'triangle',
      wave1Volume: 0.8,
      wave2Volume: 0.2,
      noiseVolume: 1.5, // Subtle noise for concentration
      fmBlend: 0.2, // Light FM interaction
      lowPassFreq: 1200,
      lowPassResonance: 0.5,
      highPassFreq: 100,
      highPassResonance: 0.5,
      lfo1Rate: 0.02,
      lfo1Depth: 0.1,
      lfo1Targets: {
        volume: { enabled: true, inverted: false },
        pitch1: { enabled: false, inverted: false },
        pitch2: { enabled: false, inverted: false },
        lowPassFreq: { enabled: false, inverted: false },
        highPassFreq: { enabled: false, inverted: false }
      },
      lfo2Rate: 0.1,
      lfo2Depth: 0.05,
      lfo2Targets: {
        volume: { enabled: false, inverted: false },
        pitch1: { enabled: true, inverted: false },
        pitch2: { enabled: false, inverted: false },
        lowPassFreq: { enabled: false, inverted: false },
        highPassFreq: { enabled: false, inverted: false }
      }
    }
  },
  {
    id: 'sleep-induction',
    name: 'Sleep Induction',
    description: 'Low, warm frequencies to guide you into restful sleep',
    params: {
      volume: 0.25,
      pitch1: 110,
      pitch2: 82.4, // Deep sub-harmonic for sleep
      wave1Type: 'sine',
      wave2Type: 'sine',
      wave1Volume: 0.7,
      wave2Volume: 0.3,
      noiseVolume: 0.8, // Very soft brown noise
      fmBlend: 0, // Keep pure for sleep
      lowPassFreq: 400,
      lowPassResonance: 1.2,
      highPassFreq: 60,
      highPassResonance: 0.3,
      lfo1Rate: 0.01,
      lfo1Depth: 0.3,
      lfo1Targets: {
        volume: { enabled: true, inverted: false },
        pitch1: { enabled: false, inverted: false },
        pitch2: { enabled: false, inverted: false },
        lowPassFreq: { enabled: false, inverted: false },
        highPassFreq: { enabled: false, inverted: false }
      },
      lfo2Rate: 0.03,
      lfo2Depth: 0.1,
      lfo2Targets: {
        volume: { enabled: false, inverted: false },
        pitch1: { enabled: true, inverted: false },
        pitch2: { enabled: false, inverted: false },
        lowPassFreq: { enabled: false, inverted: false },
        highPassFreq: { enabled: false, inverted: false }
      }
    }
  },
  {
    id: 'anxiety-relief',
    name: 'Anxiety Relief',
    description: 'Gentle, flowing tones to calm the nervous system',
    params: {
      volume: 0.35,
      pitch1: 174,
      pitch2: 261, // Solfeggio frequencies for healing
      wave1Type: 'sine',
      wave2Type: 'triangle',
      wave1Volume: 0.6,
      wave2Volume: 0.4,
      noiseVolume: 2.2, // Gentle pink noise for calming
      fmBlend: 0.1, // Very light modulation
      lowPassFreq: 600,
      lowPassResonance: 0.8,
      highPassFreq: 80,
      highPassResonance: 0.4,
      lfo1Rate: 0.04,
      lfo1Depth: 0.25,
      lfo1Targets: {
        volume: { enabled: true, inverted: false },
        pitch1: { enabled: false, inverted: false },
        pitch2: { enabled: false, inverted: false },
        lowPassFreq: { enabled: false, inverted: false },
        highPassFreq: { enabled: false, inverted: false }
      },
      lfo2Rate: 0.06,
      lfo2Depth: 0.08,
      lfo2Targets: {
        volume: { enabled: false, inverted: false },
        pitch1: { enabled: true, inverted: false },
        pitch2: { enabled: false, inverted: false },
        lowPassFreq: { enabled: false, inverted: false },
        highPassFreq: { enabled: false, inverted: false }
      }
    }
  },
  {
    id: 'chakra-balancing',
    name: 'Chakra Balancing',
    description: 'Sacred frequencies for energy alignment and spiritual harmony',
    params: {
      volume: 0.4,
      pitch1: 256,
      pitch2: 384, // Sacred ratio 3:2 for spiritual alignment
      wave1Type: 'sine',
      wave2Type: 'triangle',
      wave1Volume: 0.5,
      wave2Volume: 0.5,
      noiseVolume: 0, // Pure tones for chakra work
      fmBlend: 0.6, // Strong FM for complex harmonics
      lowPassFreq: 1000,
      lowPassResonance: 1.5,
      highPassFreq: 120,
      highPassResonance: 0.6,
      lfo1Rate: 0.07,
      lfo1Depth: 0.2,
      lfo1Targets: {
        volume: { enabled: false, inverted: false },
        pitch1: { enabled: true, inverted: false },
        pitch2: { enabled: false, inverted: false },
        lowPassFreq: { enabled: false, inverted: false },
        highPassFreq: { enabled: false, inverted: false }
      },
      lfo2Rate: 0.03,
      lfo2Depth: 0.15,
      lfo2Targets: {
        volume: { enabled: true, inverted: false },
        pitch1: { enabled: false, inverted: false },
        pitch2: { enabled: false, inverted: false },
        lowPassFreq: { enabled: false, inverted: false },
        highPassFreq: { enabled: false, inverted: false }
      }
    }
  },
  {
    id: 'nature-harmony',
    name: 'Nature Harmony',
    description: 'Organic, flowing tones that mirror natural rhythms',
    params: {
      volume: 0.45,
      pitch1: 196,
      pitch2: 147, // Natural fifth below for earthy feel
      wave1Type: 'triangle',
      wave2Type: 'sine',
      wave1Volume: 0.7,
      wave2Volume: 0.3,
      noiseVolume: 3.5, // More prominent nature-like noise
      fmBlend: 0.4, // Medium FM for organic complexity
      lowPassFreq: 800,
      lowPassResonance: 1.0,
      highPassFreq: 90,
      highPassResonance: 0.7,
      lfo1Rate: 0.05,
      lfo1Depth: 0.3,
      lfo1Targets: {
        volume: { enabled: true, inverted: false },
        pitch1: { enabled: false, inverted: false },
        pitch2: { enabled: false, inverted: false },
        lowPassFreq: { enabled: false, inverted: false },
        highPassFreq: { enabled: false, inverted: false }
      },
      lfo2Rate: 0.12,
      lfo2Depth: 0.12,
      lfo2Targets: {
        volume: { enabled: false, inverted: false },
        pitch1: { enabled: true, inverted: false },
        pitch2: { enabled: false, inverted: false },
        lowPassFreq: { enabled: false, inverted: false },
        highPassFreq: { enabled: false, inverted: false }
      }
    }
  },
  {
    id: 'morpheus',
    name: 'Morpheus',
    description: 'Ethereal dream frequencies to guide you into the realm of dreams',
    params: {
      volume: 0.2,
      pitch1: 98, // Deep G2 for grounding
      pitch2: 65.4, // C2 - perfect fourth below for dreamlike depth
      wave1Type: 'sine',
      wave2Type: 'triangle',
      wave1Volume: 0.5,
      wave2Volume: 0.5,
      noiseVolume: 0.5, // Barely audible dream mist
      fmBlend: 0.3, // Medium FM for ethereal dream complexity
      lowPassFreq: 300,
      lowPassResonance: 1.8,
      highPassFreq: 45,
      highPassResonance: 0.2,
      lfo1Rate: 0.008, // Ultra slow like breathing during REM
      lfo1Depth: 0.4,
      lfo1Targets: {
        volume: { enabled: true, inverted: false },
        pitch1: { enabled: false, inverted: false },
        pitch2: { enabled: false, inverted: false },
        lowPassFreq: { enabled: true, inverted: false },
        highPassFreq: { enabled: false, inverted: false }
      },
      lfo2Rate: 0.02,
      lfo2Depth: 0.15,
      lfo2Targets: {
        volume: { enabled: false, inverted: false },
        pitch1: { enabled: true, inverted: false },
        pitch2: { enabled: true, inverted: true }, // Inverted for dream-like phase shifting
        lowPassFreq: { enabled: false, inverted: false },
        highPassFreq: { enabled: false, inverted: false }
      }
    }
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Your personalized meditation settings',
    params: {
      volume: 0.3,
      pitch1: 220,
      pitch2: 220,
      wave1Type: 'sine',
      wave2Type: 'triangle',
      wave1Volume: 0.7,
      wave2Volume: 0.3,
      noiseVolume: 0,
      fmBlend: 0,
      lowPassFreq: 800,
      lowPassResonance: 1,
      highPassFreq: 80,
      highPassResonance: 1,
      lfo1Rate: 0.05,
      lfo1Depth: 0.2,
      lfo1Targets: {
        volume: { enabled: true, inverted: false },
        pitch1: { enabled: false, inverted: false },
        pitch2: { enabled: false, inverted: false },
        lowPassFreq: { enabled: false, inverted: false },
        highPassFreq: { enabled: false, inverted: false }
      },
      lfo2Rate: 0.3,
      lfo2Depth: 0.1,
      lfo2Targets: {
        volume: { enabled: false, inverted: false },
        pitch1: { enabled: true, inverted: false },
        pitch2: { enabled: false, inverted: false },
        lowPassFreq: { enabled: false, inverted: false },
        highPassFreq: { enabled: false, inverted: false }
      }
    }
  }
];

export const getPresetById = (id: string): MeditationPreset | undefined => {
  return meditationPresets.find(preset => preset.id === id);
};