import { create } from 'zustand';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

interface SoundState {
  isEnabled: boolean;
  toggleSound: () => void;
  playSuccess: () => void;
  playPop: () => void;
  playTick: () => void;
  playDelete: () => void;
}

export const useSoundStore = create<SoundState>((set, get) => ({
  isEnabled: typeof window !== 'undefined' ? localStorage.getItem('flow_studio_sound') !== 'false' : true,

  toggleSound: () => {
    const next = !get().isEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('flow_studio_sound', String(next));
    }
    set({ isEnabled: next });
  },

  playSuccess: () => {
    if (!get().isEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic Chord Chime (C5 + E5)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now); // G5
    osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.12); // C6

    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.22);
    osc2.stop(now + 0.22);
  },

  playPop: () => {
    if (!get().isEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

    gainNode.gain.setValueAtTime(0.07, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  },

  playTick: () => {
    if (!get().isEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);

    gainNode.gain.setValueAtTime(0.025, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  },

  playDelete: () => {
    if (!get().isEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.12);

    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  },
}));

export const sound = {
  success: () => useSoundStore.getState().playSuccess(),
  pop: () => useSoundStore.getState().playPop(),
  tick: () => useSoundStore.getState().playTick(),
  delete: () => useSoundStore.getState().playDelete(),
  toggle: () => useSoundStore.getState().toggleSound(),
};
