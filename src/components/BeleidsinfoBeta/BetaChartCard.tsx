import React from 'react';

import InfoTooltip from '../InfoTooltip/InfoTooltip';

import './BeleidsinfoBeta.css';

export type ProposalStatus = 'voorstel' | 'later';

export interface BetaChartCardProps {
  title: string;
  /** Status from the proposal sheet: "voorstel" (mocked up) or "later" (PM). */
  status: ProposalStatus;
  /** Chart type from the proposal sheet, e.g. "lijn", "100% gestapelde kolommen". */
  chartType?: string;
  /** Explanation of the metric (shown in the info tooltip). */
  toelichting?: React.ReactNode;
  /** Remarks from the proposal sheet, shown as footnotes below the chart. */
  opmerkingen?: string[];
  /** Optional controls (toggles) rendered at the top-right of the card. */
  controls?: React.ReactNode;
  /** Chart height in px. */
  height?: number;
  /** Extra classes for the wrapper. */
  className?: string;
  children?: React.ReactNode;
}

/**
 * Card wrapper for one proposed chart on the Beleidsinfo (beta) page.
 * Shows the title, status/chart-type badges, an explanation tooltip,
 * optional controls, the chart itself and footnotes.
 */
function BetaChartCard({
  title,
  status,
  chartType,
  toelichting,
  opmerkingen,
  controls,
  height = 380,
  className = '',
  children
}: BetaChartCardProps) {
  return (
    <section className={`BetaChartCard ${className}`} data-status={status}>
      <header className="BetaChartCard-header">
        <div className="BetaChartCard-title-row">
          <h2 className="BetaChartCard-title">{title}</h2>
          {toelichting && (
            <InfoTooltip className="ml-2 inline-block">
              {toelichting}
            </InfoTooltip>
          )}
        </div>
        <div className="BetaChartCard-meta">
          {chartType && <span className="BetaChartCard-badge">{chartType}</span>}
          <span className={`BetaChartCard-badge BetaChartCard-badge-${status}`}>
            {status === 'voorstel' ? 'Voorstel' : 'Later'}
          </span>
        </div>
      </header>

      {controls && <div className="BetaChartCard-controls">{controls}</div>}

      <div className="BetaChartCard-body" style={{ height }}>
        {children}
      </div>

      {opmerkingen && opmerkingen.length > 0 && (
        <ul className="BetaChartCard-footnotes">
          {opmerkingen.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default BetaChartCard;
