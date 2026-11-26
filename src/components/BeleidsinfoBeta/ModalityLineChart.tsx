import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { Modality } from './modalities';
import { TimeSeriesRow } from './statsV3Transforms';
import {
  AXIS_TICK_STYLE,
  BetaTooltip,
  ValueFormatter,
  formatNumber,
  getYAxisLabel
} from './BetaChartShared';
import { useBetaChartCompact } from './BetaChartCompactContext';
import ChartLegend from './ChartLegend';
import { COMPACT_LINE_PLOT_HEIGHT, getMaxValue, getYAxisWidth, niceCeil } from './chartLayout';

export interface ModalityLineChartProps {
  /** One row per period, with a value per modality key. */
  data: TimeSeriesRow[];
  /** Modalities to draw, one line each. */
  modalities: readonly Modality[];
  /** Y-axis title. */
  yLabel: string;
  /** Formatter for Y ticks and tooltip values. */
  formatter?: ValueFormatter;
  /** Fix the Y domain, e.g. [0, 100] for percentages. */
  yDomain?: [number | 'auto', number | 'auto'];
}

/**
 * Line chart with one line per modality and no "Totaal" line.
 * X values are the period starts; ticks and tooltips show readable labels.
 * In a compact card the Y title becomes a caption and the legend moves below the plot.
 */
function ModalityLineChart({
  data,
  modalities,
  yLabel,
  formatter = formatNumber,
  yDomain
}: ModalityLineChartProps) {
  const compact = useBetaChartCompact();

  const rowsByStart = useMemo(() => {
    const map = new Map<string, TimeSeriesRow>();
    data.forEach((row) => map.set(row.periodStart, row));
    return map;
  }, [data]);

  const yAxisWidth = useMemo(() => {
    if (!compact) return 64;
    const max = niceCeil(getMaxValue(data, modalities.map((m) => m.key)));
    return getYAxisWidth([formatter(0), formatter(max)]);
  }, [compact, data, modalities, formatter]);

  const tickFormatter = (value: string) => rowsByStart.get(value)?.tickLabel ?? value;
  const tooltipLabel = (value: string | number) =>
    rowsByStart.get(String(value))?.tooltipLabel ?? String(value);

  const chart = (
    <LineChart
      data={data}
      margin={compact
        ? { top: 8, right: 12, left: 0, bottom: 0 }
        : { top: 10, right: 24, left: 8, bottom: 0 }}
    >
      <CartesianGrid strokeDasharray="3 0" vertical={false} />
      <XAxis
        dataKey="periodStart"
        tick={AXIS_TICK_STYLE}
        tickFormatter={tickFormatter}
        interval="preserveStartEnd"
        minTickGap={compact ? 16 : 24}
      />
      <YAxis
        tick={AXIS_TICK_STYLE}
        tickFormatter={(v: number) => formatter(v)}
        domain={yDomain}
        width={yAxisWidth}
        label={compact ? undefined : getYAxisLabel(yLabel)}
      />
      <Tooltip
        content={<BetaTooltip formatter={formatter} labelFormatter={tooltipLabel} />}
        position={compact ? { y: 0 } : undefined}
      />
      {!compact && <Legend iconType="plainline" />}
      {modalities.map((m) => (
        <Line
          key={m.key}
          type="monotone"
          dataKey={m.key}
          name={m.label}
          stroke={m.color}
          strokeWidth={compact ? 2 : 2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          dot={data.length === 1}
          isAnimationActive={false}
          connectNulls
        />
      ))}
    </LineChart>
  );

  if (!compact) return <ResponsiveContainer>{chart}</ResponsiveContainer>;

  return (
    <div className="BetaChart-compact">
      <div className="BetaChart-caption">{yLabel}</div>
      <div style={{ height: COMPACT_LINE_PLOT_HEIGHT }}>
        <ResponsiveContainer>{chart}</ResponsiveContainer>
      </div>
      <ChartLegend items={modalities} variant="line" />
    </div>
  );
}

export default ModalityLineChart;
