import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useMeditationAudio, AudioParams } from '@/hooks/useMeditationAudio';
import { LFOTargets } from '@/utils/meditationSynth';
import { meditationPresets, getPresetById } from '@/utils/presets';
import { sessionDurations, formatTime } from '@/utils/sessionTimer';
import { Play, Pause, Volume2, Waves, Filter, Zap, Bookmark, Timer, Clock } from 'lucide-react';

// Component definitions - moved outside main component to prevent re-creation on each render
const ControlGroup = ({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode 
}) => (
  <Card className="p-6 bg-gradient-card border-0 shadow-soft backdrop-blur-sm">
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-meditation-primary" />
      <h3 className="text-lg font-medium text-card-foreground">{title}</h3>
    </div>
    {children}
  </Card>
);

const SliderControl = React.memo(({ 
  label, 
  value, 
  min, 
  max, 
  step, 
  onChange,
  formatValue
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <span className="text-sm text-meditation-primary font-mono">
        {formatValue ? formatValue(value) : value.toFixed(2)}
      </span>
    </div>
    <Slider
      value={[value]}
      onValueChange={([val]) => onChange(val)}
      min={min}
      max={max}
      step={step}
      className="w-full"
    />
  </div>
));

const WaveSelector = React.memo(({ 
  label, 
  value, 
  onChange 
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-muted-foreground">{label}</label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="sine">Sine</SelectItem>
        <SelectItem value="triangle">Triangle</SelectItem>
        <SelectItem value="square">Square</SelectItem>
        <SelectItem value="sawtooth">Sawtooth</SelectItem>
      </SelectContent>
    </Select>
  </div>
));

const LFOTargetControl = React.memo(({ 
  lfoNum, 
  targets, 
  onUpdateTargets 
}: {
  lfoNum: 1 | 2;
  targets: LFOTargets;
  onUpdateTargets: (targets: LFOTargets) => void;
}) => {
  const targetLabels = {
    volume: 'Volume',
    pitch1: 'Pitch 1',
    pitch2: 'Pitch 2',
    lowPassFreq: 'Low Pass Filter',
    highPassFreq: 'High Pass Filter'
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-muted-foreground">Modulation Targets</label>
      <div className="space-y-3">
        {(Object.keys(targetLabels) as Array<keyof LFOTargets>).map((targetKey) => (
          <div key={targetKey} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`lfo${lfoNum}-${targetKey}`}
                checked={targets[targetKey].enabled}
                onCheckedChange={(checked) => {
                  const newTargets = {
                    ...targets,
                    [targetKey]: { ...targets[targetKey], enabled: checked as boolean }
                  };
                  onUpdateTargets(newTargets);
                }}
              />
              <label 
                htmlFor={`lfo${lfoNum}-${targetKey}`}
                className="text-sm text-card-foreground cursor-pointer"
              >
                {targetLabels[targetKey]}
              </label>
            </div>
            {targets[targetKey].enabled && (
              <div className="flex items-center space-x-2">
                <Switch
                  id={`lfo${lfoNum}-${targetKey}-invert`}
                  checked={targets[targetKey].inverted}
                  onCheckedChange={(inverted) => {
                    const newTargets = {
                      ...targets,
                      [targetKey]: { ...targets[targetKey], inverted }
                    };
                    onUpdateTargets(newTargets);
                  }}
                />
                <label 
                  htmlFor={`lfo${lfoNum}-${targetKey}-invert`}
                  className="text-xs text-muted-foreground"
                >
                  Invert
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

const MeditationToneGenerator = () => {
  const { 
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
    stopSession
  } = useMeditationAudio();

  const [sessionDuration, setSessionDuration] = React.useState(20);

  const handlePresetChange = React.useCallback((presetId: string) => {
    const preset = getPresetById(presetId);
    if (preset) {
      loadPreset(preset);
    }
  }, [loadPreset]);

  const handleSessionStart = React.useCallback((durationMinutes: number) => {
    if (durationMinutes > 0) {
      startSession(durationMinutes);
      if (!isPlaying) {
        handlePlayPause();
      }
    } else {
      // Unlimited session - just start playing without timer
      if (!isPlaying) {
        handlePlayPause();
      }
    }
  }, [startSession, isPlaying]);

  const handlePlayPause = React.useCallback(() => {
    if (isPlaying) {
      stopTone();
    } else {
      startTone();
    }
  }, [isPlaying, stopTone, startTone]);

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8 relative">
        {/* Side Elements */}
        <div className="absolute left-0 top-48 w-48">
          <Card className="p-3 bg-gradient-card border-0 shadow-soft backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Bookmark className="w-3 h-3 text-meditation-primary" />
              <h3 className="text-xs font-medium text-card-foreground">Presets</h3>
            </div>
            <Select value={currentPresetId} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-full text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meditationPresets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </div>

        <div className="absolute right-20 top-48 w-48">
          <p className="text-sm text-muted-foreground leading-relaxed text-right">
            Create your perfect meditative soundscape with customizable tones and soothing frequencies
          </p>
        </div>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
            Breathing Mind Meditation Tone
          </h1>
        </div>

        {/* Central Play Button */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-glow rounded-full blur-xl opacity-30"></div>
            <Button
              onClick={handlePlayPause}
              disabled={isTransitioning}
              className={`
                relative w-32 h-32 rounded-full text-2xl transition-all duration-500
                ${isPlaying 
                  ? 'bg-meditation-secondary hover:bg-meditation-secondary/90 shadow-glow' 
                  : 'bg-gradient-hero hover:shadow-glow shadow-medium'
                }
                ${isTransitioning ? 'scale-95 opacity-75' : 'hover:scale-105'}
              `}
            >
              {isTransitioning ? (
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-12 h-12" />
              ) : (
                <Play className="w-12 h-12 ml-1" />
              )}
            </Button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
          
          {/* Session Timer */}
          <div className="flex justify-center">
            <Card className="w-96 p-4 bg-gradient-card border-0 shadow-soft backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Timer className="w-4 h-4 text-meditation-primary" />
                <h3 className="text-sm font-medium text-card-foreground">Session Timer</h3>
              </div>
              <div className="space-y-4">
                
                {/* Timer Display */}
                {timerState.isActive && (
                  <div className="text-center space-y-3">
                    <div className="text-2xl font-mono text-meditation-primary">
                      {formatTime(timerState.remainingTime)}
                    </div>
                    <Progress 
                      value={timerState.progress * 100} 
                      className="w-full h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Session in progress
                    </p>
                  </div>
                )}

                {/* Duration Slider */}
                <div className="space-y-4">
                  <SliderControl
                    label="Session Duration"
                    value={timerState.isActive ? timerState.duration / (60 * 1000) : sessionDuration}
                    min={1}
                    max={60}
                    step={1}
                    onChange={(value) => {
                      if (!timerState.isActive) {
                        setSessionDuration(value);
                      }
                    }}
                    formatValue={(v) => `${v} min`}
                  />
                  
                  {!timerState.isActive && (
                    <Button
                      onClick={() => handleSessionStart(sessionDuration)}
                      className="w-full text-sm"
                      size="sm"
                    >
                      Start {sessionDuration} min Session
                    </Button>
                  )}
                  
                  {timerState.isActive && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        stopSession();
                        if (isPlaying) {
                          stopTone();
                        }
                      }}
                      className="w-full text-sm"
                      size="sm"
                    >
                      Stop Session
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Controls */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Main Controls */}
              <Card className="p-3 bg-gradient-card border-0 shadow-soft backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-5 h-5 text-meditation-primary" />
                  <h3 className="text-lg font-medium text-card-foreground">Main Controls</h3>
                </div>
                <div className="space-y-3">
                  <SliderControl
                    label="Master Volume"
                    value={params.volume}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => updateParam('volume', value)}
                    formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <SliderControl
                    label="Pitch 1 (Hz)"
                    value={params.pitch1}
                    min={80}
                    max={800}
                    step={0.01}
                    onChange={(value) => updateParam('pitch1', value)}
                    formatValue={(v) => `${v.toFixed(0)} Hz`}
                  />
                  <SliderControl
                    label="Pitch 2 (Hz)"
                    value={params.pitch2}
                    min={80}
                    max={800}
                    step={0.01}
                    onChange={(value) => updateParam('pitch2', value)}
                    formatValue={(v) => `${v.toFixed(0)} Hz`}
                  />
                  <SliderControl
                    label="White Noise"
                    value={params.noiseVolume}
                    min={0}
                    max={12}
                    step={0.1}
                    onChange={(value) => updateParam('noiseVolume', value)}
                    formatValue={(v) => v === 0 ? 'Silent' : `-${(12 - v).toFixed(1)}dB`}
                  />
                  <SliderControl
                    label="FM Blend"
                    value={params.fmBlend}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => updateParam('fmBlend', value)}
                    formatValue={(v) => v === 0 ? 'Parallel' : v === 1 ? 'Full FM' : `${(v * 100).toFixed(0)}% FM`}
                  />
                </div>
              </Card>

              {/* Wave Controls */}
              <ControlGroup title="Wave Generator" icon={Waves}>
                <div className="space-y-6">
                  <WaveSelector
                    label="Wave 1 Type"
                    value={params.wave1Type}
                    onChange={(value) => updateParam('wave1Type', value as OscillatorType)}
                  />
                  <SliderControl
                    label="Wave 1 Volume"
                    value={params.wave1Volume}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => updateParam('wave1Volume', value)}
                    formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <WaveSelector
                    label="Wave 2 Type"
                    value={params.wave2Type}
                    onChange={(value) => updateParam('wave2Type', value as OscillatorType)}
                  />
                  <SliderControl
                    label="Wave 2 Volume"
                    value={params.wave2Volume}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => updateParam('wave2Volume', value)}
                    formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                </div>
              </ControlGroup>

              {/* Filter Controls */}
              <ControlGroup title="Filters" icon={Filter}>
                <div className="space-y-6">
                  <SliderControl
                    label="Low Pass Frequency"
                    value={params.lowPassFreq}
                    min={200}
                    max={2000}
                    step={1}
                    onChange={(value) => updateParam('lowPassFreq', value)}
                    formatValue={(v) => `${v.toFixed(0)} Hz`}
                  />
                  <SliderControl
                    label="Low Pass Resonance"
                    value={params.lowPassResonance}
                    min={0.1}
                    max={10}
                    step={0.01}
                    onChange={(value) => updateParam('lowPassResonance', value)}
                  />
                  <SliderControl
                    label="High Pass Frequency"
                    value={params.highPassFreq}
                    min={20}
                    max={400}
                    step={0.5}
                    onChange={(value) => updateParam('highPassFreq', value)}
                    formatValue={(v) => `${v.toFixed(0)} Hz`}
                  />
                  <SliderControl
                    label="High Pass Resonance"
                    value={params.highPassResonance}
                    min={0.1}
                    max={10}
                    step={0.01}
                    onChange={(value) => updateParam('highPassResonance', value)}
                  />
                </div>
              </ControlGroup>

              {/* LFO 1 Controls */}
              <ControlGroup title="Slow LFO (0.01-0.1 Hz)" icon={Zap}>
                <div className="space-y-6">
                  <SliderControl
                    label="Rate"
                    value={params.lfo1Rate}
                    min={0.01}
                    max={0.1}
                    step={0.001}
                    onChange={(value) => updateParam('lfo1Rate', value)}
                    formatValue={(v) => `${v.toFixed(3)} Hz`}
                  />
                  <SliderControl
                    label="Depth"
                    value={params.lfo1Depth}
                    min={-1}
                    max={1}
                    step={0.01}
                    onChange={(value) => updateParam('lfo1Depth', value)}
                    formatValue={(v) => v.toFixed(2)}
                  />
                  <LFOTargetControl
                    lfoNum={1}
                    targets={params.lfo1Targets}
                    onUpdateTargets={(targets) => updateLFOTargets(1, targets)}
                  />
                </div>
              </ControlGroup>

              {/* LFO 2 Controls */}
              <ControlGroup title="Fast LFO (0-1 Hz)" icon={Zap}>
                <div className="space-y-6">
                  <SliderControl
                    label="Rate"
                    value={params.lfo2Rate}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => updateParam('lfo2Rate', value)}
                    formatValue={(v) => `${v.toFixed(2)} Hz`}
                  />
                  <SliderControl
                    label="Depth"
                    value={params.lfo2Depth}
                    min={-1}
                    max={1}
                    step={0.01}
                    onChange={(value) => updateParam('lfo2Depth', value)}
                    formatValue={(v) => v.toFixed(2)}
                  />
                  <LFOTargetControl
                    lfoNum={2}
                    targets={params.lfo2Targets}
                    onUpdateTargets={(targets) => updateLFOTargets(2, targets)}
                  />
                </div>
              </ControlGroup>

              {/* Status Card */}
              <ControlGroup title="Status" icon={Waves}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">State</span>
                    <span className={`text-sm font-medium ${
                      isTransitioning ? 'text-accent' : isPlaying ? 'text-meditation-primary' : 'text-muted-foreground'
                    }`}>
                      {isTransitioning ? 'Transitioning...' : isPlaying ? 'Playing' : 'Stopped'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {isPlaying 
                      ? 'Your meditation tone is now playing. Adjust the controls above to customize your experience.'
                      : 'Press the play button to start your meditation session. All changes will be applied gradually.'
                    }
                  </div>
                </div>
              </ControlGroup>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>Find your perfect meditative frequency. All transitions are gradual to maintain your peaceful state.</p>
        </div>
      </div>
    </div>
  );
};

export default MeditationToneGenerator;