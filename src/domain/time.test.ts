import { describe, expect, it } from 'vitest';
import { formatCountdown } from './time';

describe('formatCountdown', () => {
  it('formatea mm:ss y h:mm:ss', () => {
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(65)).toBe('01:05');
    expect(formatCountdown(3600)).toBe('1:00:00');
    expect(formatCountdown(3725)).toBe('1:02:05');
  });
  it('no muestra negativos', () => {
    expect(formatCountdown(-10)).toBe('00:00');
  });
});
