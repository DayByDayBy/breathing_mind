export interface SessionConfig {
  duration: number; // in minutes
  autoFadeOut: boolean;
  endBell: boolean;
}

export interface TimerState {
  isActive: boolean;
  startTime: number | null;
  duration: number; // in milliseconds
  remainingTime: number; // in milliseconds
  progress: number; // 0-1
}

export class SessionTimer {
  private state: TimerState;
  private intervalId: number | null = null;
  private onUpdate: (state: TimerState) => void;
  private onComplete: () => void;

  constructor(
    onUpdate: (state: TimerState) => void,
    onComplete: () => void
  ) {
    this.state = {
      isActive: false,
      startTime: null,
      duration: 0,
      remainingTime: 0,
      progress: 0
    };
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
  }

  start(durationMinutes: number) {
    const durationMs = durationMinutes * 60 * 1000;
    const now = Date.now();
    
    this.state = {
      isActive: true,
      startTime: now,
      duration: durationMs,
      remainingTime: durationMs,
      progress: 0
    };

    this.onUpdate(this.state);
    
    // Update every second
    this.intervalId = window.setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  stop() {
    this.state.isActive = false;
    this.clearInterval();
    this.onUpdate(this.state);
  }

  pause() {
    this.state.isActive = false;
    this.clearInterval();
    this.onUpdate(this.state);
  }

  resume() {
    if (this.state.remainingTime > 0) {
      this.state.isActive = true;
      this.state.startTime = Date.now() - (this.state.duration - this.state.remainingTime);
      
      this.intervalId = window.setInterval(() => {
        this.updateTimer();
      }, 1000);
      
      this.onUpdate(this.state);
    }
  }

  private updateTimer() {
    if (!this.state.isActive || !this.state.startTime) return;

    const now = Date.now();
    const elapsed = now - this.state.startTime;
    const remaining = Math.max(0, this.state.duration - elapsed);
    const progress = Math.min(1, elapsed / this.state.duration);

    this.state.remainingTime = remaining;
    this.state.progress = progress;

    if (remaining === 0) {
      this.state.isActive = false;
      this.clearInterval();
      this.onComplete();
    }

    this.onUpdate(this.state);
  }

  private clearInterval() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getState(): TimerState {
    return { ...this.state };
  }
}

export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const sessionDurations = [
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '20 minutes', value: 20 },
  { label: '45 minutes', value: 45 },
  { label: 'Unlimited', value: 0 }
];