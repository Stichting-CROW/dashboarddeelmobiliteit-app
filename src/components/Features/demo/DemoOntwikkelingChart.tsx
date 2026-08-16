import { useMemo } from 'react';

import DemoLineChart from './DemoLineChart';
import { getDemoOntwikkelingData } from './demoData';

/**
 * Demo version of the "Ontwikkeling" chart on the zone statistics page:
 * the number of parked vehicles in one hub during a weekday, per quarter.
 */
function DemoOntwikkelingChart() {
  const data = useMemo(() => getDemoOntwikkelingData(), []);

  return (
    <DemoLineChart
      title="Trends door tijd"
      description="Bezetting van een hub bij een centraal station op een werkdag, per kwartier en per aanbieder."
      data={data}
      xAxisInterval={11}
    />
  );
}

export default DemoOntwikkelingChart;
