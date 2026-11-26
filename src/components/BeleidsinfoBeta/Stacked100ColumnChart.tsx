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

import { Category } from './modalities';
import { AXIS_TICK_STYLE, BetaTooltip, formatPercent, getYAxisLabel } from './BetaChartShared';
import { useBetaChartCompact } from './BetaChartCompactContext';
import ChartLegend from './ChartLegend';
import { COMPACT_COLUMN_PLOT_HEIGHT, getYAxisWidth } from './chartLayout';

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

const Y_TICKS = [0, 25, 50, 75, 100];

/**
 * 100% stacked column chart: each column (modality) sums to 100%,
 * the segments show the distribution over the given categories.
 * In a compact card the Y title becomes a caption and the legend moves below the plot.
 */
function Stacked100ColumnChart({
  data,
  xKey,
  categories,
  yLabel = 'Percentage van de verhuringen',
  showLabels = true
}: Stacked100ColumnChartProps) {
  const compact = useBetaChartCompact();

  const chart = (
    <BarChart
      data={data}
      margin={compact
        ? { top: 8, right: 4, left: 0, bottom: 0 }
        : { top: 10, right: 24, left: 8, bottom: 0 }}
      barCategoryGap={compact ? '18%' : '28%'}
    >
      <CartesianGrid strokeDasharray="3 0" vertical={false} />
      <XAxis dataKey={xKey} tick={AXIS_TICK_STYLE} />
      <YAxis
        tick={AXIS_TICK_STYLE}
        domain={[0, 100]}
        ticks={Y_TICKS}
        tickFormatter={(v: number) => `${v}%`}
        width={compact ? getYAxisWidth(['100%']) : 64}
        label={compact ? undefined : getYAxisLabel(yLabel)}
      />
      <Tooltip
        content={<BetaTooltip formatter={formatPercent} reverse />}
        position={compact ? { y: 0 } : undefined}
      />
      {!compact && (
        <Legend
          iconType="square"
          formatter={(value: string) => <span className="BetaChart-legend-label">{value}</span>}
        />
      )}
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
  );

  if (!compact) return <ResponsiveContainer>{chart}</ResponsiveContainer>;

  return (
    <div className="BetaChart-compact">
      <div className="BetaChart-caption">{yLabel}</div>
      <div style={{ height: COMPACT_COLUMN_PLOT_HEIGHT }}>
        <ResponsiveContainer>{chart}</ResponsiveContainer>
      </div>
      <ChartLegend items={categories} variant="square" />
    </div>
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
