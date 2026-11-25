import {
  FeedCreate,
  FeedCredentials,
  FeedSummary,
  FeedUpdate,
  FeedValidateRequest,
  FeedValidationResult,
  VehicleTypeOption
} from '../types/FeedType';

const admin_api_url: string = `${process.env.REACT_APP_MAIN_API_URL}/admin`;

const request = async <T>(
  token: string,
  path: string,
  method: string = 'GET',
  body?: object
): Promise<T> => {
  const response = await fetch(`${admin_api_url}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  let json: any = null;
  try {
    json = await response.json();
  } catch (e) {
    json = null;
  }
  if (!response.ok) {
    const detail = json && (json.detail || json.reason);
    throw new Error(typeof detail === 'string' ? detail : `Fout ${response.status}`);
  }
  return json as T;
};

// GET /feed/list (without credentials)
export const getFeeds = (token: string): Promise<FeedSummary[]> =>
  request<FeedSummary[]>(token, '/feed/list');

// GET /feed/{feed_id}/credentials (the API logs who requested them)
export const getFeedCredentials = (token: string, feedId: number): Promise<FeedCredentials> =>
  request<FeedCredentials>(token, `/feed/${feedId}/credentials`);

// POST /feed/create (new feeds are always inactive)
export const createFeed = (token: string, feed: FeedCreate): Promise<FeedSummary> =>
  request<FeedSummary>(token, '/feed/create', 'POST', feed);

// PUT /feed/update
export const updateFeed = (token: string, update: FeedUpdate): Promise<FeedSummary> =>
  request<FeedSummary>(token, '/feed/update', 'PUT', update);

// POST /feed/validate (can take up to a minute)
export const validateFeed = (
  token: string,
  feed: FeedValidateRequest
): Promise<FeedValidationResult> =>
  request<FeedValidationResult>(token, '/feed/validate', 'POST', feed);

// GET /feed/vehicle_types
export const getFeedVehicleTypes = (token: string): Promise<VehicleTypeOption[]> =>
  request<VehicleTypeOption[]>(token, '/feed/vehicle_types');
