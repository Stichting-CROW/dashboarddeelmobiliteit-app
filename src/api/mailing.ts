import {
  LastMailing,
  MailingFilters,
  MailingPreview,
  MailingRecipients,
  MailingRequest,
  MailingResult
} from '../types/MailingType';

const admin_api_url: string = `${process.env.REACT_APP_MAIN_API_URL}/admin`;

interface FetchOptions {
  method?: string;
  body?: string;
  headers: Record<string, string>;
}

const getHeaders = (token: string): FetchOptions => {
  return {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * Reads the JSON body and throws a readable error when the API responded
 * with a non-2xx status (FastAPI puts the message in `detail`).
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
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

const buildFiltersQuery = (filters: MailingFilters): string => {
  const params = new URLSearchParams();
  if (filters.organisation_id) params.set('organisation_id', String(filters.organisation_id));
  if (filters.core_group_only) params.set('core_group_only', 'true');
  if (filters.microhub_edit_only) params.set('microhub_edit_only', 'true');
  const query = params.toString();
  return query ? `?${query}` : '';
};

// GET /mailing/recipients?organisation_id=&core_group_only=&microhub_edit_only=
export const getMailingRecipients = async (
  token: string,
  filters: MailingFilters
): Promise<MailingRecipients> => {
  const url = `${admin_api_url}/mailing/recipients${buildFiltersQuery(filters)}`;
  const response = await fetch(url, getHeaders(token));
  return handleResponse<MailingRecipients>(response);
};

// POST /mailing/preview
export const getMailingPreview = async (
  token: string,
  subject: string,
  bodyMarkdown: string
): Promise<MailingPreview> => {
  const url = `${admin_api_url}/mailing/preview`;
  const options = getHeaders(token);
  options.method = 'POST';
  options.body = JSON.stringify({ subject, body_markdown: bodyMarkdown });
  const response = await fetch(url, options);
  return handleResponse<MailingPreview>(response);
};

// POST /mailing/send_test (only to the logged in admin)
export const sendTestMailing = async (
  token: string,
  mailing: MailingRequest
): Promise<MailingResult> => {
  const url = `${admin_api_url}/mailing/send_test`;
  const options = getHeaders(token);
  options.method = 'POST';
  options.body = JSON.stringify(mailing);
  const response = await fetch(url, options);
  return handleResponse<MailingResult>(response);
};

// POST /mailing/send (to all users matching the filters)
export const sendMailing = async (
  token: string,
  mailing: MailingRequest
): Promise<MailingResult> => {
  const url = `${admin_api_url}/mailing/send`;
  const options = getHeaders(token);
  options.method = 'POST';
  options.body = JSON.stringify(mailing);
  const response = await fetch(url, options);
  return handleResponse<MailingResult>(response);
};

// GET /mailing/last
export const getLastMailing = async (token: string): Promise<LastMailing | null> => {
  const url = `${admin_api_url}/mailing/last`;
  const response = await fetch(url, getHeaders(token));
  return handleResponse<LastMailing | null>(response);
};
