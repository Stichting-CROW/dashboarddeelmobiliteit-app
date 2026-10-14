import {ChartRow} from '../../helpers/stats/kpi';
import {PREVIOUS_TOTAAL_KEY, TOTAAL_KEY} from './chartConstants';

const isProviderKey = (key: string) =>
  key !== 'time' && key !== 'name' && key !== TOTAAL_KEY && key !== PREVIOUS_TOTAAL_KEY;

/** Sum of all provider columns in a prepared chart row */
export const sumProviders = (row: ChartRow): number =>
  Object.keys(row)
    .filter(isProviderKey)
    .reduce((sum, key) => sum + (Number(row[key]) || 0), 0);

/**
 * Adds the total of the previous period to each row of the current period,
 * aligned by position: the first interval of the current period is compared
 * with the first interval of the previous period, and so on. Rows without a
 * counterpart get `null` so the ghost line simply stops.
 */
export const mergePreviousPeriodTotals = (rows: ChartRow[], previousRows: ChartRow[] | null): ChartRow[] => {
  if (!previousRows) return rows;
  return rows.map((row, index) => ({
    ...row,
    [PREVIOUS_TOTAAL_KEY]: previousRows[index] ? sumProviders(previousRows[index]) : null
  }));
};
