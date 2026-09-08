import {
  createFilterparameters,
  getMunicipalityZoneIds,
  NL_COUNTRY_ZONE_ID
} from '../poll-api/pollTools.js';
import { DISPLAYMODE_OTHER } from '../reducers/layers.js';
import saveAs from 'file-saver';
import { dedupedFetch } from './dedupedFetch';
import {
  chunkArray,
  hasAggregatedStatsValues,
  mergeAggregatedStatsResponses
} from '../helpers/stats/mergeAggregatedStats';

const getFetchOptions = (token) => {
  return {
    headers: {
      "authorization": `Bearer ${token}`,
      'mode':'no-cors'
    }
  }
}

/**
 * Maximum number of zone_ids per aggregated-stats request. Longer lists are
 * split into batches whose responses are summed client-side, so the query
 * string never grows long enough to be rejected upstream (502).
 */
export const MAX_ZONE_IDS_PER_REQUEST = 50;

const ZONE_IDS_PREFIX = 'zone_ids=';

/** Split `zone_ids=` off the filter params: { zoneIds: string[] | null, otherParams }. */
const extractZoneIds = (filterParams) => {
  const index = filterParams.findIndex((param) => param.startsWith(ZONE_IDS_PREFIX));
  if (index < 0) {
    return { zoneIds: null, otherParams: filterParams };
  }
  const zoneIds = filterParams[index]
    .substring(ZONE_IDS_PREFIX.length)
    .split(',')
    .filter(Boolean);
  return {
    zoneIds,
    otherParams: filterParams.filter((_, i) => i !== index)
  };
};

const buildUrl = (baseUrl, params) => {
  return params.length > 0 ? `${baseUrl}&${params.join('&')}` : baseUrl;
};

// Fetch JSON (deduped: concurrent identical requests share a single network
// call). Resolves to null on a non-2xx response so callers can fall back.
const fetchJson = async (token, url) => {
  const response = await dedupedFetch(url, getFetchOptions(token));
  if (!response.ok) {
    console.warn(`aggregated stats request failed (${response.status}): ${url}`);
    return null;
  }
  return response.json();
};

// Fetch all zone batches in parallel and merge them into one response.
const fetchZoneBatches = async (token, baseUrl, otherParams, zoneIds, responseKey) => {
  const batches = chunkArray(zoneIds, MAX_ZONE_IDS_PER_REQUEST);
  const responses = await Promise.all(batches.map((batch) => (
    fetchJson(token, buildUrl(baseUrl, [`${ZONE_IDS_PREFIX}${batch.join(',')}`, ...otherParams]))
  )));
  const merged = mergeAggregatedStatsResponses(responses, responseKey);
  // Preserve the single-request behaviour of returning whatever the API sent
  // (e.g. an error body) when nothing could be merged.
  return merged || responses.find((response) => response !== null) || null;
};

// Remembered per session: once the country zone is rejected by the backend
// (e.g. 403/404) we stop trying it and go straight to batched municipalities.
let nlCountryZoneRejected = false;

/**
 * Shared request logic for both aggregated-stats endpoints:
 * - no or few zone_ids: a single request;
 * - many zone_ids: batched requests, summed client-side;
 * - the NL country zone (admin "Alle plaatsen"): falls back to batched
 *   municipality zones when the country zone yields no data.
 */
const fetchAggregated = async (token, baseUrl, options, responseKey) => {
  const filterParams = createFilterparameters(DISPLAYMODE_OTHER, options.filter, options.metadata, {
    is_logged_in: true,
    is_aggregated_stats: true
  });
  const { zoneIds, otherParams } = extractZoneIds(filterParams);

  if (zoneIds === null) {
    return fetchJson(token, buildUrl(baseUrl, otherParams));
  }

  const isNlCountryZone = zoneIds.length === 1 && Number(zoneIds[0]) === NL_COUNTRY_ZONE_ID;
  if (!isNlCountryZone) {
    return fetchZoneBatches(token, baseUrl, otherParams, zoneIds, responseKey);
  }

  let response = null;
  if (!nlCountryZoneRejected) {
    const url = buildUrl(baseUrl, [`${ZONE_IDS_PREFIX}${NL_COUNTRY_ZONE_ID}`, ...otherParams]);
    const raw = await dedupedFetch(url, getFetchOptions(token));
    if (raw.ok) {
      response = await raw.json();
    } else if (raw.status === 403 || raw.status === 404) {
      nlCountryZoneRejected = true;
      console.warn(`Country zone ${NL_COUNTRY_ZONE_ID} rejected (${raw.status}); using municipality zones instead`);
    }
    if (hasAggregatedStatsValues(response, responseKey)) {
      return response;
    }
  }

  // Fallback: every municipality zone we know of, in batches.
  const municipalityZoneIds = getMunicipalityZoneIds(options.metadata?.zones);
  if (municipalityZoneIds.length === 0) {
    return response;
  }
  return fetchZoneBatches(token, baseUrl, otherParams, municipalityZoneIds, responseKey);
};

export const getAggregatedStats = async (token, key, options) => {
  // Define API end point URL
  // Example URL: `https://api.deelfietsdashboard.nl/dashboard-api/aggregated_stats/${key}?start_time=${options.startTime}&end_time=${options.endTime}&operators=${options.operators}&zone_ids=${options.zoneIds}&aggregation_level=${options.aggregationLevel}`;
  const baseUrl = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/aggregated_stats/${key}?aggregation_level=${options.aggregationLevel}&aggregation_time=${options.aggregationTime}`;

  return fetchAggregated(token, baseUrl, options, `${key}_aggregated_stats`);
}
export const getAggregatedStats_timescaleDB = async (token, key, options) => {
  // Define API end point URL
  //
  // curl --location --request GET 'https://api.deelfietsdashboard.nl/dashboard-api/stats_v2/availability_stats?aggregation_level=5m&group_by=operator&start_time=2022-11-07T00:00:00&end_time=2022-11-09T00:00:00&zone_ids=51856' \
  // --header 'Authorization: Bearer TOKEN'
  const responseKey = key === 'available_vehicles' ? 'availability_stats' : 'rental_stats';
  let baseUrl = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/stats_v2/${responseKey}?`;
  baseUrl += `aggregation_level=${options.aggregationLevel}`
  baseUrl += `&group_by=operator`;
  baseUrl += `&aggregation_function=${options.aggregationFunction || 'MAX'}`;

  return fetchAggregated(token, baseUrl, options, responseKey);
}

export const downloadReport = async (token, options) => {
  const searchParams = new URLSearchParams();
  searchParams.append("start_time", options.startDate);
  searchParams.append("end_time", options.endDate);
  searchParams.append("gm_code", options.gm_code);
  if (options.filter_operators.length > 0) {
    searchParams.append("operators", options.filter_operators.join(","));
  }
  
  let url = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/stats/generate_report?${searchParams.toString()}`;

  // Get API response  
  const fetchOptions = getFetchOptions(token)
  const response = await fetch(url, fetchOptions);
  const responseBlob = await response.blob();

  saveAs(responseBlob, `rapportage_${options.startDate}-${options.endDate}_${options.gm_code}.xlsx`)
}

export const downloadRawData = async (token, options) => {
  let url = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/raw_data?start_time=${options.startDate}&end_time=${options.endDate}`;

  // Get API response      
  const fetchOptions = getFetchOptions(token)
  const response = await fetch(url, fetchOptions);
  const json = await response.json();

  return json;
}
