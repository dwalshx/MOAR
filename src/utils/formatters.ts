export function formatRelativeDate(date: Date): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffMs = now.getTime() - target.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays >= 2 && diffDays <= 6) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatVolume(totalLbs: number): string {
  if (totalLbs === 0) return '0 lbs';
  if (totalLbs >= 1000) {
    return `${(totalLbs / 1000).toFixed(1)}k lbs`;
  }
  return `${totalLbs.toLocaleString()} lbs`;
}

/**
 * Compute effective volume for a set, substituting body weight when logged weight is 0.
 */
export function setVolume(weight: number, reps: number, bodyWeight: number | null): number {
  const effectiveWeight = weight > 0 ? weight : (bodyWeight ?? 0);
  return effectiveWeight * reps;
}

export function formatAbsoluteDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatChartDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return '--';
  if (minutes === 0) return '< 1 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
