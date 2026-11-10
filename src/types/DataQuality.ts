export type DataQualityDataType = 'aanbod' | 'verhuringen' | 'servicegebieden';

export type IssueOwner = 'operator' | 'dashboard_deelmobiliteit';

/**
 * - available: feed is reachable and contains data
 * - unavailable: feed is offline or empty
 * - not_expected: the operator does not offer this feed
 * - unknown: no check result yet
 */
export type FeedStatus = 'available' | 'unavailable' | 'not_expected' | 'unknown';

export interface TimeInterval {
  start_time: string;
  /** null means the interval is still ongoing */
  end_time: string | null;
}

export interface ManualRejection extends TimeInterval {
  rejection_id: number;
  system_ids: string[] | 'all';
  municipalities: string[] | 'all';
  vehicle_types: string[] | 'all';
  data_types: DataQualityDataType[];
  issue_owner: IssueOwner;
  note: string;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

export type ManualRejectionInput = Omit<
  ManualRejection,
  'rejection_id' | 'created_by' | 'created_at' | 'updated_by' | 'updated_at'
>;

export interface FeedAvailability {
  system_id: string;
  data_type: DataQualityDataType;
  status: FeedStatus;
  last_checked_at: string | null;
  last_data_received_at: string | null;
  /** Share (0-100) of checks in the period that passed */
  availability_pct: number | null;
  outages: TimeInterval[];
}

export interface OperatorDataQuality {
  system_id: string;
  feeds: Partial<Record<DataQualityDataType, FeedAvailability>>;
  rejections: ManualRejection[];
}

export interface DataQualityPeriod {
  /** Inclusive start, epoch ms */
  start: number;
  /** Exclusive end, epoch ms */
  end: number;
}
