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

import { MODALITIES } from './mockData';
import {
  AXIS_TICK_STYLE,
  BetaTooltip,
  ValueFormatter,
  formatNumber,
  getYAxisLabel
} from './BetaChartShared';

export interface ModalityLineChartProps {
  /** Rows with a `time` label and one numeric value per modality key. */
  data: Array<Record<string, number | string | boolean>>;
  /** Y-axis title. */
  yLabel: string;
  /** Formatter for Y ticks and tooltip values. */
  formatter?: ValueFormatter;
  /** Fix the Y domain, e.g. [0, 100] for percentages. */
  yDomain?: [number | 'auto', number | 'auto'];
  /** Show X ticks only where `tickFilter` returns true (e.g. day starts). */
  tickFilter?: (row: Record<string, unknown>) => boolean;
  /** Optional label override for shown X ticks (defaults to the `time` value). */
  tickLabel?: (row: Record<string, unknown>) => string;
  /** Interval for X-axis ticks; defaults to recharts auto. */
  xTickInterval?: number | 'preserveStartEnd';
}

/**
 * Line chart with one line per modality (fiets, bakfiets, scooter, auto)
 * and no "Totaal" line, as requested in the proposal.
 */
function ModalityLineChart({
  data,
  yLabel,
  formatter = formatNumber,
  yDomain,
  tickFilter,
  tickLabel,
  xTickInterval
}: ModalityLineChartProps) {
  // Recharts passes the index of the *rendered* tick, not of the data row,
  // so look the row up by its (unique) `time` value instead.
  const rowsByTime = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    data.forEach((row) => map.set(String(row.time), row));
    return map;
  }, [data]);

  const xTickFormatter = tickFilter
    ? (value: string) => {
        const row = rowsByTime.get(String(value)) ?? {};
        if (!tickFilter(row)) return '';
        return tickLabel ? tickLabel(row) : value;
      }
    : undefined;

  return (
    <ResponsiveContainer>
      <LineChart data={data} margin={{ top: 10, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 0" vertical={false} />
        <XAxis
          dataKey="time"
          tick={AXIS_TICK_STYLE}
          tickFormatter={xTickFormatter}
          interval={xTickInterval ?? (tickFilter ? 0 : 'preserveStartEnd')}
          tickLine={!tickFilter}
          minTickGap={tickFilter ? 0 : 24}
        />
        <YAxis
          tick={AXIS_TICK_STYLE}
          tickFormatter={(v: number) => formatter(v)}
          domain={yDomain}
          width={64}
          label={getYAxisLabel(yLabel)}
        />
        <Tooltip content={<BetaTooltip formatter={formatter} />} />
        <Legend iconType="plainline" />
        {MODALITIES.map((m) => (
          <Line
            key={m.key}
            type="monotone"
            dataKey={m.key}
            name={m.label}
            stroke={m.color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default ModalityLineChart;
