import React from 'react';
import moment from 'moment';

import PageTitle from '../common/PageTitle';
import InfoTooltip from '../InfoTooltip/InfoTooltip';
import AggregationLevelControl from './AggregationLevelControl';
import {AggregationLevel, AggregationLevelOption} from '../../helpers/stats/index';
import {getPreviousPeriodFilter} from '../../helpers/stats/kpi';

interface StatsPageHeaderProps {
  /** Selected plaats or zone name(s) */
  title: string;
  /** ISO date strings of the selected period */
  startDate: string;
  endDate: string;
  /** Number of selected zones (0 = whole plaats) */
  zoneCount: number;
  aggregationLevels: AggregationLevelOption[];
  activeAggregationLevel: AggregationLevel | string;
  onChangeAggregationLevel: (level: AggregationLevel) => void;
  /** Whether the charts show the previous period as a ghost line */
  compareWithPreviousPeriod: boolean;
  onChangeCompareWithPreviousPeriod: (compare: boolean) => void;
}

/**
 * Formats the selected period as a compact Dutch range, e.g.
 * "17 aug. – 16 sep. 2026" or "28 dec. 2025 – 16 jan. 2026".
 */
export const formatPeriodLabel = (startDate: string, endDate: string): string => {
  const start = moment(startDate).locale('nl');
  const end = moment(endDate).locale('nl');
  if(start.isSame(end, 'day')) {
    return start.format('D MMM YYYY');
  }
  const startFormat = start.isSame(end, 'year') ? 'D MMM' : 'D MMM YYYY';
  return `${start.format(startFormat)} – ${end.format('D MMM YYYY')}`;
};

function StatsPageHeader({
  title,
  startDate,
  endDate,
  zoneCount,
  aggregationLevels,
  activeAggregationLevel,
  onChangeAggregationLevel,
  compareWithPreviousPeriod,
  onChangeCompareWithPreviousPeriod
}: StatsPageHeaderProps) {
  // Inclusive number of days in the selected period
  const days = moment(endDate).startOf('day').diff(moment(startDate).startOf('day'), 'days') + 1;

  // The previous period of equal length, shown in the compare toggle
  const previousPeriod = getPreviousPeriodFilter({ontwikkelingvan: startDate, ontwikkelingtot: endDate});
  const previousPeriodLabel = formatPeriodLabel(previousPeriod.ontwikkelingvan, previousPeriod.ontwikkelingtot);

  const subtitleParts = [
    formatPeriodLabel(startDate, endDate),
    `${days} ${days === 1 ? 'dag' : 'dagen'}`,
    zoneCount > 0 ? `${zoneCount} ${zoneCount === 1 ? 'zone' : 'zones'}` : 'Alle zones'
  ];

  return (
    <div className="StatsPageHeader">
      <PageTitle className="my-0">
        {title}
      </PageTitle>
      <p className="StatsPageHeader-subtitle text-sm text-gray-500 mt-1">
        {subtitleParts.map((part, i) => (
          <React.Fragment key={part}>
            {i > 0 && <span className="mx-2 text-gray-300" aria-hidden="true">·</span>}
            {part}
          </React.Fragment>
        ))}
      </p>

      {aggregationLevels.length > 0 && (
        <div className="StatsPageHeader-controls flex items-center gap-2 mt-3">
          <AggregationLevelControl
            levels={aggregationLevels}
            activeLevel={activeAggregationLevel}
            onChange={onChangeAggregationLevel}
          />

          <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden="true" />

          <button
            type="button"
            role="switch"
            aria-checked={compareWithPreviousPeriod}
            onClick={() => onChangeCompareWithPreviousPeriod(!compareWithPreviousPeriod)}
            className="StatsPageHeader-compare inline-flex items-center gap-2 text-xs text-gray-600 select-none"
          >
            <span
              className={
                'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ' +
                (compareWithPreviousPeriod ? 'bg-theme-blue' : 'bg-gray-300')
              }
            >
              <span
                className={
                  'inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ' +
                  (compareWithPreviousPeriod ? 'translate-x-3.5' : 'translate-x-0.5')
                }
              />
            </span>
            <span>
              Vergelijk met vorige periode
              <span className="ml-1 text-gray-400">({previousPeriodLabel})</span>
            </span>
          </button>
          <InfoTooltip className="inline-block">
            Toont in de grafieken het totaal van de vorige periode van gelijke lengte
            ({previousPeriodLabel}) als grijze stippellijn, uitgelijnd op dezelfde dag
            van de periode.
          </InfoTooltip>
        </div>
      )}
    </div>
  );
}

export default StatsPageHeader;
