import { toCsv } from '../../helpers/csv';
import type {
  FeedAvailability,
  ManualRejection,
  ManualRejectionInput,
} from '../../types/DataQuality';
import {
  buildRejectionCsvColumns,
  filterRejections,
  groupByOperator,
  hasDataQualityIssue,
  intervalOverlapsPeriod,
  parsePeriod,
  rejectionAppliesToMunicipality,
  rejectionAppliesToOperator,
  sortOperators,
  toTimelineSegments,
  validateRejectionInput,
} from './dataQualityUtils';
import {
  buildDemoFeeds,
  buildDemoRejections,
  pickActiveOperators,
} from './dataQualityDemoData';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const period = parsePeriod('2026-11-01', '2026-11-07')!;
const now = period.end + 3 * DAY;

const makeRejection = (overrides: Partial<ManualRejection> = {}): ManualRejection => ({
  rejection_id: 1,
  system_ids: ['lime'],
  start_time: new Date(period.start + DAY).toISOString(),
  end_time: new Date(period.start + DAY + 5 * HOUR).toISOString(),
  municipalities: 'all',
  vehicle_types: 'all',
  data_types: ['aanbod'],
  issue_owner: 'operator',
  note: 'Test',
  created_by: 'admin@example.com',
  created_at: new Date(period.start).toISOString(),
  updated_by: null,
  updated_at: null,
  ...overrides,
});

const makeFeed = (overrides: Partial<FeedAvailability> = {}): FeedAvailability => ({
  system_id: 'lime',
  data_type: 'aanbod',
  status: 'available',
  last_checked_at: null,
  last_data_received_at: null,
  availability_pct: 100,
  outages: [],
  ...overrides,
});

describe('parsePeriod', () => {
  it('treats the end date as inclusive', () => {
    expect(period.end - period.start).toBe(7 * DAY);
  });

  it('returns null for invalid dates', () => {
    expect(parsePeriod('2026-13-01', '2026-11-07')).toBeNull();
  });
});

describe('intervalOverlapsPeriod', () => {
  it('detects intervals inside, before and after the period', () => {
    expect(intervalOverlapsPeriod(makeRejection(), period, now)).toBe(true);
    expect(intervalOverlapsPeriod(makeRejection({
      start_time: new Date(period.start - 2 * DAY).toISOString(),
      end_time: new Date(period.start - DAY).toISOString(),
    }), period, now)).toBe(false);
    expect(intervalOverlapsPeriod(makeRejection({
      start_time: new Date(period.end).toISOString(),
      end_time: new Date(period.end + DAY).toISOString(),
    }), period, now)).toBe(false);
  });

  it('treats an ongoing interval that started before the period as overlapping', () => {
    expect(intervalOverlapsPeriod(makeRejection({
      start_time: new Date(period.start - 10 * DAY).toISOString(),
      end_time: null,
    }), period, now)).toBe(true);
  });
});

describe('rejection scope', () => {
  it('applies to every municipality when municipalities is "all" or no gm_code is selected', () => {
    expect(rejectionAppliesToMunicipality({ municipalities: 'all' }, 'GM0599')).toBe(true);
    expect(rejectionAppliesToMunicipality({ municipalities: ['GM0363'] }, null)).toBe(true);
  });

  it('only applies to listed municipalities otherwise', () => {
    expect(rejectionAppliesToMunicipality({ municipalities: ['GM0363'] }, 'GM0363')).toBe(true);
    expect(rejectionAppliesToMunicipality({ municipalities: ['GM0363'] }, 'GM0599')).toBe(false);
  });

  it('applies to operators that are listed or covered by "all"', () => {
    expect(rejectionAppliesToOperator({ system_ids: 'all' }, 'dott')).toBe(true);
    expect(rejectionAppliesToOperator({ system_ids: ['lime'] }, 'lime')).toBe(true);
    expect(rejectionAppliesToOperator({ system_ids: ['lime'] }, 'dott')).toBe(false);
  });

  it('filters on municipality and period together', () => {
    const rejections = [
      makeRejection({ rejection_id: 1 }),
      makeRejection({ rejection_id: 2, municipalities: ['GM0363'] }),
      makeRejection({
        rejection_id: 3,
        start_time: new Date(period.start - 5 * DAY).toISOString(),
        end_time: new Date(period.start - 4 * DAY).toISOString(),
      }),
    ];
    const result = filterRejections(rejections, { gmCode: 'GM0599', period, now });
    expect(result.map((r) => r.rejection_id)).toEqual([1]);
  });
});

describe('groupByOperator', () => {
  const feeds = [
    makeFeed({ system_id: 'lime', data_type: 'aanbod' }),
    makeFeed({ system_id: 'lime', data_type: 'verhuringen', status: 'unavailable' }),
    makeFeed({ system_id: 'dott', data_type: 'aanbod' }),
  ];
  const rejections = [
    makeRejection({ rejection_id: 1, system_ids: ['lime'] }),
    makeRejection({ rejection_id: 2, system_ids: 'all' }),
  ];

  it('builds one entry per operator with its feeds and matching rejections', () => {
    const result = groupByOperator(feeds, rejections);
    const lime = result.find((o) => o.system_id === 'lime')!;
    const dott = result.find((o) => o.system_id === 'dott')!;

    expect(result).toHaveLength(2);
    expect(Object.keys(lime.feeds).sort()).toEqual(['aanbod', 'verhuringen']);
    expect(lime.rejections.map((r) => r.rejection_id).sort()).toEqual([1, 2]);
    expect(dott.rejections.map((r) => r.rejection_id)).toEqual([2]);
  });

  it('restricts operator accounts to their own card', () => {
    const result = groupByOperator(feeds, rejections, ['dott']);
    expect(result.map((o) => o.system_id)).toEqual(['dott']);
  });

  it('sorts operators with issues first, then by name', () => {
    const result = sortOperators(groupByOperator(feeds, []), (id) => id);
    expect(result.map((o) => o.system_id)).toEqual(['lime', 'dott']);
    expect(hasDataQualityIssue(result[0])).toBe(true);
    expect(hasDataQualityIssue(result[1])).toBe(false);
  });
});

describe('toTimelineSegments', () => {
  it('clamps intervals to the period and converts them to percentages', () => {
    const segments = toTimelineSegments([
      {
        start_time: new Date(period.start - DAY).toISOString(),
        end_time: new Date(period.start + DAY).toISOString(),
      },
    ], period, now);

    expect(segments).toHaveLength(1);
    expect(segments[0].leftPct).toBe(0);
    expect(segments[0].widthPct).toBeCloseTo(100 / 7);
  });

  it('ends ongoing intervals at "now" when now falls inside the period', () => {
    const midPeriod = period.start + 3 * DAY;
    const [segment] = toTimelineSegments([
      { start_time: new Date(period.start + 2 * DAY).toISOString(), end_time: null },
    ], period, midPeriod);

    expect(segment.ongoing).toBe(true);
    expect(segment.end).toBe(midPeriod);
  });

  it('drops intervals outside the period', () => {
    expect(toTimelineSegments([
      {
        start_time: new Date(period.end + DAY).toISOString(),
        end_time: new Date(period.end + 2 * DAY).toISOString(),
      },
    ], period, now)).toEqual([]);
  });
});

describe('buildRejectionCsvColumns', () => {
  it('exports readable labels including audit fields', () => {
    const csv = toCsv(
      [makeRejection({ system_ids: 'all', municipalities: ['GM0599'] })],
      buildRejectionCsvColumns({
        getOperatorName: (id) => id.toUpperCase(),
        getMunicipalityName: (gm) => (gm === 'GM0599' ? 'Rotterdam' : gm),
        getVehicleTypeName: (vt) => vt,
      })
    );
    const [header, row] = csv.split('\r\n');

    expect(header).toContain('"Aangemaakt door"');
    expect(row).toContain('"Alle aanbieders"');
    expect(row).toContain('"Rotterdam"');
    expect(row).toContain('"Aanbieder"');
    expect(row).toContain('"admin@example.com"');
  });
});

describe('validateRejectionInput', () => {
  const valid: ManualRejectionInput = {
    system_ids: ['lime'],
    start_time: '2026-11-01T08:00:00.000Z',
    end_time: '2026-11-01T12:00:00.000Z',
    municipalities: 'all',
    vehicle_types: 'all',
    data_types: ['aanbod'],
    issue_owner: 'operator',
    note: '',
  };

  it('accepts a valid input', () => {
    expect(validateRejectionInput(valid)).toEqual([]);
  });

  it('rejects an end before the start and empty selections', () => {
    const errors = validateRejectionInput({
      ...valid,
      end_time: '2026-11-01T07:00:00.000Z',
      system_ids: [],
      municipalities: [],
      vehicle_types: [],
      data_types: [],
    });
    expect(errors).toHaveLength(5);
  });
});

describe('demo data', () => {
  const systemIds = ['baqme', 'check', 'cykl', 'dott', 'felyx', 'lime'];

  it('is deterministic for the same input', () => {
    expect(buildDemoFeeds(systemIds, period, now)).toEqual(buildDemoFeeds(systemIds, period, now));
    expect(buildDemoRejections(systemIds, ['GM0599'], now))
      .toEqual(buildDemoRejections(systemIds, ['GM0599'], now));
  });

  it('returns three feeds per operator with outages inside the period', () => {
    const feeds = buildDemoFeeds(systemIds, period, now);
    expect(feeds).toHaveLength(systemIds.length * 3);
    feeds.forEach((feed) => {
      feed.outages.forEach((outage) => {
        expect(intervalOverlapsPeriod(outage, period, now)).toBe(true);
      });
    });
  });

  it('always includes an all-operator rejection by Dashboard Deelmobiliteit', () => {
    const rejections = buildDemoRejections(systemIds, [], now);
    expect(rejections.some((r) =>
      r.system_ids === 'all' && r.issue_owner === 'dashboard_deelmobiliteit'
    )).toBe(true);
  });

  it('shows all operators for NL and a stable subset of at least 3 for a municipality', () => {
    expect(pickActiveOperators(systemIds, null)).toEqual(systemIds);
    const subset = pickActiveOperators(systemIds, 'GM0599');
    expect(subset.length).toBeGreaterThanOrEqual(3);
    expect(pickActiveOperators(systemIds, 'GM0599')).toEqual(subset);
  });
});
