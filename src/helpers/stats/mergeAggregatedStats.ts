/**
 * Helpers to split a long `zone_ids` list into batches and to merge the
 * per-batch aggregated-stats responses back into a single response.
 *
 * The aggregated stats endpoints (`aggregated_stats/*`, `stats_v2/*`) sum the
 * stats of every zone in `zone_ids`. Summing the responses of disjoint batches
 * therefore yields the same result as one request with all zone ids, without
 * producing a query string long enough to be rejected upstream (502).
 */

/** Time bucket keys used by the legacy and the timescale response formats. */
const TIME_KEYS = ['start_interval', 'time'] as const;

export interface AggregatedStatsValue {
  start_interval?: string;
  time?: string;
  [provider: string]: unknown;
}

export interface AggregatedStatsResponse {
  [responseKey: string]: {
    values?: AggregatedStatsValue[];
    [other: string]: unknown;
  } | unknown;
}

export const chunkArray = <T>(items: T[], size: number): T[][] => {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const detectTimeKey = (value: AggregatedStatsValue): string | null => {
  for (const key of TIME_KEYS) {
    if (key in value) return key;
  }
  return null;
};

/**
 * Recursively add the numeric leaves of `source` onto `target`. Non-numeric,
 * non-object leaves (e.g. the time key) are left untouched.
 */
const deepSumInto = (
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  skipKey: string | null,
) => {
  Object.keys(source).forEach((key) => {
    if (key === skipKey) return;
    const sourceValue = source[key];
    if (typeof sourceValue === 'number') {
      const current = target[key];
      target[key] = (typeof current === 'number' ? current : 0) + sourceValue;
    } else if (isPlainObject(sourceValue)) {
      const current = target[key];
      const nested = isPlainObject(current) ? current : {};
      target[key] = nested;
      deepSumInto(nested, sourceValue, null);
    } else if (!(key in target)) {
      target[key] = sourceValue;
    }
  });
};

const hasValues = (response: unknown, responseKey: string): boolean => {
  if (!isPlainObject(response)) return false;
  const section = response[responseKey];
  return isPlainObject(section) && Array.isArray(section.values);
};

/** True when the response carries at least one time bucket for `responseKey`. */
export const hasAggregatedStatsValues = (response: unknown, responseKey: string): boolean => {
  if (!hasValues(response, responseKey)) return false;
  const section = (response as Record<string, Record<string, unknown>>)[responseKey];
  return (section.values as unknown[]).length > 0;
};

/**
 * Merge the responses of several batched requests into one response, summing
 * the per-provider (and per-modality) numbers of matching time buckets.
 *
 * Returns `null` when no response contains a usable `values` array.
 */
export const mergeAggregatedStatsResponses = (
  responses: unknown[],
  responseKey: string,
): AggregatedStatsResponse | null => {
  const usable = responses.filter((response) => hasValues(response, responseKey)) as
    Record<string, Record<string, unknown>>[];
  if (usable.length === 0) return null;
  if (usable.length === 1) return usable[0] as AggregatedStatsResponse;

  const byTime = new Map<string, Record<string, unknown>>();
  let timeKey: string | null = null;

  usable.forEach((response) => {
    const values = response[responseKey].values as AggregatedStatsValue[];
    values.forEach((value) => {
      if (timeKey === null) timeKey = detectTimeKey(value);
      const bucket = timeKey ? String(value[timeKey]) : String(byTime.size);
      const existing = byTime.get(bucket);
      if (existing) {
        deepSumInto(existing, value, timeKey);
      } else {
        const copy: Record<string, unknown> = {};
        deepSumInto(copy, value, null);
        byTime.set(bucket, copy);
      }
    });
  });

  // Batches normally share the same buckets in the same order; sort to be safe
  // (ISO-like timestamps sort correctly as strings).
  const merged = Array.from(byTime.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, value]) => value);

  return {
    ...usable[0],
    [responseKey]: {
      ...usable[0][responseKey],
      values: merged,
    },
  };
};
