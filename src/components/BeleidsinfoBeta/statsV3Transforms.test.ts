import type { DistributionResponse, TimeSeriesResponse } from '../../types/StatsV3';
import {
  countDays,
  formatPeriod,
  getEffectivePeriod,
  getOperatorsPerModality,
  getWholeMonthsPeriod,
  toDistributionRows,
  toTimeSeriesRows,
} from './statsV3Transforms';
import { resolveModalities } from './modalities';

const TODAY = '2026-11-25';

const timeSeries = (overrides: Partial<TimeSeriesResponse>): TimeSeriesResponse => ({
  statistic: 'rentals',
  municipality: 'GM0599',
  start_date: '2026-10-01',
  end_date: '2026-10-31',
  aggregation: 'day',
  trip_source: 'vehicles',
  modalities: [],
  ...overrides,
});

describe('getEffectivePeriod', () => {
  it('keeps the selected period for day', () => {
    expect(getEffectivePeriod('2026-10-14', '2026-11-05', 'day', TODAY)).toEqual({
      start: '2026-10-14',
      end: '2026-11-05',
      widened: false,
    });
  });

  it('widens to whole months', () => {
    expect(getEffectivePeriod('2026-08-14', '2026-10-05', 'month', TODAY)).toEqual({
      start: '2026-08-01',
      end: '2026-10-31',
      widened: true,
    });
  });

  it('does not widen past today', () => {
    expect(getEffectivePeriod('2026-10-14', '2026-11-20', 'month', TODAY)).toEqual({
      start: '2026-10-01',
      end: TODAY,
      widened: true,
    });
  });

  it('keeps a selected end that is already after today', () => {
    expect(getEffectivePeriod('2026-10-14', '2026-11-28', 'month', TODAY).end).toBe('2026-11-28');
  });

  it('widens to Monday-Sunday weeks across a year change', () => {
    // 2025-12-31 is a Wednesday, 2026-01-02 a Friday
    expect(getEffectivePeriod('2025-12-31', '2026-01-02', 'week', TODAY)).toEqual({
      start: '2025-12-29',
      end: '2026-01-04',
      widened: true,
    });
  });

  it('reports no widening when the period is already whole months', () => {
    expect(getEffectivePeriod('2026-09-01', '2026-10-31', 'month', TODAY).widened).toBe(false);
  });
});

describe('period helpers', () => {
  it('counts days inclusively', () => {
    expect(countDays('2026-10-01', '2026-10-31')).toBe(31);
    expect(countDays('2026-10-01', '2026-10-01')).toBe(1);
  });

  it('rounds out to whole months', () => {
    expect(getWholeMonthsPeriod('2026-10-14', '2026-12-05')).toEqual({
      start: '2026-10-01',
      end: '2026-12-31',
    });
  });

  it('formats periods in Dutch', () => {
    expect(formatPeriod('2026-10-14', '2026-12-05')).toBe('14 okt – 5 dec 2026');
    expect(formatPeriod('2025-12-29', '2026-01-04')).toBe('29 dec 2025 – 4 jan 2026');
  });
});

describe('toTimeSeriesRows', () => {
  it('builds one row per period with a value per modality', () => {
    const { rows, modalities } = toTimeSeriesRows(
      timeSeries({
        start_date: '2026-10-01',
        end_date: '2026-10-02',
        modalities: [
          {
            modality: 'moped',
            operators: ['felyx'],
            values: [
              { period_start: '2026-10-01', period_end: '2026-10-01', value: 5 },
              { period_start: '2026-10-02', period_end: '2026-10-02', value: 6 },
            ],
          },
          {
            modality: 'bicycle',
            operators: ['lime'],
            values: [
              { period_start: '2026-10-01', period_end: '2026-10-01', value: 10 },
              { period_start: '2026-10-02', period_end: '2026-10-02', value: 12 },
            ],
          },
        ],
      }),
      { today: TODAY }
    );

    expect(modalities.map((m) => m.key)).toEqual(['bicycle', 'moped']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      periodStart: '2026-10-01',
      tickLabel: '1 okt',
      tooltipLabel: '1 okt 2026',
      incomplete: false,
      bicycle: 10,
      moped: 5,
    });
  });

  it('divides sums by the days in a partial first bucket when perDay is set', () => {
    // Month bucket starts on 1 Oct but only 14-31 Oct (18 days) is requested
    const { rows } = toTimeSeriesRows(
      timeSeries({
        aggregation: 'month',
        start_date: '2026-10-14',
        end_date: '2026-10-31',
        modalities: [
          {
            modality: 'bicycle',
            operators: [],
            values: [{ period_start: '2026-10-01', period_end: '2026-10-31', value: 180 }],
          },
        ],
      }),
      { today: TODAY, perDay: true }
    );

    expect(rows[0].bicycle).toBe(10);
    expect(rows[0].incomplete).toBe(true);
    expect(rows[0].tooltipLabel).toBe('14 okt – 31 okt 2026 (nog niet compleet)');
    expect(rows[0].tickLabel).toBe('okt 2026');
  });

  it('marks the running month as incomplete', () => {
    const { rows } = toTimeSeriesRows(
      timeSeries({
        aggregation: 'month',
        start_date: '2026-10-01',
        end_date: TODAY,
        modalities: [
          {
            modality: 'car',
            operators: [],
            values: [
              { period_start: '2026-10-01', period_end: '2026-10-31', value: 1 },
              { period_start: '2026-11-01', period_end: TODAY, value: 2 },
            ],
          },
        ],
      }),
      { today: TODAY }
    );

    expect(rows.map((r) => r.incomplete)).toEqual([false, true]);
  });

  it('keeps unknown modalities with their raw key as label', () => {
    const { modalities } = toTimeSeriesRows(
      timeSeries({
        modalities: [{ modality: 'hoverboard', operators: [], values: [] }],
      }),
      { today: TODAY }
    );
    expect(modalities).toEqual([expect.objectContaining({ key: 'hoverboard', label: 'hoverboard' })]);
  });

  it('returns no rows for an empty response', () => {
    expect(toTimeSeriesRows(timeSeries({}), { today: TODAY }).rows).toEqual([]);
  });
});

describe('toDistributionRows', () => {
  const distribution = (modalities: DistributionResponse['modalities']): DistributionResponse => ({
    statistic: 'usage_distribution',
    municipality: 'GM0599',
    start_date: '2026-10-01',
    end_date: '2026-10-31',
    trip_source: 'vehicles',
    months_included: ['2026-10'],
    modalities,
  });

  it('converts counts to percentages per modality', () => {
    const { categories, rows } = toDistributionRows(
      distribution([
        {
          modality: 'bicycle',
          operators: [],
          buckets: [
            { time_period: 0, label: '00:00-07:00', count: 25 },
            { time_period: 1, label: '07:00-09:00', count: 75 },
          ],
        },
      ])
    );

    expect(categories.map((c) => [c.key, c.label])).toEqual([
      ['b0', '00:00-07:00'],
      ['b1', '07:00-09:00'],
    ]);
    expect(rows).toEqual([{ modality: 'Fiets', modalityKey: 'bicycle', b0: 25, b1: 75 }]);
  });

  it('leaves out modalities without rentals', () => {
    const { rows, operators } = toDistributionRows(
      distribution([
        {
          modality: 'car',
          operators: ['greenwheels'],
          buckets: [{ category: 0, label: '< 1 min', count: 0 }],
        },
      ])
    );
    expect(rows).toEqual([]);
    expect(operators).toEqual([]);
  });

  it('lists operators only for shown modalities', () => {
    const { operators } = toDistributionRows(
      distribution([
        {
          modality: 'moped',
          operators: ['felyx', 'check'],
          buckets: [{ time_period: 0, label: '00:00-07:00', count: 3 }],
        },
        {
          modality: 'car',
          operators: ['greenwheels'],
          buckets: [{ time_period: 0, label: '00:00-07:00', count: 0 }],
        },
      ])
    );
    expect(operators.map((o) => [o.modality.key, o.operators])).toEqual([
      ['moped', ['check', 'felyx']],
    ]);
  });
});

describe('getOperatorsPerModality', () => {
  it('follows the modality order and de-duplicates operators', () => {
    const modalities = resolveModalities(['moped', 'bicycle']);
    const result = getOperatorsPerModality(modalities, [
      { modality: 'moped', operators: ['felyx', 'check', 'felyx'] },
      { modality: 'bicycle', operators: ['lime'] },
    ]);
    expect(result.map((o) => [o.modality.key, o.operators])).toEqual([
      ['bicycle', ['lime']],
      ['moped', ['check', 'felyx']],
    ]);
  });

  it('is returned with time series data', () => {
    const { operators } = toTimeSeriesRows(
      timeSeries({
        modalities: [{ modality: 'bicycle', operators: ['lime', 'bolt'], values: [] }],
      }),
      { today: TODAY }
    );
    expect(operators.map((o) => o.operators)).toEqual([['bolt', 'lime']]);
  });
});
