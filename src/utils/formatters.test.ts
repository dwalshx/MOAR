import { describe, it, expect } from 'vitest';
import { formatRelativeDate, formatVolume } from './formatters';

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
