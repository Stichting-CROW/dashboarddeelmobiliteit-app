/** Cards narrower than this (in px) switch to the compact (phone) layout. */
export const COMPACT_CARD_WIDTH = 480;

/** Plot heights in px for the compact layout (caption and legend come on top). */
export const COMPACT_LINE_PLOT_HEIGHT = 260;
export const COMPACT_COLUMN_PLOT_HEIGHT = 300;

/** Highest finite number found under `keys` in `rows`; 0 when there is none. */
export const getMaxValue = (
  rows: ReadonlyArray<Record<string, unknown>>,
  keys: readonly string[]
): number =>
  rows.reduce<number>((max, row) => {
    return keys.reduce<number>((m, key) => {
      const v = row[key];
      return typeof v === 'number' && Number.isFinite(v) && v > m ? v : m;
    }, max);
  }, 0);

/** Round up to a "nice" axis value (1, 2, 2.5 or 5 times a power of ten). */
export const niceCeil = (value: number): number => {
  if (!(value > 0)) return 0;
  const power = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / power;
  const step = [1, 2, 2.5, 5, 10].find((s) => n <= s + 1e-9) ?? 10;
  return Number((step * power).toPrecision(12));
};

export interface YAxisWidthOptions {
  /** Average width of one tick character in px (12px font). */
  charWidth?: number;
  /** Space for the tick line and gap in px. */
  padding?: number;
  /** Minimum width in px. */
  min?: number;
}

/** Y-axis width in px that fits the longest of the given tick labels. */
export const getYAxisWidth = (
  labels: readonly string[],
  { charWidth = 7, padding = 10, min = 28 }: YAxisWidthOptions = {}
): number => {
  const longest = labels.reduce((max, label) => Math.max(max, label.length), 0);
  return Math.max(min, Math.ceil(longest * charWidth + padding));
};
