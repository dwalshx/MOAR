const BODY_WEIGHT_KEY = 'moar_body_weight';

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export const settingsService = {
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

  /**
   * Returns the effective weight for volume calculations.
   * If the logged weight is 0 and a body weight is set, uses body weight.
   * Otherwise returns the logged weight as-is.
   */
  getEffectiveWeight(loggedWeight: number): number {
    if (loggedWeight > 0) return loggedWeight;
    const bw = this.getBodyWeight();
    return bw ?? 0;
  },
};
