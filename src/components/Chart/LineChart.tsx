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
  series: LineChartData[];
  xAxisCategories: number[];
  height?: number;
  colors?: string[];
}

const LineChart: React.FC<LineChartProps> = ({
  title,
  series,
  xAxisCategories,
  height = 300,
  colors = ['#ef4444', '#3b82f6']
}) => {
  // Validate inputs
  if (!series || series.length === 0 || !xAxisCategories || xAxisCategories.length === 0) {
    return (
      <div className="line-chart-container">
        <h4 className="text-sm font-semibold mb-2">{title}</h4>
        <div className="text-sm text-gray-500">Geen data beschikbaar</div>
      </div>
    );
  }

  // Helper to sanitize a number for ApexCharts (prevents SVG path "Expected number" errors)
  // - Coerces strings to numbers; rejects NaN/Infinity
  // - Rounds to avoid floating-point precision issues that break SVG path parsing
  const sanitizeNumber = (value: unknown, decimals = 4): number | null => {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return null;
    // Round to avoid floating-point artifacts (e.g. 0.1+0.2 = 0.30000000000000004)
    return parseFloat(num.toFixed(decimals));
  };

  // Helper to validate and sanitize a chart point [x, y]
  const sanitizePoint = (point: unknown): [number, number] | null => {
    if (!Array.isArray(point) || point.length < 2) return null;
    const x = sanitizeNumber(point[0], 0); // timestamps: whole numbers
    const y = sanitizeNumber(point[1]); // y-values: allow decimals
    if (x === null || y === null) return null;
    return [x, y];
  };

  // Convert series data to [x, y] format for numeric x-axis
  const seriesWithNumericData = series.map((s) => {
    if (!s.data || s.data.length === 0) {
      return { ...s, data: [] };
    }

    // Check if already in [x, y] format
    if (Array.isArray(s.data[0]) && s.data[0].length === 2) {
      const validData = (s.data as [number, number][]).reduce<[number, number][]>((acc, point) => {
        const sanitized = sanitizePoint(point);
        if (sanitized) acc.push(sanitized);
        return acc;
      }, []);
      // Sort by x to ensure correct line drawing order
      validData.sort((a, b) => a[0] - b[0]);
      return { ...s, data: validData };
    }

    // Convert to [x, y] format and validate
    const validData: [number, number][] = [];
    const dataArray = s.data as number[];
    
    for (let i = 0; i < Math.min(dataArray.length, xAxisCategories.length); i++) {
      const x = sanitizeNumber(xAxisCategories[i], 0);
      const y = sanitizeNumber(dataArray[i]);
      if (x !== null && y !== null) {
        validData.push([x, y]);
      }
    }

    validData.sort((a, b) => a[0] - b[0]);

    return {
      ...s,
      data: validData
    };
  }).filter((s) => s.data.length > 0); // Remove series with no valid data

  // Don't render if no valid series
  if (seriesWithNumericData.length === 0) {
    return (
      <div className="line-chart-container">
        <h4 className="text-sm font-semibold mb-2">{title}</h4>
        <div className="text-sm text-gray-500">Geen geldige data beschikbaar</div>
      </div>
    );
  }

  // When all y-values are equal, ApexCharts can produce NaN in SVG paths. Force a range.
  const allYValues = seriesWithNumericData.flatMap((s) => (s.data as [number, number][]).map((p) => p[1]));
  const yMin = Math.min(...allYValues);
  const yMax = Math.max(...allYValues);
  const yRange = yMax - yMin;
  const forceYRange = yRange === 0;
  const yAxisMin = forceYRange ? yMin - 0.5 : undefined;
  const yAxisMax = forceYRange ? yMax + 0.5 : undefined;
  const yAxisConfig = forceYRange && yAxisMin != null && yAxisMax != null
    ? { min: yAxisMin, max: yAxisMax }
    : {};

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
      curve: 'straight',
      width: 2,
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
      ...yAxisConfig,
      labels: {
        formatter: (value: number) => {
          try {
            if (!isFinite(value)) {
              return '0.0';
            }
            return value.toFixed(1);
          } catch (error) {
            return '0.0';
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
    <div className="line-chart-container" style={{ marginBottom: getBottomMargin(rotationAngle) }}>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
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
