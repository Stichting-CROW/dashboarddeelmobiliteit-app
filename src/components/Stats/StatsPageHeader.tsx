import React from 'react';
import moment from 'moment';

import PageTitle from '../common/PageTitle';
import InfoTooltip from '../InfoTooltip/InfoTooltip';
import {AggregationLevel, AggregationLevelOption} from '../../helpers/stats/index';

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
  onChangeAggregationLevel
}: StatsPageHeaderProps) {
  // Inclusive number of days in the selected period
  const days = moment(endDate).startOf('day').diff(moment(startDate).startOf('day'), 'days') + 1;
  const activeOption = aggregationLevels.find(x => x.name === activeAggregationLevel);

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
          <div
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5"
            role="group"
            aria-label="Tijdsinterval"
          >
            {aggregationLevels.map(x => {
              const isActive = x.name === activeAggregationLevel;
              return (
                <button
                  key={x.name}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onChangeAggregationLevel(x.name)}
                  className={
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors select-none ' +
                    (isActive
                      ? 'bg-theme-blue text-white cursor-default'
                      : 'text-gray-600 hover:bg-gray-100')
                  }
                >
                  {x.title}
                </button>
              );
            })}
          </div>
          <InfoTooltip className="inline-block">
            Toon de data in intervallen van {aggregationLevels.map(x => x.title).join(' / ')}.
            Je bekijkt nu {activeOption?.title}-niveau.
          </InfoTooltip>
        </div>
      )}
    </div>
  );
}

export default StatsPageHeader;
