import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

export interface LineChartData {
  name: string;
  data: number[] | [number, number][];
  dashArray?: number;
}

export interface LineChartProps {
  title: string;
  /** Optional subtitle shown on the right side of the header */
  subtitle?: string;
  series: LineChartData[];
  xAxisCategories: number[];
  height?: number;
  colors?: string[];
  /** When 'percentage', appends '%' to tooltip and y-axis values */
  unit?: string;
}

const TARGET_Y_TICK_COUNT = 5;

/** Picks a human-friendly step (1, 2, 5 × 10^n) for axis ticks. */
function niceAxisStep(range: number): number {
  if (!isFinite(range) || range <= 0) {
    return 1;
  }
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / 10 ** exponent;
  let niceFraction: number;
  if (fraction < 1.5) {
    niceFraction = 1;
  } else if (fraction < 3) {
    niceFraction = 2;
  } else if (fraction < 7) {
    niceFraction = 5;
  } else {
    niceFraction = 10;
  }
  return niceFraction * 10 ** exponent;
}

/** Rounds axis max up and returns step/tick count for labels like 0, 200, 400, … */
function computeNiceYAxisScale(maxValue: number): { max: number; step: number; tickAmount: number } {
  if (!isFinite(maxValue) || maxValue <= 0) {
    return { max: 10, step: 2, tickAmount: TARGET_Y_TICK_COUNT };
  }
  const step = niceAxisStep(maxValue / (TARGET_Y_TICK_COUNT - 1));
  const niceMax = Math.ceil(maxValue / step) * step;
  const tickAmount = Math.max(1, Math.round(niceMax / step));
  return { max: niceMax, step, tickAmount };
}

const LineChart: React.FC<LineChartProps> = ({
  title,
  subtitle,
  series,
  xAxisCategories,
  height = 300,
  colors = ['#ef4444', '#3b82f6'],
  unit
}) => {
  // Validate inputs
  if (!series || series.length === 0 || !xAxisCategories || xAxisCategories.length === 0) {
    return (
      <div className="line-chart-container bg-white p-6">
        <div className="flex justify-between">
          <h4 className="text-sm font-semibold mb-2">{title}</h4>
          {subtitle && <h4 className="text-sm font-semibold mb-2" style={{ color: '#AFAFAF' }}>{subtitle}</h4>}
        </div>
        <div className="text-sm text-gray-500">Geen data beschikbaar</div>
      </div>
    );
  }

  // Helper function to check if a value is a valid number
  const isValidNumber = (value: any): value is number => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  };

  // Convert series data to [x, y] format for numeric x-axis
  const seriesWithNumericData = series.map((s) => {
    if (!s.data || s.data.length === 0) {
      return { ...s, data: [] };
    }

    // Check if already in [x, y] format
    if (Array.isArray(s.data[0]) && s.data[0].length === 2) {
      // Validate all points are valid numbers
      const validData = (s.data as [number, number][]).filter((point) => {
        return Array.isArray(point) && 
               point.length === 2 && 
               isValidNumber(point[0]) && 
               isValidNumber(point[1]);
      });
      return { ...s, data: validData };
    }

    // Convert to [x, y] format and validate
    const validData: [number, number][] = [];
    const dataArray = s.data as number[];
    
    for (let i = 0; i < Math.min(dataArray.length, xAxisCategories.length); i++) {
      const x = xAxisCategories[i];
      const y = dataArray[i];
      
      if (isValidNumber(x) && isValidNumber(y)) {
        validData.push([x, y]);
      }
    }

    return {
      ...s,
      data: validData
    };
  }).filter((s) => s.data.length > 0); // Remove series with no valid data

  const primaryLineSeries = seriesWithNumericData.find((s) => (s.dashArray ?? 0) === 0);
  const primaryLineValues = primaryLineSeries
    ? (primaryLineSeries.data as [number, number][])
        .map(([, y]) => y)
        .filter((value) => isValidNumber(value))
    : [];
  const primaryLineAverage = primaryLineValues.length > 0
    ? primaryLineValues.reduce((sum, value) => sum + value, 0) / primaryLineValues.length
    : null;

  // Don't render if no valid series
  if (seriesWithNumericData.length === 0) {
    return (
      <div className="line-chart-container bg-white p-6">
        <div className="flex justify-between">
          <h4 className="text-sm font-semibold mb-2">{title}</h4>
          {subtitle && <h4 className="text-sm font-semibold mb-2" style={{ color: '#AFAFAF' }}>{subtitle}</h4>}
        </div>
        <div className="text-sm text-gray-500">Geen geldige data beschikbaar</div>
      </div>
    );
  }

  // Calculate data density to determine label strategy
  const dataPointCount = xAxisCategories.length;
  const shouldRotateLabels = true; // Always rotate labels
  const shouldShowFewerLabels = dataPointCount > 7; // Show fewer labels if more than 7 points
  
  // Determine optimal number of labels to show (more aggressive reduction for readability)
  const getOptimalTickAmount = (count: number): number | undefined => {
    if (count <= 7) return undefined; // Show all labels
    if (count <= 14) return 5; // Show ~5 labels
    if (count <= 30) return 7; // Show ~7 labels (increased from 6 to accommodate weekday names)
    if (count <= 60) return 10; // Show ~10 labels
    return 12; // Show max 12 labels for very long ranges
  };

  const tickAmount = shouldShowFewerLabels ? getOptimalTickAmount(dataPointCount) : undefined;

  // Calculate max y value across all series to add headroom above the highest line
  const maxDataValue = Math.max(
    ...seriesWithNumericData.flatMap((s) =>
      (s.data as [number, number][]).map(([, y]) => y)
    ),
    0
  );
  const normalizedUnit = unit?.trim().toLowerCase();
  const isPercentageUnit = normalizedUnit === '%' || normalizedUnit === 'percentage';
  const formattedPrimaryLineAverage = primaryLineAverage !== null
    ? `${Math.round(primaryLineAverage)}${isPercentageUnit ? '%' : ''}`
    : null;
  // Add ~15% headroom above the highest value, minimum 5 units (ensures space above highest line)
  const headroom = Math.max(maxDataValue * 0.15, 5);
  const rawYAxisMax = maxDataValue + headroom;
  const percentageStep = height <= 250 ? 10 : 5;
  const percentageYAxisMax = Math.max(
    percentageStep * 2,
    Math.ceil(maxDataValue / percentageStep) * percentageStep
  );
  const niceNumericScale = computeNiceYAxisScale(rawYAxisMax);
  const yAxisMax = isPercentageUnit ? percentageYAxisMax : niceNumericScale.max;
  const yAxisStepSize = isPercentageUnit ? percentageStep : niceNumericScale.step;
  const yAxisTickAmount = isPercentageUnit
    ? Math.max(1, Math.round(yAxisMax / percentageStep))
    : niceNumericScale.tickAmount;

  // Always rotate at 325 degrees for all periods
  const rotationAngle = 325;

  // Determine date format based on data density (always include weekday in Dutch)
  const getDateFormat = (count: number): Intl.DateTimeFormatOptions => {
    // Always include weekday for better context
    return {
      weekday: 'long', // Full weekday name in Dutch (maandag, dinsdag, etc.)
      day: 'numeric',
      month: 'numeric'
    };
  };

  const dateFormat = getDateFormat(dataPointCount);

  const options: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      // Add margins to accommodate rotated labels
      offsetX: 0,
      offsetY: 0
    },
    stroke: {
      // curve: 'smooth',
      width: 3,
      dashArray: series.map((s) => s.dashArray || 0)
    },
    markers: {
      size: 0
    },
    xaxis: {
      type: 'numeric',
      tickAmount: tickAmount,
      labels: {
        rotate: rotationAngle,
        rotateAlways: shouldRotateLabels,
        hideOverlappingLabels: true,
        maxHeight: rotationAngle === 325 ? 100 : rotationAngle === -90 ? 150 : rotationAngle === -45 ? 80 : 40,
        offsetY: rotationAngle === 325 ? 5 : rotationAngle === -90 ? 10 : rotationAngle === -45 ? 5 : 0,
        minHeight: rotationAngle === 325 ? 80 : rotationAngle === -90 ? 120 : undefined,
        style: {
          fontSize: '10px', // Smaller font to fit weekday names
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          colors: ['#374151']
        },
        formatter: (value: string) => {
          try {
            const numValue = parseInt(value);
            if (!isFinite(numValue) || numValue <= 0) {
              return '';
            }
            const date = new Date(numValue);
            if (isNaN(date.getTime())) {
              return '';
            }
            // Format: "vrijdag 1-1" (weekday day-month)
            const weekday = date.toLocaleDateString('nl-NL', { weekday: 'long' });
            const dayMonth = date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'numeric' });
            return `${weekday} ${dayMonth}`;
          } catch (error) {
            return '';
          }
        }
      }
    },
    yaxis: {
      max: yAxisMax,
      min: 0,
      tickAmount: yAxisTickAmount,
      stepSize: yAxisStepSize,
      forceNiceScale: true,
      labels: {
        formatter: (value: number) => {
          try {
            if (!isFinite(value)) {
              return isPercentageUnit ? '0%' : '0';
            }
            const str = Math.round(value).toString();
            return isPercentageUnit ? `${str}%` : str;
          } catch (error) {
            return isPercentageUnit ? '0%' : '0';
          }
        }
      }
    },
    grid: {
      show: true,
      borderColor: '#e5e7eb',
      strokeDashArray: 0,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    legend: {
      show: false
    },
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        formatter: (value: string) => {
          try {
            const numValue = parseInt(value);
            if (!isFinite(numValue) || numValue <= 0) {
              return '';
            }
            const date = new Date(numValue);
            if (isNaN(date.getTime())) {
              return '';
            }
            return date.toLocaleDateString('nl-NL', { 
              weekday: 'long',
              day: 'numeric', 
              month: 'long'
            });
          } catch (error) {
            return '';
          }
        }
      },
      y: {
        formatter: (value: number) => {
          if (value == null || !isFinite(value)) return '-';
          const str = Math.round(value).toString();
          return isPercentageUnit ? `${str}%` : str;
        }
      }
    },
    colors: colors
  };

  // Calculate bottom margin based on rotation angle (more space for weekday labels)
  const getBottomMargin = (angle: number): string => {
    if (angle === 325) return '30px'; // Space for 325 degree rotated labels with weekday names
    if (angle === -90) return '40px'; // More space for vertical labels with weekday names
    if (angle === -45) return '25px'; // Moderate space for angled labels with weekday names
    return '0';
  };

  return (
    <div className="line-chart-container bg-white p-6" style={{ marginBottom: getBottomMargin(rotationAngle) }}>
      <div className="flex justify-between">
        <h4 className="text-sm font-semibold mb-2">{title}</h4>
        {subtitle && <h4 className="text-sm font-semibold mb-2" style={{ color: '#AFAFAF' }}>{subtitle}</h4>}
        {!subtitle && formattedPrimaryLineAverage && (
          <h4 className="text-sm font-semibold mb-2" style={{ color: '#AFAFAF' }}>
            Gemiddelde {formattedPrimaryLineAverage}
          </h4>
        )}
      </div>
      <Chart
        options={options}
        series={seriesWithNumericData}
        type="line"
        height={height}
      />
    </div>
  );
};

export default LineChart;
