import moment from 'moment';
import type { PermitLimitData, PerformanceIndicatorDescription, GeometryOperatorModalityLimit } from '../../api/permitLimits';

/** Extract YYYY-MM-DD from date string (handles ISO datetime like 2026-02-26T00:00:00.000Z) */
export const toDateOnly = (dateStr: string | undefined): string => {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const part = dateStr.split('T')[0];
  return part && /^\d{4}-\d{2}-\d{2}$/.test(part) ? part : dateStr;
};

/** Map unit to display: number -> nummer, percentage -> percentage */
export const formatUnit = (unit: string | undefined): string => {
  if (!unit) return '';
  const u = unit.toLowerCase();
  return u === 'number' ? 'nummer' : u === 'percentage' ? 'percentage' : unit;
};

/** Map bound to display: upper -> bovengrens, lower -> ondergrens */
export const formatBound = (bound: string | undefined): string => {
  if (!bound) return '';
  const b = bound.toLowerCase();
  return b === 'upper' ? 'bovengrens' : b === 'lower' ? 'ondergrens' : bound;
};

// Export HistoryTableRow type for use in other components
export interface HistoryTableRow {
  organisationName: string;
  providerName: string;
  vehicleTypeName: string;
  kpiDescription: string;
  effectiveDate: string;
  maxOrMin: 'max' | 'min';
  thresholdValue: number | null; // null if inactive
  isActive: boolean; // Whether this KPI is active (not "niet actief")
  permit_limit_id?: number;
  geometry_operator_modality_limit_id?: number; // New API
  effective_date: string; // For editing
  kpiKey: string; // Which KPI key this row represents (e.g., 'vehicle_cap', 'percentage_parked_longer_then_14_days', etc.)
  permitField?: keyof PermitLimitData; // Legacy - which permit field this maps to (old API)
  eenheid: string; // nummer or percentage (from unit)
}

// Mapping: KPI key to permit limit field (legacy) + new API keys
const KPI_KEY_TO_PERMIT_FIELD: Record<string, keyof PermitLimitData> = {
  maximum_vehicles: 'maximum_vehicles',
  minimum_vehicles: 'minimum_vehicles',
  percentage_parked_longer_then_3_days: 'max_parking_duration',
  percentage_parked_longer_then_14_days: 'max_parking_duration', // New API key
  minimal_number_of_trips_per_vehicle: 'minimal_number_of_trips_per_vehicle',
  vehicle_cap: 'maximum_vehicles', // New API key - maps to max vehicles for display
};

export const getAllKpis = (kpiDescriptions: PerformanceIndicatorDescription[]): Array<{
  kpiKey: string;
  permitField: keyof PermitLimitData | null;
  description: PerformanceIndicatorDescription;
}> => {
  return kpiDescriptions.map(desc => ({
    kpiKey: desc.kpi_key,
    permitField: KPI_KEY_TO_PERMIT_FIELD[desc.kpi_key] || null,
    description: desc,
  }));
};

export const isoDurationToDays = (duration: string | undefined): number | false => {
  if (!duration || typeof duration !== 'string') return false;
  const regex = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;
  const match = duration.match(regex);
  if (!match) return false;

  const [, years, months, weeks, days, hours, minutes, seconds] = match.map((v) => (v ? parseInt(v, 10) : 0));

  let totalDays = (years || 0) * 365 + (months || 0) * 30 + (weeks || 0) * 7 + (days || 0);

  if (hours || minutes || seconds) {
    const dayFraction = (hours || 0) / 24 + (minutes || 0) / 1440 + (seconds || 0) / 86400;
    totalDays += Math.floor(dayFraction);
  }

  return totalDays;
};

export const daysToIsoDuration = (days: number): string => {
  return `P${Math.floor(days)}D`;
};

/** Flatten GeometryOperatorModalityLimit[] to table rows for the new API */
export const flattenLimitHistoryToTableRows = (
  history: GeometryOperatorModalityLimit[],
  organisationName: string,
  providerName: string,
  vehicleTypeName: string,
  kpiDescriptions: PerformanceIndicatorDescription[]
): HistoryTableRow[] => {
  const rows: HistoryTableRow[] = [];

  kpiDescriptions.forEach((kpiDesc) => {
    history.forEach((record) => {
      const value = record.limits[kpiDesc.kpi_key];
      const isActive = value !== undefined && value !== null && typeof value === 'number' && !isNaN(value);

      const maxOrMin: 'max' | 'min' =
        kpiDesc.kpi_key.includes('max') || kpiDesc.kpi_key === 'vehicle_cap' || kpiDesc.kpi_key === 'maximum_vehicles'
          ? 'max'
          : 'min';

      rows.push({
        organisationName,
        providerName,
        vehicleTypeName,
        kpiDescription: kpiDesc.title + (formatBound(kpiDesc.bound) ? ` (${formatBound(kpiDesc.bound)})` : ''),
        effectiveDate: moment(toDateOnly(record.effective_date) + 'T12:00:00Z').format('DD-MM-YYYY'),
        maxOrMin,
        thresholdValue: isActive ? value : null,
        isActive,
        geometry_operator_modality_limit_id: record.geometry_operator_modality_limit_id,
        effective_date: toDateOnly(record.effective_date),
        kpiKey: kpiDesc.kpi_key,
        eenheid: formatUnit(kpiDesc.unit),
      });
    });
  });

  return rows.sort((a, b) => b.effective_date.localeCompare(a.effective_date));
};
