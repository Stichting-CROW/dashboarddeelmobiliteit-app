import moment from 'moment';
import type { CsvColumn } from '../../helpers/csv';
import type {
  DataQualityDataType,
  DataQualityPeriod,
  FeedAvailability,
  FeedStatus,
  IssueOwner,
  ManualRejection,
  ManualRejectionInput,
  OperatorDataQuality,
  TimeInterval,
} from '../../types/DataQuality';

export const DATA_TYPES: readonly DataQualityDataType[] = [
  'aanbod',
  'verhuringen',
  'servicegebieden',
] as const;

export const DATA_TYPE_LABELS: Record<DataQualityDataType, string> = {
  aanbod: 'Aanbod',
  verhuringen: 'Verhuringen',
  servicegebieden: 'Servicegebieden',
};

export const ISSUE_OWNER_LABELS: Record<IssueOwner, string> = {
  operator: 'Aanbieder',
  dashboard_deelmobiliteit: 'Dashboard Deelmobiliteit',
};

export const FEED_STATUS_LABELS: Record<FeedStatus, string> = {
  available: 'Online',
  unavailable: 'Offline',
  not_expected: 'Geen feed verwacht',
  unknown: 'Onbekend',
};

export const STATUS_COLORS = {
  ok: '#48E248',
  issue: '#FD3E48',
  neutral: '#B2B2B2',
} as const;

export const getFeedStatusColor = (status: FeedStatus | undefined): string => {
  if (status === 'available') return STATUS_COLORS.ok;
  if (status === 'unavailable') return STATUS_COLORS.issue;
  return STATUS_COLORS.neutral;
};

/** Convert URL dates (YYYY-MM-DD, both inclusive) to a [start, end) period in local time. */
export const parsePeriod = (startDate: string, endDate: string): DataQualityPeriod | null => {
  const start = moment(startDate, 'YYYY-MM-DD', true);
  const end = moment(endDate, 'YYYY-MM-DD', true);
  if (!start.isValid() || !end.isValid()) return null;
  return {
    start: start.startOf('day').valueOf(),
    end: end.startOf('day').add(1, 'day').valueOf(),
  };
};

const intervalEndMs = (interval: TimeInterval, now: number): number => {
  return interval.end_time ? new Date(interval.end_time).getTime() : now;
};

export const intervalOverlapsPeriod = (
  interval: TimeInterval,
  period: DataQualityPeriod,
  now: number = Date.now()
): boolean => {
  const start = new Date(interval.start_time).getTime();
  const end = intervalEndMs(interval, Math.max(now, period.end));
  return start < period.end && end > period.start;
};

export const rejectionAppliesToMunicipality = (
  rejection: Pick<ManualRejection, 'municipalities'>,
  gmCode: string | null | undefined
): boolean => {
  if (!gmCode) return true;
  if (rejection.municipalities === 'all') return true;
  return rejection.municipalities.includes(gmCode);
};

export const rejectionAppliesToOperator = (
  rejection: Pick<ManualRejection, 'system_ids'>,
  systemId: string
): boolean => {
  if (rejection.system_ids === 'all') return true;
  return rejection.system_ids.includes(systemId);
};

export const filterRejections = (
  rejections: ManualRejection[],
  options: { gmCode?: string | null; period: DataQualityPeriod; now?: number }
): ManualRejection[] => {
  return rejections.filter((rejection) =>
    rejectionAppliesToMunicipality(rejection, options.gmCode) &&
    intervalOverlapsPeriod(rejection, options.period, options.now)
  );
};

/**
 * Build one entry per operator that has feed data. Operator accounts pass
 * `restrictToSystemIds` so they only see their own card.
 */
export const groupByOperator = (
  feeds: FeedAvailability[],
  rejections: ManualRejection[],
  restrictToSystemIds?: string[] | null
): OperatorDataQuality[] => {
  const operators = new Map<string, OperatorDataQuality>();

  feeds.forEach((feed) => {
    if (restrictToSystemIds && !restrictToSystemIds.includes(feed.system_id)) return;
    let entry = operators.get(feed.system_id);
    if (!entry) {
      entry = { system_id: feed.system_id, feeds: {}, rejections: [] };
      operators.set(feed.system_id, entry);
    }
    entry.feeds[feed.data_type] = feed;
  });

  operators.forEach((entry) => {
    entry.rejections = rejections
      .filter((rejection) => rejectionAppliesToOperator(rejection, entry.system_id))
      .sort((a, b) => b.start_time.localeCompare(a.start_time));
  });

  return Array.from(operators.values());
};

export const hasDataQualityIssue = (operator: OperatorDataQuality): boolean => {
  if (operator.rejections.length > 0) return true;
  return DATA_TYPES.some((dataType) => operator.feeds[dataType]?.status === 'unavailable');
};

/** Operators with issues first, then alphabetically by display name. */
export const sortOperators = (
  operators: OperatorDataQuality[],
  getName: (systemId: string) => string
): OperatorDataQuality[] => {
  return [...operators].sort((a, b) => {
    const issueDiff = Number(hasDataQualityIssue(b)) - Number(hasDataQualityIssue(a));
    if (issueDiff !== 0) return issueDiff;
    return getName(a.system_id).localeCompare(getName(b.system_id), 'nl', {
      sensitivity: 'base',
    });
  });
};

export interface TimelineSegment {
  leftPct: number;
  widthPct: number;
  start: number;
  end: number;
  ongoing: boolean;
}

/** Clamp intervals to the period and express them as percentage offsets for a timeline. */
export const toTimelineSegments = (
  intervals: TimeInterval[],
  period: DataQualityPeriod,
  now: number = Date.now()
): TimelineSegment[] => {
  const visibleEnd = Math.min(period.end, Math.max(now, period.start));
  const duration = period.end - period.start;
  if (duration <= 0) return [];

  return intervals
    .map((interval) => {
      const rawStart = new Date(interval.start_time).getTime();
      const rawEnd = interval.end_time ? new Date(interval.end_time).getTime() : visibleEnd;
      const start = Math.max(rawStart, period.start);
      const end = Math.min(rawEnd, period.end);
      return { start, end, ongoing: interval.end_time === null };
    })
    .filter(({ start, end }) => end > start)
    .sort((a, b) => a.start - b.start)
    .map(({ start, end, ongoing }) => ({
      start,
      end,
      ongoing,
      leftPct: ((start - period.start) / duration) * 100,
      widthPct: ((end - start) / duration) * 100,
    }));
};

export const formatDateTime = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return moment(value).format('DD-MM-YYYY HH:mm');
};

export const formatRejectionPeriod = (rejection: TimeInterval): string => {
  const end = rejection.end_time ? formatDateTime(rejection.end_time) : 'heden';
  return `${formatDateTime(rejection.start_time)} – ${end}`;
};

export interface RejectionLabelResolvers {
  getOperatorName: (systemId: string) => string;
  getMunicipalityName: (gmCode: string) => string;
  getVehicleTypeName: (vehicleTypeId: string) => string;
}

const joinOrAll = (
  values: string[] | 'all',
  resolve: (value: string) => string,
  allLabel: string
): string => {
  if (values === 'all') return allLabel;
  return values.map(resolve).join(', ');
};

export const describeRejectionOperators = (
  rejection: ManualRejection,
  resolvers: RejectionLabelResolvers
): string => joinOrAll(rejection.system_ids, resolvers.getOperatorName, 'Alle aanbieders');

export const describeRejectionMunicipalities = (
  rejection: ManualRejection,
  resolvers: RejectionLabelResolvers
): string => joinOrAll(rejection.municipalities, resolvers.getMunicipalityName, 'Alle (heel Nederland)');

export const describeRejectionVehicleTypes = (
  rejection: ManualRejection,
  resolvers: RejectionLabelResolvers
): string => joinOrAll(rejection.vehicle_types, resolvers.getVehicleTypeName, 'Alle');

export const describeRejectionDataTypes = (rejection: ManualRejection): string => {
  return rejection.data_types.map((dataType) => DATA_TYPE_LABELS[dataType]).join(', ');
};

export const buildRejectionCsvColumns = (
  resolvers: RejectionLabelResolvers
): CsvColumn<ManualRejection>[] => [
  { header: 'ID', value: (r) => r.rejection_id },
  { header: 'Aanbieder(s)', value: (r) => describeRejectionOperators(r, resolvers) },
  { header: 'Van', value: (r) => formatDateTime(r.start_time) },
  { header: 'Tot', value: (r) => (r.end_time ? formatDateTime(r.end_time) : 'heden') },
  { header: 'Gebied', value: (r) => describeRejectionMunicipalities(r, resolvers) },
  { header: 'Voertuigtype', value: (r) => describeRejectionVehicleTypes(r, resolvers) },
  { header: 'Datatype', value: (r) => describeRejectionDataTypes(r) },
  { header: 'Issue owner', value: (r) => ISSUE_OWNER_LABELS[r.issue_owner] },
  { header: 'Notitie', value: (r) => r.note },
  { header: 'Aangemaakt door', value: (r) => r.created_by },
  { header: 'Aangemaakt op', value: (r) => formatDateTime(r.created_at) },
  { header: 'Gewijzigd door', value: (r) => r.updated_by },
  { header: 'Gewijzigd op', value: (r) => (r.updated_at ? formatDateTime(r.updated_at) : '') },
];

/** Returns Dutch validation messages; an empty array means the input is valid. */
export const validateRejectionInput = (input: ManualRejectionInput): string[] => {
  const errors: string[] = [];
  const start = new Date(input.start_time).getTime();

  if (!input.start_time || isNaN(start)) {
    errors.push('Vul een geldige startdatum in.');
  }
  if (input.end_time) {
    const end = new Date(input.end_time).getTime();
    if (isNaN(end)) {
      errors.push('Vul een geldige einddatum in.');
    } else if (!isNaN(start) && end <= start) {
      errors.push('De einddatum moet na de startdatum liggen.');
    }
  }
  if (input.system_ids !== 'all' && input.system_ids.length === 0) {
    errors.push('Kies minimaal één aanbieder.');
  }
  if (input.municipalities !== 'all' && input.municipalities.length === 0) {
    errors.push('Kies minimaal één gemeente, of heel Nederland.');
  }
  if (input.vehicle_types !== 'all' && input.vehicle_types.length === 0) {
    errors.push('Kies minimaal één voertuigtype, of alle voertuigtypes.');
  }
  if (input.data_types.length === 0) {
    errors.push('Kies minimaal één datatype.');
  }
  return errors;
};
