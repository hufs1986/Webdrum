import { create } from "zustand";
import { drumEngine } from "./engine";
import { emptyPattern, PAD_IDS, PRESETS, type PadId } from "./pads";

type DrumState = {
  bpm: number;
  swing: number;
  volume: number;
  playing: boolean;
  currentStep: number;
  selectedPad: PadId;
  pattern: Record<PadId, boolean[]>;
  hits: Partial<Record<PadId, number>>;
  presetId: string;
  play: () => void;
  stop: () => void;
  togglePlay: () => void;
  setBpm: (n: number) => void;
  setSwing: (n: number) => void;
  setVolume: (n: number) => void;
  selectPad: (id: PadId) => void;
  hitPad: (id: PadId, velocity?: number) => void;
  toggleStep: (pad: PadId, step: number) => void;
  clearPattern: () => void;
  loadPreset: (id: string) => void;
};

let timer: number | null = null;
let nextNoteTime = 0;
let stepIndex = 0;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12;

function secondsPerStep(bpm: number) {
  return 60 / bpm / 4;
}

function scheduler(get: () => DrumState, set: (p: Partial<DrumState>) => void) {
  const state = get();
  if (!state.playing) return;
  const now = drumEngine.now();
  while (nextNoteTime < now + SCHEDULE_AHEAD) {
    const step = stepIndex;
    const swingDelay = step % 2 === 1 ? secondsPerStep(state.bpm) * state.swing * 0.55 : 0;
    const when = nextNoteTime + swingDelay;
    const livePattern = get().pattern;
    for (const id of PAD_IDS) {
      if (livePattern[id][step]) {
        drumEngine.trigger(id, 0.86, when);
      }
    }
    const delayMs = Math.max(0, (when - now) * 1000);
    window.setTimeout(() => {
      if (get().playing) set({ currentStep: step });
    }, delayMs);
    nextNoteTime += secondsPerStep(state.bpm);
    stepIndex = (stepIndex + 1) % 16;
  }
  timer = window.setTimeout(() => scheduler(get, set), LOOKAHEAD_MS);
}

export const useDrum = create<DrumState>((set, get) => ({
  bpm: PRESETS[0].bpm,
  swing: PRESETS[0].swing,
  volume: 0.85,
  playing: false,
  currentStep: -1,
  selectedPad: "kick",
  pattern: PRESETS[0].pattern,
  hits: {},
  presetId: PRESETS[0].id,

  play: () => {
    void drumEngine.resume().then(() => {
      if (get().playing) return;
      stepIndex = 0;
      nextNoteTime = drumEngine.now() + 0.06;
      set({ playing: true, currentStep: 0 });
      scheduler(get, set);
    });
  },
  stop: () => {
    if (timer != null) {
      window.clearTimeout(timer);
      timer = null;
    }
    stepIndex = 0;
    set({ playing: false, currentStep: -1 });
  },
  togglePlay: () => {
    if (get().playing) get().stop();
    else get().play();
  },
  setBpm: (n) => set({ bpm: Math.max(60, Math.min(200, Math.round(n))) }),
  setSwing: (n) => set({ swing: Math.max(0, Math.min(0.45, n)) }),
  setVolume: (n) => {
    const v = Math.max(0, Math.min(1, n));
    drumEngine.setVolume(v);
    set({ volume: v });
  },
  selectPad: (id) => set({ selectedPad: id }),
  hitPad: (id, velocity = 0.9) => {
    void drumEngine.resume();
    drumEngine.trigger(id, velocity);
    set({
      selectedPad: id,
      hits: { ...get().hits, [id]: Date.now() },
    });
  },
  toggleStep: (pad, step) => {
    const pattern = get().pattern;
    const next = pattern[pad].map((on, i) => (i === step ? !on : on));
    set({
      selectedPad: pad,
      pattern: { ...pattern, [pad]: next },
      presetId: "custom",
    });
  },
  clearPattern: () =>
    set({
      pattern: emptyPattern(),
      presetId: "custom",
    }),
  loadPreset: (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    set({
      presetId: preset.id,
      bpm: preset.bpm,
      swing: preset.swing,
      pattern: preset.pattern,
    });
  },
}));
