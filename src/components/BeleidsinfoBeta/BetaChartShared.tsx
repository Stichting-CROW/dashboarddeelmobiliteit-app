import React from 'react';

import '../Chart/CustomizedTooltip.css';
import './BeleidsinfoBeta.css';

/* ------------------------------------------------------------------ */
/* Value formatting                                                    */
/* ------------------------------------------------------------------ */

export type ValueFormatter = (value: number) => string;

export const formatNumber: ValueFormatter = (v) =>
  Number.isInteger(v) ? v.toLocaleString('nl-NL') : v.toLocaleString('nl-NL', { maximumFractionDigits: 2 });

export const formatPercent: ValueFormatter = (v) =>
  `${v.toLocaleString('nl-NL', { maximumFractionDigits: 1 })}%`;

export const formatRatio: ValueFormatter = (v) =>
  v.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ------------------------------------------------------------------ */
/* Tooltip                                                             */
/* ------------------------------------------------------------------ */

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  stroke?: string;
  fill?: string;
  dataKey?: string;
}

export interface BetaTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  formatter?: ValueFormatter;
  /** Show a "Totaal" line summing all entries (only for additive metrics). */
  showTotal?: boolean;
  /** Reverse the entry order (useful for stacked charts so the visual order matches). */
  reverse?: boolean;
}

/**
 * Tooltip in the same visual style as the existing charts, but without the
 * implicit "Totaal" (which makes no sense for percentages or ratios).
 */
export function BetaTooltip({
  active,
  payload,
  label,
  formatter = formatNumber,
  showTotal = false,
  reverse = false
}: BetaTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entries = reverse ? [...payload].reverse() : payload;
  const total = entries.reduce((s, e) => s + (Number(e.value) || 0), 0);
  return (
    <div className="CustomizedTooltip text-sm">
      <div className="my-0 font-semibold">{label}</div>
      <ul className="my-0 py-0">
        {entries.map((e, i) => (
          <li
            key={`${e.dataKey ?? e.name}-${i}`}
            className="CustomizedTooltip-item"
            style={{ color: e.color || e.stroke || e.fill || '#333333' }}
          >
            {e.name}: {formatter(Number(e.value) || 0)}
          </li>
        ))}
      </ul>
      {showTotal && entries.length > 1 && (
        <div className="my-0 pt-1 border-t border-gray-200">Totaal: {formatter(total)}</div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Axis styling shared by all beta charts                              */
/* ------------------------------------------------------------------ */

export const AXIS_TICK_STYLE = { fontSize: 12, fill: '#666666' } as const;

export const getYAxisLabel = (text: string) => ({
  value: text,
  angle: -90,
  position: 'insideLeft' as const,
  offset: 12,
  className: 'BetaChart-axis-label',
  style: { textAnchor: 'middle' as const }
});

export const getXAxisLabel = (text: string) => ({
  value: text,
  position: 'insideBottom' as const,
  offset: -4,
  className: 'BetaChart-axis-label'
});

/* ------------------------------------------------------------------ */
/* Segmented control                                                   */
/* ------------------------------------------------------------------ */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface BetaSegmentedProps<T extends string> {
  label?: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
}

/** Small toggle, styled like the existing aggregation buttons. */
export function BetaSegmented<T extends string>({
  label,
  value,
  options,
  onChange
}: BetaSegmentedProps<T>) {
  return (
    <div className="BetaSegmented" role="group" aria-label={label}>
      {label && <span className="BetaSegmented-label">{label}</span>}
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`agg-button ${value === o.value ? 'agg-button-active' : ''}`}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Placeholder for "later" items                                       */
/* ------------------------------------------------------------------ */

export function BetaPlaceholder({ text }: { text?: string }) {
  return (
    <div className="BetaPlaceholder">
      <div className="BetaPlaceholder-pm">PM</div>
      <div className="BetaPlaceholder-text">
        {text ?? 'Grafiektype, legenda en assen nog te bepalen.'}
      </div>
    </div>
  );
}
