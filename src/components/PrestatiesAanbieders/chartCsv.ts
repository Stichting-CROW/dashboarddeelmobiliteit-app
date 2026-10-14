import moment from 'moment';
import type { LineChartData } from '../Chart/LineChart';
import type { CsvColumn } from '../../helpers/csv';

/** Series name used for the dashed threshold line in the KPI charts. */
export const THRESHOLD_SERIES_NAME = 'Drempelwaarde';

export interface ChartData {
  kpiKey: string;
  title: string;
  series: LineChartData[];
  unit?: string;
  precision?: number;
}

/** Index a chart series by date string, so CSV rows can span the full date range. */
const getSeriesValuesByDate = (series?: LineChartData): Map<string, number> => {
  const valuesByDate = new Map<string, number>();
  if (!series || !Array.isArray(series.data)) return valuesByDate;

  (series.data as [number, number][]).forEach((point) => {
    if (!Array.isArray(point) || point.length !== 2) return;
    const [timestamp, value] = point;
    if (!isFinite(timestamp) || !isFinite(value)) return;
    valuesByDate.set(moment(timestamp).format('YYYY-MM-DD'), value);
  });

  return valuesByDate;
};

const getMeasuredSeries = (chart: ChartData): LineChartData | undefined =>
  chart.series.find((serie) => serie.name !== THRESHOLD_SERIES_NAME);

const getThresholdSeries = (chart: ChartData): LineChartData | undefined =>
  chart.series.find((serie) => serie.name === THRESHOLD_SERIES_NAME);

/**
 * CSV columns for a single KPI chart: a date column plus the measured value and,
 * when the chart has a threshold line, the threshold. The KPI itself is
 * identified by the filename.
 */
export const buildChartCsvColumns = (chart: ChartData): CsvColumn<string>[] => {
  const measuredByDate = getSeriesValuesByDate(getMeasuredSeries(chart));
  const thresholdSeries = getThresholdSeries(chart);
  const thresholdByDate = getSeriesValuesByDate(thresholdSeries);
  const precision = chart.precision ?? 0;

  const columns: CsvColumn<string>[] = [
    { header: 'datum', value: (date) => date },
    { header: 'waarde', value: (date) => measuredByDate.get(date) ?? null, precision },
  ];

  if (thresholdSeries) {
    columns.push({
      header: 'drempelwaarde',
      value: (date) => thresholdByDate.get(date) ?? null,
      precision,
    });
  }

  return columns;
};

/**
 * CSV columns for every KPI chart at once: one date column, then a column per
 * KPI (titled after the KPI) with its threshold column alongside it.
 */
export const buildAllChartsCsvColumns = (charts: ChartData[]): CsvColumn<string>[] => {
  const columns: CsvColumn<string>[] = [{ header: 'datum', value: (date) => date }];

  charts.forEach((chart) => {
    const measuredByDate = getSeriesValuesByDate(getMeasuredSeries(chart));
    const thresholdSeries = getThresholdSeries(chart);
    const thresholdByDate = getSeriesValuesByDate(thresholdSeries);
    const precision = chart.precision ?? 0;
    const header = chart.title || chart.kpiKey;

    columns.push({
      header,
      value: (date) => measuredByDate.get(date) ?? null,
      precision,
    });

    if (thresholdSeries) {
      columns.push({
        header: `${header} drempelwaarde`,
        value: (date) => thresholdByDate.get(date) ?? null,
        precision,
      });
    }
  });

  return columns;
};
