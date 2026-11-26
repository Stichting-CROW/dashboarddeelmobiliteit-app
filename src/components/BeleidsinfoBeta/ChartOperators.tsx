import React from 'react';

import { isDemoMode } from '../../config/demo';
import { getDisplayOperatorName } from '../../helpers/demoMode';
import { getPrettyProviderName } from '../../helpers/providers';
import type { ModalityOperators } from './modalities';

import './BeleidsinfoBeta.css';

export interface ChartOperatorsProps {
  items: ModalityOperators[];
}

const getOperatorName = (systemId: string): string =>
  getDisplayOperatorName(systemId, getPrettyProviderName(systemId), isDemoMode());

/** Lists the operators whose data is included in a chart, per modality. */
function ChartOperators({ items }: ChartOperatorsProps) {
  if (items.length === 0) return null;

  return (
    <div className="BetaChartOperators">
      <span className="BetaChartOperators-title">Aanbieders in deze grafiek</span>
      <ul className="BetaChartOperators-list">
        {items.map(({ modality, operators }) => {
          const names = operators
            .map(getOperatorName)
            .sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
          return (
            <li key={modality.key} className="BetaChartOperators-item">
              <span
                className="BetaChartOperators-swatch"
                style={{ backgroundColor: modality.color }}
                aria-hidden="true"
              />
              <span className="BetaChartOperators-modality">{modality.label}:</span>{' '}
              {names.length > 0 ? names.join(', ') : <em>onbekend</em>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ChartOperators;
