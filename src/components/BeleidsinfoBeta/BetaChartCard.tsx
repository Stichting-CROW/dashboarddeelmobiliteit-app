import React from 'react';

import InfoTooltip from '../InfoTooltip/InfoTooltip';
import ChartOperators from './ChartOperators';
import type { ModalityOperators } from './modalities';

import './BeleidsinfoBeta.css';

/** "live" shows real data; "voorstel" and "later" come from the proposal sheet. */
export type ProposalStatus = 'live' | 'voorstel' | 'later';

export interface BetaChartCardProps {
  title: string;
  status: ProposalStatus;
  /** Chart type from the proposal sheet, e.g. "lijn", "100% gestapelde kolommen". */
  chartType?: string;
  /** Explanation of the metric (shown in the info tooltip). */
  toelichting?: React.ReactNode;
  /** Remarks shown as footnotes below the chart. */
  opmerkingen?: string[];
  /** Operators included in the chart, per modality; shown below the chart. */
  operators?: ModalityOperators[];
  /** Optional controls (toggles) rendered at the top-right of the card. */
  controls?: React.ReactNode;
  /** Chart height in px. */
  height?: number;
  /** Shows a loading indicator over the body. */
  loading?: boolean;
  /** Replaces the chart with a message, e.g. for errors or empty data. */
  message?: string | null;
  /** Extra classes for the wrapper. */
  className?: string;
  children?: React.ReactNode;
}

/**
 * Card wrapper for one chart on the Beleidsinfo (beta) page.
 * Shows the title, badges, an explanation tooltip, optional controls,
 * the chart itself (or a loading / message state) and footnotes.
 */
function BetaChartCard({
  title,
  status,
  chartType,
  toelichting,
  opmerkingen,
  operators,
  controls,
  height = 380,
  loading = false,
  message,
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
          {status !== 'live' && (
            <span className={`BetaChartCard-badge BetaChartCard-badge-${status}`}>
              {status === 'voorstel' ? 'Voorstel' : 'Later'}
            </span>
          )}
        </div>
      </header>

      {controls && <div className="BetaChartCard-controls">{controls}</div>}

      <div className="BetaChartCard-body" style={{ height }} aria-busy={loading}>
        {message ? <div className="BetaChartCard-message">{message}</div> : children}
        {loading && (
          <div className="BetaChartCard-loading" role="status">
            Bezig met laden…
          </div>
        )}
      </div>

      {!message && operators && <ChartOperators items={operators} />}

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
