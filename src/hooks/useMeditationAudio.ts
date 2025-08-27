import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { createMeditationSynth, MeditationSynth, SynthParams, LFOTargets } from '@/utils/meditationSynth';
import { MeditationPreset } from '@/utils/presets';
import { SessionTimer, TimerState, SessionConfig } from '@/utils/sessionTimer';

export interface AudioParams {
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

export const useMeditationAudio = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPresetId, setCurrentPresetId] = useState<string>('custom');
  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    startTime: null,
    duration: 0,
    remainingTime: 0,
    progress: 0
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthRef = useRef<MeditationSynth | null>(null);
  const sessionTimerRef = useRef<SessionTimer | null>(null);

  const [params, setParams] = useState<AudioParams>({
    volume: 0.3,
    pitch1: 220, // A3 - nice calming frequency
    pitch2: 220, // Start with same pitch
    wave1Type: 'sine',
    wave2Type: 'triangle',
    wave1Volume: 0.7,
    wave2Volume: 0.3,
    noiseVolume: 0, // Start with no noise
    fmBlend: 0, // Start in parallel mode
    lowPassFreq: 800,
    lowPassResonance: 1,
    highPassFreq: 80,
    highPassResonance: 1,
    lfo1Rate: 0.05, // Very slow
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
  });

  const initializeAudioContext = useCallback(() => {
    const Ctor = (window.AudioContext || (window as any).webkitAudioContext);
    // Recreate if missing or previously closed (e.g., after HMR or unmount)
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new Ctor();
    }
    return audioContextRef.current!;
  }, []);

  const smoothTransition = useCallback((param: AudioParam, targetValue: number, duration = 0.1) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;
    
    const currentTime = audioContext.currentTime;
    param.cancelScheduledValues(currentTime);
    param.linearRampToValueAtTime(targetValue, currentTime + duration);
  }, []);

  // Session timer functions
  const startSession = useCallback((durationMinutes: number) => {
    if (sessionTimerRef.current && durationMinutes > 0) {
      console.log(`🎹 Starting ${durationMinutes} minute session`);
      sessionTimerRef.current.start(durationMinutes);
    }
  }, []);

  const stopSession = useCallback(() => {
    if (sessionTimerRef.current) {
      console.log('🎹 Stopping session timer');
      sessionTimerRef.current.stop();
    }
  }, []);

  const pauseSession = useCallback(() => {
    if (sessionTimerRef.current) {
      sessionTimerRef.current.pause();
    }
  }, []);

  const resumeSession = useCallback(() => {
    if (sessionTimerRef.current) {
      sessionTimerRef.current.resume();
    }
  }, []);

  // Initialize session timer
  useEffect(() => {
    const handleTimerUpdate = (state: TimerState) => {
      setTimerState(state);
      
      // Auto-fade when 30 seconds remaining
      if (state.remainingTime <= 30000 && state.remainingTime > 29000 && isPlaying) {
        console.log('🎹 Starting auto-fade (30s remaining)');
        if (synthRef.current) {
          smoothTransition(synthRef.current.masterGain.gain, 0.1, 10);
        }
      }
    };

    const handleTimerComplete = () => {
      console.log('🎹 Session timer completed - stopping audio');
      stopTone();
    };

    sessionTimerRef.current = new SessionTimer(handleTimerUpdate, handleTimerComplete);
    
    return () => {
      if (sessionTimerRef.current) {
        sessionTimerRef.current.stop();
      }
    };
  }, [isPlaying, smoothTransition]);

  const startTone = useCallback(async () => {
    if (isTransitioning) return;
    
    console.log('🎹 Starting meditation synth...');
    setIsTransitioning(true);
    
    const audioContext = initializeAudioContext();
    console.log('🎹 Audio context state:', audioContext.state);
    
    if (audioContext.state === 'suspended') {
      console.log('🎹 Resuming suspended audio context...');
      await audioContext.resume();
      console.log('🎹 Audio context resumed, new state:', audioContext.state);
    }

    try {
      // Create the meditation synth with current parameters
      const synth = createMeditationSynth(audioContext, params as SynthParams);
      synthRef.current = synth;
      
      setIsPlaying(true);
      
      // Fade in the volume smoothly
      console.log('🎹 Starting volume fade in...');
      smoothTransition(synth.masterGain.gain, params.volume, 1);
      
      setTimeout(() => {
        console.log('🎹 Meditation synth started successfully');
        setIsTransitioning(false);
      }, 100);
      
    } catch (error) {
      console.error('🎹 Error starting meditation synth:', error);
      setIsTransitioning(false);
    }
  }, [initializeAudioContext, params, isTransitioning, smoothTransition]);

  const stopTone = useCallback(() => {
    if (!synthRef.current || isTransitioning) return;
    
    console.log('🎹 Stopping meditation synth...');
    setIsTransitioning(true);
    
    const synth = synthRef.current;
    
    // Stop session timer when manually stopping
    stopSession();
    
    // Fade out smoothly over 3 seconds with exponential decay for natural feel
    const audioContext = audioContextRef.current;
    if (audioContext) {
      const currentTime = audioContext.currentTime;
      synth.masterGain.gain.cancelScheduledValues(currentTime);
      synth.masterGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 3);
    }

    setTimeout(() => {
      // Stop the synth
      synth.stop();
      synthRef.current = null;

      setIsTransitioning(false);
      setIsPlaying(false);
      console.log('🎹 Meditation synth stopped');
    }, 3000);
  }, [isTransitioning, stopSession]);

  // Debounced audio update to prevent excessive calls during dragging
  const audioUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateParam = useCallback((paramName: keyof AudioParams, value: any) => {
    console.log(`🎹 Updating ${paramName} to:`, value);
    
    // Update state immediately for UI responsiveness
    setParams(prev => ({ ...prev, [paramName]: value }));
    
    // Mark preset as custom when manually adjusting parameters (debounced)
    if (audioUpdateTimeoutRef.current) {
      clearTimeout(audioUpdateTimeoutRef.current);
    }
    
    audioUpdateTimeoutRef.current = setTimeout(() => {
      if (currentPresetId !== 'custom') {
        setCurrentPresetId('custom');
      }
    }, 100);
    
    // Update the running synth directly for real-time control (no debounce)
    if (synthRef.current && isPlaying) {
      try {
        if (paramName === 'volume') {
          // Volume uses smooth transition
          smoothTransition(synthRef.current.masterGain.gain, value as number);
        } else if (paramName === 'wave1Type') {
          // Wave type requires hot-swapping oscillator
          synthRef.current.replaceOscillator(1, value as OscillatorType);
        } else if (paramName === 'wave2Type') {
          // Wave type requires hot-swapping oscillator
          synthRef.current.replaceOscillator(2, value as OscillatorType);
        } else {
          // All other parameters can be updated directly
          synthRef.current.updateParam(paramName, value);
        }
      } catch (error) {
        console.error(`🎹 Error updating ${paramName}:`, error);
      }
    }
  }, [isPlaying, smoothTransition, currentPresetId]);

  const loadPreset = useCallback((preset: MeditationPreset) => {
    console.log(`🎹 Loading preset: ${preset.name}`);
    setCurrentPresetId(preset.id);
    
    // Update all parameters
    setParams(preset.params);
    
    // If playing, update the running synth with all new parameters
    if (synthRef.current && isPlaying) {
      // Update each parameter on the running synth
      Object.entries(preset.params).forEach(([paramName, value]) => {
        if (paramName === 'volume') {
          smoothTransition(synthRef.current!.masterGain.gain, value as number);
        } else if (paramName === 'wave1Type') {
          synthRef.current!.replaceOscillator(1, value as OscillatorType);
        } else if (paramName === 'wave2Type') {
          synthRef.current!.replaceOscillator(2, value as OscillatorType);
        } else {
          synthRef.current!.updateParam(paramName as keyof AudioParams, value);
        }
      });
    }
  }, [isPlaying, smoothTransition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
        synthRef.current = null;
      }
      if (sessionTimerRef.current) {
        sessionTimerRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Add LFO targets update function
  const updateLFOTargets = useCallback((lfoNum: 1 | 2, targets: LFOTargets) => {
    console.log(`🎹 Updating LFO${lfoNum} targets:`, targets);
    
    // Update state immediately for UI responsiveness
    setParams(prev => ({ 
      ...prev, 
      [`lfo${lfoNum}Targets`]: targets 
    }));
    
    // Mark preset as custom when manually adjusting parameters
    if (currentPresetId !== 'custom') {
      setCurrentPresetId('custom');
    }
    
    // Update the running synth directly for real-time control
    if (synthRef.current && isPlaying) {
      try {
        synthRef.current.updateLFOTargets(lfoNum, targets);
      } catch (error) {
        console.error(`🎹 Error updating LFO${lfoNum} targets:`, error);
      }
    }
  }, [isPlaying, currentPresetId]);

  return {
    isPlaying,
    isTransitioning,
    params,
    currentPresetId,
    timerState,
    startTone,
    stopTone,
    updateParam,
    updateLFOTargets,
    loadPreset,
    startSession,
    stopSession,
    pauseSession,
    resumeSession
  };
};