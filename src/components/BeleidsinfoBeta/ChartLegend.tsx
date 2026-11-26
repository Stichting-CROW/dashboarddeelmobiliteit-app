import React from 'react';

import './BeleidsinfoBeta.css';

export interface ChartLegendItem {
  key: string;
  label: string;
  color: string;
}

export interface ChartLegendProps {
  items: readonly ChartLegendItem[];
  /** "line" for line charts, "square" for bar segments. */
  variant?: 'line' | 'square';
}

/** HTML legend below a chart, so wrapping items never take height from the plot. */
function ChartLegend({ items, variant = 'square' }: ChartLegendProps) {
  if (items.length === 0) return null;

  return (
    <ul className="BetaChartLegend">
      {items.map((item) => (
        <li key={item.key} className="BetaChartLegend-item">
          <span
            className={`BetaChartLegend-swatch BetaChartLegend-swatch-${variant}`}
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export default ChartLegend;
