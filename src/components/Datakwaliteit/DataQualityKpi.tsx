import React, { useCallback, useMemo } from 'react';
import moment from 'moment';
import PerformanceIndicator from '../PrestatiesAanbieders/PerformanceIndicator';
import type {
  PerformanceIndicatorDescription,
  PerformanceIndicatorKPI,
} from '../../api/permitLimits';
import type { OperatorDataQuality } from '../../types/DataQuality';
import { useOperatorDataQuality } from './DataQualityContext';
import {
  DATA_TYPES,
  DATA_TYPE_LABELS,
  ISSUE_OWNER_LABELS,
  buildDailyDataQuality,
  describeRejectionDataTypes,
  formatRejectionPeriod,
  type DailyDataQuality,
  type DailyFeedQuality,
} from './dataQualityUtils';

const KPI_KEY = 'data_quality';

const DESCRIPTIONS: PerformanceIndicatorDescription[] = [{
  kpi_key: KPI_KEY,
  bound: '',
  unit: '',
  title: 'Datakwaliteit',
  description:
    'Rood als op die dag minstens één feed van de aanbieder (aanbod, verhuringen of ' +
    'servicegebieden) een storing had, of als de data handmatig is afgekeurd voor deze ' +
    'gemeente en dit voertuigtype. Groen als alle verwachte feeds beschikbaar waren.',
  bound_description: '',
}];

const formatPct = (value: number): string => `${value.toFixed(1).replace('.', ',')}%`;

const formatDay = (date: string): string =>
  new Date(`${date}T00:00:00`).toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });

const describeDailyFeed = (feed: DailyFeedQuality | undefined): string => {
  if (!feed || feed.status === 'unknown') return 'nog niet gecontroleerd';
  if (feed.status === 'not_expected') return 'geen feed verwacht';
  if (feed.outages.length === 0) return 'beschikbaar';
  const outages = feed.outages.map((outage) => {
    const end = outage.ongoing ? 'heden' : moment(outage.end).format('HH:mm');
    return `${moment(outage.start).format('HH:mm')}–${end}`;
  });
  return `storing ${outages.join(', ')}`;
};

const describeVerdict = (complies: boolean | undefined): string => {
  if (complies === true) return 'Alle feeds beschikbaar';
  if (complies === false) return 'Problemen met de datakwaliteit';
  return 'Onbekend';
};

const DayTooltip = ({ day }: { day: DailyDataQuality }) => (
  <div className="text-sm leading-tight">
    <div className="font-semibold">{formatDay(day.date)}</div>
    <div className="mb-1">{describeVerdict(day.complies)}</div>
    {DATA_TYPES.map((dataType) => (
      <div key={dataType}>
        {DATA_TYPE_LABELS[dataType]}: {describeDailyFeed(day.feeds[dataType])}
      </div>
    ))}
    {day.rejections.length > 0 && (
      <>
        <div className="font-semibold mt-1">Handmatig afgekeurd</div>
        {day.rejections.map((rejection) => (
          <div key={rejection.rejection_id} className="mt-1">
            <div>{formatRejectionPeriod(rejection)}</div>
            <div>
              {describeRejectionDataTypes(rejection)} · {ISSUE_OWNER_LABELS[rejection.issue_owner]}
            </div>
            {rejection.note && <div className="italic whitespace-pre-line">{rejection.note}</div>}
          </div>
        ))}
      </>
    )}
  </div>
);

const describePeriodFeed = (operator: OperatorDataQuality, dataType: typeof DATA_TYPES[number]) => {
  const feed = operator.feeds[dataType];
  if (!feed || feed.status === 'unknown') return 'nog niet gecontroleerd';
  if (feed.status === 'not_expected') return 'geen feed verwacht';
  const parts: string[] = [];
  if (feed.availability_pct !== null) parts.push(`${formatPct(feed.availability_pct)} beschikbaar`);
  parts.push(`${feed.outages.length} ${feed.outages.length === 1 ? 'storing' : 'storingen'}`);
  return parts.join(' · ');
};

const PeriodTooltip = ({
  operator,
  days,
}: {
  operator: OperatorDataQuality;
  days: DailyDataQuality[];
}) => {
  const okDays = days.filter((day) => day.complies === true).length;
  const issueDays = days.filter((day) => day.complies === false).length;
  const rejectionCount = new Set(
    days.flatMap((day) => day.rejections.map((rejection) => rejection.rejection_id))
  ).size;

  return (
    <div className="text-sm leading-tight">
      <div>Dagen zonder problemen: {okDays}</div>
      <div className="mb-1">Dagen met problemen: {issueDays}</div>
      {DATA_TYPES.map((dataType) => (
        <div key={dataType}>
          {DATA_TYPE_LABELS[dataType]}: {describePeriodFeed(operator, dataType)}
        </div>
      ))}
      <div className="mt-1">Handmatige afkeuringen: {rejectionCount}</div>
    </div>
  );
};

interface DataQualityKpiProps {
  systemId: string | null | undefined;
  gmCode: string | null | undefined;
  formFactor: string | null | undefined;
}

/** "Datakwaliteit" row for a Prestaties aanbieders card. Renders nothing without data. */
const DataQualityKpi = ({ systemId, gmCode, formFactor }: DataQualityKpiProps) => {
  const dataQuality = useOperatorDataQuality(systemId);
  const operator = dataQuality?.operator ?? null;
  const period = dataQuality?.period ?? null;
  const now = dataQuality?.now;

  const days = useMemo(() => {
    if (!operator || !period) return [];
    return buildDailyDataQuality(operator, { gmCode, formFactor, period, now });
  }, [operator, period, now, gmCode, formFactor]);

  const daysByDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);

  const kpi = useMemo<PerformanceIndicatorKPI>(() => ({
    kpi_key: KPI_KEY,
    granularity: 'day',
    values: days.map((day) => ({ date: day.date, measured: 0, complies: day.complies })),
  }), [days]);

  const renderBlockTooltip = useCallback((date: string) => {
    const day = daysByDate.get(date);
    return day ? <DayTooltip day={day} /> : null;
  }, [daysByDate]);

  if (!operator || days.length === 0) return null;

  return (
    <PerformanceIndicator
      kpi={kpi}
      performanceIndicatorDescriptions={DESCRIPTIONS}
      renderBlockTooltip={renderBlockTooltip}
      barTooltip={<PeriodTooltip operator={operator} days={days} />}
    />
  );
};

export default React.memo(DataQualityKpi);
