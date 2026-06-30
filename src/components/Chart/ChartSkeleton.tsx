import React from 'react';
import { Skeleton } from '../ui/skeleton';

interface ChartSkeletonProps {
  /** Height of the plot area. Number is treated as pixels. Defaults to filling the parent. */
  height?: number | string;
  /** Number of vertical bars used to suggest a chart. */
  bars?: number;
}

/**
 * Loading placeholder shaped like a line/bar chart. Used on the chart-heavy
 * statistics pages so the layout stays stable and the app feels responsive
 * while aggregated data is being fetched.
 */
const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ height = '100%', bars = 12 }) => {
  // Deterministic, varied bar heights so the placeholder reads as a chart
  // without relying on random values (which would jump on every render).
  const barHeights = Array.from({ length: bars }, (_, i) => {
    const wave = Math.sin(i / 1.7) * 0.5 + 0.5; // 0..1
    return 25 + Math.round(wave * 60); // 25%..85%
  });

  return (
    <div
      className="flex w-full"
      style={{ height }}
      role="status"
      aria-busy="true"
      aria-label="Grafiek wordt geladen"
    >
      {/* Y-axis tick labels */}
      <div className="flex flex-col justify-between py-2 pr-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>

      {/* Plot area with bars sitting on a baseline */}
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-end gap-2 border-l border-b border-gray-100 px-2 pb-2">
          {barHeights.map((h, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-sm"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        {/* X-axis tick labels */}
        <div className="flex justify-between px-2 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-10" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChartSkeleton;
