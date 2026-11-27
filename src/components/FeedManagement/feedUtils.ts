import {
  FeedCreate,
  FeedCredentials,
  FeedDataType,
  FeedSummary,
  FeedUpdate,
  FeedValidateRequest,
  FEED_TYPES_BY_DATA_TYPE,
  IMPORT_STRATEGIES
} from '../../types/FeedType';

export const MASK = '•••';

export interface AuthFieldDefinition {
  key: string;
  label: string;
  /** Stored in authentication.OAuth2Credentials instead of at the top level. */
  inCredentials: boolean;
  secret: boolean;
  required: boolean;
  multiline?: boolean;
  /** Comma separated in the form, a list in the stored JSON. */
  list?: boolean;
}

const tokenUrl: AuthFieldDefinition = {
  key: 'TokenURL', label: 'Token URL', inCredentials: false, secret: false, required: true
};
const clientId: AuthFieldDefinition = {
  key: 'client_id', label: 'Client ID', inCredentials: true, secret: false, required: true
};
const clientSecret: AuthFieldDefinition = {
  key: 'client_secret', label: 'Client secret', inCredentials: true, secret: true, required: true
};
const grantType: AuthFieldDefinition = {
  key: 'grant_type', label: 'Grant type', inCredentials: true, secret: false, required: true
};

/** The fields the importer reads per authentication_type (dd-importer-v2 feed/authentication.go). */
export const AUTH_FIELDS: Record<string, AuthFieldDefinition[]> = {
  'token': [
    { key: 'ApiKeyName', label: 'Header naam', inCredentials: false, secret: false, required: true },
    { key: 'ApiKey', label: 'API key', inCredentials: false, secret: true, required: true },
  ],
  'oauth2': [
    tokenUrl, clientId, clientSecret, grantType,
    { key: 'scope', label: 'Scope', inCredentials: true, secret: false, required: true },
  ],
  'oauth2-bolt': [
    tokenUrl, clientId, clientSecret,
    { key: 'scope', label: 'Scope', inCredentials: true, secret: false, required: false },
  ],
  'oauth2-basic-auth': [
    tokenUrl, clientId, clientSecret,
    { key: 'scope', label: 'Scope', inCredentials: true, secret: false, required: false },
  ],
  'oauth2-moveyou': [tokenUrl, clientId, clientSecret, grantType],
  'oauth2-dott': [
    { key: 'keyId', label: 'Key ID', inCredentials: true, secret: false, required: true },
    { key: 'organizationId', label: 'Organization ID', inCredentials: true, secret: false, required: true },
    {
      key: 'privateKey', label: 'Private key (PEM)', inCredentials: true, secret: true,
      required: true, multiline: true
    },
    {
      key: 'audience', label: 'Audience (komma-gescheiden)', inCredentials: true, secret: false,
      required: true, list: true
    },
  ],
};

export interface RequestHeaderRow {
  name: string;
  value: string;
}

export interface FeedFormValues {
  system_id: string;
  data_type: FeedDataType;
  feed_type: string;
  feed_url: string;
  import_strategy: string;
  default_vehicle_type: number | null;
  /** YYYY-MM-DD or empty */
  trip_import_start_date: string;
  remarks: string;
  /** Empty means no authentication. */
  authentication_type: string;
  authentication_values: Record<string, string>;
  request_headers: RequestHeaderRow[];
  /** When editing, credential sections stay unchanged unless they are replaced. */
  replace_feed_url: boolean;
  replace_authentication: boolean;
  replace_request_headers: boolean;
}

export interface FeedFilters {
  operator: string | null;
  dataType: FeedDataType | null;
  showInactive: boolean;
  search: string;
}

export type FeedStatusKey = 'inactive' | 'down' | 'never_imported' | 'ok';

export interface FeedStatus {
  key: FeedStatusKey;
  label: string;
}

export interface FeedChange {
  field: string;
  label: string;
  from: string;
  to: string;
}

const FIELD_LABELS: Record<string, string> = {
  feed_url: 'URL',
  feed_type: 'Feedtype',
  import_strategy: 'Importstrategie',
  is_active: 'Actief',
  authentication: 'Authenticatie',
  request_headers: 'Request headers',
  default_vehicle_type: 'Standaard voertuigtype',
  trip_import_start_date: 'Ritten importeren vanaf',
  remarks: 'Opmerkingen',
};

/** Changes that can break a running import, so they need an extra confirmation on active feeds. */
const RISKY_FIELDS = ['feed_url', 'feed_type', 'import_strategy', 'authentication', 'request_headers'];

export interface OperatorOption {
  value: string;
  label: string;
}

/** Known operators plus system_ids that only occur in feeds, sorted by label. */
export const buildOperatorOptions = (
  operators: { system_id: string; name: string }[],
  feeds: FeedSummary[]
): OperatorOption[] => {
  const names = new Map<string, string>();
  operators.forEach((operator) => names.set(operator.system_id, operator.name));
  const systemIds = new Set<string>([...operators.map((o) => o.system_id), ...feeds.map((f) => f.system_id)]);
  return Array.from(systemIds)
    .map((systemId) => {
      const name = names.get(systemId);
      return { value: systemId, label: name && name !== systemId ? `${name} (${systemId})` : systemId };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
};

export const formatDateTime = (value: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' });
};

export const filterFeeds = (feeds: FeedSummary[], filters: FeedFilters): FeedSummary[] => {
  const search = filters.search.trim().toLowerCase();
  return feeds.filter((feed) => {
    if (filters.operator && feed.system_id !== filters.operator) return false;
    if (filters.dataType && feed.data_type !== filters.dataType) return false;
    if (!filters.showInactive && !feed.is_active) return false;
    if (search) {
      const haystack = [feed.system_id, feed.feed_type, feed.feed_url, feed.remarks || '', String(feed.feed_id)]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
};

export const getFeedStatus = (feed: FeedSummary): FeedStatus => {
  if (!feed.is_active) return { key: 'inactive', label: 'Inactief' };
  if (feed.down_since) return { key: 'down', label: `Storing sinds ${formatDateTime(feed.down_since)}` };
  if (!feed.last_time_succesfully_imported) return { key: 'never_imported', label: 'Nog niet geïmporteerd' };
  return { key: 'ok', label: 'Actief' };
};

export const emptyFormValues = (): FeedFormValues => ({
  system_id: '',
  data_type: 'vehicles',
  feed_type: FEED_TYPES_BY_DATA_TYPE.vehicles[0],
  feed_url: '',
  import_strategy: IMPORT_STRATEGIES[0],
  default_vehicle_type: null,
  trip_import_start_date: '',
  remarks: '',
  authentication_type: '',
  authentication_values: {},
  request_headers: [],
  replace_feed_url: true,
  replace_authentication: true,
  replace_request_headers: true,
});

/** Form values for editing a feed; credentials are not loaded until a section is replaced. */
export const formValuesFromFeed = (feed: FeedSummary): FeedFormValues => ({
  system_id: feed.system_id,
  data_type: feed.data_type,
  feed_type: feed.feed_type,
  feed_url: feed.feed_url_has_hidden_values ? '' : feed.feed_url,
  import_strategy: feed.import_strategy,
  default_vehicle_type: feed.default_vehicle_type,
  trip_import_start_date: feed.trip_import_start_date ? feed.trip_import_start_date.slice(0, 10) : '',
  remarks: feed.remarks || '',
  authentication_type: feed.authentication_type || '',
  authentication_values: {},
  request_headers: [],
  replace_feed_url: !feed.feed_url_has_hidden_values,
  replace_authentication: false,
  replace_request_headers: false,
});

export const authenticationToValues = (
  authentication: Record<string, any> | null
): Record<string, string> => {
  const values: Record<string, string> = {};
  const type = authentication?.authentication_type;
  if (!type || !AUTH_FIELDS[type]) return values;
  AUTH_FIELDS[type].forEach((field) => {
    const source = field.inCredentials ? authentication.OAuth2Credentials || {} : authentication;
    const value = source[field.key];
    if (value === undefined || value === null) return;
    values[field.key] = field.list && Array.isArray(value) ? value.join(', ') : String(value);
  });
  return values;
};

export const buildAuthentication = (
  type: string,
  values: Record<string, string>
): Record<string, any> | null => {
  if (!type || !AUTH_FIELDS[type]) return null;
  const authentication: Record<string, any> = { authentication_type: type };
  const credentials: Record<string, any> = {};
  let hasCredentials = false;
  AUTH_FIELDS[type].forEach((field) => {
    const raw = (values[field.key] || '').trim();
    if (!raw && !field.required) return;
    const value = field.list ? raw.split(',').map((x) => x.trim()).filter(Boolean) : raw;
    if (field.inCredentials) {
      credentials[field.key] = value;
      hasCredentials = true;
    } else {
      authentication[field.key] = value;
    }
  });
  if (hasCredentials) authentication.OAuth2Credentials = credentials;
  return authentication;
};

export const requestHeadersToRows = (headers: Record<string, string> | null): RequestHeaderRow[] =>
  Object.entries(headers || {}).map(([name, value]) => ({ name, value }));

export const buildRequestHeaders = (rows: RequestHeaderRow[]): Record<string, string> | null => {
  const headers: Record<string, string> = {};
  rows.forEach((row) => {
    if (row.name.trim()) headers[row.name.trim()] = row.value;
  });
  return Object.keys(headers).length > 0 ? headers : null;
};

export type CredentialSection = 'feed_url' | 'authentication' | 'request_headers';

const ALL_CREDENTIAL_SECTIONS: CredentialSection[] = ['feed_url', 'authentication', 'request_headers'];

/** Opens credential sections of the form for editing, filled with the stored values. */
export const applyCredentials = (
  values: FeedFormValues,
  credentials: FeedCredentials,
  sections: CredentialSection[] = ALL_CREDENTIAL_SECTIONS
): FeedFormValues => {
  const next = { ...values };
  if (sections.includes('feed_url')) {
    next.feed_url = credentials.feed_url;
    next.replace_feed_url = true;
  }
  if (sections.includes('authentication')) {
    next.authentication_type = credentials.authentication?.authentication_type || '';
    next.authentication_values = authenticationToValues(credentials.authentication);
    next.replace_authentication = true;
  }
  if (sections.includes('request_headers')) {
    next.request_headers = requestHeadersToRows(credentials.request_headers);
    next.replace_request_headers = true;
  }
  return next;
};

const SYSTEM_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const HEADER_NAME_PATTERN = /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/;

/** Mirrors the checks of the admin API, so mistakes show up next to the field. */
export const validateFormValues = (
  values: FeedFormValues,
  isNew: boolean
): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (isNew && !SYSTEM_ID_PATTERN.test(values.system_id)) {
    errors.system_id = 'Gebruik kleine letters, cijfers, - of _ (maximaal 64 tekens).';
  }
  if (!FEED_TYPES_BY_DATA_TYPE[values.data_type].includes(values.feed_type)) {
    errors.feed_type = 'Dit feedtype hoort niet bij het gekozen datatype.';
  }
  if (values.replace_feed_url) {
    const url = values.feed_url.trim();
    if (!/^https?:\/\/[^\s/]+[^\s]*$/.test(url)) {
      errors.feed_url = 'Vul een volledige http(s) URL in, zonder spaties.';
    } else if (url.includes(MASK)) {
      errors.feed_url = 'De URL bevat nog gemaskeerde waarden (•••).';
    }
  }
  if (values.replace_authentication && values.authentication_type) {
    const missing = (AUTH_FIELDS[values.authentication_type] || [])
      .filter((field) => field.required && !(values.authentication_values[field.key] || '').trim());
    if (missing.length > 0) {
      errors.authentication = `Vul in: ${missing.map((field) => field.label).join(', ')}.`;
    } else if (
      values.authentication_type === 'oauth2-dott' &&
      !(values.authentication_values.privateKey || '').includes('PRIVATE KEY-----')
    ) {
      errors.authentication = 'De private key moet een PEM-gecodeerde EC private key zijn.';
    }
  }
  if (values.replace_request_headers) {
    const names = values.request_headers.map((row) => row.name.trim()).filter(Boolean);
    if (names.some((name) => !HEADER_NAME_PATTERN.test(name))) {
      errors.request_headers = 'Een headernaam mag geen spaties of speciale tekens bevatten.';
    } else if (new Set(names).size !== names.length) {
      errors.request_headers = 'Elke header mag maar één keer voorkomen.';
    } else if (values.request_headers.some((row) => /[\r\n]/.test(row.value))) {
      errors.request_headers = 'Een headerwaarde moet op één regel staan.';
    }
  }
  if (values.remarks.length > 2000) {
    errors.remarks = 'Maximaal 2000 tekens.';
  }
  return errors;
};

const tripStartDate = (values: FeedFormValues): string | null =>
  values.data_type === 'trips' && values.trip_import_start_date
    ? `${values.trip_import_start_date}T00:00:00`
    : null;

export const buildCreatePayload = (values: FeedFormValues): FeedCreate => ({
  system_id: values.system_id.trim(),
  data_type: values.data_type,
  feed_type: values.feed_type,
  feed_url: values.feed_url.trim(),
  import_strategy: values.import_strategy,
  authentication: buildAuthentication(values.authentication_type, values.authentication_values),
  request_headers: buildRequestHeaders(values.request_headers),
  default_vehicle_type: values.default_vehicle_type,
  trip_import_start_date: tripStartDate(values),
  remarks: values.remarks.trim() || null,
});

const sameJson = (a: any, b: any): boolean => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Only the fields that differ from the stored feed. Credentials are only
 * included when their section was replaced and differs from the loaded credentials.
 */
export const buildUpdatePayload = (
  feed: FeedSummary,
  values: FeedFormValues,
  credentials: FeedCredentials | null = null
): FeedUpdate => {
  const update: FeedUpdate = { feed_id: feed.feed_id };
  const storedTripStart = feed.trip_import_start_date ? `${feed.trip_import_start_date.slice(0, 10)}T00:00:00` : null;

  if (values.feed_type !== feed.feed_type) update.feed_type = values.feed_type;
  if (values.import_strategy !== feed.import_strategy) update.import_strategy = values.import_strategy;
  if (values.default_vehicle_type !== feed.default_vehicle_type) {
    update.default_vehicle_type = values.default_vehicle_type;
  }
  if (tripStartDate(values) !== storedTripStart) update.trip_import_start_date = tripStartDate(values);
  if ((values.remarks.trim() || null) !== (feed.remarks || null)) update.remarks = values.remarks.trim() || null;
  const storedUrl = credentials ? credentials.feed_url : feed.feed_url;
  if (values.replace_feed_url && values.feed_url.trim() !== storedUrl) {
    update.feed_url = values.feed_url.trim();
  }
  if (values.replace_authentication) {
    const authentication = buildAuthentication(values.authentication_type, values.authentication_values);
    const unchanged = credentials
      ? sameJson(authentication, buildAuthentication(
        credentials.authentication?.authentication_type || '',
        authenticationToValues(credentials.authentication)
      ))
      : !authentication && !feed.has_authentication;
    if (!unchanged) update.authentication = authentication;
  }
  if (values.replace_request_headers) {
    const headers = buildRequestHeaders(values.request_headers);
    const unchanged = credentials
      ? sameJson(headers, buildRequestHeaders(requestHeadersToRows(credentials.request_headers)))
      : !headers && feed.request_header_names.length === 0;
    if (!unchanged) update.request_headers = headers;
  }
  return update;
};

/** The configuration to validate: unsaved values, completed by the stored feed for unreplaced credentials. */
export const buildValidateRequest = (
  values: FeedFormValues,
  feed: FeedSummary | null
): FeedValidateRequest => {
  const request: FeedValidateRequest = {
    system_id: values.system_id.trim(),
    data_type: values.data_type,
    feed_type: values.feed_type,
  };
  if (feed) request.feed_id = feed.feed_id;
  if (!feed || values.replace_feed_url) request.feed_url = values.feed_url.trim();
  if (!feed || values.replace_authentication) {
    request.authentication = buildAuthentication(values.authentication_type, values.authentication_values);
  }
  if (!feed || values.replace_request_headers) {
    request.request_headers = buildRequestHeaders(values.request_headers);
  }
  return request;
};

const describeValue = (
  field: string,
  value: any,
  vehicleTypeLabel: (id: number) => string
): string => {
  if (value === null || value === undefined || value === '') return '(leeg)';
  if (field === 'is_active') return value ? 'ja' : 'nee';
  if (field === 'default_vehicle_type') return vehicleTypeLabel(value);
  if (field === 'trip_import_start_date') return String(value).slice(0, 10);
  return String(value);
};

/**
 * Human readable list of changes for the confirmation dialog. Credentials are
 * never shown, only that they change.
 */
export const describeChanges = (
  feed: FeedSummary,
  update: FeedUpdate,
  vehicleTypeLabel: (id: number) => string = (id) => String(id)
): FeedChange[] => {
  return Object.keys(update)
    .filter((field) => field !== 'feed_id')
    .map((field) => {
      const label = FIELD_LABELS[field] || field;
      const to = (update as any)[field];
      if (field === 'authentication') {
        return {
          field,
          label,
          from: feed.authentication_type || 'geen',
          to: to ? `${to.authentication_type} (nieuwe gegevens)` : 'geen',
        };
      }
      if (field === 'request_headers') {
        return {
          field,
          label,
          from: feed.request_header_names.join(', ') || 'geen',
          to: to ? `${Object.keys(to).join(', ')} (nieuwe waarden)` : 'geen',
        };
      }
      if (field === 'feed_url') {
        return { field, label, from: feed.feed_url, to: maskUrl(to) };
      }
      return {
        field,
        label,
        from: describeValue(field, (feed as any)[field], vehicleTypeLabel),
        to: describeValue(field, to, vehicleTypeLabel),
      };
    });
};

/** True when the change can interrupt the data of an active feed. */
export const isRiskyChange = (feed: FeedSummary, update: FeedUpdate): boolean => {
  if (!feed.is_active) return false;
  if (update.is_active === false) return true;
  return RISKY_FIELDS.some((field) => field in update);
};

const SAFE_QUERY_PARAMS = ['end_time', 'size', 'page[offset]', 'page[limit]'];

/** Masks user info and query values, like the admin API does for the list. */
export const maskUrl = (url: string): string => {
  const match = url.match(/^([a-z][a-z0-9+.-]*:\/\/)([^/?#]*)([^?#]*)(\?[^#]*)?(#.*)?$/i);
  if (!match) return MASK;
  const [, scheme, authority, path, query, fragment] = match;
  const host = authority.includes('@') ? `${MASK}@${authority.slice(authority.lastIndexOf('@') + 1)}` : authority;
  const maskedQuery = query
    ? '?' + query.slice(1).split('&').map((part) => {
      const index = part.indexOf('=');
      if (index < 0) return part;
      const key = part.slice(0, index);
      let decodedKey = key;
      try {
        decodedKey = decodeURIComponent(key);
      } catch (e) {
        decodedKey = key;
      }
      return SAFE_QUERY_PARAMS.includes(decodedKey) ? part : `${key}=${MASK}`;
    }).join('&')
    : '';
  return `${scheme}${host}${path}${maskedQuery}${fragment || ''}`;
};
