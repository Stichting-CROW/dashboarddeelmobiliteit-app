import React from 'react';

import InfoTooltip from '../InfoTooltip/InfoTooltip';
import {AggregationLevel, AggregationLevelOption} from '../../helpers/stats/index';

interface AggregationLevelControlProps {
  levels: AggregationLevelOption[];
  activeLevel: AggregationLevel | string;
  onChange: (level: AggregationLevel) => void;
}

/**
 * Segmented control for the chart interval (5 min / kwartier / uur / dag /
 * week / maand), with an info tooltip. Shared by the statistics pages so the
 * control looks and behaves the same everywhere.
 */
function AggregationLevelControl({levels, activeLevel, onChange}: AggregationLevelControlProps) {
  if (levels.length === 0) return null;

  const activeOption = levels.find(x => x.name === activeLevel);

  return (
    <>
      <div
        className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5"
        role="group"
        aria-label="Tijdsinterval"
      >
        {levels.map(x => {
          const isActive = x.name === activeLevel;
          return (
            <button
              key={x.name}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(x.name)}
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
        Toon de data in intervallen van {levels.map(x => x.title).join(' / ')}.
        Je bekijkt nu {activeOption?.title}-niveau.
      </InfoTooltip>
    </>
  );
}

export default AggregationLevelControl;
