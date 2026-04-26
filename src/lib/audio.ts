/**
 * Minimal Web Audio helper for the rest-timer ding.
 * No assets — generates a short tone programmatically.
 *
 * iOS Safari requires the AudioContext to be created/resumed inside a
 * user gesture. We expose `unlockAudio()` which can be called when the
 * user logs a set (which is a gesture), so subsequent timer-driven dings
 * will play.
 */

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  // Webkit prefix for older Safari
  const Ctor = window.AudioContext || (window as unknown as {
    webkitAudioContext?: typeof AudioContext;
  }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Should be called inside a user gesture (e.g., button click) to allow
 * subsequent programmatic playback on iOS Safari. Idempotent.
 */
export function unlockAudio(): void {
  const c = getContext();
  if (c && c.state === 'suspended') {
    c.resume().catch(() => {});
  }
}

/** Play a short two-tone "ding" — pleasant, non-startling. */
export function playDing(): void {
  const c = getContext();
  if (!c) return;
  if (c.state === 'suspended') {
    c.resume().catch(() => {});
  }
  const now = c.currentTime;

  // Tone 1: 880 Hz for 100ms
  toneAt(c, 880, now, 0.12, 0.18);
  // Tone 2: 1320 Hz starting 80ms later, 120ms
  toneAt(c, 1320, now + 0.08, 0.14, 0.18);
}

function toneAt(c: AudioContext, freq: number, startTime: number, duration: number, peakGain: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  // Quick fade-in/out envelope so it doesn't click
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

/** Vibrate the device if supported (mobile). */
export function vibrate(pattern: number | number[] = [80]): void {
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern);
  }
}
