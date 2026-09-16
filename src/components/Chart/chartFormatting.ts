/**
 * Number formatting helpers shared by the statistics charts.
 * All output uses Dutch conventions (dot as thousands separator, comma as
 * decimal separator).
 */

const fullFormatter = new Intl.NumberFormat('nl-NL', {maximumFractionDigits: 0});
const compactFormatter = new Intl.NumberFormat('nl-NL', {
  notation: 'compact',
  maximumFractionDigits: 1
});

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * Full number for tooltips and KPI's, e.g. 1250 -> "1.250", 1.5 -> "1,5".
 * `decimals` sets the exact number of fraction digits; by default integers
 * are shown without decimals and other values with at most 2.
 */
export const formatNumber = (value: unknown, decimals?: number): string => {
  const n = toNumber(value);
  if (n === null) return '0';
  if (decimals !== undefined) {
    return new Intl.NumberFormat('nl-NL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(n);
  }
  if (Number.isInteger(n)) return fullFormatter.format(n);
  return new Intl.NumberFormat('nl-NL', {maximumFractionDigits: 2}).format(n);
};

/**
 * Short number for axis ticks, e.g. 1250 -> "1,3K", 800 -> "800", 2.2 -> "2,2".
 */
export const formatCompactNumber = (value: unknown): string => {
  const n = toNumber(value);
  if (n === null) return '';
  if (Math.abs(n) < 1000) {
    return Number.isInteger(n) ? fullFormatter.format(n) : formatNumber(n);
  }
  return compactFormatter.format(n);
};

/**
 * Signed percentage for deltas, e.g. 0.125 -> "+12,5%", -0.04 -> "-4%".
 */
export const formatPercentageDelta = (ratio: number): string => {
  const percentage = ratio * 100;
  const formatted = new Intl.NumberFormat('nl-NL', {maximumFractionDigits: 1}).format(Math.abs(percentage));
  if (percentage > 0) return `+${formatted}%`;
  if (percentage < 0) return `-${formatted}%`;
  return `${formatted}%`;
};
