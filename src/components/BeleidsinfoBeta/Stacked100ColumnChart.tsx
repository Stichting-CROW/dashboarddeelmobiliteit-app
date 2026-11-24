import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer
} from 'recharts';

import { Category } from './mockData';
import { AXIS_TICK_STYLE, BetaTooltip, formatPercent, getYAxisLabel } from './BetaChartShared';

export interface Stacked100ColumnChartProps {
  /** One row per X category (modality), with a percentage per `categories[].key`. */
  data: Array<Record<string, number | string>>;
  /** Key in `data` used for the X axis (e.g. 'modality'). */
  xKey: string;
  /** Stack segments (legend), in bottom-to-top order. */
  categories: readonly Category[];
  /** Y-axis title. */
  yLabel?: string;
  /** Show percentage labels inside segments that are large enough. */
  showLabels?: boolean;
}

/** Only label segments that are at least this many percent tall. */
const MIN_LABEL_PERCENT = 6;

/**
 * 100% stacked column chart: each column (modality) sums to 100%,
 * the segments show the distribution over the given categories.
 */
function Stacked100ColumnChart({
  data,
  xKey,
  categories,
  yLabel = 'Percentage van de verhuringen',
  showLabels = true
}: Stacked100ColumnChartProps) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 10, right: 24, left: 8, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 0" vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS_TICK_STYLE} />
        <YAxis
          tick={AXIS_TICK_STYLE}
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(v: number) => `${v}%`}
          width={64}
          label={getYAxisLabel(yLabel)}
        />
        <Tooltip content={<BetaTooltip formatter={formatPercent} reverse />} />
        <Legend iconType="square" />
        {categories.map((c) => (
          <Bar
            key={c.key}
            dataKey={c.key}
            name={c.label}
            stackId="stack"
            fill={c.color}
            isAnimationActive={false}
          >
            {showLabels && (
              <LabelList
                dataKey={c.key}
                position="center"
                formatter={(v: number) => (v >= MIN_LABEL_PERCENT ? `${Math.round(v)}%` : '')}
                style={{ fontSize: 11, fill: isDark(c.color) ? '#FFFFFF' : '#111827', pointerEvents: 'none' }}
              />
            )}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Rough luminance check to pick a readable label colour. */
const isDark = (hex: string): boolean => {
  const h = hex.replace('#', '');
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 150;
};

export default Stacked100ColumnChart;
