/**
 * API functions for the /stats/beleidszones page.
 * Uses only these endpoints:
 * - MDS public/zones for filterbar zones (https://mds.dashboarddeelmobiliteit.nl/public/zones?gm_code=...)
 * - stats_v2/availability_stats for vehicle availability charts
 * - stats_v2/rental_stats for rental charts
 *
 * @see https://docs.dashboarddeelmobiliteit.nl/api_docs/zone_statistics/
 * @see https://mds.dashboarddeelmobiliteit.nl/redoc#operation/get_zones_public_public_zones_get
 */

import moment from 'moment';

const ALLOWED_PHASES = [
  'active',
  'retirement_concept',
  'published_retirement',
  'committed_retirement_concept',
] as const;

/** Zone from MDS public/zones API (zone_id, geography_id, name, prev_geographies, etc.) */
export interface Beleidszone {
  zone_id?: number;
  geography_id?: string;
  prev_geographies?: string[];
  effective_date?: string;
  published_date?: string;
  modified_at?: string;
  retire_date?: string;
  name?: string;
  geography_type?: string;
  municipality?: string;
  phase?: string;
  [key: string]: unknown;
}

/** Normalized zone for FilteritemZones (zone_id, name, zone_type) */
export interface BeleidszoneForFilter {
  zone_id: number;
  name: string;
  zone_type: 'custom';
  geography_id?: string;
  prev_geographies?: string[];
  effective_date?: string;
  published_date?: string;
  modified_at?: string;
  retire_date?: string;
  municipality?: string;
  [key: string]: unknown;
}

function zoneDisplayName(z: Beleidszone, baseName: string): string {
  const now = moment();
  if (z.retire_date && moment(z.retire_date).isValid() && moment(z.retire_date).isBefore(now)) {
    return `${baseName} (oud)`;
  }
  if (
    z.effective_date &&
    moment(z.effective_date).isValid() &&
    moment(z.effective_date).isAfter(now)
  ) {
    return `${baseName} (toekomst)`;
  }
  return baseName;
}

function mapZone(z: Beleidszone, gmCode: string): BeleidszoneForFilter {
  const baseName = z.name ?? `Zone ${z.zone_id}`;
  return {
    zone_id: z.zone_id!,
    name: zoneDisplayName(z, baseName),
    zone_type: 'custom' as const,
    geography_id: z.geography_id,
    prev_geographies: z.prev_geographies,
    effective_date: z.effective_date,
    published_date: z.published_date,
    modified_at: z.modified_at,
    retire_date: z.retire_date,
    municipality: z.municipality ?? gmCode,
  };
}

export interface BeleidszonesStatsOptions {
  zoneIds: number[];
  startTime: string;
  endTime: string;
  aggregationLevel?: string;
  aggregationFunction?: string;
}

const MDS_URL = process.env.REACT_APP_MDS_URL;
const DASHBOARD_API_URL = process.env.REACT_APP_MAIN_API_URL;

const getFetchOptions = (token: string | null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return { headers };
};

const phasesParam =
  'phases=active&phases=retirement_concept&phases=published_retirement&phases=committed_retirement_concept';

async function fetchZonesFromMds(
  gmCode: string,
  phases: string
): Promise<Beleidszone[]> {
  const url = `${MDS_URL}/public/zones?municipality=${encodeURIComponent(gmCode)}&geography_types=no_parking&geography_types=stop&geography_types=monitoring&${phases}`;
  const response = await fetch(url, getFetchOptions(null));
  if (!response.ok) {
    return [];
  }
  const raw = await response.json();
  const zonesArray = Array.isArray(raw)
    ? raw
    : raw?.zones ?? raw?.data?.zones ?? [];
  return Array.isArray(zonesArray) ? zonesArray : [];
}

/**
 * Fetches zones for a municipality from MDS public/zones.
 * Used for the filterbar zone list on /stats/beleidszones.
 * Only includes zones with phase: active, retirement_concept, published_retirement, committed_retirement_concept.
 * Additionally includes zones whose zone_id is in zoneIdsToInclude (e.g. from URL params), even if archived.
 *
 * @param gmCode Municipality code (e.g. GM0599)
 * @param zoneIdsToInclude Optional zone IDs to always include (e.g. from URL params)
 * @returns Normalized zones for FilteritemZones
 */
export const getBeleidszonesZones = async (
  gmCode: string,
  zoneIdsToInclude?: number[]
): Promise<BeleidszoneForFilter[]> => {
  if (!gmCode?.trim()) return [];

  const mainZones = await fetchZonesFromMds(gmCode, phasesParam);

  let result = mainZones
    .filter(
      (z: Beleidszone) =>
        z.zone_id != null &&
        (z.phase == null || ALLOWED_PHASES.includes(z.phase as (typeof ALLOWED_PHASES)[number]))
    )
    .map((z: Beleidszone) => mapZone(z, gmCode));

  if (zoneIdsToInclude?.length) {
    const existingIds = new Set(result.map((z) => z.zone_id));
    const missingIds = zoneIdsToInclude.filter((id) => !existingIds.has(id));
    if (missingIds.length > 0) {
      const archivedZones = await fetchZonesFromMds(
        gmCode,
        'phases=archived'
      );
      const toAdd = archivedZones.filter(
        (z: Beleidszone) =>
          z.zone_id != null && missingIds.includes(z.zone_id)
      );
      result = [...result, ...toAdd.map((z: Beleidszone) => mapZone(z, gmCode))];
    }
  }

  return result;
};

const phasesParamWithArchived =
  phasesParam + '&phases=archived';

/**
 * Fetches all zones for a municipality including archived.
 * Used by DashboardBeleidszones for resolving prev_geographies (Vorige versie / Huidige versie links).
 *
 * @param gmCode Municipality code (e.g. GM0599)
 * @returns Normalized zones including archived
 */
export const getBeleidszonesZonesForMetadata = async (
  gmCode: string
): Promise<BeleidszoneForFilter[]> => {
  if (!gmCode?.trim()) return [];
  const zones = await fetchZonesFromMds(gmCode, phasesParamWithArchived);
  return zones
    .filter((z: Beleidszone) => z.zone_id != null)
    .map((z: Beleidszone) => mapZone(z, gmCode));
};

/**
 * Fetches availability stats (parked vehicles) for zone charts.
 *
 * @see https://docs.dashboarddeelmobiliteit.nl/api_docs/zone_statistics/
 */
export const getBeleidszonesAvailabilityStats = async (
  token: string | null,
  options: BeleidszonesStatsOptions
): Promise<{ availability_stats?: { values: Array<Record<string, unknown>> } } | null> => {
  if (!options.zoneIds?.length) return null;

  const startTime = moment(options.startTime).format('YYYY-MM-DDTHH:mm:ss') + 'Z';
  const endTime = moment(options.endTime).format('YYYY-MM-DDTHH:mm:ss') + 'Z';
  const aggregationLevel = options.aggregationLevel ?? 'day';
  const aggregationFunction = options.aggregationFunction ?? 'MAX';

  const params = new URLSearchParams({
    aggregation_level: aggregationLevel,
    group_by: 'operator',
    aggregation_function: aggregationFunction,
    start_time: startTime,
    end_time: endTime,
  });

  const url = `${DASHBOARD_API_URL}/dashboard-api/stats_v2/availability_stats?${params.toString()}&zone_ids=${options.zoneIds.join(',')}`;
  const response = await fetch(url, getFetchOptions(token));

  if (!response.ok) {
    console.error('getBeleidszonesAvailabilityStats failed:', response.status);
    return null;
  }

  return response.json();
};

/**
 * Fetches rental stats for zone charts.
 *
 * @see https://docs.dashboarddeelmobiliteit.nl/api_docs/zone_statistics/
 */
export const getBeleidszonesRentalStats = async (
  token: string | null,
  options: BeleidszonesStatsOptions
): Promise<{ rental_stats?: { values: Array<Record<string, unknown>> } } | null> => {
  if (!options.zoneIds?.length) return null;

  const startTime = moment(options.startTime).format('YYYY-MM-DDTHH:mm:ss') + 'Z';
  const endTime = moment(options.endTime).format('YYYY-MM-DDTHH:mm:ss') + 'Z';
  const aggregationLevel = options.aggregationLevel ?? 'day';
  const aggregationFunction = options.aggregationFunction ?? 'MAX';

  const params = new URLSearchParams({
    aggregation_level: aggregationLevel,
    group_by: 'operator',
    aggregation_function: aggregationFunction,
    start_time: startTime,
    end_time: endTime,
  });

  const url = `${DASHBOARD_API_URL}/dashboard-api/stats_v2/rental_stats?${params.toString()}&zone_ids=${options.zoneIds.join(',')}`;
  const response = await fetch(url, getFetchOptions(token));

  if (!response.ok) {
    console.error('getBeleidszonesRentalStats failed:', response.status);
    return null;
  }

  return response.json();
};
