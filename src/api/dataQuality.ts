import { fetchJson } from './fetchJson';
import type {
  FeedAvailability,
  ManualRejection,
  ManualRejectionInput,
} from '../types/DataQuality';

const DATA_QUALITY_API_URL = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/data_quality`;

export interface DataQualityQuery {
  /** Municipality code; omit for all of The Netherlands */
  gm_code?: string | null;
  /** YYYY-MM-DD, inclusive */
  start_date: string;
  /** YYYY-MM-DD, inclusive */
  end_date: string;
}

const getHeaders = (token: string): Record<string, string> => ({
  authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const buildQueryString = (query: DataQualityQuery): string => {
  const params = new URLSearchParams();
  if (query.gm_code) params.set('gm_code', query.gm_code);
  params.set('start_date', query.start_date);
  params.set('end_date', query.end_date);
  return params.toString();
};

/** Manual rejections overlapping the period that apply to the municipality (or all of NL). */
export const getManualRejections = (
  token: string,
  query: DataQualityQuery
): Promise<ManualRejection[]> => {
  return fetchJson<ManualRejection[]>(
    `${DATA_QUALITY_API_URL}/rejections?${buildQueryString(query)}`,
    { headers: getHeaders(token) }
  );
};

/**
 * Feed availability per operator and data type. With a gm_code, only operators
 * active in that municipality during the period are returned.
 */
export const getFeedAvailability = (
  token: string,
  query: DataQualityQuery
): Promise<FeedAvailability[]> => {
  return fetchJson<FeedAvailability[]>(
    `${DATA_QUALITY_API_URL}/feed_status?${buildQueryString(query)}`,
    { headers: getHeaders(token) }
  );
};

export const createManualRejection = (
  token: string,
  input: ManualRejectionInput
): Promise<ManualRejection> => {
  return fetchJson<ManualRejection>(`${DATA_QUALITY_API_URL}/rejections`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(input),
  });
};

export const updateManualRejection = (
  token: string,
  rejectionId: number,
  input: ManualRejectionInput
): Promise<ManualRejection> => {
  return fetchJson<ManualRejection>(`${DATA_QUALITY_API_URL}/rejections/${rejectionId}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(input),
  });
};

export const deleteManualRejection = async (
  token: string,
  rejectionId: number
): Promise<void> => {
  const url = `${DATA_QUALITY_API_URL}/rejections/${rejectionId}`;
  const response = await fetch(url, { method: 'DELETE', headers: getHeaders(token) });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} for ${url}: ${text.slice(0, 200)}`);
  }
};
