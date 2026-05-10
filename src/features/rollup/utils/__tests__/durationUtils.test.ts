import { describe, it, expect } from 'vitest';
import { formatEtaMs } from '../durationUtils';

describe('formatEtaMs', () => {
  it('returns "< 1m" for 0 ms', () => {
    expect(formatEtaMs(0)).toBe('< 1m');
  });

  it('returns "< 1m" for negative ms', () => {
    expect(formatEtaMs(-5000)).toBe('< 1m');
  });

  it('returns seconds when under 60s', () => {
    expect(formatEtaMs(45_000)).toBe('~45s');
  });

  it('returns minutes when under 1h', () => {
    expect(formatEtaMs(8 * 60_000)).toBe('~8m');
    expect(formatEtaMs(8 * 60_000 + 30_000)).toBe('~8m');
  });

  it('returns hours and minutes when 1h+', () => {
    expect(formatEtaMs(90 * 60_000)).toBe('~1h 30m');
    expect(formatEtaMs(60 * 60_000)).toBe('~1h 0m');
  });
});
