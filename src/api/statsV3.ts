import type { StatisticQuery } from '../types/StatsV3';

const STATS_V3_API_URL = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/stats_v3/statistics`;

/** Error for a failed stats_v3 request; `status` is 0 when no response was received. */
export class StatsV3Error extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'StatsV3Error';
    this.status = status;
  }
}

const buildQueryString = (query: StatisticQuery): string => {
  const params = new URLSearchParams({
    statistic: query.statistic,
    municipality: query.municipality,
    start_date: query.start_date,
    end_date: query.end_date,
  });
  if (query.aggregation) params.set('aggregation', query.aggregation);
  if (query.trip_source) params.set('trip_source', query.trip_source);
  return params.toString();
};

/** Fetch one statistic; the caller picks the response type that matches `query.statistic`. */
export const getStatistic = async <T>(
  token: string,
  query: StatisticQuery,
  signal?: AbortSignal
): Promise<T> => {
  const url = `${STATS_V3_API_URL}?${buildQueryString(query)}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new StatsV3Error(`Network error for ${url}`, 0);
  }

  const text = await response.text();
  if (!response.ok) {
    throw new StatsV3Error(`HTTP ${response.status} for ${url}: ${text.slice(0, 200)}`, response.status);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new StatsV3Error(`Invalid JSON from ${url}: ${text.slice(0, 200)}`, response.status);
  }
};
