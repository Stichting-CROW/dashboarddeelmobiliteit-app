import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { Category } from './modalities';
import {
  AXIS_TICK_STYLE,
  BetaTooltip,
  ValueFormatter,
  formatPercent,
  getYAxisLabel
} from './BetaChartShared';

export interface GroupedColumnChartProps {
  /** One row per X category (modality), with a value per `groups[].key`. */
  data: Array<Record<string, number | string>>;
  /** Key in `data` used for the X axis (e.g. 'modality'). */
  xKey: string;
  /** Grouped bars (legend), in left-to-right order. */
  groups: readonly Category[];
  yLabel: string;
  formatter?: ValueFormatter;
  yDomain?: [number, number];
}

/** Grouped (clustered) column chart, e.g. dekkingsgraad per moment van de dag. */
function GroupedColumnChart({
  data,
  xKey,
  groups,
  yLabel,
  formatter = formatPercent,
  yDomain = [0, 100]
}: GroupedColumnChartProps) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 10, right: 24, left: 8, bottom: 0 }} barCategoryGap="20%" barGap={2}>
        <CartesianGrid strokeDasharray="3 0" vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS_TICK_STYLE} />
        <YAxis
          tick={AXIS_TICK_STYLE}
          domain={yDomain}
          tickFormatter={(v: number) => formatter(v)}
          width={64}
          label={getYAxisLabel(yLabel)}
        />
        <Tooltip content={<BetaTooltip formatter={formatter} />} />
        <Legend iconType="square" />
        {groups.map((g) => (
          <Bar
            key={g.key}
            dataKey={g.key}
            name={g.label}
            fill={g.color}
            isAnimationActive={false}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default GroupedColumnChart;
