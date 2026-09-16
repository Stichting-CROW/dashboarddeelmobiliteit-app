import moment from 'moment';

/** A row of prepared chart data: a time/name column plus one column per provider */
export type ChartRow = Record<string, unknown>;

export interface StatsKpis {
  /** Mean of the summed available vehicles over all intervals */
  averageAvailableVehicles: number | null;
  /** Sum of all rentals in the period */
  totalRentals: number | null;
  /** Rentals divided by the summed vehicle-days, i.e. how often a vehicle is rented per day */
  rentalsPerVehiclePerDay: number | null;
  /** Number of providers that had at least one vehicle or rental */
  activeProviders: number | null;
}

export interface KpiDelta {
  /** Relative change, e.g. 0.12 for +12%. Null when the previous value is 0 or missing */
  ratio: number | null;
  /** Absolute change (current - previous). Null when either value is missing */
  absolute: number | null;
}

const isValueKey = (key: string) => key !== 'time' && key !== 'name';

/** Sum of all provider columns in a row */
const rowTotal = (row: ChartRow): number =>
  Object.keys(row)
    .filter(isValueKey)
    .reduce((sum, key) => sum + (Number(row[key]) || 0), 0);

/** Providers that have a non-zero value in at least one row */
const providersWithData = (rows: ChartRow[]): Set<string> => {
  const found = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row)
      .filter(isValueKey)
      .forEach((key) => {
        if ((Number(row[key]) || 0) > 0) found.add(key);
      });
  });
  return found;
};

/**
 * Returns a copy of the filter shifted back by one period length, so the
 * same helpers can fetch the "previous period" for comparisons. The period
 * is treated as inclusive on both ends, matching how the API is queried.
 */
export const getPreviousPeriodFilter = <T extends {ontwikkelingvan: string; ontwikkelingtot: string}>(filter: T): T => {
  const van = moment(filter.ontwikkelingvan).startOf('day');
  const tot = moment(filter.ontwikkelingtot).startOf('day');
  const lengthInDays = tot.diff(van, 'days') + 1;
  const previousTot = van.clone().subtract(1, 'day');
  const previousVan = previousTot.clone().subtract(lengthInDays - 1, 'days');
  return {
    ...filter,
    ontwikkelingvan: previousVan.toISOString(),
    ontwikkelingtot: previousTot.toISOString()
  };
};

/**
 * Computes the headline numbers from day-level chart data. Both inputs are
 * the prepared datasets as used by the charts (one row per day, one column
 * per provider). Pass empty arrays when a dataset is not available.
 */
export const computeKpis = (vehicleRows: ChartRow[], rentalRows: ChartRow[]): StatsKpis => {
  const hasVehicles = vehicleRows.length > 0;
  const hasRentals = rentalRows.length > 0;

  const vehicleTotals = vehicleRows.map(rowTotal);
  const summedVehicleDays = vehicleTotals.reduce((a, b) => a + b, 0);
  const averageAvailableVehicles = hasVehicles ? summedVehicleDays / vehicleRows.length : null;

  const totalRentals = hasRentals ? rentalRows.map(rowTotal).reduce((a, b) => a + b, 0) : null;

  const rentalsPerVehiclePerDay =
    hasVehicles && hasRentals && summedVehicleDays > 0 && totalRentals !== null
      ? totalRentals / summedVehicleDays
      : null;

  const providers = new Set<string>([
    ...Array.from(providersWithData(vehicleRows)),
    ...Array.from(providersWithData(rentalRows))
  ]);
  const activeProviders = hasVehicles || hasRentals ? providers.size : null;

  return {
    averageAvailableVehicles,
    totalRentals,
    rentalsPerVehiclePerDay,
    activeProviders
  };
};

/** Change of a KPI compared to its previous-period value */
export const computeDelta = (current: number | null, previous: number | null): KpiDelta => {
  if (current === null || previous === null) return {ratio: null, absolute: null};
  const absolute = current - previous;
  const ratio = previous !== 0 ? absolute / previous : null;
  return {ratio, absolute};
};
