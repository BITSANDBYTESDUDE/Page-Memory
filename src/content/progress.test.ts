import { describe, expect, it } from 'vitest';
import { calculateReadingProgress } from './progress';

describe('calculateReadingProgress', () => {
  it('accounts for the viewport height in the scrollable range', () => {
    expect(calculateReadingProgress(400, 2_000, 800)).toBe(1 / 3);
  });

  it('returns zero when the document has no scrollable area', () => {
    expect(calculateReadingProgress(0, 800, 800)).toBe(0);
    expect(calculateReadingProgress(0, 0, 0)).toBe(0);
  });

  it('clamps progress to the valid range', () => {
    expect(calculateReadingProgress(-100, 2_000, 800)).toBe(0);
    expect(calculateReadingProgress(5_000, 2_000, 800)).toBe(1);
  });

  it('handles non-finite inputs without producing NaN', () => {
    expect(calculateReadingProgress(Number.NaN, Number.POSITIVE_INFINITY, 800)).toBe(0);
  });
});
