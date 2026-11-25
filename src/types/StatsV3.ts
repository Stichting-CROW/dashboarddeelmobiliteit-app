/**
 * Types for GET /dashboard-api/stats_v3/statistics.
 * See STATS_V3_FRONTEND_GUIDE.md in the dashboarddeelmobiliteit-api repository.
 */

export type TimeSeriesStatistic =
  | 'max_available_vehicles'
  | 'rentals'
  | 'usage_ratio'
  | 'unavailable_percentage';

export type DistributionStatistic =
  | 'usage_distribution'
  | 'distance_distribution'
  | 'real_distance_distribution'
  | 'duration_distribution';

export type Statistic = TimeSeriesStatistic | DistributionStatistic;

export type Aggregation = 'day' | 'week' | 'month';
export type TripSource = 'vehicles' | 'trips';

export interface TimeSeriesValue {
  /** YYYY-MM-DD; can be before the requested start_date for week/month */
  period_start: string;
  /** YYYY-MM-DD; clipped to the requested end_date */
  period_end: string;
  value: number;
}

export interface DistributionBucket {
  time_period?: number;
  category?: number;
  label: string;
  count: number;
}

export interface ModalityTimeSeries {
  modality: string;
  operators: string[];
  values: TimeSeriesValue[];
}

export interface ModalityDistribution {
  modality: string;
  operators: string[];
  buckets: DistributionBucket[];
}

export interface TimeSeriesResponse {
  statistic: TimeSeriesStatistic;
  municipality: string;
  start_date: string;
  end_date: string;
  aggregation: Aggregation;
  trip_source: TripSource;
  modalities: ModalityTimeSeries[];
}

export interface DistributionResponse {
  statistic: DistributionStatistic;
  municipality: string;
  start_date: string;
  end_date: string;
  trip_source: TripSource;
  /** YYYY-MM */
  months_included: string[];
  modalities: ModalityDistribution[];
}

export interface StatisticQuery {
  statistic: Statistic;
  /** GM code, e.g. GM0599 */
  municipality: string;
  /** YYYY-MM-DD, inclusive */
  start_date: string;
  /** YYYY-MM-DD, inclusive */
  end_date: string;
  /** Required for time-series statistics, ignored for distributions */
  aggregation?: Aggregation;
  trip_source?: TripSource;
}
