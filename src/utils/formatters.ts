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
  if (totalLbs >= 1000) {
    return `${(totalLbs / 1000).toFixed(1)}k lbs`;
  }
  return `${totalLbs.toLocaleString()} lbs`;
}
