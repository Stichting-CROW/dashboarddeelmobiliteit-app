import moment from 'moment';

export interface ZoneStatsOptions {
  /** Municipality code (e.g. GM0599). When provided, used instead of zone_ids. */
  gmCode?: string;
  /** Zone IDs. Used when gmCode is not provided. */
  zoneIds?: number[];
  startTime: string;
  endTime: string;
  aggregationLevel?: string;
  aggregationFunction?: string;
}

const getFetchOptions = (token: string | null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }
  return { headers };
};

/** Hub zone types that have vehicle availability/rental stats. */
const HUB_GEOGRAPHY_TYPES = ['stop', 'no_parking', 'monitoring'] as const;

/**
 * Fetches all zone_ids for a municipality from the dashboard-api.
 * Returns zone_ids of hub zones (stop, no_parking, monitoring) when available,
 * otherwise all zone_ids.
 */
export const getZoneIdsForMunicipality = async (
  token: string | null,
  gmCode: string
): Promise<number[]> => {
  const baseUrl = process.env.REACT_APP_MAIN_API_URL;
  const encodedGmCode = encodeURIComponent(gmCode);
  const url =
    token != null
      ? `${baseUrl}/dashboard-api/zones?gm_code=${encodedGmCode}`
      : `${baseUrl}/dashboard-api/public/filters?gm_code=${encodedGmCode}`;

  const response = await fetch(url, getFetchOptions(token));
  if (!response.ok) {
    console.error('getZoneIdsForMunicipality failed:', response.status);
    return [];
  }
  const json = await response.json();
  const zones = (token != null ? json?.zones : json?.filter_values?.zones) ?? [];
  if (!Array.isArray(zones) || zones.length === 0) return [];

  // Prefer hub zones (geography_type: stop, no_parking, monitoring)
  const hubZones = zones.filter(
    (z: { geography_type?: string }) =>
      z.geography_type && HUB_GEOGRAPHY_TYPES.includes(z.geography_type as (typeof HUB_GEOGRAPHY_TYPES)[number])
  );
  const zonesToUse = hubZones.length > 0 ? hubZones : zones;

  return zonesToUse
    .map((z: { zone_id?: number }) => z.zone_id)
    .filter((id: unknown): id is number => typeof id === 'number' && !isNaN(id));
};

const buildZoneStatsUrl = (
  endpoint: 'availability_stats' | 'rental_stats',
  options: ZoneStatsOptions
): string => {
  const startTime = moment(options.startTime).format('YYYY-MM-DDTHH:mm:ss') + 'Z';
  const endTime = moment(options.endTime).format('YYYY-MM-DDTHH:mm:ss') + 'Z';
  const aggregationLevel = options.aggregationLevel || 'day';
  const aggregationFunction = options.aggregationFunction || 'MAX';

  const params = new URLSearchParams({
    start_time: startTime,
    end_time: endTime,
    aggregation_level: aggregationLevel,
    group_by: 'operator',
    aggregation_function: aggregationFunction,
  });

  if (options.gmCode) {
    params.set('gm_code', options.gmCode);
  } else if (options.zoneIds && options.zoneIds.length > 0) {
    // Append zone_ids with unencoded commas (URLSearchParams would encode them as %2C)
    // TODO: If I get data of many zone_ids at once, the API server crashes
    return `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/stats_v2/${endpoint}?${params.toString()}&zone_ids=${options.zoneIds.join(',')}`;
  } else {
    return '';
  }

  return `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/stats_v2/${endpoint}?${params.toString()}`;
};

export const getZoneAvailabilityStats = async (
  token: string | null,
  options: ZoneStatsOptions
): Promise<{ availability_stats?: { values: Array<Record<string, unknown>> } } | null> => {
  if (!options.gmCode && (!options.zoneIds || options.zoneIds.length === 0)) {
    return null;
  }

  const url = buildZoneStatsUrl('availability_stats', options);
  if (!url) return null;

  const response = await fetch(url, getFetchOptions(token));

  if (!response.ok) {
    console.error('getZoneAvailabilityStats failed:', response.status);
    return null;
  }

  return response.json();
};

export const getZoneRentalStats = async (
  token: string | null,
  options: ZoneStatsOptions
): Promise<{ rental_stats?: { values: Array<Record<string, unknown>> } } | null> => {
  if (!options.gmCode && (!options.zoneIds || options.zoneIds.length === 0)) {
    return null;
  }

  const url = buildZoneStatsUrl('rental_stats', options);
  if (!url) return null;

  const response = await fetch(url, getFetchOptions(token));

  if (!response.ok) {
    console.error('getZoneRentalStats failed:', response.status);
    return null;
  }

  return response.json();
};
