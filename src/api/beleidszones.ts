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

/** Zone from MDS public/zones API (zone_id, geography_id, name, prev_geographies, etc.) */
export interface Beleidszone {
  zone_id?: number;
  geography_id?: string;
  prev_geographies?: string[];
  effective_date?: string;
  published_date?: string;
  modified_at?: string;
  name?: string;
  geography_type?: string;
  municipality?: string;
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
  municipality?: string;
  [key: string]: unknown;
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

/**
 * Fetches zones for a municipality from MDS public/zones.
 * Used for the filterbar zone list on /stats/beleidszones.
 *
 * @param gmCode Municipality code (e.g. GM0599)
 * @returns Normalized zones for FilteritemZones
 */
export const getBeleidszonesZones = async (
  gmCode: string
): Promise<BeleidszoneForFilter[]> => {
  if (!gmCode?.trim()) return [];

  const url = `${MDS_URL}/public/zones?municipality=${encodeURIComponent(gmCode)}&geography_types=no_parking&geography_types=stop&geography_types=monitoring&phases=active&phases=retirement_concept&phases=committed_retirement_concept&phases=published_retirement&phases=archived`;

  const response = await fetch(url, getFetchOptions(null));
  if (!response.ok) {
    console.error('getBeleidszonesZones failed:', response.status);
    return [];
  }

  const raw = await response.json();
  const zonesArray = Array.isArray(raw)
    ? raw
    : raw?.zones ?? raw?.data?.zones ?? [];
  const zones = Array.isArray(zonesArray) ? zonesArray : [];

  return zones
    .filter((z: Beleidszone) => z.zone_id != null)
    .map((z: Beleidszone) => ({
      zone_id: z.zone_id!,
      name: z.name ?? `Zone ${z.zone_id}`,
      zone_type: 'custom' as const,
      geography_id: z.geography_id,
      prev_geographies: z.prev_geographies,
      effective_date: z.effective_date,
      published_date: z.published_date,
      modified_at: z.modified_at,
      municipality: z.municipality ?? gmCode,
    }));
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
