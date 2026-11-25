import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer
} from 'recharts';

import {
  AXIS_TICK_STYLE,
  BetaTooltip,
  ValueFormatter,
  formatNumber,
  getXAxisLabel
} from './BetaChartShared';

export interface HorizontalBarChartProps {
  /** Rows sorted descending; `labelKey` gives the category, `valueKey` the value. */
  data: object[];
  labelKey: string;
  valueKey: string;
  /** Series name shown in the tooltip. */
  seriesName: string;
  color: string;
  xLabel: string;
  formatter?: ValueFormatter;
  /** Width reserved for the category labels on the left. */
  labelWidth?: number;
}

/** Horizontal ("liggende") bar chart, e.g. top-15 HB-relaties. */
function HorizontalBarChart({
  data,
  labelKey,
  valueKey,
  seriesName,
  color,
  xLabel,
  formatter = formatNumber,
  labelWidth = 220
}: HorizontalBarChartProps) {
  return (
    <ResponsiveContainer>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 48, left: 8, bottom: 16 }}
        barCategoryGap="25%"
      >
        <CartesianGrid strokeDasharray="3 0" horizontal={false} />
        <XAxis
          type="number"
          tick={AXIS_TICK_STYLE}
          tickFormatter={(v: number) => formatter(v)}
          label={getXAxisLabel(xLabel)}
        />
        <YAxis
          type="category"
          dataKey={labelKey}
          tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }}
          width={labelWidth}
          interval={0}
        />
        <Tooltip content={<BetaTooltip formatter={formatter} />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        <Bar dataKey={valueKey} name={seriesName} fill={color} isAnimationActive={false} radius={[0, 3, 3, 0]}>
          <LabelList
            dataKey={valueKey}
            position="right"
            formatter={(v: number) => formatter(v)}
            style={{ fontSize: 11, fill: '#4B5563' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default HorizontalBarChart;
