import { getMaxValue, getYAxisWidth, niceCeil } from './chartLayout';

describe('getMaxValue', () => {
  it('returns the highest number for the given keys', () => {
    const rows = [
      { a: 3, b: 10, c: 99 },
      { a: 12, b: 'x' },
    ];
    expect(getMaxValue(rows, ['a', 'b'])).toBe(12);
  });

  it('returns 0 without numbers', () => {
    expect(getMaxValue([], ['a'])).toBe(0);
    expect(getMaxValue([{ a: NaN }], ['a'])).toBe(0);
  });
});

describe('niceCeil', () => {
  it.each([
    [0, 0],
    [0.8, 1],
    [1, 1],
    [1.3, 2],
    [2.3, 2.5],
    [3.4, 5],
    [7, 10],
    [1234, 2000],
    [0.042, 0.05],
  ])('rounds %p up to %p', (input, expected) => {
    expect(niceCeil(input)).toBe(expected);
  });
});

describe('getYAxisWidth', () => {
  it('fits the longest label', () => {
    expect(getYAxisWidth(['0', '1.500'])).toBe(5 * 7 + 10);
  });

  it('never goes below the minimum', () => {
    expect(getYAxisWidth(['0'])).toBe(28);
    expect(getYAxisWidth([], { min: 20 })).toBe(20);
  });

  it('accepts custom sizes', () => {
    expect(getYAxisWidth(['100%'], { charWidth: 6, padding: 4, min: 0 })).toBe(28);
  });
});
