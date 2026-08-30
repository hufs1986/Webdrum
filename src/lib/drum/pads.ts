export type PadId =
  | "kick"
  | "snare"
  | "clap"
  | "rim"
  | "chh"
  | "ohh"
  | "phh"
  | "crash"
  | "tomL"
  | "tomM"
  | "tomH"
  | "cowbell"
  | "shaker"
  | "ride"
  | "clave"
  | "zap";

export type PadDef = {
  id: PadId;
  name: string;
  sub: string;
  key: string;
};

export const PADS: PadDef[] = [
  { id: "kick", name: "킥", sub: "KICK", key: "1" },
  { id: "snare", name: "스네어", sub: "SNR", key: "2" },
  { id: "clap", name: "클랩", sub: "CLAP", key: "3" },
  { id: "rim", name: "림샷", sub: "RIM", key: "4" },
  { id: "chh", name: "클로즈햇", sub: "CHH", key: "Q" },
  { id: "ohh", name: "오픈햇", sub: "OHH", key: "W" },
  { id: "phh", name: "페달햇", sub: "PHH", key: "E" },
  { id: "crash", name: "크래시", sub: "CRS", key: "R" },
  { id: "tomL", name: "로우탐", sub: "TOM L", key: "A" },
  { id: "tomM", name: "미드탐", sub: "TOM M", key: "S" },
  { id: "tomH", name: "하이탐", sub: "TOM H", key: "D" },
  { id: "cowbell", name: "카우벨", sub: "CBL", key: "F" },
  { id: "shaker", name: "셰이커", sub: "SHK", key: "Z" },
  { id: "ride", name: "라이드", sub: "RIDE", key: "X" },
  { id: "clave", name: "클라베", sub: "CLV", key: "C" },
  { id: "zap", name: "잽", sub: "ZAP", key: "V" },
];

export const PAD_IDS = PADS.map((p) => p.id);

export const KEY_TO_PAD: Record<string, PadId> = Object.fromEntries(
  PADS.map((p) => [p.key.toLowerCase(), p.id]),
) as Record<string, PadId>;

export function emptyPattern(): Record<PadId, boolean[]> {
  return Object.fromEntries(PAD_IDS.map((id) => [id, Array.from({ length: 16 }, () => false)])) as Record<
    PadId,
    boolean[]
  >;
}

export type Preset = {
  id: string;
  name: string;
  bpm: number;
  swing: number;
  pattern: Record<PadId, boolean[]>;
};

function p(hits: Partial<Record<PadId, number[]>>): Record<PadId, boolean[]> {
  const pattern = emptyPattern();
  for (const [id, steps] of Object.entries(hits) as [PadId, number[]][]) {
    for (const s of steps) pattern[id][s] = true;
  }
  return pattern;
}

export const PRESETS: Preset[] = [
  {
    id: "boom",
    name: "붐뱃",
    bpm: 90,
    swing: 0.18,
    pattern: p({
      kick: [0, 8],
      snare: [4, 12],
      chh: [0, 2, 4, 6, 8, 10, 12, 14],
      shaker: [2, 6, 10, 14],
    }),
  },
  {
    id: "house",
    name: "하우스",
    bpm: 124,
    swing: 0,
    pattern: p({
      kick: [0, 4, 8, 12],
      clap: [4, 12],
      chh: [2, 6, 10, 14],
      ohh: [6, 14],
      shaker: [0, 4, 8, 12],
    }),
  },
  {
    id: "dnb",
    name: "리퀀드",
    bpm: 172,
    swing: 0.06,
    pattern: p({
      kick: [0, 10],
      snare: [4, 12],
      chh: [0, 2, 4, 6, 8, 10, 12, 14],
      ride: [0, 4, 8, 12],
      clave: [3, 11],
    }),
  },
  {
    id: "latin",
    name: "라틴",
    bpm: 108,
    swing: 0.08,
    pattern: p({
      kick: [0, 6, 10],
      rim: [4, 12],
      clave: [0, 3, 6, 10, 12],
      cowbell: [2, 8, 14],
      shaker: [0, 2, 4, 6, 8, 10, 12, 14],
      tomL: [7, 15],
    }),
  },
];
