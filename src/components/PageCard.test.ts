import { describe, expect, it } from 'vitest';
import { formatLastReadAt, getPageDomain, getPageProgress, getPageTitle } from './PageCard';

describe('PageCard display helpers', () => {
  it('provides safe fallbacks for missing metadata', () => {
    expect(getPageTitle({ title: '  ', url: '  ' })).toBe('Untitled page');
    expect(getPageDomain({ domain: '', url: 'https://example.com/article' })).toBe('example.com');
    expect(getPageDomain({ domain: '', url: 'not-a-url' })).toBe('Unknown domain');
  });

  it('clamps invalid reading progress to a display-safe percentage', () => {
    expect(getPageProgress(-10)).toBe(0);
    expect(getPageProgress(125)).toBe(100);
    expect(getPageProgress(Number.NaN)).toBe(0);
  });

  it('formats recent and missing read timestamps compactly', () => {
    const now = Date.parse('2026-10-09T12:00:00.000Z');
    expect(formatLastReadAt(null, now)).toBe('Not read yet');
    expect(formatLastReadAt('2026-10-09T11:45:00.000Z', now)).toBe('15m ago');
    expect(formatLastReadAt('2026-10-09T13:00:00.000Z', now)).toBe('Not read yet');
  });
});
