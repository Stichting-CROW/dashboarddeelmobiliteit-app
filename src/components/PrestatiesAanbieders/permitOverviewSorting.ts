import type { PerformanceIndicatorKPI, PermitLimitRecord } from '../../api/permitLimits';
import type { RowData } from './PermitCardCollection';

const VEHICLE_CAP_KPI = 'vehicle_cap';
const VEHICLE_CAP_PRIORITY_THRESHOLD = 10;

const getLatestValue = (
  kpi: PerformanceIndicatorKPI | undefined,
  field: 'measured' | 'threshold'
): number | null => {
  const values = kpi?.values;
  if (!values?.length) return null;

  const sorted = [...values].sort((a, b) => b.date.localeCompare(a.date));
  for (const entry of sorted) {
    const value = entry[field];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
  }
  return null;
};

export const getVehicleCapLimitFromKpis = (kpis: PerformanceIndicatorKPI[]): number | null => {
  const capKpi = kpis.find((k) => k.kpi_key === VEHICLE_CAP_KPI);
  return getLatestValue(capKpi, 'threshold');
};

/**
 * Per municipality: for each day, sum vehicle_cap measured values across all modalities;
 * return the average of those daily totals.
 */
export const getAverageSumVehicleCapMeasuredForMunicipality = (
  kpiGroups: PerformanceIndicatorKPI[][]
): number => {
  const dailyTotals = new Map<string, number>();

  for (const kpis of kpiGroups) {
    const kpi = kpis.find((k) => k.kpi_key === VEHICLE_CAP_KPI);
    if (!kpi?.values?.length) continue;

    for (const entry of kpi.values) {
      if (typeof entry.measured !== 'number' || Number.isNaN(entry.measured)) {
        continue;
      }
      const dateKey = entry.date.split('T')[0];
      dailyTotals.set(dateKey, (dailyTotals.get(dateKey) ?? 0) + entry.measured);
    }
  }

  const totals = Array.from(dailyTotals.values());
  if (totals.length === 0) {
    return 0;
  }

  return totals.reduce((sum, value) => sum + value, 0) / totals.length;
};

export interface MunicipalitySortMetrics {
  gmcode: string;
  hasVehicleCapPriority: boolean;
  /** Average of daily sums of vehicle_cap measured values for the operator in this municipality. */
  avgActiveVehicles: number;
}

export const computeMunicipalitySortMetrics = (
  permits: PermitLimitRecord[],
  municipalityKpisByGmcode: Map<string, PerformanceIndicatorKPI[][]>
): MunicipalitySortMetrics[] => {
  const byGmcode = new Map<string, MunicipalitySortMetrics>();

  for (const permit of permits) {
    const gmcode = permit.municipality?.gmcode || permit.permit_limit?.municipality;
    if (!gmcode) continue;

    if (!byGmcode.has(gmcode)) {
      byGmcode.set(gmcode, {
        gmcode,
        hasVehicleCapPriority: false,
        avgActiveVehicles: 0,
      });
    }
  }

  Array.from(municipalityKpisByGmcode.entries()).forEach(([gmcode, kpiGroups]) => {
    const metrics = byGmcode.get(gmcode) ?? {
      gmcode,
      hasVehicleCapPriority: false,
      avgActiveVehicles: 0,
    };

    let maxCap: number | null = null;

    kpiGroups.forEach((kpis) => {
      const cap = getVehicleCapLimitFromKpis(kpis);
      if (cap !== null) {
        maxCap = maxCap === null ? cap : Math.max(maxCap, cap);
      }
    });

    metrics.hasVehicleCapPriority = maxCap !== null && maxCap >= VEHICLE_CAP_PRIORITY_THRESHOLD;
    metrics.avgActiveVehicles = getAverageSumVehicleCapMeasuredForMunicipality(kpiGroups);
    byGmcode.set(gmcode, metrics);
  });

  return Array.from(byGmcode.values());
};

export const sortMunicipalityRowData = (
  rowData: RowData[],
  metrics: MunicipalitySortMetrics[]
): RowData[] => {
  const metricsByGmcode = new Map(metrics.map((m) => [m.gmcode, m]));

  return [...rowData].sort((a, b) => {
    const ma = metricsByGmcode.get(a.id);
    const mb = metricsByGmcode.get(b.id);

    const priorityA = ma?.hasVehicleCapPriority ? 1 : 0;
    const priorityB = mb?.hasVehicleCapPriority ? 1 : 0;
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    const activeA = ma?.avgActiveVehicles ?? 0;
    const activeB = mb?.avgActiveVehicles ?? 0;
    if (activeA !== activeB) {
      return activeB - activeA;
    }

    return (a.name || a.id).localeCompare(b.name || b.id, 'nl');
  });
};

export const buildMunicipalityKpisMapFromPermits = (
  permits: PermitLimitRecord[],
  rawOperators: Array<{
    operator: string;
    form_factor: string;
    geometry_ref?: string;
    kpis?: PerformanceIndicatorKPI[];
  }>
): Map<string, PerformanceIndicatorKPI[][]> => {
  const map = new Map<string, PerformanceIndicatorKPI[][]>();

  for (const item of rawOperators) {
    const gmcode = item.geometry_ref?.replace('cbs:', '') ?? '';
    if (!gmcode) continue;

    const existing = map.get(gmcode) ?? [];
    existing.push(item.kpis ?? []);
    map.set(gmcode, existing);
  }

  if (map.size === 0) {
    for (const permit of permits) {
      const gmcode = permit.municipality?.gmcode || permit.permit_limit?.municipality;
      if (!gmcode) continue;
      const existing = map.get(gmcode) ?? [];
      existing.push([]);
      map.set(gmcode, existing);
    }
  }

  return map;
};
