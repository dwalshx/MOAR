import { describe, it, expect } from 'vitest';
import { formatRelativeDate, formatVolume, formatAbsoluteDate, formatChartDate, formatDuration } from './formatters';

describe('formatRelativeDate', () => {
  function daysAgo(n: number): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return d;
  }

  it('returns "Today" for today\'s date', () => {
    expect(formatRelativeDate(new Date())).toBe('Today');
  });

  it('returns "Yesterday" for yesterday\'s date', () => {
    expect(formatRelativeDate(daysAgo(1))).toBe('Yesterday');
  });

  it('returns weekday abbreviation for 3 days ago', () => {
    const date = daysAgo(3);
    const expected = date.toLocaleDateString('en-US', { weekday: 'short' });
    expect(formatRelativeDate(date)).toBe(expected);
  });

  it('returns weekday abbreviation for 6 days ago', () => {
    const date = daysAgo(6);
    const expected = date.toLocaleDateString('en-US', { weekday: 'short' });
    expect(formatRelativeDate(date)).toBe(expected);
  });

  it('returns "Mon D" format for 8 days ago', () => {
    const date = daysAgo(8);
    const expected = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    expect(formatRelativeDate(date)).toBe(expected);
  });

  it('returns "Mon D" format for 30 days ago', () => {
    const date = daysAgo(30);
    const expected = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    expect(formatRelativeDate(date)).toBe(expected);
  });
});

describe('formatVolume', () => {
  it('returns "0 lbs" for zero', () => {
    expect(formatVolume(0)).toBe('0 lbs');
  });

  it('returns "500 lbs" for 500', () => {
    expect(formatVolume(500)).toBe('500 lbs');
  });

  it('returns "1.5k lbs" for 1500', () => {
    expect(formatVolume(1500)).toBe('1.5k lbs');
  });

  it('returns "10.0k lbs" for 10000', () => {
    expect(formatVolume(10000)).toBe('10.0k lbs');
  });

  it('returns "999 lbs" for 999', () => {
    expect(formatVolume(999)).toBe('999 lbs');
  });

  it('returns "1.0k lbs" for 1000', () => {
    expect(formatVolume(1000)).toBe('1.0k lbs');
  });
});

describe('formatAbsoluteDate', () => {
  it('returns "Apr 9, 2026" for April 9 2026', () => {
    expect(formatAbsoluteDate(new Date(2026, 3, 9))).toBe('Apr 9, 2026');
  });

  it('returns "Jan 1, 2025" for January 1 2025', () => {
    expect(formatAbsoluteDate(new Date(2025, 0, 1))).toBe('Jan 1, 2025');
  });

  it('returns "Dec 25, 2026" for December 25 2026', () => {
    expect(formatAbsoluteDate(new Date(2026, 11, 25))).toBe('Dec 25, 2026');
  });
});

describe('formatChartDate', () => {
  it('returns "Apr 9" for April 9 2026', () => {
    expect(formatChartDate(new Date(2026, 3, 9))).toBe('Apr 9');
  });

  it('returns "Jan 1" for January 1 2025', () => {
    expect(formatChartDate(new Date(2025, 0, 1))).toBe('Jan 1');
  });
});

describe('formatDuration', () => {
  it('returns "--" for null', () => {
    expect(formatDuration(null)).toBe('--');
  });

  it('returns "< 1 min" for 0', () => {
    expect(formatDuration(0)).toBe('< 1 min');
  });

  it('returns "45 min" for 45', () => {
    expect(formatDuration(45)).toBe('45 min');
  });

  it('returns "1h 30m" for 90', () => {
    expect(formatDuration(90)).toBe('1h 30m');
  });

  it('returns "1h" for 60', () => {
    expect(formatDuration(60)).toBe('1h');
  });

  it('returns "2h 15m" for 135', () => {
    expect(formatDuration(135)).toBe('2h 15m');
  });
});
