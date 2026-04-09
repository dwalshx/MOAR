/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLongPress } from './useLongPress';

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onTap for quick press-release', () => {
    const onTap = vi.fn();
    const onLongPress = vi.fn();

    const { result } = renderHook(() => useLongPress(onTap, onLongPress));

    result.current.onTouchStart();
    result.current.onTouchEnd();

    expect(onTap).toHaveBeenCalledTimes(1);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('calls onLongPress after threshold', () => {
    const onTap = vi.fn();
    const onLongPress = vi.fn();

    const { result } = renderHook(() => useLongPress(onTap, onLongPress));

    result.current.onTouchStart();
    vi.advanceTimersByTime(400);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onTap).not.toHaveBeenCalled();
  });

  it('does not call onTap after long press', () => {
    const onTap = vi.fn();
    const onLongPress = vi.fn();

    const { result } = renderHook(() => useLongPress(onTap, onLongPress));

    result.current.onTouchStart();
    vi.advanceTimersByTime(400);
    result.current.onTouchEnd();

    expect(onTap).not.toHaveBeenCalled();
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('auto-repeats on sustained hold', () => {
    const onTap = vi.fn();
    const onLongPress = vi.fn();

    const { result } = renderHook(() => useLongPress(onTap, onLongPress));

    result.current.onTouchStart();
    // Trigger initial long press at 400ms
    vi.advanceTimersByTime(400);
    expect(onLongPress).toHaveBeenCalledTimes(1);

    // Advance 300ms more = 2 repeats at 150ms interval
    vi.advanceTimersByTime(300);
    expect(onLongPress).toHaveBeenCalledTimes(3);

    result.current.onTouchEnd();
  });

  it('supports custom threshold', () => {
    const onTap = vi.fn();
    const onLongPress = vi.fn();

    const { result } = renderHook(() => useLongPress(onTap, onLongPress, 200));

    result.current.onTouchStart();
    vi.advanceTimersByTime(200);

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});
