import {
  chunkArray,
  hasAggregatedStatsValues,
  mergeAggregatedStatsResponses,
} from './mergeAggregatedStats';

describe('chunkArray', () => {
  it('splits into equally sized chunks with a remainder', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns a single chunk for short input', () => {
    expect(chunkArray([1, 2], 50)).toEqual([[1, 2]]);
  });

  it('returns no chunks for empty input', () => {
    expect(chunkArray([], 3)).toEqual([]);
  });
});

describe('hasAggregatedStatsValues', () => {
  it('is true only for a non-empty values array under the response key', () => {
    expect(hasAggregatedStatsValues({ rental_stats: { values: [{ time: 't' }] } }, 'rental_stats')).toBe(true);
    expect(hasAggregatedStatsValues({ rental_stats: { values: [] } }, 'rental_stats')).toBe(false);
    expect(hasAggregatedStatsValues({ message: 'forbidden' }, 'rental_stats')).toBe(false);
    expect(hasAggregatedStatsValues(null, 'rental_stats')).toBe(false);
  });
});

describe('mergeAggregatedStatsResponses', () => {
  const key = 'available_vehicles_aggregated_stats';

  it('returns null when no response is usable', () => {
    expect(mergeAggregatedStatsResponses([null, { message: 'nope' }], key)).toBeNull();
  });

  it('returns the single usable response untouched', () => {
    const response = { [key]: { values: [{ start_interval: '2026-09-01', moveyou: 3 }] } };
    expect(mergeAggregatedStatsResponses([null, response], key)).toBe(response);
  });

  it('sums providers per time bucket across legacy responses', () => {
    const a = {
      [key]: {
        values: [
          { start_interval: '2026-09-01', moveyou: 10, hely: 2 },
          { start_interval: '2026-09-02', moveyou: 12 },
        ],
      },
    };
    const b = {
      [key]: {
        values: [
          { start_interval: '2026-09-01', moveyou: 20, check: 5 },
          { start_interval: '2026-09-02', hely: 1 },
        ],
      },
    };

    const merged = mergeAggregatedStatsResponses([a, b], key);

    expect(merged?.[key]).toEqual({
      values: [
        { start_interval: '2026-09-01', moveyou: 30, hely: 2, check: 5 },
        { start_interval: '2026-09-02', moveyou: 12, hely: 1 },
      ],
    });
  });

  it('sums nested modality objects in timescale rental responses', () => {
    const a = {
      rental_stats: {
        values: [{ time: '2026-09-01T00:00:00', moveyou: { bicycle: { rentals_started: 4 } } }],
      },
    };
    const b = {
      rental_stats: {
        values: [{
          time: '2026-09-01T00:00:00',
          moveyou: { bicycle: { rentals_started: 6 }, moped: { rentals_started: 1 } },
          hely: { car: { rentals_started: 2 } },
        }],
      },
    };

    const merged = mergeAggregatedStatsResponses([a, b], 'rental_stats');

    expect(merged?.rental_stats).toEqual({
      values: [{
        time: '2026-09-01T00:00:00',
        moveyou: { bicycle: { rentals_started: 10 }, moped: { rentals_started: 1 } },
        hely: { car: { rentals_started: 2 } },
      }],
    });
  });

  it('does not mutate the input responses', () => {
    const a = { [key]: { values: [{ start_interval: '2026-09-01', moveyou: 1 }] } };
    const b = { [key]: { values: [{ start_interval: '2026-09-01', moveyou: 2 }] } };
    const snapshotA = JSON.stringify(a);
    const snapshotB = JSON.stringify(b);

    mergeAggregatedStatsResponses([a, b], key);

    expect(JSON.stringify(a)).toBe(snapshotA);
    expect(JSON.stringify(b)).toBe(snapshotB);
  });

  it('orders buckets chronologically even when batches differ', () => {
    const a = { [key]: { values: [{ start_interval: '2026-09-02', moveyou: 1 }] } };
    const b = { [key]: { values: [{ start_interval: '2026-09-01', moveyou: 1 }] } };

    const merged = mergeAggregatedStatsResponses([a, b], key);

    expect(merged?.[key]).toEqual({
      values: [
        { start_interval: '2026-09-01', moveyou: 1 },
        { start_interval: '2026-09-02', moveyou: 1 },
      ],
    });
  });
});
