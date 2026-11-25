export type FeedDataType = 'vehicles' | 'trips' | 'service_areas';

/** Feed types each data type supports, matching the importers in dd-importer-v2. */
export const FEED_TYPES_BY_DATA_TYPE: Record<FeedDataType, readonly string[]> = {
  vehicles: ['gbfs', 'full_gbfs', 'mds', 'mds-v2', 'tomp'],
  trips: ['mds-trips-v1', 'mds-trips-v2'],
  service_areas: ['gbfs', 'full_gbfs', 'manifest_gbfs'],
} as const;

export const DATA_TYPE_LABELS: Record<FeedDataType, string> = {
  vehicles: 'Voertuigen',
  trips: 'Ritten',
  service_areas: 'Servicegebieden',
} as const;

export const IMPORT_STRATEGIES = ['clean', 'gps'] as const;

export const AUTHENTICATION_TYPES = [
  'token',
  'oauth2',
  'oauth2-bolt',
  'oauth2-basic-auth',
  'oauth2-moveyou',
  'oauth2-dott',
] as const;

/** A feeds row without credentials, as returned by GET /admin/feed/list. */
export interface FeedSummary {
  feed_id: number;
  system_id: string;
  /** Query values and user info are masked. */
  feed_url: string;
  feed_url_has_hidden_values: boolean;
  feed_type: string;
  data_type: FeedDataType;
  import_strategy: string;
  is_active: boolean;
  default_vehicle_type: number | null;
  trip_import_start_date: string | null;
  remarks: string | null;
  authentication_type: string | null;
  has_authentication: boolean;
  request_header_names: string[];
  last_time_updated: string | null;
  last_time_succesfully_imported: string | null;
  ignore_disruptions_in_feed_until: string | null;
  down_since: string | null;
}

export interface FeedCredentials {
  feed_id: number;
  feed_url: string;
  authentication: Record<string, any> | null;
  request_headers: Record<string, string> | null;
}

export interface FeedCreate {
  system_id: string;
  feed_url: string;
  feed_type: string;
  data_type: FeedDataType;
  import_strategy: string;
  authentication?: Record<string, any> | null;
  request_headers?: Record<string, string> | null;
  default_vehicle_type?: number | null;
  trip_import_start_date?: string | null;
  remarks?: string | null;
}

/** Only the fields that are present are changed. */
export interface FeedUpdate extends Partial<Omit<FeedCreate, 'system_id' | 'data_type'>> {
  feed_id: number;
  is_active?: boolean;
}

/** Validate a stored feed, unsaved values, or a stored feed with some values replaced. */
export interface FeedValidateRequest {
  feed_id?: number;
  system_id?: string;
  data_type?: FeedDataType;
  feed_url?: string;
  feed_type?: string;
  authentication?: Record<string, any> | null;
  request_headers?: Record<string, string> | null;
}

export interface VehicleTypeOption {
  vehicle_type_id: number;
  label: string;
}

export type FeedValidationStatus =
  | 'valid'
  | 'invalid'
  | 'unreachable'
  | 'not_checked'
  | 'config_error';

export interface FeedValidationErrorGroup {
  path: string;
  message: string;
  count: number;
  example: string;
}

export interface FeedValidationFile {
  name: string;
  url: string;
  reachable: boolean;
  http_status: number;
  schema: string;
  schema_checked: boolean;
  declared_version: string;
  records_checked: number | null;
  valid: boolean;
  messages: string[] | null;
  error_count: number;
  error_groups: FeedValidationErrorGroup[] | null;
  error_groups_truncated: boolean;
}

export interface FeedValidationResult {
  status: FeedValidationStatus;
  valid: boolean;
  standard: string;
  declared_version: string;
  importer_issues: string[] | null;
  messages: string[] | null;
  files: FeedValidationFile[] | null;
  checked_at: string;
  duration_ms: number;
}
