import { useMemo } from 'react';

import DemoLineChart from './DemoLineChart';
import { getDemoVerhuringenData } from './demoData';

/** Demo version of the rentals chart: verhuringen per dag over four weeks. */
function DemoVerhuringenChart() {
  const data = useMemo(() => getDemoVerhuringenData(), []);

  return (
    <DemoLineChart
      title="Verhuringen door tijd"
      description="Aantal verhuringen per dag over vier weken, per aanbieder. In het weekend wordt er meer gereden."
      data={data}
      xAxisInterval={6}
    />
  );
}

export default DemoVerhuringenChart;
