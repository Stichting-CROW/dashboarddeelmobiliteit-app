import moment from 'moment';

import type {
  Aggregation,
  DistributionResponse,
  DistributionStatistic,
  TimeSeriesResponse,
} from '../../types/StatsV3';
import { Category, Modality, ModalityOperators, resolveModalities } from './modalities';

const DATE_FORMAT = 'YYYY-MM-DD';
const NL_MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

const parseDate = (date: string) => moment(date, DATE_FORMAT, true);

const minDate = (a: string, b: string): string => (a < b ? a : b);
const maxDate = (a: string, b: string): string => (a > b ? a : b);

/* ------------------------------------------------------------------ */
/* Dates and periods                                                   */
/* ------------------------------------------------------------------ */

/** Local calendar date (YYYY-MM-DD) of a Date or ISO timestamp. */
export const toDateString = (value: string | Date): string => moment(value).format(DATE_FORMAT);

/** Number of calendar days from `start` to `end`, both inclusive. */
export const countDays = (start: string, end: string): number =>
  parseDate(end).diff(parseDate(start), 'days') + 1;

/** e.g. "14 okt" or "14 okt 2026" */
export const formatDate = (date: string, withYear = true): string => {
  const d = parseDate(date);
  const text = `${d.date()} ${NL_MONTHS[d.month()]}`;
  return withYear ? `${text} ${d.year()}` : text;
};

/** e.g. "14 okt – 5 dec 2026"; the start year is only shown when it differs. */
export const formatPeriod = (start: string, end: string): string => {
  if (start === end) return formatDate(start);
  const sameYear = parseDate(start).year() === parseDate(end).year();
  return `${formatDate(start, !sameYear)} – ${formatDate(end)}`;
};

export interface EffectivePeriod {
  start: string;
  end: string;
  /** True when the period differs from the selected one */
  widened: boolean;
}

/**
 * Period to request for time series. For week and month the selected period
 * is widened to whole weeks (Monday to Sunday) or whole calendar months, so
 * the first and last points are not partial. The widened end never moves past
 * today, because the API counts missing (future) days as 0.
 */
export const getEffectivePeriod = (
  start: string,
  end: string,
  aggregation: Aggregation,
  today: string
): EffectivePeriod => {
  if (aggregation === 'day') return { start, end, widened: false };

  const unit = aggregation === 'week' ? 'isoWeek' : 'month';
  const wideStart = parseDate(start).startOf(unit).format(DATE_FORMAT);
  const wideEnd = parseDate(end).endOf(unit).format(DATE_FORMAT);
  const cappedEnd = minDate(wideEnd, maxDate(end, today));

  return {
    start: wideStart,
    end: cappedEnd,
    widened: wideStart !== start || cappedEnd !== end,
  };
};

/** First day of the start month to the last day of the end month. */
export const getWholeMonthsPeriod = (start: string, end: string): { start: string; end: string } => ({
  start: parseDate(start).startOf('month').format(DATE_FORMAT),
  end: parseDate(end).endOf('month').format(DATE_FORMAT),
});

/* ------------------------------------------------------------------ */
/* Operators                                                           */
/* ------------------------------------------------------------------ */

/**
 * Operators per modality, in the order of `modalities`. Modalities missing
 * from `series` are skipped; operator ids are de-duplicated and sorted.
 */
export const getOperatorsPerModality = (
  modalities: readonly Modality[],
  series: ReadonlyArray<{ modality: string; operators?: string[] }>
): ModalityOperators[] =>
  modalities.flatMap((modality) => {
    const match = series.find((s) => s.modality === modality.key);
    if (!match) return [];
    const operators = Array.from(new Set(match.operators ?? [])).sort();
    return [{ modality, operators }];
  });

/* ------------------------------------------------------------------ */
/* Time series                                                         */
/* ------------------------------------------------------------------ */

export interface TimeSeriesRow {
  /** Unique X value: the bucket start (YYYY-MM-DD) */
  periodStart: string;
  /** Short X-axis label, e.g. "14 okt", "wk 42" or "okt 2026" */
  tickLabel: string;
  /** Tooltip title with the real date range of the point */
  tooltipLabel: string;
  /** The bucket does not cover its whole day, week or month (yet) */
  incomplete: boolean;
  [modalityKey: string]: number | string | boolean;
}

export interface TimeSeriesChartData {
  modalities: Modality[];
  rows: TimeSeriesRow[];
  /** Operators with data per shown modality */
  operators: ModalityOperators[];
}

const getTickLabel = (periodStart: string, aggregation: Aggregation): string => {
  const d = parseDate(periodStart);
  if (aggregation === 'month') return `${NL_MONTHS[d.month()]} ${d.year()}`;
  if (aggregation === 'week') return `wk ${d.isoWeek()}`;
  return formatDate(periodStart, false);
};

const getNaturalBucketEnd = (periodStart: string, aggregation: Aggregation): string => {
  if (aggregation === 'day') return periodStart;
  const unit = aggregation === 'week' ? 'isoWeek' : 'month';
  return parseDate(periodStart).endOf(unit).format(DATE_FORMAT);
};

const round = (value: number, decimals: number): number => {
  const f = Math.pow(10, decimals);
  return Math.round(value * f) / f;
};

export interface TimeSeriesOptions {
  /** Today (YYYY-MM-DD); buckets that include today are marked incomplete */
  today: string;
  /**
   * Divide each value by the number of days that contributed to it.
   * Use for sums (rentals) that should be shown as a daily average.
   */
  perDay?: boolean;
}

/** Turn a time-series response into one row per period with a value per modality. */
export const toTimeSeriesRows = (
  response: TimeSeriesResponse,
  options: TimeSeriesOptions
): TimeSeriesChartData => {
  const { aggregation, start_date: requestStart } = response;
  const modalities = resolveModalities(response.modalities.map((m) => m.modality));
  const rowsByStart = new Map<string, TimeSeriesRow>();

  response.modalities.forEach((series) => {
    series.values.forEach((v) => {
      let row = rowsByStart.get(v.period_start);
      if (!row) {
        const firstDay = maxDate(v.period_start, requestStart);
        const naturalEnd = getNaturalBucketEnd(v.period_start, aggregation);
        const incomplete =
          firstDay > v.period_start || v.period_end < naturalEnd || v.period_end >= options.today;
        row = {
          periodStart: v.period_start,
          tickLabel: getTickLabel(v.period_start, aggregation),
          tooltipLabel: formatPeriod(firstDay, v.period_end) + (incomplete ? ' (nog niet compleet)' : ''),
          incomplete,
        };
        rowsByStart.set(v.period_start, row);
      }
      const days = countDays(maxDate(v.period_start, requestStart), v.period_end);
      row[series.modality] = options.perDay ? round(v.value / Math.max(days, 1), 1) : v.value;
    });
  });

  const rows = Array.from(rowsByStart.values()).sort((a, b) =>
    a.periodStart.localeCompare(b.periodStart)
  );
  return { modalities, rows, operators: getOperatorsPerModality(modalities, response.modalities) };
};

/* ------------------------------------------------------------------ */
/* Distributions                                                       */
/* ------------------------------------------------------------------ */

const TIME_OF_DAY_COLORS = ['#1E3A8A', '#3B82F6', '#FBBF24', '#F97316', '#EF4444', '#7C3AED'];
const DISTANCE_COLORS = [
  '#99F6E4', '#5EEAD4', '#2DD4BF', '#14B8A6', '#0D9488',
  '#0F766E', '#115E59', '#134E4A', '#0B3B38', '#042F2E',
];
const DURATION_COLORS = [
  '#DDD6FE', '#C4B5FD', '#A78BFA', '#8B5CF6', '#7C3AED', '#6D28D9',
  '#5B21B6', '#4C1D95', '#3B0764', '#2E1065', '#240B52', '#1A0740',
];

const PALETTES: Record<DistributionStatistic, readonly string[]> = {
  usage_distribution: TIME_OF_DAY_COLORS,
  distance_distribution: DISTANCE_COLORS,
  real_distance_distribution: DISTANCE_COLORS,
  duration_distribution: DURATION_COLORS,
};

export interface DistributionRow {
  modality: string;
  modalityKey: string;
  [categoryKey: string]: number | string;
}

export interface DistributionChartData {
  categories: Category[];
  /** One row per modality with rentals, with a percentage per category */
  rows: DistributionRow[];
  /** Operators with data per shown modality (modalities without rentals are left out) */
  operators: ModalityOperators[];
}

const getBucketIndex = (bucket: { time_period?: number; category?: number }, fallback: number) =>
  bucket.time_period ?? bucket.category ?? fallback;

/**
 * Turn raw bucket counts into percentages per modality (100% stacked columns).
 * Modalities without any rentals in the period are left out.
 */
export const toDistributionRows = (response: DistributionResponse): DistributionChartData => {
  const palette = PALETTES[response.statistic] ?? TIME_OF_DAY_COLORS;
  const first = response.modalities[0];
  const categories: Category[] = (first?.buckets ?? []).map((bucket, i) => ({
    key: `b${getBucketIndex(bucket, i)}`,
    label: bucket.label,
    color: palette[i % palette.length],
  }));

  const order = resolveModalities(response.modalities.map((m) => m.modality));
  const rows: DistributionRow[] = [];
  const shown: Modality[] = [];
  order.forEach((modality) => {
    const series = response.modalities.find((m) => m.modality === modality.key);
    if (!series) return;
    const total = series.buckets.reduce((sum, b) => sum + b.count, 0);
    if (total <= 0) return;
    const row: DistributionRow = { modality: modality.label, modalityKey: modality.key };
    series.buckets.forEach((bucket, i) => {
      row[`b${getBucketIndex(bucket, i)}`] = round((bucket.count / total) * 100, 1);
    });
    rows.push(row);
    shown.push(modality);
  });

  return { categories, rows, operators: getOperatorsPerModality(shown, response.modalities) };
};
