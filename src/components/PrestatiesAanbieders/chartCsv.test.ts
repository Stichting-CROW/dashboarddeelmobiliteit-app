import moment from 'moment';
import { toCsv } from '../../helpers/csv';
import {
  buildChartCsvColumns,
  buildAllChartsCsvColumns,
  THRESHOLD_SERIES_NAME,
  type ChartData,
} from './chartCsv';

const timestamp = (date: string): number => moment(date).valueOf();

const dates = ['2026-08-18', '2026-08-19', '2026-08-20'];

const unrentedVehicles: ChartData = {
  kpiKey: 'unrented_vehicles',
  title: 'Aantal onverhuurde voertuigen',
  series: [
    {
      name: 'Baqme',
      // 2026-08-19 is intentionally absent: a day without measured data.
      data: [
        [timestamp('2026-08-18'), 42],
        [timestamp('2026-08-20'), 0],
      ],
      dashArray: 0,
    },
    {
      name: THRESHOLD_SERIES_NAME,
      data: [
        [timestamp('2026-08-18'), 200],
        [timestamp('2026-08-19'), 200],
        [timestamp('2026-08-20'), 200],
      ],
      dashArray: 5,
    },
  ],
};

const parkingDuration: ChartData = {
  kpiKey: 'parking_duration_7_days',
  title: 'Parkeerduur > 7 dagen',
  precision: 1,
  series: [
    {
      name: 'Baqme',
      data: [[timestamp('2026-08-19'), 2.25]],
      dashArray: 0,
    },
  ],
};

describe('buildChartCsvColumns', () => {
  it('exports the measured value and threshold per date in the range', () => {
    const csv = toCsv(dates, buildChartCsvColumns(unrentedVehicles));

    expect(csv.split('\r\n')).toEqual([
      '"datum";"waarde";"drempelwaarde"',
      '"2026-08-18";"42";"200"',
      '"2026-08-19";;"200"',
      '"2026-08-20";"0";"200"',
    ]);
  });

  it('omits the threshold column when the chart has no threshold line', () => {
    const csv = toCsv(dates, buildChartCsvColumns(parkingDuration));

    expect(csv.split('\r\n')).toEqual([
      '"datum";"waarde"',
      '"2026-08-18";',
      '"2026-08-19";"2,3"',
      '"2026-08-20";',
    ]);
  });
});

describe('buildAllChartsCsvColumns', () => {
  it('puts one date column first, then a column per KPI titled after the KPI', () => {
    const csv = toCsv(dates, buildAllChartsCsvColumns([unrentedVehicles, parkingDuration]));

    expect(csv.split('\r\n')).toEqual([
      '"datum";"Aantal onverhuurde voertuigen";"Aantal onverhuurde voertuigen drempelwaarde";"Parkeerduur > 7 dagen"',
      '"2026-08-18";"42";"200";',
      '"2026-08-19";;"200";"2,3"',
      '"2026-08-20";"0";"200";',
    ]);
  });
});
