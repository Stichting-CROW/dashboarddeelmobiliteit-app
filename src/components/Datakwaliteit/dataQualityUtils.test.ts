import { toCsv } from '../../helpers/csv';
import type {
  FeedAvailability,
  IndividualFeed,
  ManualRejection,
  ManualRejectionInput,
  TimeInterval,
} from '../../types/DataQuality';
import {
  buildDailyDataQuality,
  buildRejectionCsvColumns,
  filterRejections,
  getDownSince,
  getFeedsDownBetween,
  getOfflineFeeds,
  hasMultipleFeeds,
  mergeIntervals,
  getRejectionsForDataType,
  groupByOperator,
  hasDataQualityIssue,
  intervalOverlapsPeriod,
  parsePeriod,
  rejectionAppliesToMunicipality,
  rejectionAppliesToOperator,
  rejectionAppliesToVehicleType,
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
  system_id: 'lime',
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

const makeIndividualFeed = (overrides: Partial<IndividualFeed> = {}): IndividualFeed => ({
  feed_id: 1,
  name: 'api.lime.example/gbfs/free_bike_status.json',
  status: 'available',
  last_data_received_at: null,
  outages: [],
  ...overrides,
});

/** Interval relative to the start of the period */
const at = (startOffset: number, endOffset: number): TimeInterval => ({
  start_time: new Date(period.start + startOffset).toISOString(),
  end_time: new Date(period.start + endOffset).toISOString(),
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

  it('applies to its own operator, or to every operator when system_id is "all"', () => {
    expect(rejectionAppliesToOperator({ system_id: 'all' }, 'dott')).toBe(true);
    expect(rejectionAppliesToOperator({ system_id: 'lime' }, 'lime')).toBe(true);
    expect(rejectionAppliesToOperator({ system_id: 'lime' }, 'dott')).toBe(false);
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

describe('getRejectionsForDataType', () => {
  const rejections = [
    makeRejection({ rejection_id: 1, data_types: ['aanbod'] }),
    makeRejection({ rejection_id: 2, data_types: ['aanbod', 'verhuringen'] }),
  ];

  it('returns only rejections that cover the data type, keeping their order', () => {
    expect(getRejectionsForDataType(rejections, 'aanbod').map((r) => r.rejection_id))
      .toEqual([1, 2]);
    expect(getRejectionsForDataType(rejections, 'verhuringen').map((r) => r.rejection_id))
      .toEqual([2]);
    expect(getRejectionsForDataType(rejections, 'servicegebieden')).toEqual([]);
  });
});

describe('groupByOperator', () => {
  const feeds = [
    makeFeed({ system_id: 'lime', data_type: 'aanbod' }),
    makeFeed({ system_id: 'lime', data_type: 'verhuringen', status: 'unavailable' }),
    makeFeed({ system_id: 'dott', data_type: 'aanbod' }),
  ];
  const rejections = [
    makeRejection({ rejection_id: 1, system_id: 'lime' }),
    makeRejection({ rejection_id: 2, system_id: 'all' }),
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

describe('rejectionAppliesToVehicleType', () => {
  it('applies to listed vehicle types, "all", or when no vehicle type is given', () => {
    expect(rejectionAppliesToVehicleType({ vehicle_types: 'all' }, 'moped')).toBe(true);
    expect(rejectionAppliesToVehicleType({ vehicle_types: ['moped'] }, 'moped')).toBe(true);
    expect(rejectionAppliesToVehicleType({ vehicle_types: ['moped'] }, 'bicycle')).toBe(false);
    expect(rejectionAppliesToVehicleType({ vehicle_types: ['moped'] }, null)).toBe(true);
  });
});

describe('buildDailyDataQuality', () => {
  const makeOperator = (
    feeds: FeedAvailability[],
    rejections: ManualRejection[] = []
  ) => groupByOperator(feeds, rejections)[0];
  const options = { gmCode: 'GM0599', formFactor: 'moped', period, now };
  const complies = (days: ReturnType<typeof buildDailyDataQuality>) =>
    days.map((day) => day.complies);

  it('returns one green day per day when all feeds are up', () => {
    const days = buildDailyDataQuality(makeOperator([makeFeed()]), options);
    expect(days).toHaveLength(7);
    expect(days[0].date).toBe('2026-11-01');
    expect(complies(days).every((value) => value === true)).toBe(true);
  });

  it('turns both days red for an outage spanning midnight', () => {
    const days = buildDailyDataQuality(makeOperator([makeFeed({
      outages: [{
        start_time: new Date(period.start + DAY - HOUR).toISOString(),
        end_time: new Date(period.start + DAY + HOUR).toISOString(),
      }],
    })]), options);
    expect(complies(days)).toEqual([false, false, true, true, true, true, true]);
    expect(days[0].feeds.aanbod!.outages).toHaveLength(1);
  });

  it('ignores outages of feeds that are not expected', () => {
    const days = buildDailyDataQuality(makeOperator([
      makeFeed(),
      makeFeed({
        data_type: 'servicegebieden',
        status: 'not_expected',
        outages: [{ start_time: new Date(period.start).toISOString(), end_time: null }],
      }),
    ]), options);
    expect(complies(days).every((value) => value === true)).toBe(true);
  });

  it('only counts rejections for the card municipality and vehicle type', () => {
    const operator = makeOperator([makeFeed()], [
      makeRejection({ rejection_id: 1, municipalities: ['GM0363'] }),
      makeRejection({ rejection_id: 2, vehicle_types: ['bicycle'] }),
      makeRejection({ rejection_id: 3, vehicle_types: ['moped'] }),
    ]);
    const days = buildDailyDataQuality(operator, options);
    expect(complies(days)).toEqual([true, false, true, true, true, true, true]);
    expect(days[1].rejections.map((r) => r.rejection_id)).toEqual([3]);
  });

  it('keeps an ongoing outage red until now and leaves future days undecided', () => {
    const midPeriod = period.start + 3 * DAY + 12 * HOUR;
    const days = buildDailyDataQuality(makeOperator([makeFeed({
      status: 'unavailable',
      outages: [{ start_time: new Date(period.start + 2 * DAY).toISOString(), end_time: null }],
    })]), { ...options, now: midPeriod });
    expect(complies(days)).toEqual([true, true, false, false, undefined, undefined, undefined]);
    expect(days[3].feeds.aanbod!.outages[0].ongoing).toBe(true);
  });

  it('has no verdict when no feed has been checked yet', () => {
    const days = buildDailyDataQuality(makeOperator([makeFeed({ status: 'unknown' })]), options);
    expect(complies(days).every((value) => value === undefined)).toBe(true);
  });

  it('lists the individual feeds that were down per day', () => {
    const outage = at(DAY + HOUR, DAY + 2 * HOUR);
    const days = buildDailyDataQuality(makeOperator([makeFeed({
      outages: [outage],
      individual_feeds: [
        makeIndividualFeed({ feed_id: 1, outages: [outage] }),
        makeIndividualFeed({ feed_id: 2 }),
      ],
    })]), options);
    expect(days[0].feeds.aanbod!.feedsDown).toEqual([]);
    expect(days[1].feeds.aanbod!.feedsDown.map((f) => f.feed_id)).toEqual([1]);
    expect(days[1].feeds.aanbod!.feedCount).toBe(2);
  });
});

describe('individual feeds', () => {
  const outageA = at(DAY, DAY + 2 * HOUR);
  const outageB = at(DAY + HOUR, DAY + 3 * HOUR);
  const ongoing: TimeInterval = {
    start_time: new Date(period.start + 4 * DAY).toISOString(),
    end_time: null,
  };
  const feed = makeFeed({
    status: 'unavailable',
    outages: mergeIntervals([outageA, outageB, ongoing]),
    individual_feeds: [
      makeIndividualFeed({ feed_id: 1, outages: [outageA] }),
      makeIndividualFeed({ feed_id: 2, outages: [outageB] }),
      makeIndividualFeed({ feed_id: 3, status: 'unavailable', outages: [ongoing] }),
      makeIndividualFeed({ feed_id: 4 }),
    ],
  });
  const ids = (feeds: IndividualFeed[]) => feeds.map((f) => f.feed_id);

  it('merges overlapping intervals and lets an ongoing one absorb later ones', () => {
    expect(mergeIntervals([outageB, outageA])).toEqual([at(DAY, DAY + 3 * HOUR)]);
    expect(mergeIntervals([ongoing, at(5 * DAY, 6 * DAY)])).toEqual([ongoing]);
    expect(mergeIntervals([at(0, HOUR), at(2 * HOUR, 3 * HOUR)])).toHaveLength(2);
  });

  it('finds the feeds that were down in a time window', () => {
    const start = period.start;
    expect(ids(getFeedsDownBetween(feed, start + DAY, start + DAY + 3 * HOUR, now)))
      .toEqual([1, 2]);
    expect(ids(getFeedsDownBetween(feed, start + DAY + 2.5 * HOUR, start + 2 * DAY, now)))
      .toEqual([2]);
    expect(ids(getFeedsDownBetween(feed, start + 5 * DAY, start + 6 * DAY, now))).toEqual([3]);
  });

  it('lists offline feeds with the start of their ongoing outage', () => {
    const offline = getOfflineFeeds(feed);
    expect(ids(offline)).toEqual([3]);
    expect(getDownSince(offline[0])).toBe(ongoing.start_time);
    expect(getDownSince(feed.individual_feeds![0])).toBeNull();
  });

  it('only treats more than one listed feed as multiple feeds', () => {
    expect(hasMultipleFeeds(feed)).toBe(true);
    expect(hasMultipleFeeds(makeFeed({ individual_feeds: [makeIndividualFeed()] }))).toBe(false);
    expect(hasMultipleFeeds(makeFeed())).toBe(false);
    expect(getOfflineFeeds(undefined)).toEqual([]);
  });
});

describe('buildRejectionCsvColumns', () => {
  it('exports readable labels including audit fields', () => {
    const csv = toCsv(
      [makeRejection({ system_id: 'all', municipalities: ['GM0599'] })],
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
    system_id: 'lime',
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
      system_id: '',
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

  it('derives status and outages from the individual feeds', () => {
    const feeds = buildDemoFeeds(systemIds, period, now)
      .filter((feed) => feed.status === 'available' || feed.status === 'unavailable');
    expect(feeds.some((feed) => (feed.individual_feeds?.length ?? 0) > 1)).toBe(true);
    feeds.forEach((feed) => {
      const individual = feed.individual_feeds!;
      expect(individual.length).toBeGreaterThan(0);
      expect(feed.status === 'unavailable')
        .toBe(individual.some((f) => f.status === 'unavailable'));
      expect(mergeIntervals(individual.flatMap((f) => f.outages))).toEqual(feed.outages);
    });
  });

  it('always includes an all-operator rejection by Dashboard Deelmobiliteit', () => {
    const rejections = buildDemoRejections(systemIds, [], now);
    expect(rejections.some((r) =>
      r.system_id === 'all' && r.issue_owner === 'dashboard_deelmobiliteit'
    )).toBe(true);
  });

  it('shows all operators for NL and a stable subset of at least 3 for a municipality', () => {
    expect(pickActiveOperators(systemIds, null)).toEqual(systemIds);
    const subset = pickActiveOperators(systemIds, 'GM0599');
    expect(subset.length).toBeGreaterThanOrEqual(3);
    expect(pickActiveOperators(systemIds, 'GM0599')).toEqual(subset);
  });
});
