let audioCtx: AudioContext | null = null;
let soundMuted = false;

export function setSoundMuted(muted: boolean) {
  soundMuted = muted;
}

export function isSoundMuted(): boolean {
  return soundMuted;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq: number, startDelay: number, duration: number, type: OscillatorType = 'sine', vol = 0.18) {
  if (soundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
    gain.gain.setValueAtTime(vol, ctx.currentTime + startDelay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + startDelay);
    osc.stop(ctx.currentTime + startDelay + duration + 0.05);
  } catch {
    // Ignore audio play errors
  }
}

export const soundEffects = {
  correct: () => {
    playTone(660, 0, 0.1, 'sine', 0.2);
    playTone(990, 0.08, 0.14, 'sine', 0.22);
  },
  wrong: () => {
    playTone(180, 0, 0.3, 'square', 0.12);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch {
        // Vibration not allowed or supported
      }
    }
  },
  levelUp: () => {
    playTone(523, 0, 0.1, 'sine', 0.2);
    playTone(659, 0.1, 0.1, 'sine', 0.2);
    playTone(784, 0.2, 0.18, 'triangle', 0.24);
  },
  gameOver: () => {
    playTone(440, 0, 0.2, 'sawtooth', 0.12);
    playTone(330, 0.2, 0.2, 'sawtooth', 0.12);
    playTone(220, 0.4, 0.35, 'sawtooth', 0.14);
  },
  click: () => {
    playTone(750, 0, 0.04, 'sine', 0.08);
  },
  splat: () => {
    playTone(400, 0, 0.06, 'triangle', 0.15);
    playTone(850, 0.05, 0.12, 'sine', 0.2);
  }
};
