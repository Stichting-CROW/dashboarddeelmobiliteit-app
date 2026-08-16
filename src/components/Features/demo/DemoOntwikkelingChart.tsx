import { useMemo } from 'react';
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
import { demoOperators, getDemoOntwikkelingData } from './demoData';
import { CustomizedXAxisTick, CustomizedYAxisTick } from '../../Chart/CustomizedAxisTick.jsx';

const TOTAAL_KEY = 'Totaal';

/**
 * Demo version of the "Ontwikkeling" chart on the zone statistics page:
 * the number of parked vehicles in one hub during a weekday, per quarter.
 */
function DemoOntwikkelingChart() {
  const data = useMemo(() => getDemoOntwikkelingData(), []);

  return (
    <DemoWidgetCard
      title="Trends door tijd"
      description="Aanbod in een hub op een werkdag, per kwartier en per aanbieder."
    >
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 0" vertical={false} />
            <XAxis
              dataKey="time"
              tick={<CustomizedXAxisTick />}
              interval={11}
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

export default DemoOntwikkelingChart;
