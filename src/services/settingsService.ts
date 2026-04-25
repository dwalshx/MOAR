const BODY_WEIGHT_KEY = 'moar_body_weight';
const BARS_KEY = 'moar_bars';
const PLATES_KEY = 'moar_plates';
const PLATE_MODE_KEY = 'moar_plate_mode';

export interface Bar {
  id: string;       // 'olympic', 'trap', or user-defined slug
  name: string;     // 'Olympic Bar', 'Trap Bar'
  weight: number;   // total bar weight in lbs
}

const DEFAULT_BARS: Bar[] = [
  { id: 'olympic', name: 'Olympic Bar', weight: 45 },
  { id: 'trap', name: 'Trap Bar', weight: 28 },
  { id: 'ezcurl', name: 'EZ Curl Bar', weight: 15 },
];

const DEFAULT_PLATES: number[] = [45, 35, 25, 10, 5, 2.5, 1];

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function readJSON<T>(key: string, fallback: T): T {
  if (!hasLocalStorage()) return fallback;
  try {
    const s = localStorage.getItem(key);
    if (!s) return fallback;
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, val: T): void {
  if (!hasLocalStorage()) return;
  localStorage.setItem(key, JSON.stringify(val));
}

export const settingsService = {
  // --- Body weight ---
  getBodyWeight(): number | null {
    if (!hasLocalStorage()) return null;
    const stored = localStorage.getItem(BODY_WEIGHT_KEY);
    if (!stored) return null;
    const parsed = parseFloat(stored);
    return isNaN(parsed) ? null : parsed;
  },

  setBodyWeight(lbs: number): void {
    if (!hasLocalStorage()) return;
    localStorage.setItem(BODY_WEIGHT_KEY, lbs.toString());
  },

  getEffectiveWeight(loggedWeight: number): number {
    if (loggedWeight > 0) return loggedWeight;
    const bw = this.getBodyWeight();
    return bw ?? 0;
  },

  // --- Bars ---
  getBars(): Bar[] {
    return readJSON<Bar[]>(BARS_KEY, DEFAULT_BARS);
  },

  setBars(bars: Bar[]): void {
    writeJSON(BARS_KEY, bars);
  },

  getBarById(id: string): Bar | null {
    return this.getBars().find(b => b.id === id) ?? null;
  },

  // --- Plates ---
  getPlates(): number[] {
    return readJSON<number[]>(PLATES_KEY, DEFAULT_PLATES);
  },

  setPlates(plates: number[]): void {
    writeJSON(PLATES_KEY, plates.slice().sort((a, b) => b - a));
  },

  // --- Plate mode toggle ---
  getPlateMode(): boolean {
    if (!hasLocalStorage()) return false;
    return localStorage.getItem(PLATE_MODE_KEY) === 'true';
  },

  setPlateMode(enabled: boolean): void {
    if (!hasLocalStorage()) return;
    localStorage.setItem(PLATE_MODE_KEY, enabled ? 'true' : 'false');
  },
};

/**
 * Compute the plate breakdown for a target weight on a given bar.
 * Returns plates per side (so each plate is added to both sides).
 * Greedy algorithm using largest plates first.
 */
export function computePlateBreakdown(targetWeight: number, barWeight: number, plates: number[]): {
  perSide: number[];
  remaining: number; // unaccounted-for weight (rounding error)
} {
  const total = targetWeight - barWeight;
  if (total <= 0) {
    return { perSide: [], remaining: total };
  }
  let perSideWeight = total / 2;
  const sortedPlates = [...plates].sort((a, b) => b - a);
  const perSide: number[] = [];
  for (const p of sortedPlates) {
    while (perSideWeight >= p - 0.001) {
      perSide.push(p);
      perSideWeight -= p;
    }
  }
  return { perSide, remaining: perSideWeight * 2 };
}
