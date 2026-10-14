import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import DemoWidgetCard from './DemoWidgetCard';
import { DemoChartRow, demoOperators } from './demoData';
import { CustomizedXAxisTick, CustomizedYAxisTick } from '../../Chart/CustomizedAxisTick.jsx';

const TOTAAL_KEY = 'Totaal';

interface DemoLineChartProps {
  title: string;
  description: string;
  data: DemoChartRow[];
  /** Number of skipped labels between two x-axis ticks. */
  xAxisInterval?: number;
  height?: number;
}

/**
 * Line chart per demo operator plus a total, styled like the charts on the
 * statistics pages (same axis ticks, same line styling).
 */
function DemoLineChart({
  title,
  description,
  data,
  xAxisInterval = 11,
  height = 300
}: DemoLineChartProps) {
  return (
    <DemoWidgetCard title={title} description={description}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 0" vertical={false} />
            <XAxis
              dataKey="time"
              tick={<CustomizedXAxisTick />}
              interval={xAxisInterval}
              minTickGap={16}
            />
            <YAxis tick={<CustomizedYAxisTick />} />
            <Tooltip contentStyle={{ color: '#333333', fontSize: '0.85em' }} />
            <Legend wrapperStyle={{ fontSize: '0.8em' }} />
            {demoOperators.map((operator) => (
              <Line
                key={operator.system_id}
                type="monotone"
                dataKey={operator.system_id}
                name={operator.name}
                stroke={operator.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                dot={false}
                isAnimationActive={false}
              />
            ))}
            <Line
              type="monotone"
              dataKey={TOTAAL_KEY}
              name={TOTAAL_KEY}
              stroke="#1a1a1a"
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DemoWidgetCard>
  );
}

export default DemoLineChart;
